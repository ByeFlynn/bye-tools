CREATE TABLE IF NOT EXISTS app_settings (
  setting_key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS favorites (
  tool_id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS recent_tools (
  tool_id TEXT PRIMARY KEY,
  opened_at INTEGER NOT NULL,
  open_count INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS tool_history (
  id TEXT PRIMARY KEY,
  tool_id TEXT NOT NULL,
  summary_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tool_history_tool_id
  ON tool_history(tool_id, created_at DESC);

CREATE TABLE IF NOT EXISTS tool_drafts (
  tool_id TEXT PRIMARY KEY,
  payload BLOB NOT NULL,
  is_sensitive INTEGER NOT NULL DEFAULT 0,
  nonce BLOB,
  payload_version INTEGER NOT NULL,
  crypto_version INTEGER,
  key_id TEXT,
  updated_at INTEGER NOT NULL,
  CHECK (is_sensitive IN (0, 1)),
  CHECK (is_sensitive = 0 OR (nonce IS NOT NULL AND crypto_version IS NOT NULL AND key_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS storage_migrations (
  migration_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  details_json TEXT,
  applied_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS storage_meta (
  meta_key TEXT PRIMARY KEY,
  value_text TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tool_configs (
  id TEXT PRIMARY KEY,
  tool_id TEXT NOT NULL,
  name TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  mode TEXT,
  format TEXT,
  summary_json TEXT NOT NULL,
  payload BLOB NOT NULL,
  nonce BLOB NOT NULL,
  payload_version INTEGER NOT NULL,
  crypto_version INTEGER NOT NULL,
  key_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tool_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tool_configs_tool_id
  ON tool_configs(tool_id, updated_at DESC);

INSERT OR IGNORE INTO storage_meta(meta_key, value_text, updated_at)
VALUES ('active_data_key_id', 'data-key-v1', unixepoch('subsec') * 1000);
