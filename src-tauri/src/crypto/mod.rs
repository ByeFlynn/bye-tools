use std::collections::{BTreeMap, HashSet};

use aes_gcm::{
    aead::{Aead, Generate, Payload},
    Aes256Gcm, KeyInit, Nonce,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use zeroize::Zeroizing;

use crate::error::{AppError, AppResult};

pub const PAYLOAD_VERSION: u32 = 1;
pub const CRYPTO_VERSION: u32 = 1;

const CONFIGURABLE_TOOLS: [&str; 9] = [
    "md5", "sha2", "sha3", "sm2", "sm3", "sm4", "aes", "des", "3des",
];

const ALLOWED_FIELD_KEYS: [&str; 10] = [
    "crypto-algorithm",
    "crypto-variant",
    "crypto-mode",
    "crypto-key-length",
    "crypto-key",
    "crypto-iv",
    "crypto-padding",
    "crypto-ctr-length",
    "crypto-gcm-tag-length",
    "crypto-format",
];

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CryptoConfigField {
    pub key: String,
    #[serde(rename = "type")]
    pub field_type: String,
    pub value: Value,
    pub sensitive: bool,
    pub required: bool,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CryptoConfigPayload {
    #[serde(alias = "version")]
    pub schema_version: u32,
    pub tool_id: String,
    pub operation: String,
    pub fields: Vec<CryptoConfigField>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CryptoConfigSummary {
    pub id: String,
    pub tool_id: String,
    pub name: String,
    pub operation: String,
    pub algorithm: String,
    pub mode: Option<String>,
    pub format: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
    pub masked_fields: BTreeMap<String, String>,
    pub summary_fields: Vec<CryptoConfigField>,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CryptoConfigWriteInput {
    pub tool_id: String,
    pub name: String,
    pub payload: CryptoConfigPayload,
}

#[derive(Clone, Debug)]
pub struct EncryptedPayload {
    pub ciphertext: Vec<u8>,
    pub nonce: Vec<u8>,
}

pub fn validate_name(name: &str) -> AppResult<String> {
    let normalized = name.trim();
    if normalized.is_empty() || normalized.chars().count() > 40 {
        return Err(AppError::InvalidField("配置名称应为 1 至 40 个字符".into()));
    }
    if normalized.chars().any(char::is_control) {
        return Err(AppError::InvalidField("配置名称不能包含控制字符".into()));
    }
    Ok(normalized.to_owned())
}

pub fn validate_payload(tool_id: &str, payload: &CryptoConfigPayload) -> AppResult<()> {
    if !CONFIGURABLE_TOOLS.contains(&tool_id) {
        return Err(AppError::InvalidField("当前工具不支持保存加密配置".into()));
    }
    if payload.schema_version != PAYLOAD_VERSION {
        return Err(AppError::VersionUnsupported(payload.schema_version));
    }
    if payload.tool_id != tool_id {
        return Err(AppError::InvalidField("配置正文与工具不匹配".into()));
    }
    if !["encrypt", "decrypt", "digest"].contains(&payload.operation.as_str()) {
        return Err(AppError::InvalidField("配置操作类型无效".into()));
    }
    if payload.fields.len() > ALLOWED_FIELD_KEYS.len() {
        return Err(AppError::InvalidField("配置字段数量超出限制".into()));
    }
    let mut seen = HashSet::new();
    for field in &payload.fields {
        if !ALLOWED_FIELD_KEYS.contains(&field.key.as_str()) || !seen.insert(field.key.as_str()) {
            return Err(AppError::InvalidField("配置包含未知或重复字段".into()));
        }
        if !["text", "secret", "select", "number", "boolean"].contains(&field.field_type.as_str()) {
            return Err(AppError::InvalidField("配置字段类型无效".into()));
        }
        if field.value.is_array() || field.value.is_object() {
            return Err(AppError::InvalidField("配置字段值必须是标量".into()));
        }
        let must_be_sensitive = matches!(field.key.as_str(), "crypto-key" | "crypto-iv");
        if must_be_sensitive && !field.sensitive {
            return Err(AppError::InvalidField("敏感字段标记无效".into()));
        }
    }
    let encoded = serde_json::to_vec(payload)?;
    if encoded.len() > 1024 * 1024 {
        return Err(AppError::InvalidField("配置正文不能超过 1 MB".into()));
    }
    Ok(())
}

pub fn config_aad(
    id: &str,
    tool_id: &str,
    name: &str,
    payload_version: u32,
    crypto_version: u32,
) -> AppResult<Vec<u8>> {
    serde_json::to_vec(&(id, tool_id, name, payload_version, crypto_version)).map_err(Into::into)
}

pub fn draft_aad(tool_id: &str, payload_version: u32, crypto_version: u32) -> AppResult<Vec<u8>> {
    serde_json::to_vec(&(tool_id, payload_version, crypto_version)).map_err(Into::into)
}

pub fn encrypt(key: &[u8; 32], plaintext: &[u8], aad: &[u8]) -> AppResult<EncryptedPayload> {
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|_| AppError::KeyUnavailable)?;
    let nonce = Nonce::generate();
    let ciphertext = cipher
        .encrypt(
            &nonce,
            Payload {
                msg: plaintext,
                aad,
            },
        )
        .map_err(|_| AppError::StorageFailed)?;
    Ok(EncryptedPayload {
        ciphertext,
        nonce: nonce.to_vec(),
    })
}

pub fn decrypt(
    key: &[u8; 32],
    ciphertext: &[u8],
    nonce: &[u8],
    aad: &[u8],
) -> AppResult<Zeroizing<Vec<u8>>> {
    if nonce.len() != 12 {
        return Err(AppError::PayloadTampered);
    }
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|_| AppError::KeyUnavailable)?;
    let nonce_array = Nonce::try_from(nonce).map_err(|_| AppError::PayloadTampered)?;
    let plaintext = cipher
        .decrypt(
            &nonce_array,
            Payload {
                msg: ciphertext,
                aad,
            },
        )
        .map_err(|_| AppError::PayloadTampered)?;
    Ok(Zeroizing::new(plaintext))
}

pub fn summary_values(payload: &CryptoConfigPayload) -> (String, Option<String>, Option<String>) {
    let value = |key: &str| {
        payload
            .fields
            .iter()
            .find(|field| field.key == key)
            .and_then(|field| field.value.as_str())
            .filter(|value| !value.is_empty())
            .map(str::to_owned)
    };
    (
        value("crypto-algorithm")
            .or_else(|| value("crypto-variant"))
            .unwrap_or_else(|| payload.tool_id.clone()),
        value("crypto-mode"),
        value("crypto-format"),
    )
}

pub fn masked_summary_fields(payload: &CryptoConfigPayload) -> Vec<CryptoConfigField> {
    payload
        .fields
        .iter()
        .cloned()
        .map(|mut field| {
            if field.sensitive {
                field.value = Value::String(mask_value(field.value.as_str().unwrap_or_default()));
            }
            field
        })
        .collect()
}

pub fn masked_values(fields: &[CryptoConfigField]) -> BTreeMap<String, String> {
    fields
        .iter()
        .filter(|field| field.sensitive)
        .map(|field| {
            (
                field.key.clone(),
                field.value.as_str().unwrap_or("未设置").to_owned(),
            )
        })
        .collect()
}

fn mask_value(value: &str) -> String {
    let chars: Vec<char> = value.chars().collect();
    if chars.is_empty() {
        return "未设置".into();
    }
    if chars.len() <= 8 {
        return "••••••••".into();
    }
    format!(
        "{}••••{}",
        chars[..4].iter().collect::<String>(),
        chars[chars.len() - 4..].iter().collect::<String>()
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn aad_tamper_is_rejected() {
        let key = [7_u8; 32];
        let encrypted = encrypt(&key, b"secret", b"record-a").expect("加密应成功");
        let result = decrypt(&key, &encrypted.ciphertext, &encrypted.nonce, b"record-b");
        assert!(matches!(result, Err(AppError::PayloadTampered)));
    }

    #[test]
    fn sensitive_summary_is_masked() {
        assert_eq!(mask_value("1234567890abcdef"), "1234••••cdef");
        assert_eq!(mask_value("short"), "••••••••");
    }
}
