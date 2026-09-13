use rusqlite::{OptionalExtension, params};
use serde::{Deserialize, Serialize};

use crate::{
    credentials::generate_key,
    crypto::{
        CRYPTO_VERSION, CryptoConfigPayload, CryptoConfigSummary, CryptoConfigWriteInput,
        PAYLOAD_VERSION, config_aad, decrypt, encrypt, masked_summary_fields, masked_values,
        summary_values, validate_name, validate_payload,
    },
    error::{AppError, AppResult},
    state::AppState,
    storage::{checkpoint, now_millis, rotate_sensitive_drafts},
};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MigrationReport {
    pub source_version: u32,
    pub imported: usize,
    pub failed: usize,
    pub completed: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RotationReport {
    pub previous_key_id: String,
    pub active_key_id: String,
    pub rotated_configs: usize,
    pub rotated_drafts: usize,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SummarySnapshot {
    operation: String,
    fields: Vec<crate::crypto::CryptoConfigField>,
}

struct StoredConfig {
    id: String,
    tool_id: String,
    name: String,
    payload: Vec<u8>,
    nonce: Vec<u8>,
    payload_version: u32,
    crypto_version: u32,
    key_id: String,
}

pub fn list(state: &AppState, tool_id: &str) -> AppResult<Vec<CryptoConfigSummary>> {
    validate_tool_id_for_config(tool_id)?;
    let database = state.lock_database()?;
    let mut statement = database.prepare(
        "SELECT id, tool_id, name, algorithm, mode, format, summary_json, created_at, updated_at
         FROM tool_configs WHERE tool_id = ?1 ORDER BY updated_at DESC",
    )?;
    let rows = statement.query_map([tool_id], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, String>(3)?,
            row.get::<_, Option<String>>(4)?,
            row.get::<_, Option<String>>(5)?,
            row.get::<_, String>(6)?,
            row.get::<_, i64>(7)?,
            row.get::<_, i64>(8)?,
        ))
    })?;
    rows.map(|row| {
        let (id, tool_id, name, algorithm, mode, format, encoded, created_at, updated_at) =
            row.map_err(AppError::from)?;
        let snapshot: SummarySnapshot = serde_json::from_str(&encoded)?;
        let masked_fields = masked_values(&snapshot.fields);
        Ok(CryptoConfigSummary {
            id,
            tool_id,
            name,
            operation: snapshot.operation,
            algorithm,
            mode,
            format,
            created_at,
            updated_at,
            masked_fields,
            summary_fields: snapshot.fields,
        })
    })
    .collect()
}

pub fn save(state: &AppState, input: &CryptoConfigWriteInput) -> AppResult<CryptoConfigSummary> {
    validate_payload(&input.tool_id, &input.payload)?;
    let name = validate_name(&input.name)?;
    let data_key = state.lock_data_key()?;
    let mut database = state.lock_database()?;
    let transaction = database.transaction()?;
    let existing = transaction
        .query_row(
            "SELECT id, created_at FROM tool_configs WHERE tool_id = ?1 AND name = ?2",
            params![input.tool_id, name],
            |row| Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?)),
        )
        .optional()?;
    let now = now_millis();
    let (id, created_at) = existing.unwrap_or_else(|| (uuid::Uuid::new_v4().to_string(), now));
    let encrypted = encrypt_config(&data_key.bytes, &id, &input.tool_id, &name, &input.payload)?;
    let (algorithm, mode, format) = summary_values(&input.payload);
    let summary_fields = masked_summary_fields(&input.payload);
    let summary_json = serde_json::to_string(&SummarySnapshot {
        operation: input.payload.operation.clone(),
        fields: summary_fields.clone(),
    })?;
    transaction.execute(
        "INSERT INTO tool_configs(id, tool_id, name, algorithm, mode, format, summary_json, payload, nonce,
         payload_version, crypto_version, key_id, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
         ON CONFLICT(id) DO UPDATE SET name = excluded.name, algorithm = excluded.algorithm, mode = excluded.mode,
         format = excluded.format, summary_json = excluded.summary_json, payload = excluded.payload,
         nonce = excluded.nonce, payload_version = excluded.payload_version,
         crypto_version = excluded.crypto_version, key_id = excluded.key_id, updated_at = excluded.updated_at",
        params![
            id,
            input.tool_id,
            name,
            algorithm,
            mode,
            format,
            summary_json,
            encrypted.ciphertext,
            encrypted.nonce,
            PAYLOAD_VERSION,
            CRYPTO_VERSION,
            data_key.id,
            created_at,
            now
        ],
    )?;
    transaction.commit()?;
    Ok(CryptoConfigSummary {
        id,
        tool_id: input.tool_id.clone(),
        name,
        operation: input.payload.operation.clone(),
        algorithm,
        mode,
        format,
        created_at,
        updated_at: now,
        masked_fields: masked_values(&summary_fields),
        summary_fields,
    })
}

