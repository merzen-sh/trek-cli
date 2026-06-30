use axum::Json;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use serde::Deserialize;
use serde_json::json;

#[allow(unused_imports)]
use serde_json::Value;

#[cfg_attr(feature = "swagger", derive(utoipa::ToSchema))]
#[derive(Deserialize)]
pub struct CheckPinPayload {
    pin: String,
}

#[cfg_attr(
    feature = "swagger",
    utoipa::path(
        post,
        path = "/api/check-pin",
        tag = "Authentication",
        operation_id = "check_pin",
        request_body(content = CheckPinPayload, content_type = "application/json"),
        responses(
            (status = 200, description = "Pin is valid", body = Value, content_type = "application/json"),
            (status = 401, description = "Invalid pin", body = Value, content_type = "application/json")
        )
    )
)]
pub async fn handler(Json(payload): Json<CheckPinPayload>) -> impl IntoResponse {
    if payload.pin == crate::server::auth_pin() {
        (StatusCode::OK, Json(json!({ "status": "ok" })))
    } else {
        (StatusCode::UNAUTHORIZED, Json(json!({ "error": "invalid pin" })))
    }
}
