// On-ice players per team at the scrub time, from shiftcharts. Desktop
// shows a table; a phone shows a one-line strip per team that taps open
// into the same table.
import { shiftsSection as panel } from "./hud.js";
import { secondsToMmss } from "./parse.js";

const POSITION_ORDER = { G: 0, D: 1, C: 2, R: 3, L: 4 };
const style = document.createElement("style");
style.textContent = `
  #shifts table { border-collapse: collapse; width: 100%; table-layout: fixed; }
  #shifts td:nth-child(2) { width: 9ch; }
  #shifts td:nth-child(3) { width: 6ch; }
  #shifts td:first-child { overflow: hidden; text-overflow: ellipsis; }
  #shifts td { padding: 1px 4px; white-space: nowrap;
    font-variant-numeric: tabular-nums; }
  #shifts td.n { text-align: right; }
  #shifts tr.on td, #shifts tr.box td { font-weight: 700; }
  #shifts tr.on td:first-child::before, #shifts tr.box td:first-child::before {
    content: "\\25CF"; font-size: 9px; margin-right: 3px; color: #7f7; }
  #shifts tr.box td:first-child::before { visibility: hidden; }
  #shifts tr.box td { color: #fc6; }
  #shifts tr.hd td { font-size: 10px; font-weight: 600; color: var(--hud-dim);
    padding-top: 6px; text-transform: uppercase; }
  #shifts tr.hd td:first-child { color: var(--hud-fg); }
  #shifts .sh-strip > div { display: flex; gap: 5px; align-items: baseline;
    white-space: nowrap; overflow: hidden; }
  #shifts .sh-strip > div + div { margin-top: 3px; }
  #shifts .sh-strip .clk { margin-left: auto; }
  #shifts .sh-strip .first::after { content: " \\25B4"; }
  #shifts.open .sh-strip .first::after { content: " \\25BE"; }
`;
document.head.appendChild(style);

let state = { shifts: [], teams: [], roster: new Map(), duration: 0,
    message: "" };

panel.addEventListener("click", (e) => {
    if (e.target.closest(".sh-strip")) panel.classList.toggle("open");
});

// teams: [{ id, abbrev, color }]; message replaces the lists when set.
export function initShifts(shifts, teams, roster, duration, message) {
    state = { shifts, teams, roster, duration, message };
    panel.classList.remove("open");
}

// The final whistle is an end time, so the last instant keeps the
// players whose shift ended there.
export function onIceAt(shifts, t, duration) {
    return shifts.filter((s) => s.start <= t
        && (t < s.end || (t === duration && s.end === duration)));
}

function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
}

function teamMark(team) {
    if (!team.logo) {
        const s = el("span", "hud-sw");
        s.style.background = team.color;
        return s;
    }
    const img = el("img", "hud-logo");
    img.src = team.logo;
    img.alt = team.abbrev;
    img.style.cssText = "height:2em;vertical-align:middle";
    return img;
}

function toiAt(t) {
    const toi = new Map();
    for (const s of state.shifts) {
        if (s.start > t) continue;
        toi.set(s.playerId, (toi.get(s.playerId) ?? 0)
            + Math.min(s.end, t) - s.start);
    }
    return toi;
}

function row(table, cls, cells) {
    const tr = table.insertRow();
    tr.className = cls;
    for (const c of cells) {
        const td = tr.insertCell();
        if (c instanceof Node) td.append(c);
        else if (c && typeof c === "object") {
            td.className = c.cls ?? "";
            td.append(...c.parts);
        } else td.textContent = c ?? "";
    }
    return tr;
}

// boxed: [{ teamId, playerId, clock, detail }], soonest release first.
// strength: Map teamId -> "PP" | "PK".
export function renderShifts(t, boxed = [], strength = new Map()) {
    if (state.message) {
        panel.replaceChildren(el("div", "hud-dim", state.message));
        return;
    }
    const on = onIceAt(state.shifts, t, state.duration);
    const toi = toiAt(t);
    const table = el("table", "sh-table");
    const strip = el("div", "sh-strip");
    state.teams.forEach((team, i) => {
        const players = on.filter((s) => s.teamId === team.id)
            .map((s) => ({ ...s, info: state.roster.get(s.playerId) }))
            .sort((a, b) => (POSITION_ORDER[a.info?.position] ?? 9)
                - (POSITION_ORDER[b.info?.position] ?? 9));
        const tag = strength.get(team.id);
        const title = `${team.abbrev} on ice (${players.length})`
            + (tag ? ` \u00b7 ${tag}` : "");
        row(table, "hd", [{ parts: [teamMark(team), " ", title] },
            { cls: "n", parts: ["shift"] }, { cls: "n", parts: ["TOI"] }]);
        const skaters = [];
        const goalies = [];
        let longest = 0;
        for (const p of players) {
            const num = p.info?.number ?? "?";
            const goalie = p.info?.position === "G";
            const name = `${num} ${p.info?.lastName ?? p.name}`
                + (goalie ? " G" : "");
            const elapsed = t - p.start;
            const shiftCell = [secondsToMmss(elapsed)];
            if (!goalie) {
                skaters.push(String(num));
                longest = Math.max(longest, elapsed);
            } else goalies.push(`${num}G`);
            const tr = row(table, "on", [name, { cls: "n", parts: shiftCell },
                { cls: "n", parts: [secondsToMmss(toi.get(p.playerId) ?? 0)] }]);
            tr.title = p.info?.name ?? p.name;
        }
        const teamBox = boxed.filter((b) => b.teamId === team.id);
        for (const b of teamBox) {
            const info = state.roster.get(b.playerId);
            const tr = row(table, "box", [
                { parts: [`${info?.number ?? "?"} ${info?.lastName ?? "bench"}`] },
                { cls: "n", parts: [`box ${b.clock}`] },
                { cls: "n", parts: [secondsToMmss(toi.get(b.playerId) ?? 0)] }]);
            tr.title = b.detail;
        }
        // Six skaters plus two stacked minors (double minor) without the block jumping.
        for (let k = players.length + teamBox.length; k < 8; k++) {
            row(table, "pad", ["\u00a0", "", ""]);
        }

        const line = el("div");
        line.append(teamMark(team), el("b", "", skaters.join(" \u00b7 ")
            || "\u2013"));
        const extra = [...goalies, ...teamBox.map((b) => {
            const info = state.roster.get(b.playerId);
            return `${info?.number ?? "?"} box ${b.clock}`;
        })];
        if (tag) extra.unshift(tag);
        if (extra.length) line.append(el("span", "hud-dim",
            "\u00b7 " + extra.join(" \u00b7 ")));
        const clk = el("span", "clk hud-dim hud-num", secondsToMmss(longest));
        if (i === 0) clk.classList.add("first");
        line.append(clk);
        strip.append(line);
    });
    panel.replaceChildren(strip, table);
}
