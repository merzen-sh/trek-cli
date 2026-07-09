use axum::Json;
use axum::extract::Request;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use http_body_util::BodyExt;
use serde::{Deserialize, Serialize};
use trek_log::log_success;

#[derive(Serialize)]
pub struct AllowedIpsResponse {
    pub allowed_ips: Vec<String>,
}

pub async fn list() -> Response {
    let config = match trek_configuration::Config::load() {
        Ok(c) => c,
        Err(e) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response();
        }
    };
    Json(AllowedIpsResponse {
        allowed_ips: config.allowed_ips.clone(),
    })
    .into_response()
}

#[derive(Deserialize)]
pub struct AddIpPayload {
    pub ip: String,
}

pub async fn add(req: Request) -> Response {
    let body_bytes = match req.collect().await {
        Ok(collected) => collected.to_bytes(),
        Err(e) => {
            return (StatusCode::BAD_REQUEST, format!("failed to read body: {e}")).into_response();
        }
    };

    let payload: AddIpPayload = match serde_json::from_slice(&body_bytes) {
        Ok(v) => v,
        Err(e) => {
            return (StatusCode::BAD_REQUEST, format!("invalid JSON: {e}")).into_response();
        }
    };

    if payload.ip.trim().is_empty() {
        return (StatusCode::BAD_REQUEST, "ip cannot be empty").into_response();
    }

    let mut config = match trek_configuration::Config::load() {
        Ok(c) => c,
        Err(e) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response();
        }
    };

    if config.allowed_ips.contains(&payload.ip) {
        return (StatusCode::CONFLICT, "ip already in list").into_response();
    }

    config.allowed_ips.push(payload.ip.clone());
    config.allowed_ips.sort();

    match config.save() {
        Ok(_) => {
            log_success!("Added allowed IP: {}", payload.ip);
            Json(AllowedIpsResponse {
                allowed_ips: config.allowed_ips,
            })
            .into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

#[derive(Deserialize)]
pub struct DeleteIpPayload {
    pub ip: String,
}

const PROTECTED_IPS: [&str; 3] = ["127.0.0.1", "::1", "localhost"];

pub async fn delete(req: Request) -> Response {
    let body_bytes = match req.collect().await {
        Ok(collected) => collected.to_bytes(),
        Err(e) => {
            return (StatusCode::BAD_REQUEST, format!("failed to read body: {e}")).into_response();
        }
    };

    let payload: DeleteIpPayload = match serde_json::from_slice(&body_bytes) {
        Ok(v) => v,
        Err(e) => {
            return (StatusCode::BAD_REQUEST, format!("invalid JSON: {e}")).into_response();
        }
    };

    if PROTECTED_IPS.contains(&payload.ip.as_str()) {
        return (
            StatusCode::FORBIDDEN,
            format!("cannot remove protected IP: {}", payload.ip),
        )
            .into_response();
    }

    let mut config = match trek_configuration::Config::load() {
        Ok(c) => c,
        Err(e) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response();
        }
    };

    let initial_len = config.allowed_ips.len();
    config.allowed_ips.retain(|ip| ip != &payload.ip);

    if config.allowed_ips.len() == initial_len {
        return (StatusCode::NOT_FOUND, "ip not in list").into_response();
    }

    match config.save() {
        Ok(_) => {
            log_success!("Removed allowed IP: {}", payload.ip);
            Json(AllowedIpsResponse {
                allowed_ips: config.allowed_ips,
            })
            .into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
