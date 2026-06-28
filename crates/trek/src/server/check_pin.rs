use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct CheckPinPayload {
    pin: String,
}

pub async fn handler(Json(payload): Json<CheckPinPayload>) -> impl IntoResponse {
    if payload.pin == crate::server::auth_pin() {
        (StatusCode::OK, "ok")
    } else {
        (StatusCode::UNAUTHORIZED, "invalid pin")
    }
}
