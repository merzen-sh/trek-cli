use crate::log_warn;
use axum::extract::Request;
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use bytes::Bytes;
use http_body_util::BodyExt;
use http_body_util::Full;
use hyper_util::client::legacy::Client;
use hyper_util::client::legacy::connect::HttpConnector;
use hyper_util::rt::TokioExecutor;
use std::collections::HashMap;
use std::sync::LazyLock;
use std::sync::Mutex;
use std::time::Instant;

static CLIENT: LazyLock<Client<HttpConnector, Full<Bytes>>> =
    LazyLock::new(|| Client::builder(TokioExecutor::new()).build_http());

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

    let url: hyper::Uri = match format!("{base}{upstream_path}{query}").parse() {
        Ok(uri) => uri,
        Err(e) => {
            log_warn!("invalid api upstream uri: {e}");
            return (StatusCode::BAD_GATEWAY, "invalid upstream url format").into_response();
        }
    };

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
        )
    };

    let mut req_builder = Request::builder().method(parts.method).uri(url);
    for (key, value) in parts.headers.iter() {
        if !is_hop_header(key.as_str()) {
            req_builder = req_builder.header(key, value);
        }
    }
    let req = req_builder.body(Full::new(body_bytes)).unwrap();

    match CLIENT.request(req).await {
        Ok(resp) => {
            let (resp_parts, resp_body) = resp.into_parts();
            let body = match resp_body.collect().await {
                Ok(collected) => collected.to_bytes(),
                Err(e) => {
                    log_warn!("failed to read upstream response body: {e}");
                    return (StatusCode::BAD_GATEWAY, "upstream read error").into_response();
                }
            };
            let mut headers = axum::http::HeaderMap::new();
            for (key, value) in resp_parts.headers.iter() {
                if !is_hop_header(key.as_str()) {
                    headers.insert(key.clone(), value.clone());
                }
            }
            if is_get && resp_parts.status.is_success() {
                CACHE.lock().unwrap().insert(
                    cache_key,
                    CacheEntry {
                        status: resp_parts.status,
                        headers: headers.clone(),
                        body: body.clone(),
                        expires: Instant::now() + std::time::Duration::from_secs(120),
                    },
                );
            }
            (resp_parts.status, headers, body).into_response()
        }
        Err(e) => {
            log_warn!("api proxy error: {e}");
            (StatusCode::BAD_GATEWAY, format!("api proxy error: {e}")).into_response()
        }
    }
}
