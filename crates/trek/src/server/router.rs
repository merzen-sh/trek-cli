use axum::Router;
use axum::routing::{any, get, post};

#[cfg(feature = "swagger")]
mod swagger {
    use axum::Router;
    use utoipa::OpenApi;
    use utoipa_swagger_ui::SwaggerUi;

    #[derive(OpenApi)]
    #[openapi(
        info(
            title = "trek API",
            version = "0.1.0",
            description = "Trek API Documentation"
        ),
        paths(
            crate::server::health::handler,
            crate::server::auth_api::handler,
            crate::server::check_pin::handler,
            crate::server::scripts_api::list,
            crate::server::scripts_api::get_by_name,
            crate::server::config_api::get_schema,
            crate::server::config_api::get_config,
            crate::server::config_api::save_config,
            crate::server::theme_api::get_theme_schema,
            crate::server::theme_api::get_theme,
            crate::server::theme_api::save_theme,
        )
    )]
    struct ApiDoc;

    pub fn router() -> Router {
        Router::new()
            .merge(SwaggerUi::new("/swagger-ui").url("/api/openapi.json", ApiDoc::openapi()))
    }
}

pub fn create() -> Router {
    let router = Router::new()
        .route("/api/health", get(crate::server::health::handler))
        .route("/api/auth", get(crate::server::auth_api::handler))
        .route("/api/check-pin", post(crate::server::check_pin::handler))
        .route(
            "/api/scripts",
            get(crate::server::scripts_api::list),
        )
        .route(
            "/api/scripts/:name",
            get(crate::server::scripts_api::get_by_name),
        )
        .route(
            "/api/scripts/:name/config-schema",
            get(crate::server::config_api::get_schema),
        )
        .route(
            "/api/scripts/:name/config",
            get(crate::server::config_api::get_config).post(crate::server::config_api::save_config),
        )
        .route(
            "/api/scripts/:name/theme-schema",
            get(crate::server::theme_api::get_theme_schema),
        )
        .route(
            "/api/scripts/:name/theme",
            get(crate::server::theme_api::get_theme).post(crate::server::theme_api::save_theme),
        )
        .route(
            "/external/api/*api_path",
            any(crate::server::proxy_api::handler),
        );

    #[cfg(feature = "swagger")]
    let router = router.merge(swagger::router());

    let router = router.fallback(crate::server::proxy::handler);

    router
}
