use std::sync::Arc;

use aes_gcm::{Aes256Gcm, Key, aead::Generate};
use zeroize::Zeroizing;

use crate::error::{AppError, AppResult};

pub const CREDENTIAL_SERVICE: &str = "com.byetools.desktop";
pub const DATABASE_KEY_ID: &str = "database-key-v1";
pub const INITIAL_DATA_KEY_ID: &str = "data-key-v1";

pub trait CredentialProvider: Send + Sync {
    fn get(&self, key_id: &str) -> AppResult<Option<Zeroizing<[u8; 32]>>>;
    fn set(&self, key_id: &str, value: &[u8; 32]) -> AppResult<()>;
    fn delete(&self, key_id: &str) -> AppResult<()>;

    fn get_or_create(&self, key_id: &str) -> AppResult<Zeroizing<[u8; 32]>> {
        if let Some(value) = self.get(key_id)? {
            return Ok(value);
        }
        let value = generate_key();
        self.set(key_id, &value)?;
        Ok(value)
    }
}

pub struct SystemCredentialProvider;

impl CredentialProvider for SystemCredentialProvider {
    fn get(&self, key_id: &str) -> AppResult<Option<Zeroizing<[u8; 32]>>> {
        let entry = keyring::Entry::new(CREDENTIAL_SERVICE, key_id)
            .map_err(|_| AppError::KeyUnavailable)?;
        match entry.get_secret() {
            Ok(secret) => parse_key(&secret).map(Some),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(_) => Err(AppError::KeyUnavailable),
        }
    }

    fn set(&self, key_id: &str, value: &[u8; 32]) -> AppResult<()> {
        keyring::Entry::new(CREDENTIAL_SERVICE, key_id)
            .and_then(|entry| entry.set_secret(value))
            .map_err(|_| AppError::KeyUnavailable)
    }

    fn delete(&self, key_id: &str) -> AppResult<()> {
        let entry = keyring::Entry::new(CREDENTIAL_SERVICE, key_id)
            .map_err(|_| AppError::KeyUnavailable)?;
        match entry.delete_credential() {
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(_) => Err(AppError::KeyUnavailable),
        }
    }
}

pub fn system_provider() -> Arc<dyn CredentialProvider> {
    Arc::new(SystemCredentialProvider)
}

pub fn generate_key() -> Zeroizing<[u8; 32]> {
    let key = Key::<Aes256Gcm>::generate();
    Zeroizing::new(
        key.as_slice()
            .try_into()
            .expect("AES-256 密钥长度固定为 32 字节"),
    )
}

fn parse_key(secret: &[u8]) -> AppResult<Zeroizing<[u8; 32]>> {
    let value: [u8; 32] = secret.try_into().map_err(|_| AppError::KeyUnavailable)?;
    Ok(Zeroizing::new(value))
}

#[cfg(test)]
pub mod tests {
    use std::{collections::HashMap, sync::Mutex};

    use super::*;

    #[derive(Default)]
    pub struct MemoryCredentialProvider {
        values: Mutex<HashMap<String, [u8; 32]>>,
    }

    impl CredentialProvider for MemoryCredentialProvider {
        fn get(&self, key_id: &str) -> AppResult<Option<Zeroizing<[u8; 32]>>> {
            let values = self.values.lock().map_err(|_| AppError::KeyUnavailable)?;
            Ok(values.get(key_id).copied().map(Zeroizing::new))
        }

        fn set(&self, key_id: &str, value: &[u8; 32]) -> AppResult<()> {
            self.values
                .lock()
                .map_err(|_| AppError::KeyUnavailable)?
                .insert(key_id.to_owned(), *value);
            Ok(())
        }

        fn delete(&self, key_id: &str) -> AppResult<()> {
            self.values
                .lock()
                .map_err(|_| AppError::KeyUnavailable)?
                .remove(key_id);
            Ok(())
        }
    }
}
