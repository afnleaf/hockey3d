// NHL play-by-play and shiftcharts JSON -> plain objects for the visualizer.
// Event selection mirrors hokej/src/jsonparser.rs process_play.

const OT_SECONDS_REG_SEASON = 300;
const PERIOD_SECONDS = 1200;

// Rust `str::parse::<i32>` accepts an optional sign and ASCII digits only.
function parseI32OrZero(s) {
    return /^[+-]?[0-9]+$/.test(s) ? parseInt(s, 10) : 0;
}

export function mmssToSeconds(s) {
    const parts = String(s ?? "").split(":");
    if (parts.length !== 2) return 0;
    return parseI32OrZero(parts[0]) * 60 + parseI32OrZero(parts[1]);
}

export function secondsToMmss(total) {
    const t = Math.max(0, Math.round(total));
    const m = Math.floor(t / 60);
    const s = t % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

// Regular season OT is 5 minutes; playoff OT is a full period. The shootout
// has no clock, so it gets a zero-length slot at the end of the timeline.
function periodLength(type, gameType) {
    if (type === "SO") return 0;
    if (type === "OT" && gameType !== 3) return OT_SECONDS_REG_SEASON;
    return PERIOD_SECONDS;
}

// periods[] ordered by number: { number, type, start, length }
function buildPeriods(plays, gameType) {
    const byNumber = new Map();
    for (const p of plays) {
        const pd = p.periodDescriptor;
        if (pd && !byNumber.has(pd.number)) {
            byNumber.set(pd.number, pd.periodType || "REG");
        }
    }
    const numbers = [...byNumber.keys()].sort((a, b) => a - b);
    const periods = [];
    let start = 0;
    for (const number of numbers) {
        const type = byNumber.get(number);
        const length = periodLength(type, gameType);
        periods.push({ number, type, start, length });
        start += length;
    }
    return periods;
}

function hasCoords(play) {
    const d = play.details;
    if (d == null) return false;
    return !(d.xCoord == null && d.yCoord == null
        && ![505, 502, 503].includes(play.typeCode));
}

export function parseGame(pbp) {
    if (!pbp || !Array.isArray(pbp.plays)) {
        throw new Error("play-by-play JSON has no plays array");
    }
    const periods = buildPeriods(pbp.plays, pbp.gameType);
    const startOf = new Map(periods.map((p) => [p.number, p]));
    const plays = pbp.plays
        .filter((p) => p.periodDescriptor)
        .map((p) => {
            const period = startOf.get(p.periodDescriptor.number);
            const inPeriod = Math.min(mmssToSeconds(p.timeInPeriod),
                period.length || 0);
            const d = p.details || {};
            return {
                eventId: p.eventId,
                sortOrder: p.sortOrder ?? 0,
                typeCode: p.typeCode,
                type: p.typeDescKey,
                period: p.periodDescriptor.number,
                periodType: period.type,
                inPeriod,
                gameSeconds: period.start + inPeriod,
                x: d.xCoord ?? 0,
                y: d.yCoord ?? 0,
                playerId: d.shootingPlayerId ?? d.scoringPlayerId
                    ?? d.hittingPlayerId ?? d.blockingPlayerId
                    ?? d.playerId ?? 0,
                teamId: d.eventOwnerTeamId ?? 0,
                details: d,
                drawable: hasCoords(p),
                homeDefending: p.homeTeamDefendingSide ?? null,
            };
        });
    // sortOrder is the feed's own sequence; eventId is not ordered.
    plays.sort((a, b) => a.gameSeconds - b.gameSeconds
        || a.sortOrder - b.sortOrder);
    const roster = new Map((pbp.rosterSpots || []).map((r) => [r.playerId, {
        teamId: r.teamId,
        name: `${r.firstName?.default ?? ""} ${r.lastName?.default ?? ""}`.trim(),
        lastName: r.lastName?.default ?? "",
        number: r.sweaterNumber,
        position: r.positionCode,
    }]));
    const last = periods[periods.length - 1];
    return {
        id: pbp.id,
        gameType: pbp.gameType,
        gameState: pbp.gameState,
        away: pbp.awayTeam,
        home: pbp.homeTeam,
        periods,
        duration: last ? last.start + last.length : 0,
        plays,
        events: plays.filter((p) => p.drawable),
        roster,
    };
}

// Shift rows -> { teamId, playerId, name, start, end } in timeline seconds.
// Goal rows (typeCode 505) share the feed and carry no shift interval.
export function parseShifts(json, game) {
    const startOf = new Map(game.periods.map((p) => [p.number, p.start]));
    const rows = Array.isArray(json?.data) ? json.data : [];
    const shifts = [];
    for (const r of rows) {
        if (r.typeCode !== 517 || !startOf.has(r.period)) continue;
        const base = startOf.get(r.period);
        shifts.push({
            teamId: r.teamId,
            playerId: r.playerId,
            name: `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim(),
            start: base + mmssToSeconds(r.startTime),
            end: base + mmssToSeconds(r.endTime),
        });
    }
    return shifts;
}
