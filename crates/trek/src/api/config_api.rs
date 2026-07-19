use axum::Json;
use axum::extract::{Path, Query, Request};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use http_body_util::BodyExt;
use serde::Deserialize;
use serde_json::Value;
use std::path::PathBuf;
use trek_log::log_success;

#[derive(Deserialize, Default)]
pub struct ConfigTypeQuery {
    #[serde(rename = "type", default = "default_config_type")]
    pub config_type: String,
}

fn default_config_type() -> String {
    "server".to_string()
}

fn config_filename(config_type: &str) -> &'static str {
    match config_type {
        "client" => "client.json",
        _ => "server.json",
    }
}

fn schema_filename(config_type: &str) -> &'static str {
    match config_type {
        "client" => "client.json",
        _ => "server.json",
    }
}

fn prevent_traversal(name: &str) -> Result<PathBuf, Response> {
    if name.contains('/') || name.contains('\\') || name.contains("..") {
        Err((StatusCode::BAD_REQUEST, "invalid script name").into_response())
    } else {
        Ok(PathBuf::from(name))
    }
}

fn script_dir(name: &str) -> Result<PathBuf, Response> {
    let config = trek_configuration::Config::load()
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

#[cfg_attr(
    feature = "swagger",
    utoipa::path(
        get,
        path = "/api/scripts/{name}/config-schema",
        tag = "Config",
        params(
            ("name" = String, Path, description = "Script name"),
            ("type" = Option<String>, Query, description = "Config type: server or client")
        ),
        responses(
            (status = 200, description = "Config schema JSON", body = Value, content_type = "application/json"),
            (status = 404, description = "Script or schema file not found"),
            (status = 500, description = "Internal server error")
        )
    )
)]
pub async fn get_schema(Path(name): Path<String>, Query(query): Query<ConfigTypeQuery>) -> Response {
    let dir = match script_dir(&name) {
        Ok(d) => d,
        Err(r) => return r,
    };
    let fname = schema_filename(&query.config_type);
    let path = dir.join("schema").join(fname);
    if !path.is_file() {
        return (StatusCode::NOT_FOUND, format!("{fname} not found")).into_response();
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

#[cfg_attr(
    feature = "swagger",
    utoipa::path(
        get,
        path = "/api/scripts/{name}/config",
        tag = "Config",
        params(
            ("name" = String, Path, description = "Script name"),
            ("type" = Option<String>, Query, description = "Config type: server or client")
        ),
        responses(
            (status = 200, description = "Current config JSON", body = Value, content_type = "application/json"),
            (status = 404, description = "Script not found"),
            (status = 500, description = "Internal server error")
        )
    )
)]
pub async fn get_config(Path(name): Path<String>, Query(query): Query<ConfigTypeQuery>) -> Response {
    let dir = match script_dir(&name) {
        Ok(d) => d,
        Err(r) => return r,
    };
    let fname = config_filename(&query.config_type);
    let path = dir.join("config").join(fname);
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

#[cfg_attr(
    feature = "swagger",
    utoipa::path(
        post,
        path = "/api/scripts/{name}/config",
        tag = "Config",
        params(
            ("name" = String, Path, description = "Script name"),
            ("type" = Option<String>, Query, description = "Config type: server or client")
        ),
        request_body(content = Value, content_type = "application/json", description = "Config JSON to save"),
        responses(
            (status = 200, description = "Config saved", body = Value, content_type = "application/json"),
            (status = 400, description = "Invalid request or JSON body"),
            (status = 404, description = "Script not found"),
            (status = 500, description = "Internal server error")
        )
    )
)]
pub async fn save_config(Path(name): Path<String>, Query(query): Query<ConfigTypeQuery>, req: Request) -> Response {
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

    let fname = config_filename(&query.config_type);
    let config_dir = dir.join("config");
    let _ = std::fs::create_dir_all(&config_dir);
    let path = config_dir.join(fname);
    match std::fs::write(&path, &formatted) {
        Ok(_) => {
            log_success!("Configuration saved to {}", path.to_string_lossy());
            Json(serde_json::json!({"ok": true, "path": path.to_string_lossy()})).into_response()
        }
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response(),
    }
}
