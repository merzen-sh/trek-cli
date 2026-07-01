use crate::{log_error, log_success};
use axum::extract::Request;
use axum::http::StatusCode;
use axum::middleware;
use axum::response::{IntoResponse, Response};
use std::sync::LazyLock;
use std::sync::Mutex;

static AUTH_PIN: LazyLock<Mutex<String>> = LazyLock::new(|| {
    let ns = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let pin = format!("{:06}", ns % 1_000_000);
    Mutex::new(pin)
});

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
        log_error!("Invalid pin {}", pin);
        return StatusCode::UNAUTHORIZED;
    }
    match crate::config::Config::load() {
        Ok(cfg) if cfg.session_id.is_some() => StatusCode::OK,
        _ => StatusCode::FORBIDDEN,
    }
}
