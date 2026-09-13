use tauri::{AppHandle, State};

use crate::{
    error::AppResult,
    mq::{self, MqConfig, MqOperationResult, MqState},
};

#[tauri::command]
pub async fn mq_test_connection(config: MqConfig) -> AppResult<MqOperationResult> {
    mq::test_connection(config).await
}

#[tauri::command]
pub async fn mq_send_message(config: MqConfig, message: String) -> AppResult<MqOperationResult> {
    mq::send_message(config, message).await
}

#[tauri::command]
pub fn mq_start_consumer(
    app: AppHandle,
    state: State<'_, MqState>,
    config: MqConfig,
) -> AppResult<MqOperationResult> {
    mq::start_consumer(app, &state, config)
}

#[tauri::command]
pub fn mq_stop_consumer(
    state: State<'_, MqState>,
    session_id: String,
) -> AppResult<MqOperationResult> {
    mq::stop_consumer(&state, session_id)
}
