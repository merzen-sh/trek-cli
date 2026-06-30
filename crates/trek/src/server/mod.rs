mod check_pin;
mod config_api;
mod health;
mod proxy;
mod proxy_api;
mod router;
mod scripts_api;
mod theme_api;

#[cfg(all(not(feature = "swagger"), debug_assertions))]
use crate::log_warn;
use crate::{log_info, log_success};
use axum::extract::Request;
use axum::http::StatusCode;
use axum::middleware;
use axum::response::{IntoResponse, Response};
use std::net::SocketAddr;
use std::sync::LazyLock;
use std::sync::Mutex;
use tokio::net::TcpListener;

static AUTH_PIN: LazyLock<Mutex<String>> = LazyLock::new(|| {
    let ns = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let pin = format!("{:06}", ns % 1_000_000);
    Mutex::new(pin)
});

pub fn auth_pin() -> String {
    AUTH_PIN.lock().unwrap().clone()
}

async fn require_pin(req: Request, next: middleware::Next) -> Response {
    let path = req.uri().path().to_string();
    if !path.starts_with("/external/") {
        return next.run(req).await;
    }
    let pin = req
        .headers()
        .get("x-auth-pin")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    if pin != *AUTH_PIN.lock().unwrap() {
        return (StatusCode::UNAUTHORIZED, "invalid pin").into_response();
    }
    next.run(req).await
}

pub struct Server {
    port: u16,
}

pub fn base_url() -> String {
    crate::log::base_url()
}

const BANNER: &str = "
    ████████╗██████╗ ███████╗██╗  ██╗
    ╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
       ██║   ██████╔╝█████╗  █████╔╝ 
       ██║   ██╔══██╗██╔══╝  ██╔═██╗ 
       ██║   ██║  ██║███████╗██║  ██╗
       ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝";

impl Server {
    pub fn new(port: u16) -> Self {
        Self { port }
    }

    pub async fn run(self) -> anyhow::Result<()> {
        let pin = auth_pin();

        println!("{}\n", BANNER);


        let start = std::time::Instant::now();

        let host = if self.port == 80 {
            format!("http://localhost")
        } else {
            format!("http://localhost:{}", self.port)
        };
        log_info!("dashboard: {host}?pin={pin}");

        let app = router::create().layer(middleware::from_fn(require_pin));
        let addr = SocketAddr::from(([0, 0, 0, 0], self.port));
        let listener = TcpListener::bind(addr).await?;

        #[cfg(all(not(feature = "swagger"), debug_assertions))]
        log_warn!("!!! swagger disabled. Enable swagger feature for debug builds");

        log_info!("listening on {addr}");

        log_success!("ready in {}ms", start.elapsed().as_millis());

        #[cfg(not(debug_assertions))]
        tokio::spawn(async move {
            if let Err(err) = crate::update::check_for_updates().await {
                crate::log_debug!("update check failed: {err}");
            }
        });

        axum::serve(listener, app).await?;
        Ok(())
    }
}

pub fn run_server(port: u16) -> anyhow::Result<()> {
    let rt = tokio::runtime::Builder::new_current_thread()
        .enable_io()
        .enable_time()
        .build()?;
    rt.block_on(Server::new(port).run())?;
    Ok(())
}
