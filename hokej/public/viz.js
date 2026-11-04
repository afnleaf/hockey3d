// Ties a parsed game to the scene and HUD: the scrub time and filters
// decide which events show, the HUD state and the on-ice lists.
import { parseGame, parseShifts, secondsToMmss } from "./parse.js";
import { renderRink, renderCenterLogo, setBenchColors, setPenaltyBoxOccupants }
    from "./rink.js";
import { logoUrl } from "./relay.js";
import { loadEvents, applyVisibility, gameColors, pickEvent, setPinned }
    from "./events.js";
import { renderer } from "./scene.js";
import { setScoreboard, setGameState, legendSection } from "./hud.js";
import { initTimeline, setMarkers } from "./timeline.js";
import { initFilters, passesFilters, showVisibleCount, isShowAll }
    from "./filters.js";
import { iconElement } from "./icons.js";
import { initShifts, renderShifts } from "./shifts.js";

renderRink();

let game = null;
let time = 0;
let teams = [];
let penalties = [];

const TIMELINE_TYPES = new Set(["goal", "penalty", "stoppage",
    "period-start", "period-end", "game-end", "shootout-complete"]);

const RECENT_COUNT = 12;

function periodAt(t) {
    let current = game.periods[0];
    for (const p of game.periods) {
        if (p.start <= t) current = p;
    }
    return current;
}

function periodName(p) {
    if (p.type === "SO") return "Shootout";
    if (p.type === "OT") {
        const n = p.number - 3;
        return n > 1 ? `Overtime ${n}` : "Overtime";
    }
    return `Period ${p.number}`;
}

function periodShort(p) {
    if (p.type !== "REG") return p.type;
    return `${p.number}${["st", "nd", "rd"][p.number - 1] ?? "th"}`;
}

function isFinal() {
    return game.gameState === "OFF" || game.gameState === "FINAL";
}

// pp: "PP ABV m:ss" for the side with fewer players in the box, timed by
// the shorthanded side's soonest release.
function hudState(t, boxed) {
    let awayScore = 0;
    let homeScore = 0;
    let awaySog = 0;
    let homeSog = 0;
    let lastGoal = null;
    for (const p of game.plays) {
        if (p.gameSeconds > t) break;
        if (p.typeCode === 505) {
            awayScore = p.details.awayScore ?? awayScore;
            homeScore = p.details.homeScore ?? homeScore;
            lastGoal = p;
        }
        // shootout attempts are not shots on goal
        if ((p.typeCode === 505 || p.typeCode === 506)
            && p.periodType !== "SO") {
            if (p.teamId === game.away.id) awaySog++;
            else if (p.teamId === game.home.id) homeSog++;
        }
    }
    const ended = isFinal() && t >= game.duration;
    // shootout goal rows do not carry the one-goal shootout bonus
    if (ended) {
        awayScore = game.away.score ?? awayScore;
        homeScore = game.home.score ?? homeScore;
    }
    const p = periodAt(t);
    let period = periodShort(p);
    if (ended) period = p.type === "REG" ? "Final" : `Final (${p.type})`;
    const clock = p.type === "SO" ? ""
        : secondsToMmss(p.length - Math.min(p.length, t - p.start));
    const pp = ended ? null : powerPlay(boxed);
    return { period, clock, awayScore, homeScore, awaySog, homeSog,
        pp: pp ? `PP ${pp.clock}` : "",
        ppSide: pp ? teams.findIndex((tm) => tm.id === pp.teamId) : -1,
        lastGoal: lastGoal ? goalText(lastGoal) : "" };
}

// Misconducts box a player without shorting the team.
const SHORTING = new Set(["MIN", "MAJ", "BEN"]);

function powerPlay(boxed) {
    const [a, h] = teams.map((tm) => boxed.filter((b) => b.teamId === tm.id
        && SHORTING.has(b.kind)));
    if (a.length === h.length) return null;
    const [pp, pk] = a.length < h.length ? [teams[0], h] : [teams[1], a];
    return { teamId: pp.id, shortId: pk[0].teamId, clock: pk[0].clock };
}

