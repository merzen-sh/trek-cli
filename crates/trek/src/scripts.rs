use crate::config::Config;
use anyhow::{Context, Result};
use serde::Serialize;
use std::path::{Path, PathBuf};
use trek_fxmanifest::ast::{Field, Manifest};

/// A single script/resource found in the workspace.
#[derive(Debug, Clone, Serialize)]
#[allow(dead_code)]
pub struct Script {
    /// Directory name (convention for the script name in FiveM)
    pub name: String,
    /// Absolute path to the script directory
    pub path: PathBuf,
    /// `version` field from fxmanifest.lua
    pub version: Option<String>,
    /// `author` field from fxmanifest.lua
    pub author: Option<String>,
    /// `description` field from fxmanifest.lua
    pub description: Option<String>,
    /// Parsed manifest (all fields available for inspection)
    pub manifest: Manifest,
}

/// Collection of scripts found in the workspace.
#[derive(Debug, Serialize)]
pub struct Scripts {
    pub scripts: Vec<Script>,
}

impl Scripts {
    /// Load all scripts from the configured workspace directory.
    pub fn load() -> Result<Self> {
        let config = Config::load()?;
        let dir = config.workspace_path().context(
            "workspace_dir not set or is not a path. Use `trek config set workspace_dir <path>`",
        )?;
        Self::load_from(&dir)
    }

    /// Load all scripts from a specific directory.
    pub fn load_from(workspace_dir: &Path) -> Result<Self> {
        let mut scripts = Vec::new();

        let mut entries = workspace_dir.read_dir().with_context(|| {
            format!("failed to read workspace dir: {}", workspace_dir.display())
        })?;

        while let Some(entry) = entries.next().transpose()? {
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }
            let name = match path.file_name().and_then(|n| n.to_str()) {
                Some(n) => n.to_owned(),
                None => continue,
            };
            if let Some(script) = Self::try_load_script(&path, &name) {
                scripts.push(script);
            }
        }

        scripts.sort_by(|a, b| a.name.cmp(&b.name));
        Ok(Scripts { scripts })
    }

    fn try_load_script(dir: &Path, name: &str) -> Option<Script> {
        let manifest_path = dir.join("fxmanifest.lua");
        if !manifest_path.is_file() {
            return None;
        }
        let content = std::fs::read_to_string(&manifest_path).ok()?;
        let manifest = trek_fxmanifest::parse(&content).ok()?;

        let mut version = None;
        let mut author = None;
        let mut description = None;

        for field in &manifest.fields {
            match field {
                Field::Version(v) => version = Some(v.clone()),
                Field::Author(a) => author = Some(a.clone()),
                Field::Description(d) => description = Some(d.clone()),
                _ => {}
            }
        }

        Some(Script {
            name: name.to_owned(),
            path: dir.to_path_buf(),
            version,
            author,
            description,
            manifest,
        })
    }
}
