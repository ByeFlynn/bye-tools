use serde::ser::{Serialize, SerializeStruct, Serializer};

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("参数不合法：{0}")]
    InvalidField(String),
    #[error("系统凭证不可用")]
    KeyUnavailable,
    #[error("配置正文校验失败，记录可能已损坏")]
    PayloadTampered,
    #[error("数据版本不受支持：{0}")]
    VersionUnsupported(u32),
    #[error("找不到指定记录")]
    NotFound,
    #[error("本地存储操作失败")]
    StorageFailed,
    #[error("SQLCipher 初始化失败")]
    CipherUnavailable,
    #[error("内部数据格式错误")]
    InvalidData,
}

impl AppError {
    pub fn code(&self) -> &'static str {
        match self {
            Self::InvalidField(_) => "INVALID_FIELD",
            Self::KeyUnavailable => "KEY_UNAVAILABLE",
            Self::PayloadTampered => "PAYLOAD_TAMPERED",
            Self::VersionUnsupported(_) => "VERSION_UNSUPPORTED",
            Self::NotFound => "NOT_FOUND",
            Self::StorageFailed => "STORAGE_FAILED",
            Self::CipherUnavailable => "CIPHER_UNAVAILABLE",
            Self::InvalidData => "INVALID_DATA",
        }
    }
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut state = serializer.serialize_struct("AppError", 2)?;
        state.serialize_field("code", self.code())?;
        state.serialize_field("message", &self.to_string())?;
        state.end()
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(_: rusqlite::Error) -> Self {
        Self::StorageFailed
    }
}

impl From<serde_json::Error> for AppError {
    fn from(_: serde_json::Error) -> Self {
        Self::InvalidData
    }
}

pub type AppResult<T> = Result<T, AppError>;