function goalText(g) {
    const team = g.teamId === game.away.id ? game.away.abbrev
        : g.teamId === game.home.id ? game.home.abbrev : "";
    const who = game.roster.get(g.details.scoringPlayerId);
    const name = who ? `#${who.number} ${who.lastName}` : "";
    return `Last goal: ${team} ${name}, ${periodName(periodAt(g.gameSeconds))}`
        + ` ${secondsToMmss(g.inPeriod)}`;
}

function timeLabel(t) {
    const p = periodAt(t);
    const short = p.type === "REG" ? `P${p.number}` : p.type;
    return `${short} ${secondsToMmss(Math.min(p.length, t - p.start))}`;
}

function refreshEvents() {
    const n = applyVisibility(time, passesFilters, isShowAll());
    showVisibleCount(n, game.events.length);
    renderRecent(time);
}

// Covers every play, not only drawable ones, so stoppages and period
// marks also appear; the type/team filters still apply. Newest first.
function renderRecent(t) {
    const rows = [];
    for (let i = game.plays.length - 1; i >= 0
        && rows.length < RECENT_COUNT; i--) {
        const p = game.plays[i];
        if (p.gameSeconds > t || !passesFilters(p)) continue;
        const team = teamOf(p.teamId);
        const row = document.createElement("div");
        row.className = "row";
        const when = document.createElement("span");
        when.className = "hud-num";
        when.textContent = timeLabel(p.gameSeconds).split(" ")[1];
        when.title = timeLabel(p.gameSeconds);
        const sw = document.createElement(team?.logo ? "img" : "span");
        sw.className = "ev-logo";
        if (team?.logo) { sw.src = team.logo; sw.alt = team.abbrev; }
        const what = document.createElement("span");
        what.className = "what";
        const who = playerText(p.playerId);
        what.textContent = typeLabel(p) + (who ? ` \u00b7 ${who}` : "");
        row.title = [team?.abbrev, what.textContent].filter(Boolean).join(" ");
        row.append(when, sw, iconElement(p.type, "#fff", 14), what);
        rows.push(row);
    }
    if (!rows.length) {
        const none = document.createElement("div");
        none.className = "hud-dim";
        none.textContent = "No events yet.";
        rows.push(none);
    }
    legendSection.replaceChildren(...rows);
}

const DETAIL_PLAYERS = [
    ["scoringPlayerId", "Scorer"], ["assist1PlayerId", "Assist"],
    ["assist2PlayerId", "Assist"], ["shootingPlayerId", "Shooter"],
    ["blockingPlayerId", "Blocked by"], ["hittingPlayerId", "Hit by"],
    ["hitteePlayerId", "Hit"], ["winningPlayerId", "Won"],
    ["losingPlayerId", "Lost"], ["committedByPlayerId", "Penalty on"],
    ["drawnByPlayerId", "Drawn by"], ["servedByPlayerId", "Served by"],
    ["goalieInNetId", "Goalie"],
];

function playerText(id) {
    const p = game.roster.get(id);
    return p ? `${p.number} ${p.name}` : null;
}

function typeLabel(p) {
    const desc = p.type === "penalty" && p.details?.descKey;
    return desc ? `pen: ${desc.replace(/-/g, " ")}` : p.type.replace(/-/g, " ");
}

function eventRows(p, full) {
    const team = teamOf(p.teamId);
    const head = `${timeLabel(p.gameSeconds)}  ${team?.abbrev ?? ""} `
        + typeLabel(p);
    const rows = [];
    if (!full) {
        const who = playerText(p.playerId);
        return { head, rows: who ? [["", who]] : [] };
    }
    const d = p.details ?? {};
    for (const [key, label] of DETAIL_PLAYERS) {
        const who = d[key] != null && playerText(d[key]);
        if (who) rows.push([label, who]);
    }
    if (d.shotType) rows.push(["Shot", d.shotType]);
    if (d.descKey) rows.push(["Infraction", d.descKey.replace(/-/g, " ")]);
    if (d.duration) rows.push(["Minutes", String(d.duration)]);
    if (d.reason) rows.push(["Reason", d.reason.replace(/-/g, " ")]);
    if (p.typeCode === 505 && d.awayScore != null) {
        rows.push(["Score", `${teams[0].abbrev} ${d.awayScore}`
            + ` - ${teams[1].abbrev} ${d.homeScore}`]);
    }
    if (!rows.length) {
        const who = playerText(p.playerId);
        if (who) rows.push(["", who]);
    }
    return { head, rows };
}

