use std::io::{self, Write};

#[derive(Copy, Clone, Debug)]
#[doc(hidden)]
#[allow(dead_code)]
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn level_tag_returns_expected_values() {
        assert_eq!(Level::Error.tag(), "ERROR");
        assert_eq!(Level::Warn.tag(), "WARN");
        assert_eq!(Level::Info.tag(), "INFO");
        assert_eq!(Level::Success.tag(), "SUCCESS");
        assert_eq!(Level::Debug.tag(), "DEBUG");
    }

    #[test]
    fn level_color_starts_with_ansi_escape() {
        for level in &[
            Level::Error,
            Level::Warn,
            Level::Info,
            Level::Success,
            Level::Debug,
        ] {
            assert!(
                level.color().starts_with("\x1b["),
                "level {level:?} color should start with ANSI escape",
            );
        }
    }

    #[test]
    fn level_color_is_unique_per_level() {
        let colors: Vec<&str> = vec![
            Level::Error.color(),
            Level::Warn.color(),
            Level::Info.color(),
            Level::Success.color(),
            Level::Debug.color(),
        ];
        let mut sorted = colors.clone();
        sorted.sort();
        sorted.dedup();
        assert_eq!(
            sorted.len(),
            colors.len(),
            "each level should have a unique color"
        );
    }
}
