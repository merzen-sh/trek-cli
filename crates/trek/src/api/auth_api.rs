use axum::extract::Request;
use axum::http::StatusCode;
use axum::middleware;
use axum::response::{IntoResponse, Response};
use std::sync::LazyLock;
use std::sync::Mutex;
use std::sync::atomic::{AtomicU32, Ordering};
use trek_log::log_error;

static AUTH_PIN: LazyLock<Mutex<String>> = LazyLock::new(|| {
    let ns = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let pin = format!("{:06}", ns % 1_000_000);
    Mutex::new(pin)
});

static FAILED_ATTEMPTS: AtomicU32 = AtomicU32::new(0);

/// Increment the wrong-PIN counter. If it exceeds 3 bail the process.
pub fn report_wrong_pin() {
    let attempts = FAILED_ATTEMPTS.fetch_add(1, Ordering::SeqCst) + 1;
    log_error!("Invalid pin (attempt {attempts}/3)");
    if attempts >= 3 {
        eprintln!("Too many invalid pin attempts — exiting");
        std::process::exit(1);
    }
}

/// Reset the wrong-PIN counter on a valid pin check.
pub fn reset_failed_attempts() {
    FAILED_ATTEMPTS.store(0, Ordering::SeqCst);
}

pub fn auth_pin() -> String {
    AUTH_PIN.lock().unwrap().clone()
}

pub async fn require_pin(req: Request, next: middleware::Next) -> Response {
    let path = req.uri().path().to_string();
    if !path.starts_with("/external/") {
        return next.run(req).await;
    }
    let pin = req
        .headers()
        .get("x-auth-pin")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    if pin != *AUTH_PIN.lock().unwrap() {
        report_wrong_pin();
        return (StatusCode::UNAUTHORIZED, "invalid pin").into_response();
    }
    next.run(req).await
}

#[cfg_attr(
    feature = "swagger",
    utoipa::path(
        get,
        path = "/api/auth",
        tag = "Authentication",
        operation_id = "auth",
        responses(
            (status = 200, description = "Authenticated with valid session"),
            (status = 401, description = "Invalid pin"),
            (status = 403, description = "Valid pin but no session (not logged in)")
        )
    )
)]
pub async fn handler(req: Request) -> impl IntoResponse {
    let pin = req
        .headers()
        .get("x-auth-pin")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    if pin != *AUTH_PIN.lock().unwrap() {
        report_wrong_pin();
        return StatusCode::UNAUTHORIZED;
    }
    reset_failed_attempts();
    match trek_configuration::Config::load() {
        Ok(cfg) if cfg.session_id.is_some() => StatusCode::OK,
        _ => StatusCode::FORBIDDEN,
    }
}
