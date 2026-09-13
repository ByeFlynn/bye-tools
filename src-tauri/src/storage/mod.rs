use std::{
    path::Path,
    time::{SystemTime, UNIX_EPOCH},
};

use rusqlite::{Connection, OpenFlags, OptionalExtension, Transaction, params};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::{
    crypto::{CRYPTO_VERSION, decrypt, draft_aad, encrypt},
    error::{AppError, AppResult},
    state::AppState,
};

pub mod crypto_config;

const INITIAL_MIGRATION: &str = include_str!("../../migrations/001_initial.sql");
const SCHEMA_VERSION: i64 = 1;
const SETTING_KEYS: [&str; 10] = [
    "theme-mode",
    "menu-layout",
    "density",
    "json-layout",
    "json-sort",
    "json-lint",
    "json-auto-decode",
    "json-node-edit",
    "json-nested",
    "mq-configs",
];
const TOOL_IDS: [&str; 57] = [
    "json",
    "json-to-types",
    "xml-format",
    "xml-converter",
    "sql-format",
    "base64",
    "qr-barcode",
    "time",
    "url",
    "md5",
    "sha2",
    "sha3",
    "sm2",
    "sm3",
    "sm4",
    "aes",
    "des",
    "3des",
    "rsa",
    "unicode",
    "ip",
    "message-queue",
    "linux-commands",
    "html",
    "regex",
    "random",
    "password",
    "color",
    "diff",
    "mermaid",
    "markdown-image",
    "markdown-editor",
    "mindmap",
    "image-tools",
    "favicon",
    "pdf-tools",
    "jwt",
    "curl",
    "cron",
    "gradient",
    "shadow",
    "contrast",
    "palette",
    "px-rem",
    "uuid-generator",
    "string-generator",
    "slug",
    "fake-data",
    "timezone",
    "date-calculator",
    "world-clock",
    "text-counter",
    "case-converter",
    "text-replace",
    "text-cleaner",
    "line-tools",
    "invisible",
];

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DraftWriteInput {
    pub tool_id: String,
    pub payload: Value,
    #[serde(default)]
    pub is_sensitive: bool,
    #[serde(default = "default_payload_version")]
    pub payload_version: u32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DraftRecord {
    pub tool_id: String,
    pub payload: Value,
    pub is_sensitive: bool,
    pub payload_version: u32,
    pub crypto_version: Option<u32>,
    pub key_id: Option<String>,
    pub updated_at: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageStatus {
    pub mode: &'static str,
    pub database_encrypted: bool,
    pub field_encryption: &'static str,
    pub credential_store: &'static str,
    pub cipher_version: String,
    pub schema_version: i64,
    pub database_path: String,
}

fn default_payload_version() -> u32 {
    1
}

pub fn now_millis() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|value| value.as_millis() as i64)
        .unwrap_or_default()
}

pub fn open_sqlcipher_database(
    path: &Path,
    database_key: &[u8; 32],
) -> AppResult<(Connection, String)> {
    let connection = Connection::open_with_flags(
        path,
        OpenFlags::SQLITE_OPEN_READ_WRITE
            | OpenFlags::SQLITE_OPEN_CREATE
            | OpenFlags::SQLITE_OPEN_FULL_MUTEX,
    )?;
    let key_hex = encode_hex(database_key);
    connection
        .execute_batch(&format!("PRAGMA key = \"x'{key_hex}'\";"))
        .map_err(|_| AppError::CipherUnavailable)?;
    let cipher_version = connection
        .query_row("PRAGMA cipher_version", [], |row| row.get::<_, String>(0))
        .map_err(|_| AppError::CipherUnavailable)?;
    if cipher_version.trim().is_empty() {
        return Err(AppError::CipherUnavailable);
    }
    connection
        .execute_batch(
            "PRAGMA foreign_keys = ON;
             PRAGMA journal_mode = WAL;
             PRAGMA busy_timeout = 5000;
             PRAGMA secure_delete = ON;
             PRAGMA trusted_schema = OFF;",
        )
        .map_err(|_| AppError::StorageFailed)?;
    Ok((connection, cipher_version))
}

