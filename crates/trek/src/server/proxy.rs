use axum::extract::Request;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};

#[cfg(debug_assertions)]
mod inner {
    use super::*;
    use trek_log::log_warn;
    use bytes::Bytes;
    use http_body_util::BodyExt;
    use http_body_util::Full;
    use hyper_util::client::legacy::Client;
    use hyper_util::client::legacy::connect::HttpConnector;
    use hyper_util::rt::TokioExecutor;
    use std::sync::LazyLock;

    static CLIENT: LazyLock<Client<HttpConnector, Full<Bytes>>> =
        LazyLock::new(|| Client::builder(TokioExecutor::new()).build_http());

    fn base_url() -> String {
        "http://localhost:5173".to_string()
    }

    pub async fn handler(req: Request) -> Response {
        let base = base_url();
        let (parts, body) = req.into_parts();

        let path = parts.uri.path();
        let query = parts
            .uri
            .query()
            .map(|q| format!("?{q}"))
            .unwrap_or_default();
        let url: hyper::Uri = match format!("{base}{path}{query}").parse() {
            Ok(uri) => uri,
            Err(e) => {
                log_warn!("invalid target uri: {e}");
                return (StatusCode::BAD_GATEWAY, "invalid upstream url format").into_response();
            }
        };

        let body_bytes = match body.collect().await {
            Ok(collected) => collected.to_bytes(),
            Err(e) => {
                log_warn!("failed to read request body: {e}");
                return (StatusCode::BAD_REQUEST, "failed to read request body").into_response();
            }
        };

        let mut req_builder = Request::builder().method(parts.method).uri(url);
        for (key, value) in parts.headers.iter() {
            if !matches!(
                key.as_str(),
                "host"
                    | "connection"
                    | "transfer-encoding"
                    | "upgrade"
                    | "proxy-authorization"
                    | "proxy-authenticate"
            ) {
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
                (resp_parts.status, resp_parts.headers, body).into_response()
            }
            Err(e) => {
                log_warn!("proxy error: {e}");
                (StatusCode::BAD_GATEWAY, format!("proxy error: {e}")).into_response()
            }
        }
    }
}

#[cfg(not(debug_assertions))]
mod inner {
    use super::*;
    use axum::http::header;
    use bytes::Bytes;
    use rust_embed::Embed;

    #[derive(Embed)]
    #[folder = "../../packages/app/dist"]
    struct Assets;

    fn mime_type(path: &str) -> &'static str {
        if path.ends_with(".html") {
            "text/html; charset=utf-8"
        } else if path.ends_with(".css") {
            "text/css; charset=utf-8"
        } else if path.ends_with(".js") {
            "application/javascript; charset=utf-8"
        } else if path.ends_with(".json") || path.ends_with(".map") {
            "application/json"
        } else if path.ends_with(".svg") {
            "image/svg+xml"
        } else if path.ends_with(".png") {
            "image/png"
        } else if path.ends_with(".ico") {
            "image/x-icon"
        } else if path.ends_with(".woff2") {
            "font/woff2"
        } else if path.ends_with(".woff") {
            "font/woff"
        } else if path.ends_with(".ttf") {
            "font/ttf"
        } else {
            "application/octet-stream"
        }
    }

    pub async fn handler(req: Request) -> Response {
        let path = req.uri().path().trim_start_matches('/');
        let path = if path.is_empty() { "index.html" } else { path };

        match Assets::get(path) {
            Some(content) => {
                let mime = mime_type(path);
                let headers = [(header::CONTENT_TYPE, header::HeaderValue::from_static(mime))];
                (
                    StatusCode::OK,
                    headers,
                    Bytes::copy_from_slice(content.data.as_ref()),
                )
                    .into_response()
            }
            None => match Assets::get("index.html") {
                Some(content) => {
                    let headers = [(
                        header::CONTENT_TYPE,
                        header::HeaderValue::from_static("text/html; charset=utf-8"),
                    )];
                    (
                        StatusCode::OK,
                        headers,
                        Bytes::copy_from_slice(content.data.as_ref()),
                    )
                        .into_response()
                }
                None => (StatusCode::NOT_FOUND, "not found").into_response(),
            },
        }
    }
}

pub use inner::handler;
