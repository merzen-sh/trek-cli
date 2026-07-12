mod ip_filter;
mod proxy;
mod router;

pub use crate::api::auth_api::{auth_pin, require_pin};

#[cfg(not(debug_assertions))]
use crate::update;
use crate::{banner, browser::open_browser};
use axum::middleware;
use std::net::SocketAddr;
use tokio::net::TcpListener;
#[cfg(all(not(feature = "swagger"), debug_assertions))]
use trek_log::log_warn;
#[cfg(not(debug_assertions))]
use trek_log::log_warn;
use trek_log::{log_info, log_success};

pub struct Server {
    port: u16,
    browser: bool,
}

pub fn base_url() -> String {
    let url = "http://localhost:3000";
    std::env::var("BASE_URL").unwrap_or_else(|_| url.to_string())
}

impl Server {
    pub fn new(port: u16, browser: bool) -> Self {
        Self { port, browser }
    }

    pub async fn run(self) -> anyhow::Result<()> {
        let start = std::time::Instant::now();

        let app = router::create()
            .layer(middleware::from_fn(require_pin))
            .layer(middleware::from_fn(ip_filter::require_allowed_ip));
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

        if self.browser {
            let _ = open_browser(&url);
        }

        crate::api::release_api::fetch_and_cache().await;

        #[cfg(not(debug_assertions))]
        tokio::spawn(async move {
            if let Err(_err) = update::check_for_updates().await {
                log_warn!("update check failed: {_err}");
            }
        });

        axum::serve(
            listener,
            app.into_make_service_with_connect_info::<SocketAddr>(),
        )
        .await?;
        Ok(())
    }
}

pub fn run_server(port: u16, browser: bool) -> anyhow::Result<()> {
    let rt = tokio::runtime::Builder::new_current_thread()
        .enable_io()
        .enable_time()
        .build()?;
    rt.block_on(Server::new(port, browser).run())?;
    Ok(())
}
