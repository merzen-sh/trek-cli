use crate::log_warn;
use axum::extract::Request;
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use bytes::Bytes;
use http_body_util::BodyExt;
use reqwest::Client;
use std::collections::HashMap;
use std::sync::LazyLock;
use std::sync::Mutex;
use std::time::Instant;

static CLIENT: LazyLock<Client> = LazyLock::new(|| {
    Client::builder()
        .build()
        .expect("failed to build reqwest client")
});

struct CacheEntry {
    status: StatusCode,
    headers: HeaderMap,
    body: Bytes,
    expires: Instant,
}

static CACHE: LazyLock<Mutex<HashMap<String, CacheEntry>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

pub async fn handler(req: Request) -> Response {
    let base = crate::server::base_url();
    let (parts, body) = req.into_parts();

    let path = parts.uri.path();
    let upstream_path = path.strip_prefix("/external").unwrap_or(&path);
    let query = parts
        .uri
        .query()
        .map(|q| format!("?{q}"))
        .unwrap_or_default();
    let cache_key = format!("{base}{upstream_path}{query}");

    let url = format!("{base}{upstream_path}{query}");

    let is_get = parts.method == "GET";
    if is_get {
        if let Some(entry) = CACHE.lock().unwrap().get(&cache_key) {
            if entry.expires > Instant::now() {
                return (
                    entry.status.clone(),
                    entry.headers.clone(),
                    entry.body.clone(),
                )
                    .into_response();
            }
        }
    }

    let body_bytes = match body.collect().await {
        Ok(collected) => collected.to_bytes(),
        Err(e) => {
            log_warn!("failed to read request body: {e}");
            return (StatusCode::BAD_REQUEST, "failed to read request body").into_response();
        }
    };

    let is_hop_header = |k: &str| -> bool {
        matches!(
            k,
            "host"
                | "connection"
                | "transfer-encoding"
                | "upgrade"
                | "proxy-authorization"
                | "proxy-authenticate"
                | "keep-alive"
                | "cookie" // we inject our own session cookie below
        )
    };

    let session_cookie = trek_configuration::Config::load()
        .ok()
        .and_then(|c| c.session_id)
        .map(|id| format!("session={id}"));

    let method = match reqwest::Method::from_bytes(parts.method.as_str().as_bytes()) {
        Ok(m) => m,
        Err(e) => {
            log_warn!("invalid http method: {e}");
            return (StatusCode::BAD_REQUEST, "invalid http method").into_response();
        }
    };

    let mut req_builder = CLIENT.request(method, &url);
    for (key, value) in parts.headers.iter() {
        if !is_hop_header(key.as_str()) {
            req_builder = req_builder.header(key, value);
        }
    }
    if let Some(cookie) = session_cookie {
        req_builder = req_builder.header(reqwest::header::COOKIE, cookie);
    }
    req_builder = req_builder.body(body_bytes);

    match req_builder.send().await {
        Ok(resp) => {
            let status =
                StatusCode::from_u16(resp.status().as_u16()).unwrap_or(StatusCode::BAD_GATEWAY);
            let mut headers = axum::http::HeaderMap::new();
            for (key, value) in resp.headers().iter() {
                if !is_hop_header(key.as_str()) {
                    headers.insert(key.clone(), value.clone());
                }
            }
            let body = match resp.bytes().await {
                Ok(b) => b,
                Err(e) => {
                    log_warn!("failed to read upstream response body: {e}");
                    return (StatusCode::BAD_GATEWAY, "upstream read error").into_response();
                }
            };

            if is_get && status.is_success() {
                CACHE.lock().unwrap().insert(
                    cache_key,
                    CacheEntry {
                        status,
                        headers: headers.clone(),
                        body: body.clone(),
                        expires: Instant::now() + std::time::Duration::from_secs(120),
                    },
                );
            }
            (status, headers, body).into_response()
        }
        Err(e) => {
            log_warn!("api proxy error: {e}");
            (StatusCode::BAD_GATEWAY, format!("api proxy error: {e}")).into_response()
        }
    }
}
