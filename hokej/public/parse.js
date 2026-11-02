// NHL play-by-play JSON -> CSV. Mirrors hokej/src/jsonparser.rs
// (process_play, EventData::to_csv_row, pbp_to_csv2) byte for byte.

const PBP_CSV_HEADER = "event_id,type_code,event_type,period,time_period_mmss,"
    + "time_period_seconds,time_game_seconds,x_coord,y_coord,player_id,team_id,"
    + "shot_type,shot_miss_reason,highlight_clip_url";

// Rust `str::parse::<i32>` accepts an optional sign and ASCII digits only.
function parseI32OrZero(s) {
    return /^[+-]?[0-9]+$/.test(s) ? parseInt(s, 10) : 0;
}

function calculateTimeValues(period, timeStr) {
    const parts = timeStr.split(":");
    let min = 0;
    let sec = 0;
    if (parts.length === 2) {
        min = parseI32OrZero(parts[0]);
        sec = parseI32OrZero(parts[1]);
    }
    const periodSeconds = 1200 - (min * 60 + sec);
    const offsets = { 1: 0, 2: 1200, 3: 2400, 4: 3600 };
    const gameSeconds = (offsets[period] ?? 0) + periodSeconds;
    return [gameSeconds, periodSeconds];
}

function processPlay(play) {
    const d = play.details;
    if (d == null) return null;
    if (d.xCoord == null && d.yCoord == null
        && ![505, 502, 503].includes(play.typeCode)) {
        return null;
    }
    const period = play.periodDescriptor.number;
    const [gameSeconds, periodSeconds] =
        calculateTimeValues(period, play.timeRemaining);
    return {
        gameSeconds,
        row: [
            play.eventId,
            play.typeCode,
            play.typeDescKey,
            period,
            play.timeRemaining,
            periodSeconds,
            gameSeconds,
            d.xCoord ?? 0,
            d.yCoord ?? 0,
            d.shootingPlayerId ?? d.scoringPlayerId ?? d.hittingPlayerId
                ?? d.blockingPlayerId ?? d.playerId ?? 0,
            d.eventOwnerTeamId ?? 0,
            d.shotType ?? "",
            d.reason ?? "",
            play.typeCode === 505 ? (d.highlightClipSharingUrl ?? "") : "",
        ].join(","),
    };
}

function pbpToCsv(pbp) {
    if (!pbp || !Array.isArray(pbp.plays)) {
        throw new Error("play-by-play JSON has no plays array");
    }
    // Array.prototype.sort is stable, matching Rust's sort_by.
    const events = pbp.plays.map(processPlay).filter((e) => e !== null);
    events.sort((a, b) => a.gameSeconds - b.gameSeconds);
    let out = PBP_CSV_HEADER + "\n";
    for (const e of events) out += e.row + "\n";
    return out;
}

if (typeof module !== "undefined") module.exports = { pbpToCsv };
