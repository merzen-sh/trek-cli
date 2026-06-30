use axum::Json;
use axum::response::IntoResponse;
use serde_json::json;

#[allow(unused_imports)]
use serde_json::Value;

#[cfg_attr(
    feature = "swagger",
    utoipa::path(
        get,
        path = "/api/health",
        tag = "General",
        operation_id = "health",
        responses(
            (status = 200, description = "Health check OK", body = Value, content_type = "application/json")
        )
    )
)]
pub async fn handler() -> impl IntoResponse {
    Json(json!({ "status": "ok" }))
}
