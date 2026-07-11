use crate::server::run_server;
use crate::{login, scripts};
use anyhow::Result;
use clap::{Parser, Subcommand};
use std::path::Path;
use trek_configuration::Config;
use trek_log::log_success;

#[derive(Parser)]
#[command(name = "trek", version, about)]
struct Cli {
    #[arg(short, long, default_value = "8080")]
    port: u16,
    /// Open a browser when starting the dashboard (default: true). Set to
    /// false to skip opening a browser.
    #[arg(long, default_value_t = true, value_parser = clap::value_parser!(bool), action = clap::ArgAction::Set, global = true)]
    browser: bool,
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
    /// Show a config value
    Show {
        #[command(subcommand)]
        key: ShowKey,
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

#[derive(Subcommand)]
enum ShowKey {
    /// Show the workspace directory
    #[clap(name = "workspace_dir")]
    WorkspaceDir,
    /// Show the config file path
    #[clap(name = "path")]
    Path,
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
            ConfigCommands::Show { key } => match key {
                ShowKey::WorkspaceDir => {
                    let config = Config::load()?;
                    match config.workspace_dir() {
                        Some(dir) => println!("{dir}"),
                        None => println!("(not set)"),
                    }
                }
                ShowKey::Path => {
                    println!("{}", Config::path().display());
                }
            },
        },
        Some(Commands::Scripts { action }) => match action {
            ScriptsCommands::List => {
                let start = std::time::Instant::now();
                let scripts = scripts::load_scripts()?;
                let elapsed = start.elapsed();
                scripts.print_list(elapsed);
            }
        },
        None => {
            let mut config = Config::load()?;
            config.ensure_workspace_dir()?;
            run_server(cli.port, cli.browser)?;
        }
    }

    Ok(())
}
