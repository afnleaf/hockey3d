use axum::{Router, routing::get};
use std::sync::{
    Arc,
    atomic::{AtomicUsize, Ordering},
};

const ORIGIN: &str = "https://hockey.example";

async fn spawn(router: Router) -> String {
    let l = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = l.local_addr().unwrap();
    tokio::spawn(async move { axum::serve(l, router).await.unwrap() });
    format!("http://{addr}")
}

fn client() -> reqwest::Client {
    let mut h = reqwest::header::HeaderMap::new();
    h.insert(nhl_record_relay::APP_HEADER, nhl_record_relay::APP_NAME.parse().unwrap());
    reqwest::Client::builder().default_headers(h).build().unwrap()
}

async fn fetch(url: String) -> reqwest::Result<reqwest::Response> {
    client().get(url).send().await
}

async fn setup(state: &'static str) -> (String, Arc<AtomicUsize>, tempfile::TempDir) {
    let hits = Arc::new(AtomicUsize::new(0));
    let h = hits.clone();
    let h2 = hits.clone();
    let h3 = hits.clone();
    let upstream = spawn(
        Router::new()
            .route(
                "/v1/gamecenter/{id}/play-by-play",
                get(move || {
                    h.fetch_add(1, Ordering::SeqCst);
                    async move { format!(r#"{{"gameState":"{state}","plays":[]}}"#) }
                }),
            )
            .route(
                "/v1/schedule/{date}",
                get(move |axum::extract::Path(d): axum::extract::Path<String>| {
                    h2.fetch_add(1, Ordering::SeqCst);
                    async move { format!(r#"{{"date":"{d}","gameWeek":[]}}"#) }
                }),
            )
            .route(
                "/logos/nhl/svg/{f}",
                get(move |axum::extract::Path(f): axum::extract::Path<String>| {
                    h3.fetch_add(1, Ordering::SeqCst);
                    async move {
                        let svg = "image/svg+xml";
                        match f.as_str() {
                            "HTM_dark.svg" => ([("content-type", "text/html")], "<svg/>".to_owned()),
                            "BIG_dark.svg" => ([("content-type", svg)], "x".repeat(600 * 1024)),
                            _ => ([("content-type", svg)], format!("<svg id=\"{f}\"/>")),
                        }
                    }
                }),
            ),
    )
    .await;
    let dir = tempfile::tempdir().unwrap();
    let relay = spawn(nhl_record_relay::app(nhl_record_relay::Config {
        cache_dir: dir.path().into(),
        allowed_origins: vec![ORIGIN.into(), "null".into()],
        web_base: upstream.clone(),
        stats_base: upstream.clone(),
        assets_base: upstream,
        index: Some(dir.path().join("index.html")),
    }))
    .await;
    (relay, hits, dir)
}

#[tokio::test]
async fn final_game_is_cached_and_cors_limited_to_origin() {
    let (relay, hits, _d) = setup("OFF").await;
    let c = client();
    let url = format!("{relay}/v1/gamecenter/2026020224/play-by-play");
    let r = c.get(&url).header("Origin", ORIGIN).send().await.unwrap();
    assert_eq!(r.status(), 200);
    assert_eq!(r.headers()["access-control-allow-origin"], ORIGIN);
    assert!(r.text().await.unwrap().contains("OFF"));
    let r = c.get(&url).header("Origin", "https://evil.example").send().await.unwrap();
    assert!(r.headers().get("access-control-allow-origin").is_none());
    assert_eq!(hits.load(Ordering::SeqCst), 1);
}

#[tokio::test]
async fn concurrent_requests_share_one_upstream_fetch() {
    let (relay, hits, _d) = setup("LIVE").await;
    let url = format!("{relay}/v1/gamecenter/2026020224/play-by-play");
    let reqs = (0..8).map(|_| fetch(url.clone()));
    for r in futures_join(reqs).await {
        assert_eq!(r.unwrap().status(), 200);
    }
    assert_eq!(hits.load(Ordering::SeqCst), 1);
}

async fn futures_join<F: std::future::Future + Send + 'static>(fs: impl Iterator<Item = F>) -> Vec<F::Output>
where
    F::Output: Send + 'static,
{
    let hs: Vec<_> = fs.map(tokio::spawn).collect();
    let mut out = Vec::new();
    for h in hs {
        out.push(h.await.unwrap());
    }
    out
}

#[tokio::test]
async fn rejects_bad_ids_and_unknown_paths() {
    let (relay, hits, _d) = setup("OFF").await;
    for p in [
        "/v1/gamecenter/12345/play-by-play",
        "/v1/gamecenter/2026x20224/play-by-play",
        "/v1/schedule/now",
    ] {
        assert_eq!(fetch(format!("{relay}{p}")).await.unwrap().status(), 404, "{p}");
    }
    assert_eq!(hits.load(Ordering::SeqCst), 0);
}

#[tokio::test]
async fn upstream_failure_without_cache_is_502() {
    let (relay, _h, _d) = setup("OFF").await;
    let r = fetch(format!("{relay}/v1/gamecenter/2026020224/boxscore")).await.unwrap();
    assert_eq!(r.status(), 502);
}

#[tokio::test]
async fn schedule_is_proxied_cached_and_cors_limited() {
    let (relay, hits, _d) = setup("OFF").await;
    let c = client();
    let url = format!("{relay}/v1/schedule/2026-10-31");
    for _ in 0..2 {
        let r = c.get(&url).header("Origin", ORIGIN).send().await.unwrap();
        assert_eq!(r.status(), 200);
        assert_eq!(r.headers()["access-control-allow-origin"], ORIGIN);
        assert!(r.text().await.unwrap().contains(r#""date":"2026-10-31""#));
    }
    assert_eq!(hits.load(Ordering::SeqCst), 1);
}

#[tokio::test]
async fn schedule_rejects_bad_dates() {
    let (relay, hits, _d) = setup("OFF").await;
    for d in [
        "2026-1-31", "2026-13-01", "2026-02-29", "2026-04-31", "2026-00-10",
        "2026-10-00", "20261031", "2026-10-31x", "2026/10/31", "..%2F..%2Fx", "+026-10-31",
    ] {
        let r = fetch(format!("{relay}/v1/schedule/{d}")).await.unwrap();
        assert_eq!(r.status(), 404, "{d}");
    }
    assert_eq!(fetch(format!("{relay}/v1/schedule/2028-02-29")).await.unwrap().status(), 200);
    assert_eq!(hits.load(Ordering::SeqCst), 1);
}

#[tokio::test]
async fn missing_or_wrong_app_header_is_403() {
    let (relay, hits, _d) = setup("OFF").await;
    let url = format!("{relay}/v1/gamecenter/2026020224/play-by-play");
    let c = reqwest::Client::new();
    assert_eq!(c.get(&url).header("Origin", "null").send().await.unwrap().status(), 403);
    let r = c.get(&url).header(nhl_record_relay::APP_HEADER, "other").send().await.unwrap();
    assert_eq!(r.status(), 403);
    assert_eq!(hits.load(Ordering::SeqCst), 0);
}

#[tokio::test]
async fn file_origin_preflight_and_get_are_allowed() {
    let (relay, _h, _d) = setup("OFF").await;
    let url = format!("{relay}/v1/gamecenter/2026020224/play-by-play");
    let r = reqwest::Client::new()
        .request(reqwest::Method::OPTIONS, &url)
        .header("Origin", "null")
        .header("Access-Control-Request-Method", "GET")
        .header("Access-Control-Request-Headers", nhl_record_relay::APP_HEADER)
        .send()
        .await
        .unwrap();
    assert!(r.status().is_success());
    assert_eq!(r.headers()["access-control-allow-origin"], "null");
    assert_eq!(r.headers()["access-control-max-age"], "86400");
    let r = client().get(&url).header("Origin", "null").send().await.unwrap();
    assert_eq!(r.status(), 200);
    assert_eq!(r.headers()["access-control-allow-origin"], "null");
}

#[tokio::test]
async fn index_is_served_without_app_header_and_reread_per_request() {
    let (relay, _hits, d) = setup("OFF").await;
    let page = d.path().join("index.html");
    assert_eq!(reqwest::get(format!("{relay}/")).await.unwrap().status(), 404);
    std::fs::write(&page, "<p>one</p>").unwrap();
    let r = reqwest::get(format!("{relay}/")).await.unwrap();
    assert_eq!(r.status(), 200);
    assert!(r.headers()["content-type"].to_str().unwrap().starts_with("text/html"));
    assert_eq!(r.text().await.unwrap(), "<p>one</p>");
    std::fs::write(&page, "<p>two</p>").unwrap();
    assert_eq!(reqwest::get(format!("{relay}/")).await.unwrap().text().await.unwrap(), "<p>two</p>");
    // The gate still covers the data routes.
    let r = reqwest::get(format!("{relay}/v1/gamecenter/2024020001/play-by-play")).await.unwrap();
    assert_eq!(r.status(), 403);
}

#[tokio::test]
async fn logo_is_ungated_cached_and_cors_enabled() {
    let (relay, hits, d) = setup("OFF").await;
    for name in ["TOR_dark.svg", "BOS_20082009-20222023_light.svg", "WSH_secondary_light.svg"] {
        let r = reqwest::Client::new()
            .get(format!("{relay}/logo/{name}"))
            .header("origin", "null")
            .send()
            .await
            .unwrap();
        assert_eq!(r.status(), 200, "{name}");
        assert_eq!(r.headers()["content-type"], "image/svg+xml");
        assert_eq!(r.headers()["content-security-policy"], "sandbox");
        assert_eq!(r.headers()["access-control-allow-origin"], "null");
        assert_eq!(r.text().await.unwrap(), format!("<svg id=\"{name}\"/>"));
    }
    let again = reqwest::get(format!("{relay}/logo/TOR_dark.svg")).await.unwrap();
    assert_eq!(again.status(), 200);
    assert_eq!(hits.load(Ordering::SeqCst), 3);
    assert!(d.path().join("logo_TOR_dark.svg").exists());
}

#[tokio::test]
async fn logo_rejects_bad_names_and_bad_upstream_bodies() {
    let (relay, hits, d) = setup("OFF").await;
    for name in ["tor_dark.svg", "TOR_dark.png", "TOR_blue.svg", "TORO_dark.svg",
        "TOR_2008-2022_dark.svg", "..%2Fsecret_dark.svg", "TOR_dark.svg%3Fx"]
    {
        let r = reqwest::get(format!("{relay}/logo/{name}")).await.unwrap();
        assert_eq!(r.status(), 404, "{name}");
    }
    assert_eq!(hits.load(Ordering::SeqCst), 0);
    for name in ["HTM_dark.svg", "BIG_dark.svg"] {
        let r = reqwest::get(format!("{relay}/logo/{name}")).await.unwrap();
        assert_eq!(r.status(), 502, "{name}");
        assert!(!d.path().join(format!("logo_{name}")).exists());
    }
}
