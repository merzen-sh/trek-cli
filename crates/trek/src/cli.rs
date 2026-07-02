use crate::server::run_server;
use crate::{login, scripts};
use trek_configuration::Config;
use crate::{log_error, log_success};
use anyhow::Result;
use clap::{Parser, Subcommand};
use std::path::Path;

#[derive(Parser)]
#[command(name = "trek", version, about)]
struct Cli {
    #[arg(short, long, default_value = "8080")]
    port: u16,
    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    /// Authenticate with the trek service
    Login,
    /// Manage configuration
    Config {
        #[command(subcommand)]
        action: ConfigCommands,
    },
    /// List scripts in the workspace
    Scripts {
        #[command(subcommand)]
        action: ScriptsCommands,
    },
}

#[derive(Subcommand)]
enum ScriptsCommands {
    /// List all scripts with metadata
    List,
}

#[derive(Subcommand)]
enum ConfigCommands {
    /// Set a config value
    Set {
        #[command(subcommand)]
        key: SetKey,
    },
}

#[derive(Subcommand)]
enum SetKey {
    /// Set the workspace directory
    #[clap(name = "workspace_dir")]
    WorkspaceDir {
        /// Path to the workspace directory
        path: String,
    },
}

pub fn run() -> Result<()> {
    let cli = Cli::parse();

    match &cli.command {
        Some(Commands::Login) => {
            login::run()?;
        }
        Some(Commands::Config { action }) => match action {
            ConfigCommands::Set { key } => match key {
                SetKey::WorkspaceDir { path } => {
                    let mut config = Config::load()?;
                    config.set_workspace_dir(Path::new(path))?;
                    log_success!(
                        "workspace_dir set to {}",
                        config.workspace_dir.as_deref().unwrap_or("?"),
                    );
                }
            },
        },
        Some(Commands::Scripts { action }) => match action {
            ScriptsCommands::List => {
                let start = std::time::Instant::now();
                let scripts = scripts::load_scripts()?;
                let elapsed = start.elapsed();
                if scripts.scripts.is_empty() {
                    log_error!("no scripts found in workspace");
                } else {
                    println!(
                        "{:<16} {:<16} {:<14} {}",
                        "Name", "Version", "Author", "Description"
                    );

                    for script in &scripts.scripts {
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
                        scripts.scripts.len(),
                        elapsed.as_nanos() as f64 / 1_000_000.0
                    );
                }
            }
        },
        None => {
            let mut config = Config::load()?;
            config.ensure_workspace_dir()?;
            run_server(cli.port)?;
        }
    }

    Ok(())
}