pub fn migrate_database(connection: &mut Connection) -> AppResult<()> {
    let version = connection.query_row("PRAGMA user_version", [], |row| row.get::<_, i64>(0))?;
    if version > SCHEMA_VERSION {
        return Err(AppError::VersionUnsupported(version as u32));
    }
    if version == SCHEMA_VERSION {
        return Ok(());
    }
    let applied_at = now_millis();
    let transaction = connection.transaction()?;
    transaction.execute_batch(INITIAL_MIGRATION)?;
    transaction.execute(
        "INSERT OR REPLACE INTO storage_migrations(migration_id, status, details_json, applied_at)
         VALUES ('001_initial', 'completed', '{\"schemaVersion\":1}', ?1)",
        [applied_at],
    )?;
    transaction.pragma_update(None, "user_version", SCHEMA_VERSION)?;
    transaction.commit()?;
    Ok(())
}

pub fn get_setting(state: &AppState, key: &str) -> AppResult<Option<Value>> {
    validate_setting_key(key)?;
    let database = state.lock_database()?;
    let value = database
        .query_row(
            "SELECT value_json FROM app_settings WHERE setting_key = ?1",
            [key],
            |row| row.get::<_, String>(0),
        )
        .optional()?;
    value
        .map(|encoded| serde_json::from_str(&encoded).map_err(Into::into))
        .transpose()
}

