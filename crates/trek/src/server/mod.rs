mod proxy;
mod router;

pub use crate::api::auth_api::{auth_pin, require_pin};

#[cfg(all(not(feature = "swagger"), debug_assertions))]
use crate::log_warn;
use crate::{log_info, log_success};
use axum::middleware;
use std::net::SocketAddr;
use tokio::net::TcpListener;

pub struct Server {
    port: u16,
}

pub fn base_url() -> String {
    crate::log::base_url()
}

impl Server {
    pub fn new(port: u16) -> Self {
        Self { port }
    }

    pub async fn run(self) -> anyhow::Result<()> {
        let pin = auth_pin();

        crate::banner::print_banner();

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
