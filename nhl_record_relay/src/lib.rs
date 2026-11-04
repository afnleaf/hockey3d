use axum::{
    Router,
    extract::{Path, State},
    extract::Request,
    http::{HeaderName, Method, StatusCode, header},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::get,
};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    net::{IpAddr, SocketAddr},
    path::PathBuf,
    sync::{Arc, Mutex},
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use tokio::sync::Semaphore;
use tower_http::cors::CorsLayer;

// Live games change every few seconds; a short window keeps one upstream
// fetch per game regardless of viewer count.
const LIVE_TTL: u64 = 20;
// The NHL corrects final games (shot coordinates, scorers) for some days.
// so you check every 7 days after the game has been played
const FINAL_RECHECK: u64 = 6 * 3600;
const FREEZE_AFTER: u64 = 7 * 86400;

// A file:// page sends `Origin: null`, which any page can also send, so the
// app header is what separates hokej from other sites' scripts. It does not
// stop non-browser clients.
pub const APP_HEADER: &str = "x-histos-app";
pub const APP_NAME: &str = "hokej";

// Largest real record (shift charts) is about 1 MB; the cap bounds memory and
// disk if upstream misbehaves.
const BODY_MAX: usize = 8 * 1024 * 1024;
// NHL API politeness and a ceiling on open sockets from one relay.
const UPSTREAM_PARALLEL: usize = 8;
const INFLIGHT_MAX: usize = 64;
// Pruned past this size so spoofed client IPs cannot grow the table unbounded.
const BUCKETS_MAX: usize = 10_000;

pub struct Config {
    pub cache_dir: PathBuf,
    pub web_base: String,
    pub stats_base: String,
    pub assets_base: String,
    pub index: Option<PathBuf>,
    /// Behind a public tunnel: no page at `/`.
    pub public: bool,
    pub rate_burst: u32,
    pub rate_per_sec: f64,
}

#[derive(Clone, Copy)]
enum Kind {
    PlayByPlay,
    Boxscore,
    Shifts,
    Schedule,
}

impl Kind {
    fn name(self) -> &'static str {
        match self {
            Kind::PlayByPlay => "pbp",
            Kind::Boxscore => "box",
            Kind::Shifts => "shifts",
            Kind::Schedule => "sched",
        }
    }
}

#[derive(Serialize, Deserialize, Default, Clone, Copy)]
struct Meta {
    fetched_at: u64,
    final_since: Option<u64>,
}

struct Relay {
    cfg: Config,
    http: reqwest::Client,
    locks: Mutex<HashMap<String, Arc<tokio::sync::Mutex<()>>>>,
    upstream_slots: Semaphore,
    inflight: Semaphore,
    buckets: Mutex<HashMap<IpAddr, (f64, Instant)>>,
}

fn now() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs()
}

fn valid_id(id: &str) -> bool {
    id.len() == 10 && id.bytes().all(|b| b.is_ascii_digit()) && id >= "2009020000"
}

fn valid_date(d: &str) -> bool {
    let b = d.as_bytes();
    if b.len() != 10 || b[4] != b'-' || b[7] != b'-' {
        return false;
    }
    let num = |r: std::ops::Range<usize>| -> Option<u32> {
        b[r.clone()].iter().all(u8::is_ascii_digit).then(|| d[r].parse().ok())?
    };
    let (Some(y), Some(m), Some(day)) = (num(0..4), num(5..7), num(8..10)) else {
        return false;
    };
    if y < 2009 || (y == 2009 && m < 10) {
        return false;
    }
    let leap = y % 4 == 0 && (y % 100 != 0 || y % 400 == 0);
    let max = match m {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 if leap => 29,
        2 => 28,
        _ => return false,
    };
    (1..=max).contains(&day)
}

fn is_final(body: &[u8]) -> bool {
    serde_json::from_slice::<serde_json::Value>(body)
        .ok()
        .and_then(|v| v.get("gameState")?.as_str().map(|s| s == "OFF" || s == "FINAL"))
        .unwrap_or(false)
}

