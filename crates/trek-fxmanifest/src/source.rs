use std::path::Path;

pub struct Source {
    content: String,
    path: Option<String>,
}

impl Source {
    pub fn new(content: &str) -> Self {
        Self {
            content: content.to_string(),
            path: None,
        }
    }

    pub fn from_file(path: &Path) -> Result<Self, SourceError> {
        let content = std::fs::read_to_string(path).map_err(|e| SourceError::Io {
            path: path.to_string_lossy().to_string(),
            inner: e,
        })?;
        Ok(Self {
            content,
            path: Some(path.to_string_lossy().to_string()),
        })
    }

    pub fn content(&self) -> &str {
        &self.content
    }

    pub fn path(&self) -> Option<&str> {
        self.path.as_deref()
    }
}

#[derive(Debug)]
pub enum SourceError {
    Io { path: String, inner: std::io::Error },
}

impl std::fmt::Display for SourceError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Io { path, inner } => {
                write!(f, "failed to read {path}: {inner}")
            }
        }
    }
}

impl std::error::Error for SourceError {}