pub fn set_setting(state: &AppState, key: &str, value: &Value) -> AppResult<()> {
    validate_setting_key(key)?;
    validate_setting_value(key, value)?;
    let encoded = serde_json::to_string(value)?;
    let mut database = state.lock_database()?;
    let transaction = database.transaction()?;
    transaction.execute(
        "INSERT INTO app_settings(setting_key, value_json, updated_at) VALUES (?1, ?2, ?3)
         ON CONFLICT(setting_key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at",
        params![key, encoded, now_millis()],
    )?;
    transaction.commit()?;
    Ok(())
}

pub fn get_favorites(state: &AppState) -> AppResult<Vec<String>> {
    let database = state.lock_database()?;
    query_string_list(
        &database,
        "SELECT tool_id FROM favorites ORDER BY created_at DESC",
        [],
    )
}

pub fn set_favorite(state: &AppState, tool_id: &str, enabled: bool) -> AppResult<()> {
    validate_tool_id(tool_id)?;
    let mut database = state.lock_database()?;
    let transaction = database.transaction()?;
    if enabled {
        transaction.execute(
            "INSERT INTO favorites(tool_id, created_at) VALUES (?1, ?2)
             ON CONFLICT(tool_id) DO UPDATE SET created_at = excluded.created_at",
            params![tool_id, now_millis()],
        )?;
    } else {
        transaction.execute("DELETE FROM favorites WHERE tool_id = ?1", [tool_id])?;
    }
    transaction.commit()?;
    Ok(())
}

pub fn get_recent_tools(state: &AppState, limit: u32) -> AppResult<Vec<String>> {
    let limit = limit.clamp(1, 100);
    let database = state.lock_database()?;
    let mut statement =
        database.prepare("SELECT tool_id FROM recent_tools ORDER BY opened_at DESC LIMIT ?1")?;
    let rows = statement.query_map([limit], |row| row.get::<_, String>(0))?;
    rows.collect::<Result<Vec<_>, _>>().map_err(Into::into)
}

pub fn set_recent_tools(state: &AppState, ids: &[String]) -> AppResult<()> {
    let unique = ids.iter().take(12).try_fold(Vec::new(), |mut result, id| {
        validate_tool_id(id)?;
        if !result.contains(id) {
            result.push(id.clone());
        }
        AppResult::Ok(result)
    })?;
    let now = now_millis();
    let mut database = state.lock_database()?;
    let transaction = database.transaction()?;
    transaction.execute("DELETE FROM recent_tools", [])?;
    for (index, tool_id) in unique.iter().enumerate() {
        transaction.execute(
            "INSERT INTO recent_tools(tool_id, opened_at, open_count) VALUES (?1, ?2, 1)",
            params![tool_id, now - index as i64],
        )?;
    }
    transaction.commit()?;
    Ok(())
}

pub fn get_tool_history(state: &AppState, tool_id: &str) -> AppResult<Vec<Value>> {
    validate_tool_id(tool_id)?;
    let database = state.lock_database()?;
    let mut statement = database.prepare(
        "SELECT summary_json FROM tool_history WHERE tool_id = ?1 ORDER BY created_at DESC",
    )?;
    let rows = statement.query_map([tool_id], |row| row.get::<_, String>(0))?;
    rows.map(|row| {
        let encoded = row.map_err(AppError::from)?;
        serde_json::from_str(&encoded).map_err(Into::into)
    })
    .collect()
}

pub fn replace_tool_history(state: &AppState, tool_id: &str, items: &[Value]) -> AppResult<()> {
    validate_tool_id(tool_id)?;
    let now = now_millis();
    let records = items
        .iter()
        .take(100)
        .enumerate()
        .map(|(index, item)| {
            validate_history_summary(item)?;
            Ok((
                uuid::Uuid::new_v4().to_string(),
                serde_json::to_string(item)?,
                item.get("savedAt")
                    .and_then(Value::as_i64)
                    .unwrap_or(now - index as i64),
            ))
        })
        .collect::<AppResult<Vec<_>>>()?;
    let mut database = state.lock_database()?;
    let transaction = database.transaction()?;
    transaction.execute("DELETE FROM tool_history WHERE tool_id = ?1", [tool_id])?;
    for (id, summary, created_at) in records {
        transaction.execute(
            "INSERT INTO tool_history(id, tool_id, summary_json, created_at) VALUES (?1, ?2, ?3, ?4)",
            params![id, tool_id, summary, created_at],
        )?;
    }
    transaction.commit()?;
    Ok(())
}

pub fn set_draft(state: &AppState, input: &DraftWriteInput) -> AppResult<()> {
    validate_tool_id(&input.tool_id)?;
    if input.payload_version != 1 {
        return Err(AppError::VersionUnsupported(input.payload_version));
    }
    let encoded = serde_json::to_vec(&input.payload)?;
    if encoded.len() > 5 * 1024 * 1024 {
        return Err(AppError::InvalidField("草稿不能超过 5 MB".into()));
    }
    let data_key = state.lock_data_key()?;
    let (payload, nonce, crypto_version, key_id) = if input.is_sensitive {
        let aad = draft_aad(&input.tool_id, input.payload_version, CRYPTO_VERSION)?;
        let encrypted = encrypt(&data_key.bytes, &encoded, &aad)?;
        (
            encrypted.ciphertext,
            Some(encrypted.nonce),
            Some(CRYPTO_VERSION),
            Some(data_key.id.clone()),
        )
    } else {
        (encoded, None, None, None)
    };
    let mut database = state.lock_database()?;
    let transaction = database.transaction()?;
    transaction.execute(
        "INSERT INTO tool_drafts(tool_id, payload, is_sensitive, nonce, payload_version, crypto_version, key_id, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         ON CONFLICT(tool_id) DO UPDATE SET payload = excluded.payload, is_sensitive = excluded.is_sensitive,
         nonce = excluded.nonce, payload_version = excluded.payload_version, crypto_version = excluded.crypto_version,
         key_id = excluded.key_id, updated_at = excluded.updated_at",
        params![
            input.tool_id,
            payload,
            i64::from(input.is_sensitive),
            nonce,
            input.payload_version,
            crypto_version,
            key_id,
            now_millis()
        ],
    )?;
    transaction.commit()?;
    Ok(())
}

pub fn get_draft(state: &AppState, tool_id: &str) -> AppResult<Option<DraftRecord>> {
    validate_tool_id(tool_id)?;
    let database = state.lock_database()?;
    let stored = database
        .query_row(
            "SELECT payload, is_sensitive, nonce, payload_version, crypto_version, key_id, updated_at
             FROM tool_drafts WHERE tool_id = ?1",
            [tool_id],
            |row| {
                Ok((
                    row.get::<_, Vec<u8>>(0)?,
                    row.get::<_, bool>(1)?,
                    row.get::<_, Option<Vec<u8>>>(2)?,
                    row.get::<_, u32>(3)?,
                    row.get::<_, Option<u32>>(4)?,
                    row.get::<_, Option<String>>(5)?,
                    row.get::<_, i64>(6)?,
                ))
            },
        )
        .optional()?;
    let Some((payload, is_sensitive, nonce, payload_version, crypto_version, key_id, updated_at)) =
        stored
    else {
        return Ok(None);
    };
    let plaintext = if is_sensitive {
        let crypto_version = crypto_version.ok_or(AppError::InvalidData)?;
        let nonce = nonce.ok_or(AppError::InvalidData)?;
        let data_key = state.lock_data_key()?;
        if key_id.as_deref() != Some(data_key.id.as_str()) {
            return Err(AppError::KeyUnavailable);
        }
        let aad = draft_aad(tool_id, payload_version, crypto_version)?;
        decrypt(&data_key.bytes, &payload, &nonce, &aad)?.to_vec()
    } else {
        payload
    };
    Ok(Some(DraftRecord {
        tool_id: tool_id.to_owned(),
        payload: serde_json::from_slice(&plaintext)?,
        is_sensitive,
        payload_version,
        crypto_version,
        key_id,
        updated_at,
    }))
}

pub fn get_storage_status(state: &AppState) -> AppResult<StorageStatus> {
    let database = state.lock_database()?;
    let schema_version = database.query_row("PRAGMA user_version", [], |row| row.get(0))?;
    Ok(StorageStatus {
        mode: "sqlite",
        database_encrypted: true,
        field_encryption: "AES-256-GCM",
        credential_store: credential_store_name(),
        cipher_version: state.cipher_version.clone(),
        schema_version,
        database_path: state.database_path.to_string_lossy().into_owned(),
    })
}

pub fn checkpoint(database: &Connection) -> AppResult<()> {
    database.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);")?;
    Ok(())
}

