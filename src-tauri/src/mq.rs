use std::{
    collections::HashMap,
    sync::{
        Arc, Mutex,
        atomic::{AtomicBool, Ordering},
    },
    thread,
    time::Duration,
};

use futures_util::StreamExt;
use lapin::{
    BasicProperties, Connection, ConnectionProperties,
    options::{BasicAckOptions, BasicConsumeOptions, BasicPublishOptions, QueueDeclareOptions},
    types::FieldTable,
};
use rdkafka::{
    config::ClientConfig,
    consumer::{BaseConsumer, Consumer},
    message::Message,
    producer::{BaseProducer, BaseRecord, Producer},
};
use rocketmq::{
    Producer as RocketProducer, SimpleConsumer as RocketSimpleConsumer,
    conf::{
        ClientOption as RocketClientOption, ProducerOption as RocketProducerOption,
        SimpleConsumerOption as RocketConsumerOption,
    },
    model::{
        common::{FilterExpression, FilterType},
        message::MessageBuilder as RocketMessageBuilder,
    },
};
use rumqttc::{
    AsyncClient, Event, EventLoop, Incoming, MqttOptions, Outgoing, QoS, TlsConfiguration,
    Transport, mqttbytes::v4::ConnectReturnCode,
};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tokio::time::timeout;
use uuid::Uuid;

use crate::error::{AppError, AppResult};

