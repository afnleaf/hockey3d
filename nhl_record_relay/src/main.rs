use std::env::var;

#[tokio::main]
async fn main() {
    let cfg = nhl_record_relay::Config {
        cache_dir: var("RELAY_CACHE_DIR").unwrap_or_else(|_| "cache".into()).into(),
        allowed_origins: var("RELAY_ALLOWED_ORIGINS")
            .expect("RELAY_ALLOWED_ORIGINS unset")
            .split(',')
            .map(|o| o.trim().to_owned())
            .collect(),
        web_base: var("RELAY_WEB_BASE").unwrap_or_else(|_| "https://api-web.nhle.com".into()),
        stats_base: var("RELAY_STATS_BASE").unwrap_or_else(|_| "https://api.nhle.com".into()),
        assets_base: var("RELAY_ASSETS_BASE").unwrap_or_else(|_| "https://assets.nhle.com".into()),
        index: var("RELAY_INDEX").ok().map(Into::into),
    };
    let bind = var("RELAY_BIND").unwrap_or_else(|_| "127.0.0.1:8790".into());
    let listener = tokio::net::TcpListener::bind(&bind).await.expect("bind");
    axum::serve(listener, nhl_record_relay::app(cfg)).await.expect("serve");
}
