mod api;
mod banner;
mod cli;
mod config;
mod log;
mod login;
mod scripts;
mod server;
mod update;

fn main() -> anyhow::Result<()> {
    log::init();

    cli::run()?;

    Ok(())
}