fn fresh(meta: &Meta, t: u64) -> bool {
    match meta.final_since {
        Some(f) if t.saturating_sub(f) >= FREEZE_AFTER => true,
        Some(_) => t.saturating_sub(meta.fetched_at) < FINAL_RECHECK,
        None => t.saturating_sub(meta.fetched_at) < LIVE_TTL,
    }
}

impl Relay {
    fn paths(&self, kind: Kind, id: &str) -> (PathBuf, PathBuf) {
        let base = self.cfg.cache_dir.join(format!("{}_{id}", kind.name()));
        (base.with_extension("json"), base.with_extension("meta"))
    }

    async fn read_meta(&self, kind: Kind, id: &str) -> Option<Meta> {
        let raw = tokio::fs::read(self.paths(kind, id).1).await.ok()?;
        serde_json::from_slice(&raw).ok()
    }

    fn upstream(&self, kind: Kind, id: &str) -> String {
        let (w, s) = (&self.cfg.web_base, &self.cfg.stats_base);
        match kind {
            Kind::PlayByPlay => format!("{w}/v1/gamecenter/{id}/play-by-play"),
            Kind::Boxscore => format!("{w}/v1/gamecenter/{id}/boxscore"),
            Kind::Shifts => format!("{s}/stats/rest/en/shiftcharts?cayenneExp=gameId={id}"),
            Kind::Schedule => format!("{w}/v1/schedule/{id}"),
        }
    }

    async fn get(&self, kind: Kind, id: &str) -> Result<Vec<u8>, StatusCode> {
        let key = format!("{}_{id}", kind.name());
        let lock = self.locks.lock().unwrap().entry(key).or_default().clone();
        let _guard = lock.lock().await;

        let (body_path, meta_path) = self.paths(kind, id);
        let meta = self.read_meta(kind, id).await;
        // Shift charts carry no game state; they follow the play-by-play record.
        let state_meta = match kind {
            Kind::Shifts => self.read_meta(Kind::PlayByPlay, id).await.map(|m| Meta {
                fetched_at: meta.map_or(0, |s| s.fetched_at),
                final_since: m.final_since,
            }),
            _ => meta,
        };
        let t = now();
        if let (Some(m), Ok(body)) = (state_meta.or(meta), tokio::fs::read(&body_path).await) {
            if meta.is_some() && fresh(&m, t) {
                return Ok(body);
            }
        }

        let fetched = async {
            let _slot = self.upstream_slots.acquire().await.ok()?;
            let mut r = self.http.get(self.upstream(kind, id)).send().await.ok()?;
            if !r.status().is_success() || r.content_length().is_some_and(|n| n as usize > BODY_MAX) {
                return None;
            }
            let mut body = Vec::new();
            while let Some(chunk) = r.chunk().await.ok()? {
                if body.len() + chunk.len() > BODY_MAX {
                    return None;
                }
                body.extend_from_slice(&chunk);
            }
            Some(body)
        }
        .await;

        let Some(body) = fetched else {
            return tokio::fs::read(&body_path).await.map_err(|_| StatusCode::BAD_GATEWAY);
        };
        let final_since = match kind {
            Kind::Shifts => state_meta.and_then(|m| m.final_since),
            // Schedules list several games, so they always use the live TTL.
            Kind::Schedule => None,
            _ if is_final(&body) => Some(meta.and_then(|m| m.final_since).unwrap_or(t)),
            _ => None,
        };
        let new_meta = Meta { fetched_at: t, final_since };
        let tmp = body_path.with_extension("tmp");
        if tokio::fs::write(&tmp, &body).await.is_ok()
            && tokio::fs::rename(&tmp, &body_path).await.is_ok()
        {
            let _ = tokio::fs::write(&meta_path, serde_json::to_vec(&new_meta).unwrap()).await;
        }
        Ok(body)
    }
}

