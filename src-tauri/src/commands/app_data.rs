use serde_json::Value;
use tauri::State;

use crate::{
    error::AppResult,
    state::AppState,
    storage::{self, DraftRecord, DraftWriteInput, StorageStatus},
};

#[tauri::command]
pub fn setting_get(state: State<'_, AppState>, key: String) -> AppResult<Option<Value>> {
    storage::get_setting(&state, &key)
}

#[tauri::command]
pub fn setting_set(state: State<'_, AppState>, key: String, value: Value) -> AppResult<()> {
    storage::set_setting(&state, &key, &value)
}

#[tauri::command]
pub fn favorites_get(state: State<'_, AppState>) -> AppResult<Vec<String>> {
    storage::get_favorites(&state)
}

#[tauri::command]
pub fn favorite_set(state: State<'_, AppState>, tool_id: String, enabled: bool) -> AppResult<()> {
    storage::set_favorite(&state, &tool_id, enabled)
}

#[tauri::command]
pub fn recent_tools_get(state: State<'_, AppState>, limit: Option<u32>) -> AppResult<Vec<String>> {
    storage::get_recent_tools(&state, limit.unwrap_or(12))
}

#[tauri::command]
pub fn recent_tools_set(state: State<'_, AppState>, ids: Vec<String>) -> AppResult<()> {
    storage::set_recent_tools(&state, &ids)
}

#[tauri::command]
pub fn tool_history_get(state: State<'_, AppState>, tool_id: String) -> AppResult<Vec<Value>> {
    storage::get_tool_history(&state, &tool_id)
}

#[tauri::command]
pub fn tool_history_replace(
    state: State<'_, AppState>,
    tool_id: String,
    items: Vec<Value>,
) -> AppResult<()> {
    storage::replace_tool_history(&state, &tool_id, &items)
}

#[tauri::command]
pub fn tool_history_clear(state: State<'_, AppState>, tool_id: String) -> AppResult<()> {
    storage::replace_tool_history(&state, &tool_id, &[])
}

#[tauri::command]
pub fn draft_get(state: State<'_, AppState>, tool_id: String) -> AppResult<Option<DraftRecord>> {
    storage::get_draft(&state, &tool_id)
}

#[tauri::command]
pub fn draft_set(state: State<'_, AppState>, input: DraftWriteInput) -> AppResult<()> {
    storage::set_draft(&state, &input)
}

#[tauri::command]
pub fn storage_status(state: State<'_, AppState>) -> AppResult<StorageStatus> {
    storage::get_storage_status(&state)
}
