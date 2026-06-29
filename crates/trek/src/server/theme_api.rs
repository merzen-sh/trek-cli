use crate::log_success;
use axum::Json;
use axum::extract::{Path, Request};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use http_body_util::BodyExt;
use serde_json::Value;
use std::path::PathBuf;

fn prevent_traversal(name: &str) -> Result<PathBuf, Response> {
    if name.contains('/') || name.contains('\\') || name.contains("..") {
        Err((StatusCode::BAD_REQUEST, "invalid script name").into_response())
    } else {
        Ok(PathBuf::from(name))
    }
}

fn script_dir(name: &str) -> Result<PathBuf, Response> {
    let config = crate::config::Config::load()
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response())?;
    let ws = config
        .workspace_path()
        .ok_or_else(|| (StatusCode::NOT_FOUND, "workspace_dir not set").into_response())?;
    let sub = prevent_traversal(name)?;
    let dir = ws.join(sub);
    if !dir.is_dir() {
        return Err((StatusCode::NOT_FOUND, "script not found").into_response());
    }
    Ok(dir)
}

pub async fn get_theme_schema(Path(name): Path<String>) -> Response {
    let dir = match script_dir(&name) {
        Ok(d) => d,
        Err(r) => return r,
    };
    let path = dir.join("schema/theme_schema.json");
    if !path.is_file() {
        return (StatusCode::NOT_FOUND, "theme_schema.json not found").into_response();
    }
    let content = match std::fs::read_to_string(&path) {
        Ok(c) => c,
        Err(e) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response();
        }
    };
    let schema: Value = match serde_json::from_str(&content) {
        Ok(v) => v,
        Err(e) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response();
        }
    };
    Json(schema).into_response()
}

pub async fn get_theme(Path(name): Path<String>) -> Response {
    let dir = match script_dir(&name) {
        Ok(d) => d,
        Err(r) => return r,
    };
    let path = dir.join("theme.json");
    if !path.is_file() {
        return Json(serde_json::json!({})).into_response();
    }
    let content = match std::fs::read_to_string(&path) {
        Ok(c) => c,
        Err(e) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response();
        }
    };
    let value: Value = match serde_json::from_str(&content) {
        Ok(v) => v,
        Err(e) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response();
        }
    };
    Json(value).into_response()
}

pub async fn save_theme(Path(name): Path<String>, req: Request) -> Response {
    let dir = match script_dir(&name) {
        Ok(d) => d,
        Err(r) => return r,
    };

    let body_bytes = match req.collect().await {
        Ok(collected) => collected.to_bytes(),
        Err(e) => {
            return (StatusCode::BAD_REQUEST, format!("failed to read body: {e}")).into_response();
        }
    };

    let value: Value = match serde_json::from_slice(&body_bytes) {
        Ok(v) => v,
        Err(e) => {
            return (StatusCode::BAD_REQUEST, format!("invalid JSON: {e}")).into_response();
        }
    };

    let formatted = match serde_json::to_string_pretty(&value) {
        Ok(s) => s,
        Err(e) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response();
        }
    };

    let path = dir.join("theme.json");
    match std::fs::write(&path, &formatted) {
        Ok(_) => {
            log_success!("Theme saved to {}", path.to_string_lossy());
            Json(serde_json::json!({"ok": true, "path": path.to_string_lossy()})).into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
