use std::ffi::OsStr;
use std::process::{Command, Stdio};

use anyhow::{Context, Result};

/// Build a command to open a URL in the user's preferred browser.
///
/// Detection order (first success wins):
///   1. `$BROWSER` environment variable (Unix convention)
///   2. Linux  → `xdg-open`, then `wsl-open` (for WSL)
///   3. Windows → `cmd /c start`
fn open_command(url: &str) -> Option<Command> {
    if let Some(bin) = std::env::var_os("BROWSER") {
        let candidate = build_cmd(bin, url);
        if candidate.is_some() {
            return candidate;
        }
    }

    if cfg!(target_os = "linux") {
        for bin in ["xdg-open", "wsl-open"] {
            if let Some(cmd) = build_cmd(bin, url) {
                return Some(cmd);
            }
        }
    }

    if cfg!(target_os = "windows") {
        let mut c = Command::new("cmd");
        c.args(["/c", "start", url]);
        return Some(c);
    }

    None
}

/// Try to resolve `bin` and return a configured [`Command`] if it exists on
/// `PATH`. Accepts both `OsString` (for `$BROWSER`) and `&str`.
fn build_cmd(bin: impl AsRef<OsStr>, url: &str) -> Option<Command> {
    let bin = bin.as_ref();
    // Quick existence check via `which` is more reliable than `Command::new("foo")`
    // which would fail at spawn time with a cryptic "No such file or directory".
    std::process::Command::new("which")
        .arg(bin)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .ok()
        .filter(|s| s.success())?;

    let mut c = Command::new(bin);
    c.arg(url);
    c.stdout(Stdio::null()).stderr(Stdio::null());
    Some(c)
}

pub fn open_browser(url: &str) -> Result<()> {
    let mut cmd =
        open_command(url).with_context(|| format!("no browser command found for url: {url}"))?;

    cmd.spawn()
        .map(|_| ())
        .with_context(|| format!("failed to open browser for url: {url}"))
}
