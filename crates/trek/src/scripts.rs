use anyhow::{Context, Result};
use trek_configuration::Config;
pub use trek_scripts::Scripts;

/// Load all scripts from the configured workspace directory.
pub fn load_scripts() -> Result<Scripts> {
    let config = Config::load()?;
    let dir = config.workspace_path().context(
        "workspace_dir not set or is not a path. Use `trek config set workspace_dir <path>`",
    )?;
    Scripts::load_from(&dir)
}
