use axum::{
    Router,
    extract::{Path, State},
    http::{HeaderValue, Method, StatusCode, header},
    response::{IntoResponse, Response},
    routing::get,
};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    path::PathBuf,
    sync::{Arc, Mutex},
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tower_http::cors::CorsLayer;

// Live games change every few seconds; a short window keeps one upstream
// fetch per game regardless of viewer count.
const LIVE_TTL: u64 = 20;
// The NHL corrects final games (shot coordinates, scorers) for some days.
// so you check every 7 days after the game has been played
const FINAL_RECHECK: u64 = 6 * 3600;
const FREEZE_AFTER: u64 = 7 * 86400;

pub struct Config {
    pub cache_dir: PathBuf,
    pub allowed_origin: String,
    pub web_base: String,
    pub stats_base: String,
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
            let r = self.http.get(self.upstream(kind, id)).send().await.ok()?;
            if !r.status().is_success() {
                return None;
            }
            r.bytes().await.ok()
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
        Ok(body.to_vec())
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

pub fn app(cfg: Config) -> Router {
    std::fs::create_dir_all(&cfg.cache_dir).expect("cache dir");
    let origin: HeaderValue = cfg.allowed_origin.parse().expect("allowed origin");
    let relay = Arc::new(Relay {
        cfg,
        http: reqwest::Client::builder()
            .timeout(Duration::from_secs(15))
            .user_agent("nhl_record_relay")
            .build()
            .unwrap(),
        locks: Mutex::default(),
    });
    Router::new()
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
        .layer(CorsLayer::new().allow_origin(origin).allow_methods([Method::GET]))
        .with_state(relay)
}
