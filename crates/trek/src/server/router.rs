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
            crate::api::health_api::handler,
            crate::api::auth_api::handler,
            crate::api::check_pin_api::handler,
            crate::api::scripts_api::list,
            crate::api::scripts_api::get_by_name,
            crate::api::config_api::get_schema,
            crate::api::config_api::get_config,
            crate::api::config_api::save_config,
            crate::api::theme_api::get_theme_schema,
            crate::api::theme_api::get_theme,
            crate::api::theme_api::save_theme,
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
        .route("/api/health", get(crate::api::health_api::handler))
        .route("/api/auth", get(crate::api::auth_api::handler))
        .route("/api/check-pin", post(crate::api::check_pin_api::handler))
        .route("/api/scripts", get(crate::api::scripts_api::list))
        .route(
            "/api/scripts/:name",
            get(crate::api::scripts_api::get_by_name),
        )
        .route(
            "/api/scripts/:name/config-schema",
            get(crate::api::config_api::get_schema),
        )
        .route(
            "/api/scripts/:name/config",
            get(crate::api::config_api::get_config).post(crate::api::config_api::save_config),
        )
        .route(
            "/api/scripts/:name/theme-schema",
            get(crate::api::theme_api::get_theme_schema),
        )
        .route(
            "/api/scripts/:name/theme",
            get(crate::api::theme_api::get_theme).post(crate::api::theme_api::save_theme),
        )
        .route(
            "/external/api/*api_path",
            any(crate::api::proxy_api::handler),
        );

    #[cfg(feature = "swagger")]
    let router = router.merge(swagger::router());

    let router = router.fallback(crate::server::proxy::handler);

    router
}
