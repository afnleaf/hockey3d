use std::env::var;

#[tokio::main]
async fn main() {
    let cfg = nhl_record_relay::Config {
        cache_dir: var("RELAY_CACHE_DIR").unwrap_or_else(|_| "cache".into()).into(),
        web_base: var("RELAY_WEB_BASE").unwrap_or_else(|_| "https://api-web.nhle.com".into()),
        stats_base: var("RELAY_STATS_BASE").unwrap_or_else(|_| "https://api.nhle.com".into()),
        assets_base: var("RELAY_ASSETS_BASE").unwrap_or_else(|_| "https://assets.nhle.com".into()),
        index: var("RELAY_INDEX").ok().map(Into::into),
        public: var("RELAY_PUBLIC").is_ok_and(|v| v == "1"),
        rate_burst: var("RELAY_RATE_BURST").ok().and_then(|v| v.parse().ok()).unwrap_or(120),
        rate_per_sec: var("RELAY_RATE_PER_SEC").ok().and_then(|v| v.parse().ok()).unwrap_or(2.0),
    };
    let bind = var("RELAY_BIND").unwrap_or_else(|_| "127.0.0.1:8790".into());
    let listener = tokio::net::TcpListener::bind(&bind).await.expect("bind");
    let app = nhl_record_relay::app(cfg).into_make_service_with_connect_info::<std::net::SocketAddr>();
    axum::serve(listener, app).await.expect("serve");
}
