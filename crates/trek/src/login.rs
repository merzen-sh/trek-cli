use crate::browser::open_browser;
use crate::server::base_url;
use trek_log::log_success;
use anyhow::{Context, Result};
use serde::Deserialize;
use std::io::{self, Write};
use std::time::Duration;

#[derive(Deserialize)]
struct ChallengeResponse {
    code: String,
}

#[derive(Deserialize)]
struct StatusResponse {
    status: String,
}

#[derive(Deserialize)]
struct ClaimResponse {
    ok: bool,
    #[serde(rename = "sessionId")]
    session_id: String,
    user: serde_json::Value,
}

pub fn run() -> Result<()> {
    let rt = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()?;
    rt.block_on(login_async())?;
    Ok(())
}

async fn login_async() -> Result<()> {
    let base = base_url();

    let client = reqwest::Client::new();

    let chal: ChallengeResponse = client
        .post(format!("{base}/api/cli/challenge"))
        .send()
        .await
        .context("failed to create challenge")?
        .json()
        .await
        .context("failed to parse challenge response")?;

    let code = &chal.code;
    let url = format!("{base}/cli-login?code={code}");

    let _ = open_browser(&url);

    let mut tick = 0u32;
    let frameset = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    let status_url = format!("{base}/api/cli/challenge/{code}/status");
    let deadline = tokio::time::Instant::now() + Duration::from_secs(300);

    loop {
        tick += 1;

        if tokio::time::Instant::now() > deadline {
            print!("\r\x1b[2K\x1b[31m✗\x1b[0m Timed out after 5 minutes\n");
            io::stdout().flush().ok();
            anyhow::bail!("timed out waiting for authorization");
        }

        let frame = frameset[tick as usize % frameset.len()];
        print!(
            "\r\x1b[2K\x1b[32m{}\x1b[0m Waiting for authorization at {}...",
            frame, url
        );
        io::stdout().flush().ok();

        tokio::time::sleep(Duration::from_millis(100)).await;

        if tick % 20 == 0 {
            let resp = client.get(&status_url).send().await?;
            let status: StatusResponse = resp.json().await?;

            if status.status == "authorized" {
                print!("\r\x1b[2K\x1b[32m✓\x1b[0m Authorization received!\n");
                io::stdout().flush().ok();
                break;
            }
        }
    }

    let claim: ClaimResponse = client
        .post(format!("{base}/api/cli/challenge/{code}/claim"))
        .send()
        .await
        .context("failed to claim session")?
        .json()
        .await
        .context("failed to parse claim response")?;

    anyhow::ensure!(claim.ok, "failed to claim session");

    let username = claim.user["displayName"]
        .as_str()
        .or_else(|| claim.user["username"].as_str())
        .unwrap_or("unknown")
        .to_string();

    let mut config = trek_configuration::Config::load()?;
    config.session_id = Some(claim.session_id);
    config.user = Some(claim.user);
    config.save()?;

    log_success!("Logged in as {username}!");

    Ok(())
}
