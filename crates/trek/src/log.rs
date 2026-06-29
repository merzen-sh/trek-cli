use std::fs;
use std::io::{self, Write};
use std::path::Path;

/// Load a `.env` file into the process environment.
///
/// Skips empty lines, lines starting with `#`, and lines without `=`.
/// Does **not** overwrite variables that are already set (matches `dotenvy` behavior).
pub fn load_dotenv() {
    let _ = load_dotenv_from(".env");
}

fn load_dotenv_from(path: impl AsRef<Path>) -> io::Result<()> {
    let content = fs::read_to_string(path.as_ref())?;
    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        if let Some((key, value)) = line.split_once('=') {
            let key = key.trim();
            let value = value.trim().trim_matches(|c| c == '"' || c == '\'');
            // Only set if not already present — same as dotenvy::dotenv()
            if std::env::var(key).is_err() {
                // SAFETY: called single-threaded at program start before any
                // threads are spawned (inside `main` → `log::init()` → `base_url()`).
                unsafe { std::env::set_var(key, value) };
            }
        }
    }
    Ok(())
}

/// Read `BASE_URL` from the environment, loading `.env` first.
/// Falls back to `"http://localhost:3000"` if unset.
pub fn base_url() -> String {
    load_dotenv();
    std::env::var("BASE_URL").unwrap_or_else(|_| "http://localhost:3000".to_string())
}

#[derive(Copy, Clone, Debug)]
#[doc(hidden)]
pub enum Level {
    Error,
    Warn,
    Info,
    Success,
    Debug,
}

impl Level {
    fn tag(self) -> &'static str {
        match self {
            Level::Error => "ERROR",
            Level::Warn => "WARN",
            Level::Info => "INFO",
            Level::Success => "SUCCESS",
            Level::Debug => "DEBUG",
        }
    }

    fn color(self) -> &'static str {
        match self {
            Level::Error => "\x1b[31m",   // red
            Level::Warn => "\x1b[33m",    // yellow
            Level::Info => "\x1b[36m",    // cyan
            Level::Success => "\x1b[32m", // green
            Level::Debug => "\x1b[90m",   // grey
        }
    }
}

const RESET: &str = "\x1b[0m";

/// Write a log line to stderr.
#[doc(hidden)]
pub fn log(level: Level, args: std::fmt::Arguments) {
    let tag = level.tag();
    let color = level.color();
    let mut stderr = io::stderr();
    let _ = writeln!(stderr, "{color}[{tag}]{RESET} {args}");
}

/// Initialize the logger. Call once at program start.
pub fn init() {
    // Nothing to do — we write directly to stderr per-message.
}

/// Log an ERROR message to stderr.
#[macro_export]
macro_rules! log_error {
    ($($arg:tt)*) => {
        $crate::log::log($crate::log::Level::Error, format_args!($($arg)*))
    };
}

/// Log a WARNING message to stderr.
#[macro_export]
macro_rules! log_warn {
    ($($arg:tt)*) => {
        $crate::log::log($crate::log::Level::Warn, format_args!($($arg)*))
    };
}

/// Log an INFO message to stderr.
#[macro_export]
macro_rules! log_info {
    ($($arg:tt)*) => {
        $crate::log::log($crate::log::Level::Info, format_args!($($arg)*))
    };
}

/// Log a SUCCESS message to stderr.
#[macro_export]
macro_rules! log_success {
    ($($arg:tt)*) => {
        $crate::log::log($crate::log::Level::Success, format_args!($($arg)*))
    };
}

/// Log a DEBUG message to stderr. Compiled out in `--release` builds.
#[macro_export]
macro_rules! log_debug {
    ($($arg:tt)*) => {
        #[cfg(debug_assertions)]
        $crate::log::log($crate::log::Level::Debug, format_args!($($arg)*))
    };
}