pub const MQ_EVENT: &str = "mq://event";

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MqConfig {
    pub broker: String,
    pub address: String,
    pub port: String,
    #[serde(default)]
    pub username: String,
    #[serde(default)]
    pub password: String,
    #[serde(default)]
    pub tls: bool,
    #[serde(default)]
    pub topic: String,
    #[serde(default)]
    pub qos: String,
    #[serde(default)]
    pub retain: bool,
    #[serde(default)]
    pub group: String,
    #[serde(default)]
    pub partition: String,
    #[serde(default)]
    pub exchange: String,
    #[serde(default)]
    pub queue: String,
    #[serde(default)]
    pub routing_key: String,
    #[serde(default)]
    pub tag: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MqOperationResult {
    pub status: String,
    pub detail: String,
    pub session_id: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MqConsumerEvent {
    pub event: String,
    pub session_id: String,
    pub broker: String,
    pub target: String,
    pub body: String,
    pub detail: String,
}

pub struct MqState {
    consumers: Arc<Mutex<HashMap<String, Arc<AtomicBool>>>>,
}

impl Default for MqState {
    fn default() -> Self {
        Self {
            consumers: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

fn fail(message: impl Into<String>) -> AppError {
    AppError::MessageQueueFailed(message.into())
}

fn port(config: &MqConfig) -> AppResult<u16> {
    config
        .port
        .trim()
        .parse::<u16>()
        .map_err(|_| AppError::InvalidField("端口必须是 1-65535 的数字".to_owned()))
        .and_then(|value| {
            if value == 0 {
                Err(AppError::InvalidField(
                    "端口必须是 1-65535 的数字".to_owned(),
                ))
            } else {
                Ok(value)
            }
        })
}

fn host(address: &str) -> String {
    let mut value = address.trim().to_owned();
    if let Some((_, rest)) = value.split_once("://") {
        value = rest.to_owned();
    }
    if let Some((authority, _)) = value.split_once('/') {
        value = authority.to_owned();
    }
    if let Some(stripped) = value.strip_prefix('[') {
        if let Some((ipv6, _)) = stripped.split_once(']') {
            return ipv6.to_owned();
        }
    }
    if let Some((host_part, port_part)) = value.rsplit_once(':') {
        if port_part.parse::<u16>().is_ok() {
            return host_part.to_owned();
        }
    }
    value.trim_matches('/').to_owned()
}

fn target(config: &MqConfig) -> String {
    match config.broker.as_str() {
        "rabbitmq" => {
            if config.queue.trim().is_empty() {
                config.exchange.trim().to_owned()
            } else {
                config.queue.trim().to_owned()
            }
        }
        _ => config.topic.trim().to_owned(),
    }
}

fn validate(config: &MqConfig) -> AppResult<u16> {
    if !matches!(
        config.broker.as_str(),
        "mqtt" | "kafka" | "rabbitmq" | "rocketmq"
    ) {
        return Err(AppError::InvalidField("不支持的消息中间件类型".to_owned()));
    }
    if config.address.trim().is_empty() {
        return Err(AppError::InvalidField("请先填写 Broker 地址".to_owned()));
    }
    if !config.password.is_empty() && config.username.is_empty() {
        return Err(AppError::InvalidField(
            "填写密码时必须同时填写用户名".to_owned(),
        ));
    }
    if config.broker == "kafka" && (!config.username.is_empty() || !config.password.is_empty()) {
        return Err(AppError::InvalidField(
            "当前桌面版 Kafka 支持无认证连接与 TLS，暂不支持 SASL 用户名密码认证".to_owned(),
        ));
    }
    if config.broker == "rocketmq" && !config.username.is_empty() && config.password.is_empty() {
        return Err(AppError::InvalidField(
            "RocketMQ 使用 AccessKey 时必须同时填写 SecretKey".to_owned(),
        ));
    }
    if config.broker == "rocketmq" && config.group.trim().is_empty() {
        return Err(AppError::InvalidField(
            "请先填写 RocketMQ Consumer Group".to_owned(),
        ));
    }
    let value = port(config)?;
    if target(config).is_empty() {
        return Err(AppError::InvalidField(
            if config.broker == "rabbitmq" {
                "请先填写 Queue 或 Exchange"
            } else {
                "请先填写 Topic"
            }
            .to_owned(),
        ));
    }
    Ok(value)
}

fn qos(value: &str) -> QoS {
    match value {
        "2" => QoS::ExactlyOnce,
        "1" => QoS::AtLeastOnce,
        _ => QoS::AtMostOnce,
    }
}

fn emit_event(app: &AppHandle, event: MqConsumerEvent) {
    let _ = app.emit(MQ_EVENT, event);
}

fn uri_component(value: &str) -> String {
    value
        .bytes()
        .map(|byte| match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                (byte as char).to_string()
            }
            _ => format!("%{byte:02X}"),
        })
        .collect()
}

fn rabbit_uri(config: &MqConfig, port: u16) -> String {
    let scheme = if config.tls { "amqps" } else { "amqp" };
    let credentials = if config.username.is_empty() {
        String::new()
    } else {
        format!(
            "{}:{}@",
            uri_component(&config.username),
            uri_component(&config.password)
        )
    };
    format!(
        "{scheme}://{credentials}{}:{port}/%2f",
        host(&config.address)
    )
}

fn kafka_endpoint(config: &MqConfig, port: u16) -> String {
    let value = config.address.trim();
    if value
        .rsplit_once(':')
        .and_then(|(_, item)| item.parse::<u16>().ok())
        .is_some()
    {
        host(value) + &value[value.rfind(':').unwrap_or(value.len())..]
    } else {
        format!("{}:{port}", host(value))
    }
}

fn rocketmq_endpoint(config: &MqConfig, port: u16) -> String {
    let value = config
        .address
        .trim()
        .split_once("://")
        .map_or(config.address.trim(), |(_, remaining)| remaining)
        .trim_end_matches('/');
    if value
        .rsplit_once(':')
        .and_then(|(_, item)| item.parse::<u16>().ok())
        .is_some()
    {
        value.to_owned()
    } else {
        format!("{}:{port}", host(value))
    }
}

fn rocketmq_client_option(config: &MqConfig, port: u16) -> RocketClientOption {
    let mut option = RocketClientOption::default();
    option.set_access_url(rocketmq_endpoint(config, port));
    option.set_enable_tls(config.tls);
    option.set_timeout(Duration::from_secs(8));
    option.set_long_polling_timeout(Duration::from_millis(500));
    if !config.username.is_empty() {
        option.set_access_key(config.username.clone());
        option.set_secret_key(config.password.clone());
    }
    option
}

fn kafka_config(config: &MqConfig, port: u16, group: Option<&str>) -> ClientConfig {
    let mut client = ClientConfig::new();
    client
        .set("bootstrap.servers", kafka_endpoint(config, port))
        .set("socket.timeout.ms", "8000")
        .set("request.timeout.ms", "8000")
        .set("message.timeout.ms", "8000")
        .set("enable.auto.commit", "true");
    if let Some(group_id) = group {
        client.set("group.id", group_id);
        client.set("auto.offset.reset", "latest");
    }
    if config.tls {
        client.set(
            "security.protocol",
            if config.username.is_empty() {
                "ssl"
            } else {
                "sasl_ssl"
            },
        );
    } else if !config.username.is_empty() {
        client.set("security.protocol", "sasl_plaintext");
    }
    if !config.username.is_empty() {
        client
            .set("sasl.mechanisms", "PLAIN")
            .set("sasl.username", &config.username)
            .set("sasl.password", &config.password);
    }
    client
}

async fn mqtt_wait_for_connection(eventloop: &mut EventLoop) -> AppResult<()> {
    timeout(Duration::from_secs(8), async {
        loop {
            let event = eventloop
                .poll()
                .await
                .map_err(|error| fail(format!("MQTT 连接失败：{error}")))?;
            if let Event::Incoming(Incoming::ConnAck(ack)) = event {
                return if ack.code == ConnectReturnCode::Success {
                    Ok(())
                } else {
                    Err(fail(format!("MQTT Broker 拒绝连接：{:?}", ack.code)))
                };
            }
        }
    })
    .await
    .map_err(|_| fail("MQTT 连接超时"))?
}

async fn mqtt_wait_for_publish(eventloop: &mut EventLoop, level: QoS) -> AppResult<()> {
    timeout(Duration::from_secs(8), async {
        loop {
            let event = eventloop
                .poll()
                .await
                .map_err(|error| fail(format!("MQTT 发布失败：{error}")))?;
            let confirmed = match level {
                QoS::AtMostOnce => matches!(event, Event::Outgoing(Outgoing::Publish(0))),
                QoS::AtLeastOnce => matches!(event, Event::Incoming(Incoming::PubAck(_))),
                QoS::ExactlyOnce => matches!(event, Event::Incoming(Incoming::PubComp(_))),
            };
            if confirmed {
                return Ok(());
            }
        }
    })
    .await
    .map_err(|_| fail("MQTT 发布确认超时"))?
}

fn mqtt_options(config: &MqConfig, port: u16, client_id: &str) -> MqttOptions {
    let mut options = MqttOptions::new(client_id, host(&config.address), port);
    options.set_keep_alive(Duration::from_secs(20));
    if !config.username.is_empty() {
        options.set_credentials(config.username.clone(), config.password.clone());
    }
    if config.tls {
        options.set_transport(Transport::Tls(TlsConfiguration::default()));
    }
    options
}

async fn mqtt_test(config: &MqConfig, port: u16) -> AppResult<()> {
    let options = mqtt_options(config, port, &format!("byetools-test-{}", Uuid::new_v4()));
    let (_client, mut eventloop) = AsyncClient::new(options, 20);
    mqtt_wait_for_connection(&mut eventloop).await
}

async fn mqtt_send(config: &MqConfig, port: u16, body: &str) -> AppResult<()> {
    let options = mqtt_options(config, port, &format!("byetools-send-{}", Uuid::new_v4()));
    let (client, mut eventloop) = AsyncClient::new(options, 20);
    mqtt_wait_for_connection(&mut eventloop).await?;
    let publish_qos = qos(&config.qos);
    client
        .publish(
            config.topic.trim(),
            publish_qos,
            config.retain,
            body.as_bytes(),
        )
        .await
        .map_err(|error| fail(format!("MQTT 发布失败：{error}")))?;
    mqtt_wait_for_publish(&mut eventloop, publish_qos).await?;
    let _ = client.disconnect().await;
    Ok(())
}

async fn mqtt_consume(
    app: AppHandle,
    session_id: String,
    stop: Arc<AtomicBool>,
    config: MqConfig,
    port: u16,
) {
    let options = mqtt_options(
        &config,
        port,
        &format!("byetools-consume-{}", Uuid::new_v4()),
    );
    let (client, mut eventloop) = AsyncClient::new(options, 20);
    let target_name = config.topic.trim().to_owned();
    if let Err(error) = client
        .subscribe(target_name.clone(), qos(&config.qos))
        .await
    {
        emit_event(
            &app,
            MqConsumerEvent {
                event: "error".to_owned(),
                session_id,
                broker: "MQTT".to_owned(),
                target: target_name,
                body: String::new(),
                detail: format!("MQTT 订阅失败：{error}"),
            },
        );
        return;
    }
    loop {
        if stop.load(Ordering::Relaxed) {
            let _ = client.disconnect().await;
            break;
        }
        match timeout(Duration::from_millis(500), eventloop.poll()).await {
            Ok(Ok(Event::Incoming(Incoming::Publish(message)))) => {
                emit_event(
                    &app,
                    MqConsumerEvent {
                        event: "message".to_owned(),
                        session_id: session_id.clone(),
                        broker: "MQTT".to_owned(),
                        target: message.topic,
                        body: String::from_utf8_lossy(&message.payload).into_owned(),
                        detail: "已收到 MQTT 消息".to_owned(),
                    },
                );
            }
            Ok(Ok(_)) | Err(_) => {}
            Ok(Err(error)) => {
                emit_event(
                    &app,
                    MqConsumerEvent {
                        event: "error".to_owned(),
                        session_id: session_id.clone(),
                        broker: "MQTT".to_owned(),
                        target: target_name.clone(),
                        body: String::new(),
                        detail: format!("MQTT 消费连接断开：{error}"),
                    },
                );
                break;
            }
        }
    }
}

fn kafka_test(config: &MqConfig, port: u16) -> AppResult<()> {
    let consumer: BaseConsumer = kafka_config(
        config,
        port,
        Some(&format!("byetools-test-{}", Uuid::new_v4())),
    )
    .create()
    .map_err(|error| fail(format!("Kafka 客户端创建失败：{error}")))?;
    consumer
        .fetch_metadata(None, Duration::from_secs(8))
        .map_err(|error| fail(format!("Kafka 连接失败：{error}")))?;
    Ok(())
}

fn kafka_send(config: &MqConfig, port: u16, body: &str) -> AppResult<()> {
    let producer: BaseProducer = kafka_config(config, port, None)
        .create()
        .map_err(|error| fail(format!("Kafka 客户端创建失败：{error}")))?;
    let mut record: BaseRecord<'_, (), [u8]> =
        BaseRecord::to(config.topic.trim()).payload(body.as_bytes());
    if let Ok(value) = config.partition.trim().parse::<i32>() {
        record = record.partition(value);
    }
    producer
        .send(record)
        .map_err(|(error, _)| fail(format!("Kafka 发布失败：{error}")))?;
    producer
        .flush(Duration::from_secs(8))
        .map_err(|error| fail(format!("Kafka 发布等待失败：{error}")))?;
    Ok(())
}

fn kafka_consume(
    app: AppHandle,
    session_id: String,
    stop: Arc<AtomicBool>,
    config: MqConfig,
    port: u16,
) {
    let group = if config.group.trim().is_empty() {
        format!("byetools-consumer-{}", Uuid::new_v4())
    } else {
        config.group.trim().to_owned()
    };
    let consumer: BaseConsumer = match kafka_config(&config, port, Some(&group)).create() {
        Ok(value) => value,
        Err(error) => {
            emit_event(
                &app,
                MqConsumerEvent {
                    event: "error".to_owned(),
                    session_id,
                    broker: "Kafka".to_owned(),
                    target: config.topic.clone(),
                    body: String::new(),
                    detail: format!("Kafka 客户端创建失败：{error}"),
                },
            );
            return;
        }
    };
    if let Err(error) = consumer.subscribe(&[config.topic.trim()]) {
        emit_event(
            &app,
            MqConsumerEvent {
                event: "error".to_owned(),
                session_id,
                broker: "Kafka".to_owned(),
                target: config.topic.clone(),
                body: String::new(),
                detail: format!("Kafka 订阅失败：{error}"),
            },
        );
        return;
    }
    while !stop.load(Ordering::Relaxed) {
        match consumer.poll(Duration::from_millis(500)) {
            Some(Ok(message)) => {
                let body = message
                    .payload()
                    .map(|value| String::from_utf8_lossy(value).into_owned())
                    .unwrap_or_default();
                emit_event(
                    &app,
                    MqConsumerEvent {
                        event: "message".to_owned(),
                        session_id: session_id.clone(),
                        broker: "Kafka".to_owned(),
                        target: format!(
                            "{} · partition {} · offset {}",
                            message.topic(),
                            message.partition(),
                            message.offset()
                        ),
                        body,
                        detail: "已收到 Kafka 消息".to_owned(),
                    },
                );
            }
            Some(Err(error)) => {
                emit_event(
                    &app,
                    MqConsumerEvent {
                        event: "error".to_owned(),
                        session_id: session_id.clone(),
                        broker: "Kafka".to_owned(),
                        target: config.topic.clone(),
                        body: String::new(),
                        detail: format!("Kafka 消费失败：{error}"),
                    },
                );
                break;
            }
            None => {}
        }
    }
}

async fn rocketmq_test(config: &MqConfig, port: u16) -> AppResult<()> {
    let mut producer_option = RocketProducerOption::default();
    producer_option.set_topics(vec![config.topic.trim()]);
    let mut producer = RocketProducer::new(producer_option, rocketmq_client_option(config, port))
        .map_err(|error| fail(format!("RocketMQ 客户端创建失败：{error}")))?;
    match timeout(Duration::from_secs(8), producer.start()).await {
        Ok(Ok(())) => producer
            .shutdown()
            .await
            .map_err(|error| fail(format!("RocketMQ 关闭连接失败：{error}"))),
        Ok(Err(error)) => Err(fail(format!("RocketMQ Proxy 连接失败：{error}"))),
        Err(_) => Err(fail("RocketMQ Proxy 连接超时")),
    }
}

async fn rocketmq_send(config: &MqConfig, port: u16, body: &str) -> AppResult<()> {
    let mut producer_option = RocketProducerOption::default();
    producer_option.set_topics(vec![config.topic.trim()]);
    let mut producer = RocketProducer::new(producer_option, rocketmq_client_option(config, port))
        .map_err(|error| fail(format!("RocketMQ 客户端创建失败：{error}")))?;
    match timeout(Duration::from_secs(8), producer.start()).await {
        Ok(Ok(())) => {}
        Ok(Err(error)) => return Err(fail(format!("RocketMQ Proxy 连接失败：{error}"))),
        Err(_) => return Err(fail("RocketMQ Proxy 连接超时")),
    }
    let mut message_builder = RocketMessageBuilder::builder()
        .set_topic(config.topic.trim())
        .set_body(body.as_bytes().to_vec());
    let tag = config.tag.trim();
    if !tag.is_empty() && tag != "*" && !tag.contains("||") {
        message_builder = message_builder.set_tag(tag);
    }
    let message = message_builder
        .build()
        .map_err(|error| fail(format!("RocketMQ 消息创建失败：{error}")))?;
    let send_result = timeout(Duration::from_secs(8), producer.send(message)).await;
    let shutdown_result = producer.shutdown().await;
    if let Err(error) = shutdown_result {
        return Err(fail(format!("RocketMQ 关闭连接失败：{error}")));
    }
    match send_result {
        Ok(Ok(_)) => Ok(()),
        Ok(Err(error)) => Err(fail(format!("RocketMQ 发布失败：{error}"))),
        Err(_) => Err(fail("RocketMQ 发布确认超时")),
    }
}

async fn rocketmq_consume(
    app: AppHandle,
    session_id: String,
    stop: Arc<AtomicBool>,
    config: MqConfig,
    port: u16,
) {
    let mut consumer_option = RocketConsumerOption::default();
    consumer_option.set_topics(vec![config.topic.trim()]);
    consumer_option.set_consumer_group(config.group.trim());
    let mut consumer =
        match RocketSimpleConsumer::new(consumer_option, rocketmq_client_option(&config, port)) {
            Ok(value) => value,
            Err(error) => {
                emit_event(
                    &app,
                    MqConsumerEvent {
                        event: "error".to_owned(),
                        session_id,
                        broker: "RocketMQ".to_owned(),
                        target: config.topic.clone(),
                        body: String::new(),
                        detail: format!("RocketMQ 消费者创建失败：{error}"),
                    },
                );
                return;
            }
        };
    let expression = if config.tag.trim().is_empty() {
        "*"
    } else {
        config.tag.trim()
    };
    match timeout(Duration::from_secs(8), consumer.start()).await {
        Ok(Ok(())) => {}
        Ok(Err(error)) => {
            emit_event(
                &app,
                MqConsumerEvent {
                    event: "error".to_owned(),
                    session_id,
                    broker: "RocketMQ".to_owned(),
                    target: config.topic.clone(),
                    body: String::new(),
                    detail: format!("RocketMQ 消费者启动失败：{error}"),
                },
            );
            return;
        }
        Err(_) => {
            emit_event(
                &app,
                MqConsumerEvent {
                    event: "error".to_owned(),
                    session_id,
                    broker: "RocketMQ".to_owned(),
                    target: config.topic.clone(),
                    body: String::new(),
                    detail: "RocketMQ 消费者启动超时".to_owned(),
                },
            );
            return;
        }
    }
    let filter = FilterExpression::new(FilterType::Tag, expression);
    while !stop.load(Ordering::Relaxed) {
        let messages = match consumer.receive(config.topic.trim(), &filter).await {
            Ok(value) => value,
            Err(error) => {
                emit_event(
                    &app,
                    MqConsumerEvent {
                        event: "error".to_owned(),
                        session_id: session_id.clone(),
                        broker: "RocketMQ".to_owned(),
                        target: config.topic.clone(),
                        body: String::new(),
                        detail: format!("RocketMQ 消费失败：{error}"),
                    },
                );
                break;
            }
        };
        for message in messages {
            let body = String::from_utf8_lossy(message.body()).into_owned();
            let message_target = format!(
                "{} · {}",
                message.topic(),
                message.tag().unwrap_or("无 Tag")
            );
            let message_id = message.message_id().to_owned();
            if let Err(error) = consumer.ack(&message).await {
                emit_event(
                    &app,
                    MqConsumerEvent {
                        event: "error".to_owned(),
                        session_id: session_id.clone(),
                        broker: "RocketMQ".to_owned(),
                        target: message_target,
                        body: String::new(),
                        detail: format!("RocketMQ 确认消息失败：{error}"),
                    },
                );
                continue;
            }
            emit_event(
                &app,
                MqConsumerEvent {
                    event: "message".to_owned(),
                    session_id: session_id.clone(),
                    broker: "RocketMQ".to_owned(),
                    target: message_target,
                    body,
                    detail: format!("消息 ID {message_id}"),
                },
            );
        }
    }
    if let Err(error) = consumer.shutdown().await {
        emit_event(
            &app,
            MqConsumerEvent {
                event: "error".to_owned(),
                session_id,
                broker: "RocketMQ".to_owned(),
                target: config.topic.clone(),
                body: String::new(),
                detail: format!("RocketMQ 关闭消费者失败：{error}"),
            },
        );
    }
}

async fn rabbit_test(config: &MqConfig, port: u16) -> AppResult<()> {
    let connection =
        Connection::connect(&rabbit_uri(config, port), ConnectionProperties::default())
            .await
            .map_err(|error| fail(format!("RabbitMQ 连接失败：{error}")))?;
    connection
        .close(200, "ByeTools test")
        .await
        .map_err(|error| fail(format!("RabbitMQ 关闭连接失败：{error}")))?;
    Ok(())
}

async fn rabbit_send(config: &MqConfig, port: u16, body: &str) -> AppResult<()> {
    let connection =
        Connection::connect(&rabbit_uri(config, port), ConnectionProperties::default())
            .await
            .map_err(|error| fail(format!("RabbitMQ 连接失败：{error}")))?;
    let channel = connection
        .create_channel()
        .await
        .map_err(|error| fail(format!("RabbitMQ 创建通道失败：{error}")))?;
    let exchange = config.exchange.trim();
    let routing_key = if config.routing_key.trim().is_empty() {
        config.queue.trim()
    } else {
        config.routing_key.trim()
    };
    channel
        .basic_publish(
            exchange,
            routing_key,
            BasicPublishOptions::default(),
            body.as_bytes(),
            BasicProperties::default(),
        )
        .await
        .map_err(|error| fail(format!("RabbitMQ 发布失败：{error}")))?
        .await
        .map_err(|error| fail(format!("RabbitMQ 发布确认失败：{error}")))?;
    connection
        .close(200, "ByeTools send")
        .await
        .map_err(|error| fail(format!("RabbitMQ 关闭连接失败：{error}")))?;
    Ok(())
}

async fn rabbit_consume(
    app: AppHandle,
    session_id: String,
    stop: Arc<AtomicBool>,
    config: MqConfig,
    port: u16,
) {
    let connection = match Connection::connect(
        &rabbit_uri(&config, port),
        ConnectionProperties::default(),
    )
    .await
    {
        Ok(value) => value,
        Err(error) => {
            emit_event(
                &app,
                MqConsumerEvent {
                    event: "error".to_owned(),
                    session_id,
                    broker: "RabbitMQ".to_owned(),
                    target: config.queue.clone(),
                    body: String::new(),
                    detail: format!("RabbitMQ 连接失败：{error}"),
                },
            );
            return;
        }
    };
    let channel = match connection.create_channel().await {
        Ok(value) => value,
        Err(error) => {
            emit_event(
                &app,
                MqConsumerEvent {
                    event: "error".to_owned(),
                    session_id,
                    broker: "RabbitMQ".to_owned(),
                    target: config.queue.clone(),
                    body: String::new(),
                    detail: format!("RabbitMQ 创建通道失败：{error}"),
                },
            );
            return;
        }
    };
    if let Err(error) = channel
        .queue_declare(
            config.queue.trim(),
            QueueDeclareOptions::default(),
            FieldTable::default(),
        )
        .await
    {
        emit_event(
            &app,
            MqConsumerEvent {
                event: "error".to_owned(),
                session_id,
                broker: "RabbitMQ".to_owned(),
                target: config.queue.clone(),
                body: String::new(),
                detail: format!("RabbitMQ 队列声明失败：{error}"),
            },
        );
        return;
    }
    let consumer_tag = format!("byetools-{}", Uuid::new_v4());
    let mut consumer = match channel
        .basic_consume(
            config.queue.trim(),
            &consumer_tag,
            BasicConsumeOptions::default(),
            FieldTable::default(),
        )
        .await
    {
        Ok(value) => value,
        Err(error) => {
            emit_event(
                &app,
                MqConsumerEvent {
                    event: "error".to_owned(),
                    session_id,
                    broker: "RabbitMQ".to_owned(),
                    target: config.queue.clone(),
                    body: String::new(),
                    detail: format!("RabbitMQ 订阅失败：{error}"),
                },
            );
            return;
        }
    };
    while !stop.load(Ordering::Relaxed) {
        match timeout(Duration::from_millis(500), consumer.next()).await {
            Ok(Some(Ok(delivery))) => {
                let body = String::from_utf8_lossy(&delivery.data).into_owned();
                let detail = delivery.routing_key.to_string();
                if let Err(error) = delivery.ack(BasicAckOptions::default()).await {
                    emit_event(
                        &app,
                        MqConsumerEvent {
                            event: "error".to_owned(),
                            session_id: session_id.clone(),
                            broker: "RabbitMQ".to_owned(),
                            target: config.queue.clone(),
                            body: String::new(),
                            detail: format!("RabbitMQ 确认消息失败：{error}"),
                        },
                    );
                    break;
                }
                emit_event(
                    &app,
                    MqConsumerEvent {
                        event: "message".to_owned(),
                        session_id: session_id.clone(),
                        broker: "RabbitMQ".to_owned(),
                        target: config.queue.clone(),
                        body,
                        detail,
                    },
                );
            }
            Ok(Some(Err(error))) => {
                emit_event(
                    &app,
                    MqConsumerEvent {
                        event: "error".to_owned(),
                        session_id: session_id.clone(),
                        broker: "RabbitMQ".to_owned(),
                        target: config.queue.clone(),
                        body: String::new(),
                        detail: format!("RabbitMQ 消费失败：{error}"),
                    },
                );
                break;
            }
            Ok(None) => break,
            Err(_) => {}
        }
    }
    let _ = channel
        .basic_cancel(&consumer_tag, Default::default())
        .await;
    let _ = connection.close(200, "ByeTools stop").await;
}

pub async fn test_connection(config: MqConfig) -> AppResult<MqOperationResult> {
    let port = validate(&config)?;
    match config.broker.as_str() {
        "mqtt" => mqtt_test(&config, port).await?,
        "kafka" => kafka_test(&config, port)?,
        "rabbitmq" => rabbit_test(&config, port).await?,
        "rocketmq" => rocketmq_test(&config, port).await?,
        _ => unreachable!(),
    }
    Ok(MqOperationResult {
        status: "connected".to_owned(),
        detail: format!(
            "{} 连接成功：{}",
            config.broker.to_uppercase(),
            target(&config)
        ),
        session_id: None,
    })
}

pub async fn send_message(config: MqConfig, body: String) -> AppResult<MqOperationResult> {
    let port = validate(&config)?;
    match config.broker.as_str() {
        "mqtt" => mqtt_send(&config, port, &body).await?,
        "kafka" => kafka_send(&config, port, &body)?,
        "rabbitmq" => rabbit_send(&config, port, &body).await?,
        "rocketmq" => rocketmq_send(&config, port, &body).await?,
        _ => unreachable!(),
    }
    Ok(MqOperationResult {
        status: "sent".to_owned(),
        detail: format!("消息已发送到 {}", target(&config)),
        session_id: None,
    })
}

pub fn start_consumer(
    app: AppHandle,
    state: &MqState,
    config: MqConfig,
) -> AppResult<MqOperationResult> {
    let port = validate(&config)?;
    let session_id = format!("mq-session-{}", Uuid::new_v4());
    let stop = Arc::new(AtomicBool::new(false));
    {
        let mut consumers = state
            .consumers
            .lock()
            .map_err(|_| fail("消息消费者状态不可用"))?;
        for previous in consumers.values() {
            previous.store(true, Ordering::Relaxed);
        }
        consumers.insert(session_id.clone(), stop.clone());
    }
    let thread_session = session_id.clone();
    let thread_config = config.clone();
    let consumers = Arc::clone(&state.consumers);
    thread::spawn(move || {
        let runtime = match tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
        {
            Ok(value) => value,
            Err(error) => {
                emit_event(
                    &app,
                    MqConsumerEvent {
                        event: "error".to_owned(),
                        session_id: thread_session.clone(),
                        broker: thread_config.broker.clone(),
                        target: target(&thread_config),
                        body: String::new(),
                        detail: format!("创建消费者运行时失败：{error}"),
                    },
                );
                let _ = consumers
                    .lock()
                    .map(|mut values| values.remove(&thread_session));
                return;
            }
        };
        match thread_config.broker.as_str() {
            "mqtt" => runtime.block_on(mqtt_consume(
                app.clone(),
                thread_session.clone(),
                stop.clone(),
                thread_config.clone(),
                port,
            )),
            "rabbitmq" => runtime.block_on(rabbit_consume(
                app.clone(),
                thread_session.clone(),
                stop.clone(),
                thread_config.clone(),
                port,
            )),
            "kafka" => kafka_consume(
                app.clone(),
                thread_session.clone(),
                stop.clone(),
                thread_config.clone(),
                port,
            ),
            "rocketmq" => runtime.block_on(rocketmq_consume(
                app.clone(),
                thread_session.clone(),
                stop.clone(),
                thread_config.clone(),
                port,
            )),
            _ => {}
        }
        let _ = consumers
            .lock()
            .map(|mut values| values.remove(&thread_session));
        let broker_name = thread_config.broker.clone();
        let target_name = target(&thread_config);
        emit_event(
            &app,
            MqConsumerEvent {
                event: "stopped".to_owned(),
                session_id: thread_session,
                broker: broker_name,
                target: target_name,
                body: String::new(),
                detail: "消费者已停止".to_owned(),
            },
        );
    });
    Ok(MqOperationResult {
        status: "consuming".to_owned(),
        detail: format!("已开始监听 {}", target(&config)),
        session_id: Some(session_id),
    })
}

pub fn stop_consumer(state: &MqState, session_id: String) -> AppResult<MqOperationResult> {
    let stop = state
        .consumers
        .lock()
        .map_err(|_| fail("消息消费者状态不可用"))?
        .remove(&session_id);
    if let Some(value) = stop {
        value.store(true, Ordering::Relaxed);
        Ok(MqOperationResult {
            status: "stopping".to_owned(),
            detail: "正在停止消费者".to_owned(),
            session_id: Some(session_id),
        })
    } else {
        Ok(MqOperationResult {
            status: "stopped".to_owned(),
            detail: "消费者已经停止".to_owned(),
            session_id: Some(session_id),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn rocketmq_config() -> MqConfig {
        MqConfig {
            broker: "rocketmq".to_owned(),
            address: "localhost".to_owned(),
            port: "8081".to_owned(),
            username: String::new(),
            password: String::new(),
            tls: false,
            topic: "ByeToolsTopic".to_owned(),
            qos: String::new(),
            retain: false,
            group: "byetools-consumer".to_owned(),
            partition: String::new(),
            exchange: String::new(),
            queue: String::new(),
            routing_key: String::new(),
            tag: "*".to_owned(),
        }
    }

    #[test]
    fn rocketmq_config_uses_proxy_endpoint() {
        let config = rocketmq_config();
        assert_eq!(validate(&config).unwrap(), 8081);
        assert_eq!(rocketmq_endpoint(&config, 8081), "localhost:8081");

        let mut explicit = config.clone();
        explicit.address = "https://rocketmq.example.com:8443/".to_owned();
        assert_eq!(
            rocketmq_endpoint(&explicit, 8081),
            "rocketmq.example.com:8443"
        );
    }

    #[test]
    fn rocketmq_config_requires_group_and_complete_acl() {
        let mut config = rocketmq_config();
        config.group.clear();
        assert!(validate(&config).is_err());

        config.group = "byetools-consumer".to_owned();
        config.username = "access-key".to_owned();
        assert!(validate(&config).is_err());

        config.password = "secret-key".to_owned();
        assert!(validate(&config).is_ok());
    }
}