pub fn update(
    state: &AppState,
    record_id: &str,
    input: &CryptoConfigWriteInput,
) -> AppResult<CryptoConfigSummary> {
    validate_payload(&input.tool_id, &input.payload)?;
    let name = validate_name(&input.name)?;
    let data_key = state.lock_data_key()?;
    let mut database = state.lock_database()?;
    let transaction = database.transaction()?;
    let created_at = transaction
        .query_row(
            "SELECT created_at FROM tool_configs WHERE id = ?1 AND tool_id = ?2",
            params![record_id, input.tool_id],
            |row| row.get::<_, i64>(0),
        )
        .optional()?
        .ok_or(AppError::NotFound)?;
    let duplicate = transaction
        .query_row(
            "SELECT 1 FROM tool_configs WHERE tool_id = ?1 AND name = ?2 AND id <> ?3",
            params![input.tool_id, name, record_id],
            |_| Ok(()),
        )
        .optional()?
        .is_some();
    if duplicate {
        return Err(AppError::InvalidField("同一工具下已存在同名配置".into()));
    }
    let encrypted = encrypt_config(
        &data_key.bytes,
        record_id,
        &input.tool_id,
        &name,
        &input.payload,
    )?;
    let (algorithm, mode, format) = summary_values(&input.payload);
    let summary_fields = masked_summary_fields(&input.payload);
    let summary_json = serde_json::to_string(&SummarySnapshot {
        operation: input.payload.operation.clone(),
        fields: summary_fields.clone(),
    })?;
    let updated_at = now_millis();
    transaction.execute(
        "UPDATE tool_configs SET name = ?1, algorithm = ?2, mode = ?3, format = ?4, summary_json = ?5,
         payload = ?6, nonce = ?7, payload_version = ?8, crypto_version = ?9, key_id = ?10, updated_at = ?11
         WHERE id = ?12 AND tool_id = ?13",
        params![
            name,
            algorithm,
            mode,
            format,
            summary_json,
            encrypted.ciphertext,
            encrypted.nonce,
            PAYLOAD_VERSION,
            CRYPTO_VERSION,
            data_key.id,
            updated_at,
            record_id,
            input.tool_id
        ],
    )?;
    transaction.commit()?;
    Ok(CryptoConfigSummary {
        id: record_id.to_owned(),
        tool_id: input.tool_id.clone(),
        name,
        operation: input.payload.operation.clone(),
        algorithm,
        mode,
        format,
        created_at,
        updated_at,
        masked_fields: masked_values(&summary_fields),
        summary_fields,
    })
}

pub fn apply(state: &AppState, tool_id: &str, record_id: &str) -> AppResult<CryptoConfigPayload> {
    validate_tool_id_for_config(tool_id)?;
    let data_key = state.lock_data_key()?;
    let database = state.lock_database()?;
    let record = database
        .query_row(
            "SELECT id, tool_id, name, payload, nonce, payload_version, crypto_version, key_id
             FROM tool_configs WHERE id = ?1 AND tool_id = ?2",
            params![record_id, tool_id],
            |row| {
                Ok(StoredConfig {
                    id: row.get(0)?,
                    tool_id: row.get(1)?,
                    name: row.get(2)?,
                    payload: row.get(3)?,
                    nonce: row.get(4)?,
                    payload_version: row.get(5)?,
                    crypto_version: row.get(6)?,
                    key_id: row.get(7)?,
                })
            },
        )
        .optional()?
        .ok_or(AppError::NotFound)?;
    if record.key_id != data_key.id {
        return Err(AppError::KeyUnavailable);
    }
    let aad = config_aad(
        &record.id,
        &record.tool_id,
        &record.name,
        record.payload_version,
        record.crypto_version,
    )?;
    let plaintext = decrypt(&data_key.bytes, &record.payload, &record.nonce, &aad)?;
    let payload: CryptoConfigPayload = serde_json::from_slice(&plaintext)?;
    validate_payload(tool_id, &payload)?;
    Ok(payload)
}

pub fn delete(state: &AppState, tool_id: &str, record_id: &str) -> AppResult<()> {
    validate_tool_id_for_config(tool_id)?;
    let mut database = state.lock_database()?;
    let transaction = database.transaction()?;
    let affected = transaction.execute(
        "DELETE FROM tool_configs WHERE id = ?1 AND tool_id = ?2",
        params![record_id, tool_id],
    )?;
    if affected == 0 {
        return Err(AppError::NotFound);
    }
    transaction.commit()?;
    checkpoint(&database)
}

