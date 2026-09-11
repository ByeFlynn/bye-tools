use std::{
    path::PathBuf,
    sync::{Arc, Mutex},
};

use rusqlite::{Connection, OptionalExtension};
use zeroize::Zeroizing;

use crate::{
    credentials::{CredentialProvider, DATABASE_KEY_ID, INITIAL_DATA_KEY_ID},
    error::{AppError, AppResult},
    storage::{migrate_database, open_sqlcipher_database},
};

pub struct DataKey {
    pub id: String,
    pub bytes: Zeroizing<[u8; 32]>,
}

pub struct AppState {
    pub database: Mutex<Connection>,
    pub data_key: Mutex<DataKey>,
    pub credentials: Arc<dyn CredentialProvider>,
    pub database_path: PathBuf,
    pub cipher_version: String,
}

impl AppState {
    pub fn initialize(
        database_path: PathBuf,
        credentials: Arc<dyn CredentialProvider>,
    ) -> AppResult<Self> {
        let database_key = credentials.get_or_create(DATABASE_KEY_ID)?;
        let (mut database, cipher_version) =
            open_sqlcipher_database(&database_path, &database_key)?;
        migrate_database(&mut database)?;
        let active_key_id = database
            .query_row(
                "SELECT value_text FROM storage_meta WHERE meta_key = 'active_data_key_id'",
                [],
                |row| row.get::<_, String>(0),
            )
            .optional()?
            .unwrap_or_else(|| INITIAL_DATA_KEY_ID.to_owned());
        let data_key = credentials.get_or_create(&active_key_id)?;
        Ok(Self {
            database: Mutex::new(database),
            data_key: Mutex::new(DataKey {
                id: active_key_id,
                bytes: data_key,
            }),
            credentials,
            database_path,
            cipher_version,
        })
    }

    pub fn lock_database(&self) -> AppResult<std::sync::MutexGuard<'_, Connection>> {
        self.database.lock().map_err(|_| AppError::StorageFailed)
    }

    pub fn lock_data_key(&self) -> AppResult<std::sync::MutexGuard<'_, DataKey>> {
        self.data_key.lock().map_err(|_| AppError::KeyUnavailable)
    }
}