pub fn rotate_sensitive_drafts(
    transaction: &Transaction<'_>,
    old_key: &[u8; 32],
    new_key: &[u8; 32],
    new_key_id: &str,
) -> AppResult<usize> {
    let mut statement = transaction.prepare(
        "SELECT tool_id, payload, nonce, payload_version, crypto_version FROM tool_drafts WHERE is_sensitive = 1",
    )?;
    let rows = statement.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, Vec<u8>>(1)?,
            row.get::<_, Vec<u8>>(2)?,
            row.get::<_, u32>(3)?,
            row.get::<_, u32>(4)?,
        ))
    })?;
    let records = rows.collect::<Result<Vec<_>, _>>()?;
    drop(statement);
    for (tool_id, payload, nonce, payload_version, crypto_version) in &records {
        let aad = draft_aad(tool_id, *payload_version, *crypto_version)?;
        let plaintext = decrypt(old_key, payload, nonce, &aad)?;
        let encrypted = encrypt(new_key, &plaintext, &aad)?;
        transaction.execute(
            "UPDATE tool_drafts SET payload = ?1, nonce = ?2, key_id = ?3, updated_at = ?4 WHERE tool_id = ?5",
            params![encrypted.ciphertext, encrypted.nonce, new_key_id, now_millis(), tool_id],
        )?;
    }
    Ok(records.len())
}

fn validate_setting_key(key: &str) -> AppResult<()> {
    if SETTING_KEYS.contains(&key) {
        Ok(())
    } else {
        Err(AppError::InvalidField("设置项不在白名单中".into()))
    }
}

