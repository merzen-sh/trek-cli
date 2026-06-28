#[cfg_attr(feature = "serialize", derive(serde::Serialize))]
#[derive(Debug, Clone)]
pub struct Manifest {
    pub fx_version: String,
    pub games: Vec<Game>,
    pub fields: Vec<Field>,
}

#[cfg_attr(feature = "serialize", derive(serde::Serialize))]
#[derive(Debug, Clone)]
pub enum Game {
    Gta5,
    Rdr3,
    Other(String),
}

impl std::fmt::Display for Game {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Gta5 => write!(f, "gta5"),
            Self::Rdr3 => write!(f, "rdr3"),
            Self::Other(s) => write!(f, "{s}"),
        }
    }
}

#[cfg_attr(feature = "serialize", derive(serde::Serialize))]
#[derive(Debug, Clone)]
pub enum Field {
    ClientScript(String),
    ServerScript(String),
    SharedScript(String),
    ClientScripts(Vec<String>),
    ServerScripts(Vec<String>),
    SharedScripts(Vec<String>),
    Files(Vec<String>),
    UiPage(String),
    UiPageCdn(String),
    DataFile { file_type: String, path: String },
    Author(String),
    Description(String),
    Version(String),
    ThisIsAMap(bool),
    Lua54(String),
    Dependency(String),
    Provide(String),
    Custom { key: String, value: Value },
}

#[cfg_attr(feature = "serialize", derive(serde::Serialize))]
#[derive(Debug, Clone)]
pub enum Value {
    String(String),
    Boolean(bool),
    Array(Vec<String>),
}
