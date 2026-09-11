use tauri::State;

use crate::{
    crypto::{CryptoConfigPayload, CryptoConfigSummary, CryptoConfigWriteInput},
    error::AppResult,
    state::AppState,
    storage::crypto_config::{self, MigrationReport, RotationReport},
};

#[tauri::command]
pub fn crypto_config_list(
    state: State<'_, AppState>,
    tool_id: String,
) -> AppResult<Vec<CryptoConfigSummary>> {
    crypto_config::list(&state, &tool_id)
}

#[tauri::command]
pub fn crypto_config_save(
    state: State<'_, AppState>,
    input: CryptoConfigWriteInput,
) -> AppResult<CryptoConfigSummary> {
    crypto_config::save(&state, &input)
}

#[tauri::command]
pub fn crypto_config_apply(
    state: State<'_, AppState>,
    tool_id: String,
    record_id: String,
) -> AppResult<CryptoConfigPayload> {
    crypto_config::apply(&state, &tool_id, &record_id)
}

#[tauri::command]
pub fn crypto_config_update(
    state: State<'_, AppState>,
    record_id: String,
    input: CryptoConfigWriteInput,
) -> AppResult<CryptoConfigSummary> {
    crypto_config::update(&state, &record_id, &input)
}

#[tauri::command]
pub fn crypto_config_delete(
    state: State<'_, AppState>,
    tool_id: String,
    record_id: String,
) -> AppResult<()> {
    crypto_config::delete(&state, &tool_id, &record_id)
}

#[tauri::command]
pub fn crypto_config_migrate(
    state: State<'_, AppState>,
    source_version: u32,
    records: Vec<CryptoConfigWriteInput>,
) -> AppResult<MigrationReport> {
    crypto_config::migrate(&state, source_version, &records)
}

#[tauri::command]
pub fn crypto_config_rotate_key(
    state: State<'_, AppState>,
    target_version: u32,
) -> AppResult<RotationReport> {
    crypto_config::rotate_key(&state, target_version)
}