const rinkTip = document.createElement("div");
rinkTip.style.cssText = "position:fixed;z-index:2000;pointer-events:none;"
    + "display:none;padding:6px 9px;border-radius:6px;"
    + "font:14px 'Atkinson Hyperlegible Next',sans-serif;"
    + "line-height:1.4;background:rgba(10,14,22,0.94);color:#fff;"
    + "box-shadow:0 4px 14px rgba(0,0,0,0.5);max-width:320px;"
    + "white-space:pre;border:2px solid transparent";
document.body.append(rinkTip);

let pinnedPlay = null;
let pinX = 0;
let pinY = 0;

function showRinkTip(p, x, y, full) {
    const { head, rows } = eventRows(p, full);
    const h = document.createElement("div");
    h.textContent = head;
    const grid = document.createElement("div");
    grid.style.cssText = "display:grid;grid-template-columns:auto auto;"
        + "column-gap:16px;margin-top:2px";
    for (const [label, value] of rows) {
        const l = document.createElement("span");
        l.style.opacity = "0.7";
        l.textContent = label;
        const v = document.createElement("span");
        v.style.textAlign = "right";
        v.textContent = value;
        grid.append(l, v);
    }
    rinkTip.replaceChildren(h, grid);
    rinkTip.style.borderColor = teamOf(p.teamId)?.color ?? "#666";
    rinkTip.style.display = "block";
    const r = rinkTip.getBoundingClientRect();
    rinkTip.style.left = Math.max(4, Math.min(innerWidth - r.width - 4,
        x + 14)) + "px";
    rinkTip.style.top = Math.max(4, Math.min(innerHeight - r.height - 4,
        y + 14)) + "px";
}

function setPin(p, x, y) {
    pinnedPlay = p;
    pinX = x;
    pinY = y;
    setPinned(p);
    if (p) showRinkTip(p, x, y, true);
    else rinkTip.style.display = "none";
    if (game) refreshEvents();
}

