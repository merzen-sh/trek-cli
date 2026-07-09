use axum::extract::Request;
use axum::http::StatusCode;
use axum::middleware;
use axum::response::{IntoResponse, Response};
use std::net::SocketAddr;

fn get_client_ip(req: &Request) -> Option<String> {
    if let Some(val) = req
        .headers()
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
    {
        let ip = val.split(',').next().unwrap_or("").trim();
        if !ip.is_empty() {
            return Some(ip.to_string());
        }
    }
    if let Some(val) = req.headers().get("x-real-ip").and_then(|v| v.to_str().ok()) {
        if !val.is_empty() {
            return Some(val.to_string());
        }
    }
    if let Some(addr) = req.extensions().get::<SocketAddr>() {
        return Some(addr.ip().to_string());
    }
    None
}

fn is_ip_allowed(ip: &str, allowed: &[String]) -> bool {
    allowed.iter().any(|a| a == ip || ip.starts_with(a))
}

fn host_is_allowed(req: &Request, allowed: &[String]) -> bool {
    if let Some(val) = req.headers().get("host").and_then(|v| v.to_str().ok()) {
        let host = val.split(':').next().unwrap_or("");
        if !host.is_empty() && allowed.iter().any(|a| a == host) {
            return true;
        }
    }
    false
}

pub async fn require_allowed_ip(req: Request, next: middleware::Next) -> Response {
    let path = req.uri().path().to_string();

    if path == "/api/allowed-ips" {
        return next.run(req).await;
    }

    let config = match trek_configuration::Config::load() {
        Ok(cfg) => cfg,
        Err(_) => return next.run(req).await,
    };

    let allowed = &config.allowed_ips;

    if host_is_allowed(&req, allowed) {
        return next.run(req).await;
    }

    match get_client_ip(&req) {
        Some(ip) if is_ip_allowed(&ip, allowed) => next.run(req).await,
        Some(ip) => {
            trek_log::log_error!("access denied for IP: {ip}");
            (StatusCode::FORBIDDEN, "access denied").into_response()
        }
        None => {
            trek_log::log_error!("could not determine client IP");
            (StatusCode::FORBIDDEN, "access denied").into_response()
        }
    }
}
