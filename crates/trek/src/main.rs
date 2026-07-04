mod api;
mod banner;
mod browser;
mod cli;

mod login;
mod scripts;
mod server;
mod update;

fn main() -> anyhow::Result<()> {
    cli::run()?;

    Ok(())
}
