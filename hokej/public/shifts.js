// On-ice players per team at the scrub time, from shiftcharts.
import { onIceSection as panel } from "./hud.js";

const POSITION_ORDER = { G: 0, D: 1, C: 2, R: 3, L: 4 };

let state = { shifts: [], teams: [], roster: new Map(), duration: 0,
    message: "" };

// teams: [{ id, abbrev, color, logo }]; message replaces the lists when set.
export function initShifts(shifts, teams, roster, duration, message) {
    state = { shifts, teams, roster, duration, message };
}

// The final whistle is an end time, so the last instant keeps the
// players whose shift ended there.
export function onIceAt(shifts, t, duration) {
    return shifts.filter((s) => s.start <= t
        && (t < s.end || (t === duration && s.end === duration)));
}

function playerRow(playerId, info, fallback, right) {
    const row = document.createElement("div");
    row.className = "shift-player";
    row.style.cssText = "padding-left:9px;white-space:nowrap;"
        + "display:flex;align-items:baseline";
    row.title = fallback;
    row.dataset.playerId = String(playerId);
    const num = document.createElement("span");
    num.style.cssText = "display:inline-block;width:2ch;"
        + "text-align:right;margin-right:6px;"
        + "font-variant-numeric:tabular-nums";
    num.textContent = String(info?.number ?? "?");
    const name = document.createElement("span");
    name.style.cssText = "flex:1;min-width:0;overflow:hidden;"
        + "text-overflow:ellipsis";
    name.textContent = info?.lastName ?? fallback;
    row.append(num, name, right);
    return row;
}

// boxed: [{ teamId, playerId, clock, detail }], soonest release first.
export function renderShifts(t, boxed = []) {
    if (state.message) {
        const m = document.createElement("div");
        m.className = "hud-dim";
        m.textContent = state.message;
        panel.replaceChildren(m);
        return;
    }
    const on = onIceAt(state.shifts, t, state.duration);
    const blocks = state.teams.map((team) => {
        const block = document.createElement("div");
        block.className = "shift-team";
        block.dataset.teamId = String(team.id);

        const players = on.filter((s) => s.teamId === team.id)
            .map((s) => ({ ...s, info: state.roster.get(s.playerId) }))
            .sort((a, b) => (POSITION_ORDER[a.info?.position] ?? 9)
                - (POSITION_ORDER[b.info?.position] ?? 9));
        const head = document.createElement("div");
        head.className = "hud-team-mark";
        head.style.cssText = `font-weight:600;border-color:${team.color};`
            + "display:flex;align-items:flex-start;gap:6px";
        head.append(`${team.abbrev} (${players.length})`);
        if (team.logo) {
            const img = document.createElement("img");
            img.src = team.logo;
            img.alt = "";
            // Negative bottom margin keeps the row at text height; logo hangs down.
            img.style.cssText = "height:28px;width:auto;flex:none;"
                + "margin-left:48px;margin-bottom:calc(1lh - 28px);"
                + "position:relative;z-index:1";
            head.append(img);
        }
        block.append(head);
        for (const p of players) {
            const pos = document.createElement("span");
            pos.style.cssText = "flex:none;width:2ch;margin-left:6px;"
                + "text-align:center;opacity:0.7";
            pos.textContent = p.info?.position ?? "";
            block.append(playerRow(p.playerId, p.info, p.name, pos));
        }
        for (const b of boxed.filter((b) => b.teamId === team.id)) {
            const info = state.roster.get(b.playerId);
            const clock = document.createElement("span");
            clock.style.cssText = "flex:none;margin-left:6px;"
                + "font-variant-numeric:tabular-nums";
            clock.textContent = b.clock;
            const row = playerRow(b.playerId, info, info?.name ?? "bench", clock);
            row.style.opacity = "0.55";
            row.title = b.detail;
            block.append(row);
        }
        return block;
    });
    const grid = document.createElement("div");
    grid.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:4px 8px";
    grid.append(...blocks);
    panel.replaceChildren(grid);
}
