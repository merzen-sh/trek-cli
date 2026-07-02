mod proxy;
mod router;

pub use crate::api::auth_api::{auth_pin, require_pin};

#[cfg(all(not(feature = "swagger"), debug_assertions))]
use crate::log_warn;
use crate::{banner, browser::open_browser, log_debug, log_info, log_success, update};
use axum::middleware;
use std::net::SocketAddr;
use tokio::net::TcpListener;

pub struct Server {
    port: u16,
}

pub fn base_url() -> String {
    let url = "http://localhost:3000";
    std::env::var("BASE_URL").unwrap_or_else(|_| url.to_string())
}

impl Server {
    pub fn new(port: u16) -> Self {
        Self { port }
    }

    pub async fn run(self) -> anyhow::Result<()> {
        let start = std::time::Instant::now();

        let app = router::create().layer(middleware::from_fn(require_pin));
        let addr = SocketAddr::from(([0, 0, 0, 0], self.port));
        let listener = TcpListener::bind(addr).await?;

        let pin = auth_pin();

        banner::print_banner();

        let host = format!("http://localhost:{}", self.port);
        let url = format!("{}?pin={}", host, pin);

        log_info!("dashboard: {}", url);

        #[cfg(all(not(feature = "swagger"), debug_assertions))]
        log_warn!("!!! swagger disabled. Enable swagger feature for debug builds");

        log_info!("listening on {addr}");

        log_success!(
            "ready in {:.2}ms",
            start.elapsed().as_nanos() as f64 / 1_000_000.0
        );

        let _ = open_browser(&url);

        #[cfg(not(debug_assertions))]
        tokio::spawn(async move {
            if let Err(_err) = update::check_for_updates().await {
                log_debug!("update check failed: {_err}");
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
