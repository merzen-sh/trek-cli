use axum::Json;
use axum::extract::Path;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};

#[allow(unused_imports)]
use serde_json::Value;

#[cfg_attr(
    feature = "swagger",
    utoipa::path(
        get,
        path = "/api/scripts",
        tag = "Scripts",
        responses(
            (status = 200, description = "List of scripts", body = Value, content_type = "application/json"),
            (status = 500, description = "Internal server error")
        )
    )
)]
pub async fn list() -> Response {
    match crate::scripts::load_scripts() {
        Ok(scripts) => Json(scripts.scripts).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}

#[cfg_attr(
    feature = "swagger",
    utoipa::path(
        get,
        path = "/api/scripts/{name}",
        tag = "Scripts",
        params(
            ("name" = String, Path, description = "Script name")
        ),
        responses(
            (status = 200, description = "Script details", body = Value, content_type = "application/json"),
            (status = 404, description = "Script not found"),
            (status = 500, description = "Internal server error")
        )
    )
)]
pub async fn get_by_name(Path(name): Path<String>) -> Response {
    let scripts = match crate::scripts::load_scripts() {
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