fn validate_setting_value(key: &str, value: &Value) -> AppResult<()> {
    let valid = match key {
        "theme-mode" => value
            .as_str()
            .is_some_and(|value| ["dark", "light", "system"].contains(&value)),
        "menu-layout" => value
            .as_str()
            .is_some_and(|value| ["standard", "compact", "icon"].contains(&value)),
        "density" => value
            .as_str()
            .is_some_and(|value| ["comfortable", "compact"].contains(&value)),
        "json-layout" => value
            .as_str()
            .is_some_and(|value| ["side", "stack"].contains(&value)),
        "json-sort" => value
            .as_str()
            .is_some_and(|value| ["default", "asc", "desc"].contains(&value)),
        "mq-configs" => validate_mq_configs(value),
        _ => value.is_boolean(),
    };
    if valid {
        Ok(())
    } else {
        Err(AppError::InvalidField("设置值无效".into()))
    }
}

fn validate_mq_configs(value: &Value) -> bool {
    let Some(configs) = value.as_array() else {
        return false;
    };
    let allowed_fields = [
        "id",
        "name",
        "broker",
        "address",
        "port",
        "username",
        "tls",
        "topic",
        "qos",
        "retain",
        "group",
        "partition",
        "exchange",
        "queue",
        "routingKey",
        "tag",
        "savedAt",
    ];
    configs.len() <= 20
        && serde_json::to_vec(value).is_ok_and(|encoded| encoded.len() <= 128 * 1024)
        && configs.iter().all(|config| {
            let Some(fields) = config.as_object() else {
                return false;
            };
            if fields
                .keys()
                .any(|key| !allowed_fields.contains(&key.as_str()))
            {
                return false;
            }
            let broker_valid = fields
                .get("broker")
                .and_then(Value::as_str)
                .is_some_and(|broker| ["mqtt", "kafka", "rabbitmq", "rocketmq"].contains(&broker));
            let identity_valid = ["id", "name", "address", "port"].iter().all(|key| {
                fields
                    .get(*key)
                    .and_then(Value::as_str)
                    .is_some_and(|field| !field.is_empty() && field.len() <= 512)
            });
            let port_valid = fields
                .get("port")
                .and_then(Value::as_str)
                .and_then(|port| port.parse::<u16>().ok())
                .is_some_and(|port| port > 0);
            let strings_valid = [
                "username",
                "topic",
                "qos",
                "group",
                "partition",
                "exchange",
                "queue",
                "routingKey",
                "tag",
            ]
            .iter()
            .all(|key| {
                fields
                    .get(*key)
                    .is_none_or(|field| field.as_str().is_some_and(|text| text.len() <= 4096))
            });
            let booleans_valid = ["tls", "retain"]
                .iter()
                .all(|key| fields.get(*key).is_none_or(Value::is_boolean));
            let timestamp_valid = fields.get("savedAt").is_none_or(Value::is_number);
            broker_valid
                && identity_valid
                && port_valid
                && strings_valid
                && booleans_valid
                && timestamp_valid
        })
}

pub fn validate_tool_id(tool_id: &str) -> AppResult<()> {
    if TOOL_IDS.contains(&tool_id) {
        Ok(())
    } else {
        Err(AppError::InvalidField("工具 ID 无效".into()))
    }
}

fn validate_history_summary(value: &Value) -> AppResult<()> {
    let object = value
        .as_object()
        .ok_or_else(|| AppError::InvalidField("历史摘要格式无效".into()))?;
    if object.len() > 20 || serde_json::to_vec(value)?.len() > 64 * 1024 {
        return Err(AppError::InvalidField("历史摘要超出大小限制".into()));
    }
    let sensitive_names = [
        "password",
        "passwd",
        "secret",
        "token",
        "private",
        "plaintext",
        "ciphertext",
        "input",
        "result",
        "jwt",
        "authorization",
    ];
    if object.keys().any(|key| {
        let normalized = key.to_ascii_lowercase();
        sensitive_names.iter().any(|name| normalized.contains(name))
            || matches!(normalized.as_str(), "key" | "iv" | "nonce")
    }) {
        return Err(AppError::InvalidField("历史摘要包含未授权字段".into()));
    }
    Ok(())
}