const canvas = renderer.domElement;
let hoverPending = null;
canvas.addEventListener("pointermove", (e) => {
    if (!game || e.buttons) return;
    if (!hoverPending) requestAnimationFrame(() => {
        const { x, y } = hoverPending;
        hoverPending = null;
        if (pinnedPlay) return;
        const p = pickEvent(x, y, canvas.getBoundingClientRect());
        canvas.style.cursor = p ? "pointer" : "";
        if (p) showRinkTip(p, x, y, false);
        else rinkTip.style.display = "none";
    });
    hoverPending = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener("pointerleave", () => {
    if (!pinnedPlay) rinkTip.style.display = "none";
});

// A drag moves the camera; only a near-still primary press counts as a click.
let downAt = null;
canvas.addEventListener("pointerdown", (e) => {
    if (!e.isPrimary || e.button !== 0 || e.ctrlKey) { downAt = null; return; }
    downAt = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener("pointerup", (e) => {
    if (!game || !downAt) return;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    downAt = null;
    if (moved > 4) return;
    const p = pickEvent(e.clientX, e.clientY, canvas.getBoundingClientRect());
    setPin(p && p !== pinnedPlay ? p : null, e.clientX, e.clientY);
});
addEventListener("keydown", (e) => {
    if (e.key === "Escape" && pinnedPlay) setPin(null);
});
addEventListener("resize", () => {
    if (pinnedPlay) showRinkTip(pinnedPlay, pinX, pinY, true);
});

function teamOf(id) {
    return teams.find((t) => t.id === id);
}

// A minor ends early on a goal by the other side; majors and misconducts
// run their full length.
function buildPenalties() {
    const goals = game.plays.filter((p) => p.typeCode === 505
        && p.periodType !== "SO");
    return game.plays.filter((p) => p.typeCode === 509 && p.details.duration)
        .map((p) => {
            const d = p.details;
            const teamId = game.roster.get(d.committedByPlayerId)?.teamId
                ?? p.teamId;
            const start = p.gameSeconds;
            let end = Math.min(start + d.duration * 60, game.duration);
            if (d.typeCode === "MIN") {
                const g = goals.find((g) => g.teamId !== teamId
                    && g.gameSeconds > start && g.gameSeconds < end);
                if (g) end = g.gameSeconds;
            }
            const playerId = d.committedByPlayerId ?? d.servedByPlayerId;
            return { start, end, teamId, playerId, kind: d.typeCode,
                desc: d.descKey ?? "penalty", minutes: d.duration };
        });
}

// Soonest release first.
function boxedAt(t) {
    return penalties.filter((p) => p.start <= t && t < p.end)
        .sort((a, b) => a.end - b.end)
        .map((p) => ({ teamId: p.teamId, playerId: p.playerId, kind: p.kind,
            clock: secondsToMmss(p.end - t),
            detail: `${p.desc.replace(/-/g, " ")} (${p.minutes})` }));
}

function timelineMarkers() {
    return game.plays.filter((p) => TIMELINE_TYPES.has(p.type)).map((p) => {
        const team = teamOf(p.teamId);
        const major = p.type === "goal" || p.type === "penalty";
        const side = p.teamId === game.away.id ? 0
            : p.teamId === game.home.id ? 1 : null;
        return { t: p.gameSeconds, type: p.type, major, side,
            color: team?.color ?? "#666",
            title: `${timeLabel(p.gameSeconds)} ${team?.abbrev ?? ""} `
                + typeLabel(p) };
    });
}

function onTime(t) {
    time = t;
    refreshEvents();
    const boxed = boxedAt(t);
    setGameState(hudState(t, boxed));
    const pp = powerPlay(boxed);
    const strength = new Map(pp ? [[pp.teamId, "PP"], [pp.shortId, "PK"]] : []);
    renderShifts(t, boxed, strength);
    setPenaltyBoxOccupants(boxed.map((b) => ({
        box: b.teamId === game.home.id ? 0 : 1,
        color: teamOf(b.teamId)?.color ?? "#888",
        number: game.roster.get(b.playerId)?.number })));
}

// shiftJson may be null when the shiftcharts request failed.
export function loadGame(pbp, shiftJson, shiftError) {
    game = parseGame(pbp);
    const colors = gameColors(game.away.id, game.home.id);
    teams = [game.away, game.home].map((t) => ({
        id: t.id,
        abbrev: t.abbrev,
        color: "#" + colors.get(t.id).toString(16).padStart(6, "0"),
        logo: logoUrl(t.darkLogo ?? t.logo),
    }));
    renderCenterLogo(logoUrl(game.home.logo));
    setBenchColors(teams[1].color, teams[0].color);
    penalties = buildPenalties();
    pinnedPlay = null;
    rinkTip.style.display = "none";
    loadEvents(game, colors);
    const date = pbp.gameDate ? new Date(pbp.gameDate + "T12:00:00Z")
        .toLocaleDateString([], { weekday: "short", month: "short",
            day: "numeric", timeZone: "UTC" }) : "";
    setScoreboard(teams, [date, pbp.venue?.default].filter(Boolean)
        .join(" \u00b7 "));
    initFilters(game.events, teams, refreshEvents);
    const shifts = shiftJson ? parseShifts(shiftJson, game) : [];
    const message = shiftError ? `Shift data unavailable: ${shiftError}`
        : shifts.length ? "" : "No shift data for this game.";
    initShifts(shifts, teams, game.roster, game.duration, message);
    initTimeline(game.duration, onTime);
    setMarkers(timelineMarkers(), game.periods);
}