pub fn migrate(
    state: &AppState,
    source_version: u32,
    records: &[CryptoConfigWriteInput],
) -> AppResult<MigrationReport> {
    if source_version != 1 {
        return Err(AppError::VersionUnsupported(source_version));
    }
    let mut imported = 0;
    let mut failed = 0;
    for record in records {
        match save(state, record) {
            Ok(_) => imported += 1,
            Err(_) => failed += 1,
        }
    }
    let report = MigrationReport {
        source_version,
        imported,
        failed,
        completed: failed == 0,
    };
    let details = serde_json::to_string(&report)?;
    let mut database = state.lock_database()?;
    let transaction = database.transaction()?;
    transaction.execute(
        "INSERT INTO storage_migrations(migration_id, status, details_json, applied_at)
         VALUES ('prototype-crypto-v1', ?1, ?2, ?3)
         ON CONFLICT(migration_id) DO UPDATE SET status = excluded.status,
         details_json = excluded.details_json, applied_at = excluded.applied_at",
        params![
            if report.completed {
                "completed"
            } else {
                "partial"
            },
            details,
            now_millis()
        ],
    )?;
    transaction.commit()?;
    Ok(report)
}

pub fn rotate_key(state: &AppState, target_version: u32) -> AppResult<RotationReport> {
    if target_version < 2 {
        return Err(AppError::InvalidField(
            "目标密钥版本必须大于当前版本".into(),
        ));
    }
    let new_key_id = format!("data-key-v{target_version}");
    let mut data_key = state.lock_data_key()?;
    if new_key_id == data_key.id {
        return Err(AppError::InvalidField("目标密钥版本已处于启用状态".into()));
    }
    let new_key = generate_key();
    state.credentials.set(&new_key_id, &new_key)?;
    let previous_key_id = data_key.id.clone();
    let rotation = (|| {
        let mut database = state.lock_database()?;
        let transaction = database.transaction()?;
        let configs = load_all_configs(&transaction)?;
        for record in &configs {
            if record.key_id != previous_key_id {
                return Err(AppError::KeyUnavailable);
            }
            let aad = config_aad(
                &record.id,
                &record.tool_id,
                &record.name,
                record.payload_version,
                record.crypto_version,
            )?;
            let plaintext = decrypt(&data_key.bytes, &record.payload, &record.nonce, &aad)?;
            let encrypted = encrypt(&new_key, &plaintext, &aad)?;
            transaction.execute(
                "UPDATE tool_configs SET payload = ?1, nonce = ?2, key_id = ?3, updated_at = ?4 WHERE id = ?5",
                params![encrypted.ciphertext, encrypted.nonce, new_key_id, now_millis(), record.id],
            )?;
        }
        let rotated_drafts =
            rotate_sensitive_drafts(&transaction, &data_key.bytes, &new_key, &new_key_id)?;
        transaction.execute(
            "UPDATE storage_meta SET value_text = ?1, updated_at = ?2 WHERE meta_key = 'active_data_key_id'",
            params![new_key_id, now_millis()],
        )?;
        transaction.commit()?;
        checkpoint(&database)?;
        Ok((configs.len(), rotated_drafts))
    })();
    let (rotated_configs, rotated_drafts) = match rotation {
        Ok(result) => result,
        Err(error) => {
            let _ = state.credentials.delete(&new_key_id);
            return Err(error);
        }
    };
    data_key.id = new_key_id.clone();
    data_key.bytes = new_key;
    let _ = state.credentials.delete(&previous_key_id);
    Ok(RotationReport {
        previous_key_id,
        active_key_id: new_key_id,
        rotated_configs,
        rotated_drafts,
    })
}

fn encrypt_config(
    key: &[u8; 32],
    id: &str,
    tool_id: &str,
    name: &str,
    payload: &CryptoConfigPayload,
) -> AppResult<crate::crypto::EncryptedPayload> {
    let aad = config_aad(id, tool_id, name, PAYLOAD_VERSION, CRYPTO_VERSION)?;
    let plaintext = serde_json::to_vec(payload)?;
    encrypt(key, &plaintext, &aad)
}

fn validate_tool_id_for_config(tool_id: &str) -> AppResult<()> {
    let placeholder = CryptoConfigPayload {
        schema_version: PAYLOAD_VERSION,
        tool_id: tool_id.to_owned(),
        operation: "digest".into(),
        fields: Vec::new(),
    };
    validate_payload(tool_id, &placeholder)
}

fn load_all_configs(transaction: &rusqlite::Transaction<'_>) -> AppResult<Vec<StoredConfig>> {
    let mut statement = transaction.prepare(
        "SELECT id, tool_id, name, payload, nonce, payload_version, crypto_version, key_id FROM tool_configs",
    )?;
    let rows = statement.query_map([], |row| {
        Ok(StoredConfig {
            id: row.get(0)?,
            tool_id: row.get(1)?,
            name: row.get(2)?,
            payload: row.get(3)?,
            nonce: row.get(4)?,
            payload_version: row.get(5)?,
            crypto_version: row.get(6)?,
            key_id: row.get(7)?,
        })
    })?;
    rows.collect::<Result<Vec<_>, _>>().map_err(Into::into)
}
