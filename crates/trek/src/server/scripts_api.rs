use axum::Json;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};

pub async fn list() -> Response {
    match crate::scripts::Scripts::load() {
        Ok(scripts) => Json(scripts.scripts).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

pub async fn get_by_name(Path(name): Path<String>) -> Response {
    let scripts = match crate::scripts::Scripts::load() {
        Ok(s) => s.scripts,
        Err(e) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response();
        }
    };
    match scripts.into_iter().find(|s| s.name == name) {
        Some(script) => Json(script).into_response(),
        None => (StatusCode::NOT_FOUND, "script not found").into_response(),
    }
}
