use axum::Json;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct ReleaseResponse {
    pub tag_name: String,
    pub name: String,
    pub body: String,
    pub html_url: String,
}

static RELEASE: std::sync::Mutex<Option<ReleaseResponse>> = std::sync::Mutex::new(None);

pub async fn fetch_and_cache() {
    let version = env!("CARGO_PKG_VERSION");
    let url = format!("https://api.github.com/repos/merzen-sh/trek-cli/releases/tags/v{version}");

    let Ok(client) = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
    else {
        return;
    };

    let res = client
        .get(&url)
        .header(reqwest::header::USER_AGENT, "trek-cli")
        .send()
        .await;

    if let Ok(r) = res {
        if r.status().is_success() {
            if let Ok(release) = r.json::<ReleaseResponse>().await {
                *RELEASE.lock().unwrap() = Some(release);
            }
        }
    }
}

pub async fn handler() -> Json<Option<ReleaseResponse>> {
    Json(RELEASE.lock().unwrap().clone())
}
