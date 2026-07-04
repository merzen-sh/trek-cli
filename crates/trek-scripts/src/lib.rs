use anyhow::{Context, Result};
use serde::Serialize;
use std::path::{Path, PathBuf};
use trek_fxmanifest::ast::{Field, Manifest};
use trek_log::log_error;

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

    /// Print a formatted table of all scripts to stdout.
    pub fn print_list(&self, elapsed: std::time::Duration) {
        if self.scripts.is_empty() {
            log_error!("no scripts found in workspace");
        } else {
            println!(
                "{:<16} {:<16} {:<14} {}",
                "Name", "Version", "Author", "Description"
            );

            for script in &self.scripts {
                let version = script.version.as_deref().unwrap_or("-");
                let author = script.author.as_deref().unwrap_or("-");
                let description = script.description.as_deref().unwrap_or("");
                println!(
                    "{script:<16} {version:<16} {author:<14} {description}",
                    script = script.name
                );
            }

            println!(
                "Found {} scripts in {:.2}ms",
                self.scripts.len(),
                elapsed.as_nanos() as f64 / 1_000_000.0
            );
        }
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::{Path, PathBuf};

    struct TempDir(PathBuf);

    impl TempDir {
        fn new(prefix: &str) -> Self {
            let dir = std::env::temp_dir().join(format!("{}-{}", prefix, std::process::id()));
            let _ = fs::remove_dir_all(&dir);
            fs::create_dir_all(&dir).unwrap();
            TempDir(dir)
        }

        fn path(&self) -> &Path {
            &self.0
        }
    }

    impl Drop for TempDir {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    #[test]
    fn load_scripts_finds_valid_scripts_in_directory() {
        let temp = TempDir::new("trek-scripts-main");

        let script_dir = temp.path().join("my-resource");
        fs::create_dir_all(&script_dir).unwrap();
        fs::write(
            script_dir.join("fxmanifest.lua"),
            r#"
fx_version 'cerulean'
game 'gta5'
author 'Test Author'
version '2.1.0'
description 'A test script'

client_script 'client.lua'
server_script 'server.lua'
"#,
        )
        .unwrap();

        // Directory without fxmanifest.lua — skipped
        fs::create_dir_all(temp.path().join("no-manifest")).unwrap();
        // Plain file — skipped
        fs::write(temp.path().join("file.txt"), b"not a dir").unwrap();

        let scripts = Scripts::load_from(temp.path()).unwrap();
        assert_eq!(scripts.scripts.len(), 1);

        let s = &scripts.scripts[0];
        assert_eq!(s.name, "my-resource");
        assert_eq!(s.version.as_deref(), Some("2.1.0"));
        assert_eq!(s.author.as_deref(), Some("Test Author"));
        assert_eq!(s.description.as_deref(), Some("A test script"));
        assert!(s.path.join("fxmanifest.lua").exists());
        assert!(s.path.is_absolute());
    }

    #[test]
    fn load_scripts_handles_crlf_line_endings() {
        let temp = TempDir::new("trek-scripts-crlf");
        let script_dir = temp.path().join("crlf-resource");
        fs::create_dir_all(&script_dir).unwrap();
        fs::write(
            script_dir.join("fxmanifest.lua"),
            "fx_version 'cerulean'\r\ngame 'gta5'\r\nauthor 'CRLF User'\r\nversion '1.0.0'\r\n",
        )
        .unwrap();

        let scripts = Scripts::load_from(temp.path()).unwrap();
        assert_eq!(scripts.scripts.len(), 1);
        assert_eq!(scripts.scripts[0].name, "crlf-resource");
        assert_eq!(scripts.scripts[0].author.as_deref(), Some("CRLF User"));
        assert_eq!(scripts.scripts[0].version.as_deref(), Some("1.0.0"));
    }

    #[test]
    fn load_scripts_returns_empty_for_empty_directory() {
        let temp = TempDir::new("trek-scripts-empty");
        let scripts = Scripts::load_from(temp.path()).unwrap();
        assert!(scripts.scripts.is_empty());
    }

    #[test]
    fn load_scripts_sorts_by_name() {
        let temp = TempDir::new("trek-scripts-sort");

        for name in ["z-script", "a-script", "m-script"] {
            let dir = temp.path().join(name);
            fs::create_dir_all(&dir).unwrap();
            fs::write(dir.join("fxmanifest.lua"), "fx_version 'cerulean'\ngame 'gta5'\n")
                .unwrap();
        }

        let scripts = Scripts::load_from(temp.path()).unwrap();
        assert_eq!(scripts.scripts.len(), 3);
        assert_eq!(scripts.scripts[0].name, "a-script");
        assert_eq!(scripts.scripts[1].name, "m-script");
        assert_eq!(scripts.scripts[2].name, "z-script");
    }

    #[cfg(target_os = "windows")]
    #[test]
    fn load_scripts_works_with_backslash_paths() {
        use std::ffi::OsString;
        let temp = TempDir::new("trek-scripts-win");
        let script_dir = temp.path().join("win-resource");
        fs::create_dir_all(&script_dir).unwrap();
        fs::write(
            script_dir.join("fxmanifest.lua"),
            "fx_version 'cerulean'\ngame 'gta5'\n",
        )
        .unwrap();

        let scripts = Scripts::load_from(temp.path()).unwrap();
        assert_eq!(scripts.scripts.len(), 1);
        assert_eq!(scripts.scripts[0].name, "win-resource");
    }

    #[cfg(not(target_os = "windows"))]
    #[test]
    fn load_scripts_works_with_forward_slash_paths() {
        let temp = TempDir::new("trek-scripts-unix");
        let script_dir = temp.path().join("unix-resource");
        fs::create_dir_all(&script_dir).unwrap();
        fs::write(
            script_dir.join("fxmanifest.lua"),
            "fx_version 'cerulean'\ngame 'gta5'\n",
        )
        .unwrap();

        let scripts = Scripts::load_from(temp.path()).unwrap();
        assert_eq!(scripts.scripts.len(), 1);
        assert_eq!(scripts.scripts[0].name, "unix-resource");
    }
}