fn query_string_list<P>(connection: &Connection, sql: &str, params: P) -> AppResult<Vec<String>>
where
    P: rusqlite::Params,
{
    let mut statement = connection.prepare(sql)?;
    let rows = statement.query_map(params, |row| row.get::<_, String>(0))?;
    rows.collect::<Result<Vec<_>, _>>().map_err(Into::into)
}

fn encode_hex(bytes: &[u8]) -> String {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut output = String::with_capacity(bytes.len() * 2);
    for byte in bytes {
        output.push(HEX[(byte >> 4) as usize] as char);
        output.push(HEX[(byte & 0x0f) as usize] as char);
    }
    output
}

#[cfg(target_os = "windows")]
fn credential_store_name() -> &'static str {
    "Windows Credential Manager"
}

#[cfg(target_os = "macos")]
fn credential_store_name() -> &'static str {
    "macOS Keychain"
}

#[cfg(all(unix, not(target_os = "macos")))]
fn credential_store_name() -> &'static str {
    "Secret Service"
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use rusqlite::Connection;
    use serde_json::json;
    use tempfile::TempDir;

    use super::*;
    use crate::{
        credentials::{CredentialProvider, tests::MemoryCredentialProvider},
        crypto::{CryptoConfigField, CryptoConfigPayload, CryptoConfigWriteInput},
        storage::crypto_config,
    };

    fn create_state() -> (TempDir, Arc<MemoryCredentialProvider>, AppState) {
        let directory = tempfile::tempdir().expect("临时目录应创建成功");
        let credentials = Arc::new(MemoryCredentialProvider::default());
        let state = AppState::initialize(directory.path().join("byetools.db"), credentials.clone())
            .expect("测试数据库应初始化成功");
        (directory, credentials, state)
    }

    fn config_input(name: &str) -> CryptoConfigWriteInput {
        CryptoConfigWriteInput {
            tool_id: "aes".into(),
            name: name.into(),
            payload: CryptoConfigPayload {
                schema_version: 1,
                tool_id: "aes".into(),
                operation: "encrypt".into(),
                fields: vec![
                    CryptoConfigField {
                        key: "crypto-mode".into(),
                        field_type: "select".into(),
                        value: json!("GCM"),
                        sensitive: false,
                        required: true,
                    },
                    CryptoConfigField {
                        key: "crypto-key".into(),
                        field_type: "secret".into(),
                        value: json!("0123456789abcdef0123456789abcdef"),
                        sensitive: true,
                        required: true,
                    },
                ],
            },
        }
    }

    #[test]
    fn sqlcipher_rejects_connection_without_key() {
        let (directory, _credentials, state) = create_state();
        set_setting(&state, "theme-mode", &json!("dark")).expect("设置应写入成功");
        drop(state);
        let database =
            Connection::open(directory.path().join("byetools.db")).expect("无密钥连接本身可以创建");
        let result = database.query_row("SELECT count(*) FROM sqlite_master", [], |row| {
            row.get::<_, i64>(0)
        });
        assert!(result.is_err(), "SQLCipher 数据库不应允许无密钥读取");
    }

    #[test]
    fn mq_configs_are_persisted_without_passwords() {
        let (_directory, _credentials, state) = create_state();
        let configs = json!([{
            "id": "mq-local",
            "name": "本地 MQTT",
            "broker": "mqtt",
            "address": "localhost",
            "port": "1883",
            "topic": "byetools/demo"
        }]);
        set_setting(&state, "mq-configs", &configs).expect("消息队列配置应写入成功");
        assert_eq!(
            get_setting(&state, "mq-configs").expect("消息队列配置应读取成功"),
            Some(configs)
        );

        let unsafe_configs = json!([{
            "id": "mq-unsafe",
            "name": "不安全配置",
            "broker": "mqtt",
            "address": "localhost",
            "port": "1883",
            "password": "secret"
        }]);
        assert!(matches!(
            set_setting(&state, "mq-configs", &unsafe_configs),
            Err(AppError::InvalidField(_))
        ));

        let disguised_secret = json!([{
            "id": "mq-unsafe-alias",
            "name": "不安全别名配置",
            "broker": "mqtt",
            "address": "localhost",
            "port": "1883",
            "secret": "secret"
        }]);
        assert!(matches!(
            set_setting(&state, "mq-configs", &disguised_secret),
            Err(AppError::InvalidField(_))
        ));
    }

    #[test]
    fn mq_configs_accept_rocketmq_fields() {
        let (_directory, _credentials, state) = create_state();
        let configs = json!([{
            "id": "mq-rocket",
            "name": "RocketMQ 测试",
            "broker": "rocketmq",
            "address": "localhost",
            "port": "8081",
            "username": "access-key",
            "tls": false,
            "topic": "ByeToolsTopic",
            "tag": "TagA || TagB",
            "group": "byetools-consumer"
        }]);

        set_setting(&state, "mq-configs", &configs).expect("RocketMQ 配置应写入成功");
        assert_eq!(
            get_setting(&state, "mq-configs").expect("RocketMQ 配置应读取成功"),
            Some(configs)
        );
    }

    #[test]
    fn config_list_is_masked_and_aad_tamper_fails() {
        let (_directory, _credentials, state) = create_state();
        let summary =
            crypto_config::save(&state, &config_input("接口配置")).expect("配置应保存成功");
        let list = crypto_config::list(&state, "aes").expect("摘要应读取成功");
        let encoded = serde_json::to_string(&list).expect("摘要应可序列化");
        assert!(!encoded.contains("0123456789abcdef0123456789abcdef"));
        assert_eq!(list[0].masked_fields["crypto-key"], "0123••••cdef");
        let payload = crypto_config::apply(&state, "aes", &summary.id).expect("配置应解密成功");
        assert_eq!(payload, config_input("接口配置").payload);

        state
            .lock_database()
            .expect("数据库锁应可用")
            .execute(
                "UPDATE tool_configs SET name = '被篡改的名称' WHERE id = ?1",
                [&summary.id],
            )
            .expect("测试数据应可篡改");
        assert!(matches!(
            crypto_config::apply(&state, "aes", &summary.id),
            Err(AppError::PayloadTampered)
        ));
    }

    #[test]
    fn sensitive_draft_and_config_survive_key_rotation() {
        let (directory, credentials, state) = create_state();
        let summary =
            crypto_config::save(&state, &config_input("轮换配置")).expect("配置应保存成功");
        let draft = DraftWriteInput {
            tool_id: "aes".into(),
            payload: json!({ "token": "sensitive-draft-value" }),
            is_sensitive: true,
            payload_version: 1,
        };
        set_draft(&state, &draft).expect("敏感草稿应保存成功");
        let report = crypto_config::rotate_key(&state, 2).expect("密钥轮换应成功");
        assert_eq!(report.rotated_configs, 1);
        assert_eq!(report.rotated_drafts, 1);
        assert!(
            credentials
                .get("data-key-v1")
                .expect("凭证读取应成功")
                .is_none()
        );
        assert!(
            credentials
                .get("data-key-v2")
                .expect("凭证读取应成功")
                .is_some()
        );
        assert!(crypto_config::apply(&state, "aes", &summary.id).is_ok());
        assert_eq!(
            get_draft(&state, "aes")
                .expect("草稿读取应成功")
                .expect("草稿应存在")
                .payload,
            draft.payload
        );
        checkpoint(&state.lock_database().expect("数据库锁应可用")).expect("检查点应执行成功");
        let database_bytes =
            std::fs::read(directory.path().join("byetools.db")).expect("数据库文件应可读取");
        assert!(
            !database_bytes
                .windows(b"sensitive-draft-value".len())
                .any(|window| window == b"sensitive-draft-value")
        );
    }
}
