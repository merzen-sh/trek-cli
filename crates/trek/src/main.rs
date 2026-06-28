mod cli;
mod config;
mod log;
mod login;
mod scripts;
mod server;

fn main() -> anyhow::Result<()> {
    log::init();

    cli::run()?;

    Ok(())
}