async fn serve(relay: Arc<Relay>, kind: Kind, id: String) -> Response {
    let ok = match kind {
        Kind::Schedule => valid_date(&id),
        _ => valid_id(&id),
    };
    if !ok {
        return StatusCode::NOT_FOUND.into_response();
    }
    match relay.get(kind, &id).await {
        Ok(body) => ([(header::CONTENT_TYPE, "application/json")], body).into_response(),
        Err(code) => code.into_response(),
    }
}

async fn require_app(req: Request, next: Next) -> Response {
    if req.headers().get(APP_HEADER).is_some_and(|v| v == APP_NAME) {
        next.run(req).await
    } else {
        StatusCode::FORBIDDEN.into_response()
    }
}

// cloudflared connects from loopback, so only then is its client-IP header
// trusted; a direct remote peer is keyed by its socket address.
fn client_ip(req: &Request) -> IpAddr {
    let peer = req.extensions().get::<axum::extract::ConnectInfo<SocketAddr>>().map(|c| c.0.ip());
    match peer {
        Some(ip) if !ip.is_loopback() => ip,
        _ => req
            .headers()
            .get("cf-connecting-ip")
            .and_then(|v| v.to_str().ok()?.parse().ok())
            .unwrap_or(IpAddr::from([127, 0, 0, 1])),
    }
}

impl Relay {
    fn take_token(&self, ip: IpAddr) -> bool {
        let (burst, rate) = (self.cfg.rate_burst as f64, self.cfg.rate_per_sec);
        let t = Instant::now();
        let mut b = self.buckets.lock().unwrap();
        if b.len() >= BUCKETS_MAX {
            b.retain(|_, (tokens, at)| *tokens + t.duration_since(*at).as_secs_f64() * rate < burst);
        }
        let (tokens, at) = b.entry(ip).or_insert((burst, t));
        *tokens = (*tokens + t.duration_since(*at).as_secs_f64() * rate).min(burst);
        *at = t;
        if *tokens < 1.0 {
            return false;
        }
        *tokens -= 1.0;
        true
    }
}

async fn guard(State(r): State<Arc<Relay>>, req: Request, next: Next) -> Response {
    let Ok(_slot) = r.inflight.try_acquire() else {
        return StatusCode::SERVICE_UNAVAILABLE.into_response();
    };
    if !r.take_token(client_ip(&req)) {
        return StatusCode::TOO_MANY_REQUESTS.into_response();
    }
    next.run(req).await
}

// Read per request so a repack shows up without a relay restart.
async fn index(State(r): State<Arc<Relay>>) -> Response {
    let Some(path) = &r.cfg.index else {
        return StatusCode::NOT_FOUND.into_response();
    };
    match tokio::fs::read(path).await {
        Ok(body) => ([(header::CONTENT_TYPE, "text/html; charset=utf-8"), (header::CACHE_CONTROL, "no-store")], body).into_response(),
        Err(_) => StatusCode::NOT_FOUND.into_response(),
    }
}

// Bounds what an upstream mistake or hijack can push into the cache.
const LOGO_MAX: usize = 512 * 1024;

// NHL names: TOR_dark.svg, BOS_20082009-20222023_light.svg,
// WSH_secondary_light.svg. Anything else never reaches upstream or disk.
fn valid_logo(f: &str) -> bool {
    let Some(stem) = f.strip_suffix(".svg") else { return false };
    let Some(rest) = stem.strip_suffix("_dark").or_else(|| stem.strip_suffix("_light")) else {
        return false;
    };
    let b = rest.as_bytes();
    if b.len() < 3 || !b[..3].iter().all(u8::is_ascii_uppercase) {
        return false;
    }
    match &rest[3..] {
        "" | "_secondary" => true,
        s => {
            let s = s.as_bytes();
            s.len() == 18
                && s[0] == b'_'
                && s[9] == b'-'
                && s[1..9].iter().chain(&s[10..]).all(u8::is_ascii_digit)
        }
    }
}

