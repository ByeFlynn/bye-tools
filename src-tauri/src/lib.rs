mod commands;
mod credentials;
mod crypto;
mod error;
mod mq;
mod state;
mod storage;

use tauri::Manager;

use crate::{credentials::system_provider, state::AppState};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&app_data_dir)?;
            let state = AppState::initialize(app_data_dir.join("byetools.db"), system_provider())?;
            app.manage(state);
            app.manage(mq::MqState::default());
            Ok(())
        })
        .on_page_load(|webview, payload| {
            if payload.event() != tauri::webview::PageLoadEvent::Finished
                || payload.url().host_str() != Some("tauri.localhost")
            {
                return;
            }
            let cleanup_script = r#"
                (async () => {
                  try {
                    const registrations = 'serviceWorker' in navigator
                      ? await navigator.serviceWorker.getRegistrations()
                      : [];
                    const cacheNames = 'caches' in window
                      ? (await caches.keys()).filter((name) => name.startsWith('byetools-'))
                      : [];
                    if (!registrations.length && !cacheNames.length) return;
                    await Promise.all(registrations.map((registration) => registration.unregister()));
                    await Promise.all(cacheNames.map((name) => caches.delete(name)));
                    window.location.reload();
                  } catch (_) {}
                })();
            "#;
            let _ = webview.eval(cleanup_script);
        })
        .invoke_handler(tauri::generate_handler![
            commands::app_data::setting_get,
            commands::app_data::setting_set,
            commands::app_data::favorites_get,
            commands::app_data::favorite_set,
            commands::app_data::recent_tools_get,
            commands::app_data::recent_tools_set,
            commands::app_data::tool_history_get,
            commands::app_data::tool_history_replace,
            commands::app_data::tool_history_clear,
            commands::app_data::draft_get,
            commands::app_data::draft_set,
            commands::app_data::storage_status,
            commands::crypto_config::crypto_config_list,
            commands::crypto_config::crypto_config_save,
            commands::crypto_config::crypto_config_apply,
            commands::crypto_config::crypto_config_update,
            commands::crypto_config::crypto_config_delete,
            commands::crypto_config::crypto_config_migrate,
            commands::crypto_config::crypto_config_rotate_key,
            commands::message_queue::mq_test_connection,
            commands::message_queue::mq_send_message,
            commands::message_queue::mq_start_consumer,
            commands::message_queue::mq_stop_consumer,
        ])
        .run(tauri::generate_context!())
        .expect("ByeTools 桌面应用启动失败");
}