// Logo files are versioned by name, so a cached copy never goes stale.
// Outside the app-header gate: <img> and texture loads cannot send headers.
async fn logo(State(r): State<Arc<Relay>>, Path(file): Path<String>) -> Response {
    if !valid_logo(&file) {
        return StatusCode::NOT_FOUND.into_response();
    }
    let lock = r.locks.lock().unwrap().entry(format!("logo_{file}")).or_default().clone();
    let _guard = lock.lock().await;
    let path = r.cfg.cache_dir.join(format!("logo_{file}"));
    let body = match tokio::fs::read(&path).await {
        Ok(b) => b,
        Err(_) => {
            let fetched = async {
                let url = format!("{}/logos/nhl/svg/{file}", r.cfg.assets_base);
                let resp = r.http.get(url).send().await.ok()?;
                let svg = resp.status().is_success()
                    && resp
                        .headers()
                        .get(header::CONTENT_TYPE)
                        .and_then(|v| v.to_str().ok())
                        .is_some_and(|v| v.starts_with("image/svg+xml"));
                if !svg || resp.content_length().is_some_and(|n| n as usize > LOGO_MAX) {
                    return None;
                }
                let b = resp.bytes().await.ok()?;
                (b.len() <= LOGO_MAX).then(|| b.to_vec())
            }
            .await;
            let Some(b) = fetched else {
                return StatusCode::BAD_GATEWAY.into_response();
            };
            let tmp = path.with_extension("tmp");
            if tokio::fs::write(&tmp, &b).await.is_ok() {
                let _ = tokio::fs::rename(&tmp, &path).await;
            }
            b
        }
    };
    (
        [
            (header::CONTENT_TYPE, "image/svg+xml"),
            // Opened directly, the SVG cannot run script against the relay origin.
            (header::CONTENT_SECURITY_POLICY, "sandbox"),
            (header::X_CONTENT_TYPE_OPTIONS, "nosniff"),
            (header::CACHE_CONTROL, "public, max-age=604800, immutable"),
        ],
        body,
    )
        .into_response()
}

pub fn app(cfg: Config) -> Router {
    std::fs::create_dir_all(&cfg.cache_dir).expect("cache dir");
    let cors = CorsLayer::new()
        .allow_origin(tower_http::cors::Any)
        .allow_methods([Method::GET])
        .allow_headers([HeaderName::from_static(APP_HEADER)])
        .max_age(Duration::from_secs(86400));
    let public = cfg.public;
    let relay = Arc::new(Relay {
        cfg,
        http: reqwest::Client::builder()
            .timeout(Duration::from_secs(15))
            .user_agent("nhl_record_relay")
            .build()
            .unwrap(),
        locks: Mutex::default(),
        upstream_slots: Semaphore::new(UPSTREAM_PARALLEL),
        inflight: Semaphore::new(INFLIGHT_MAX),
        buckets: Mutex::default(),
    });
    let router = Router::new()
        .route(
            "/v1/gamecenter/{id}/play-by-play",
            get(|State(r): State<Arc<Relay>>, Path(id): Path<String>| serve(r, Kind::PlayByPlay, id)),
        )
        .route(
            "/v1/gamecenter/{id}/boxscore",
            get(|State(r): State<Arc<Relay>>, Path(id): Path<String>| serve(r, Kind::Boxscore, id)),
        )
        .route(
            "/v1/shiftcharts/{id}",
            get(|State(r): State<Arc<Relay>>, Path(id): Path<String>| serve(r, Kind::Shifts, id)),
        )
        .route(
            "/v1/schedule/{date}",
            get(|State(r): State<Arc<Relay>>, Path(d): Path<String>| serve(r, Kind::Schedule, d)),
        )
        .route_layer(middleware::from_fn(require_app))
        .route("/logo/{file}", get(logo))
        // Outermost, so preflights are answered before the app header check,
        // and logos get CORS headers for untainted WebGL textures.
        .layer(cors);
    // Added after the gate: a browser navigation cannot send the app header.
    let router = if public { router } else { router.route("/", get(index)) };
    router
        .layer(middleware::from_fn_with_state(relay.clone(), guard))
        .with_state(relay)
}
