// Main page (daily game list) and visualizer routing.
import { loadGame } from "./viz.js";
import { pause } from "./timeline.js";
import { backButton as back } from "./hud.js";
import { setStatsInGame } from "./scene.js";
import { RELAY_BASE, logoUrl } from "./relay.js";

// Routes: "" = game list, "#date=YYYY-MM-DD" = list for a day,
// "#game=ID" = visualizer.

const GAME_ID_RE = /^(20090[2-9]|20[1-9]\d{3})\d{4}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// 2009-10 opening night; 2009 preseason feed has goals only
const FIRST_DAY = "2009-10-01";

(function () {
    const style = document.createElement("style");
    style.textContent = `
      #main-page { position: fixed; inset: 0; z-index: 2000; overflow: auto;
        background: #fff; color: #111;
        font: 15px 'Atkinson Hyperlegible Next', sans-serif;
        touch-action: manipulation; }
      #main-page header { position: sticky; top: 0; z-index: 1; background: #fff;
        display: flex; flex-wrap: wrap; align-items: center; justify-content: center;
        gap: 12px; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
      #main-page h1 { margin: 0 24px 0 0; font-size: 20px; letter-spacing: 2px; }
      #main-page .day-label { flex: 0 0 13em; margin: 0; text-align: center;
        font-size: 17px; font-weight: bold; font-variant-numeric: tabular-nums;
        white-space: nowrap; font-family: ui-monospace, Menlo, Consolas, monospace; }
      #day-input { font-family: ui-monospace, Menlo, Consolas, monospace;
        font-variant-numeric: tabular-nums; }
      #pick-day { display: none; align-items: center; justify-content: center; }
      #main-page button, #main-page input {
        background: #fff; color: #111; border: 1px solid #d1d5db;
        border-radius: 6px; padding: 6px 12px; font: inherit; cursor: pointer; }
      @media (hover: hover) { #main-page button:hover { background: #f3f4f6; } }
      #main-page button, #main-page input { -webkit-tap-highlight-color: transparent; }
      #prev-day, #next-day { width: 36px; height: 34px; padding: 0;
        display: inline-flex; align-items: center; justify-content: center; }
      #prev-day svg, #next-day svg { width: 12px; height: 12px; fill: currentColor; }
      #main-page button:disabled { opacity: 0.3; cursor: default; background: #fff; }
      #main-page input { color-scheme: light; }
      #game-list { max-width: 760px; margin: 24px auto; padding: 0 16px;
        display: flex; flex-direction: column; gap: 12px; }
      #game-list .message { text-align: center; padding: 40px; color: #6b7280; }
      .game-card { display: grid;
        grid-template-columns: minmax(0, 1fr) 70px minmax(0, 1fr) 88px 200px 84px;
        align-items: center; gap: 16px; padding: 14px 20px; border-radius: 8px;
        background: #fff; border: 1px solid #e5e7eb; text-align: left;
        width: 100%; box-sizing: border-box; color: inherit; font: inherit; }
      button.game-card { cursor: pointer; }
      @media (hover: hover) {
        button.game-card:hover { border-color: #9ca3af; background: #f9fafb; } }
      .game-card.unavailable { opacity: 0.55; }
      .game-card .team { display: flex; align-items: center; gap: 10px; }
      .game-card .team.home { justify-content: flex-end; }
      .game-card img { width: 40px; height: 40px; }
      .game-card .abbrev { font-size: 20px; font-weight: bold; }
      .game-card .score { font-size: 22px; font-weight: bold; text-align: center; }
      .game-card .state { display: flex; flex-direction: column; align-items: center;
        justify-content: center; gap: 4px; width: 84px; font-size: 13px;
        color: #4b5563; text-align: center; white-space: nowrap; }
      .game-card .state.live { color: #dc2626; font-weight: bold; }
      .game-card .type { display: inline-block; min-width: 36px; padding: 2px 6px;
        border-radius: 4px; font-size: 10px; font-weight: bold; letter-spacing: 0.5px;
        color: #374151; background: #f3f4f6; }
      .game-card .type.t1 { background: #fef3c7; color: #92400e; }
      .game-card .type.t3 { background: #fee2e2; color: #991b1b; }
      .game-card .type.t4 { background: #dbeafe; color: #1e40af; }
      .game-card .time, .game-card .venue { font-size: 13px; color: #6b7280;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .game-card .time { text-align: left; font-variant-numeric: tabular-nums;
        padding-left: 16px; }
      @media (max-width: 599px) {
        #main-page header { padding: 10px 12px; gap: 8px; }
        #main-page h1 { flex: 1 1 auto; margin: 0; order: 0; }
        #yesterday, #today { order: 1; }
        #main-page header::after { content: ""; order: 2; flex-basis: 100%;
          height: 0; margin-bottom: -8px; }
        #prev-day { order: 3; }
        #main-page .day-label { order: 3; flex: 1 0 calc(100% - 88px);
          min-width: 0; font-size: 15px; }
        #next-day { order: 4; }
        #day-input { position: absolute; width: 1px; height: 1px; opacity: 0;
          pointer-events: none; }
        #pick-day { display: inline-flex; order: 1; padding: 6px 10px; }
        #pick-day svg { height: 1lh; }
        #game-list { margin: 16px auto; padding: 0 12px; }
        .game-card { grid-template-columns: minmax(0, 1fr) 64px minmax(0, 1fr);
          grid-template-areas: "away score home" "meta meta state";
          row-gap: 8px; column-gap: 8px; padding: 12px 14px; }
        .game-card .team.away { grid-area: away; }
        .game-card .score { grid-area: score; }
        .game-card .team.home { grid-area: home; }
        .game-card .time { grid-area: meta; padding-left: 0; }
        .game-card .venue { display: none; }
        .game-card .state { grid-area: state; width: auto; flex-direction: row;
          justify-self: end; }
        .game-card img { width: 32px; height: 32px; }
        .game-card .abbrev { font-size: 17px; }
      }
      #visualizer-status { position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%); z-index: 1100; padding: 14px 20px;
        background: rgba(20, 20, 20, 0.9); color: #eee; border-radius: 8px;
        font: 16px 'Atkinson Hyperlegible Next', sans-serif; }
    `;
    document.head.appendChild(style);

    const page = document.createElement("div");
    page.id = "main-page";
    page.innerHTML = `
      <header>
        <h1>HOKEJ</h1>
        <button id="prev-day" title="Previous day"><svg viewBox="0 0 12 12"><path d="M10 1 2 6l8 5z"/></svg></button>
        <span class="day-label" id="day-label"></span>
        <button id="next-day" title="Next day"><svg viewBox="0 0 12 12"><path d="M2 1l8 5-8 5z"/></svg></button>
        <input type="date" id="day-input" min="2009-10-01" title="Jump to date">
        <button id="pick-day" title="Jump to date"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M2 7h12M5 1.5v3M11 1.5v3"/></svg></button>
        <button id="yesterday">Yesterday</button>
        <button id="today">Today</button>
      </header>
      <div id="game-list"></div>`;
    document.body.appendChild(page);

    const vizStatus = document.createElement("div");
    vizStatus.id = "visualizer-status";
    document.body.append(vizStatus);

    const list = page.querySelector("#game-list");
    const dayLabel = page.querySelector("#day-label");
    const dayInput = page.querySelector("#day-input");
    const TYPE_LABELS = { 1: "PRE", 2: "REG", 3: "PO", 4: "ASG" };

    let shownDate = null;
    // stale responses from earlier navigation must not overwrite newer views
    let requestSeq = 0;

    function localToday() {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 10);
    }

    function shiftDate(date, days) {
        const d = new Date(date + "T12:00:00Z");
        d.setUTCDate(d.getUTCDate() + days);
        return d.toISOString().slice(0, 10);
    }

    async function fetchJSON(path) {
        let r;
        try {
            r = await fetch(RELAY_BASE + path, { headers: { "X-Histos-App": "hokej" } });
        } catch (e) {
            throw new Error("Relay unreachable at " + RELAY_BASE);
        }
        if (!r.ok) throw new Error(`Relay returned HTTP ${r.status}`);
        return r.json();
    }

    function message(text) {
        const m = document.createElement("div");
        m.className = "message";
        m.textContent = text;
        list.replaceChildren(m);
    }

    function teamCell(team, side) {
        const cell = document.createElement("div");
        cell.className = "team " + side;
        const abbrev = document.createElement("span");
        abbrev.className = "abbrev";
        abbrev.textContent = team.abbrev;
        const parts = [abbrev];
        const src = team.logo ?? team.darkLogo;
        if (src) {
            const img = document.createElement("img");
            img.src = logoUrl(src);
            img.alt = "";
            side === "away" ? parts.unshift(img) : parts.push(img);
        }
        cell.append(...parts);
        return cell;
    }

    function stateText(g) {
        const pd = g.periodDescriptor || {};
        switch (g.gameState) {
            case "LIVE":
            case "CRIT":
                return { text: "LIVE" + (pd.number ? " P" + pd.number : ""),
                    cls: "live", loadable: true };
            case "OFF":
            case "FINAL": {
                const extra = pd.periodType && pd.periodType !== "REG"
                    ? "/" + pd.periodType : "";
                return { text: "Final" + extra, cls: "", loadable: true };
            }
            default: {
                const text = g.gameScheduleState === "PPD" ? "Postponed"
                    : "Scheduled";
                return { text, cls: "", loadable: false };
            }
        }
    }

    function gameCard(g) {
        const st = stateText(g);
        const card = document.createElement(st.loadable ? "button" : "div");
        card.className = "game-card" + (st.loadable ? "" : " unavailable");
        card.dataset.gameId = String(g.id);
        card.dataset.type = String(g.gameType);
        const score = document.createElement("div");
        score.className = "score";
        score.textContent = st.loadable
            ? `${g.awayTeam.score ?? 0} - ${g.homeTeam.score ?? 0}` : "@";
        const state = document.createElement("div");
        state.className = "state " + st.cls;
        state.append(st.text);
        if (TYPE_LABELS[g.gameType]) {
            const type = document.createElement("span");
            type.className = "type t" + g.gameType;
            type.textContent = TYPE_LABELS[g.gameType];
            state.append(type);
        }
        const time = document.createElement("div");
        time.className = "time";
        time.textContent = g.startTimeUTC ? new Date(g.startTimeUTC)
            .toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";
        const venue = document.createElement("div");
        venue.className = "venue";
        venue.textContent = g.venue?.default ?? "";
        venue.title = venue.textContent;
        card.append(teamCell(g.awayTeam, "away"), score,
            teamCell(g.homeTeam, "home"), time, venue, state);
        if (st.loadable) {
            card.title = `Open ${g.awayTeam.abbrev} @ ${g.homeTeam.abbrev}`;
            card.addEventListener("click", () => { location.hash = "game=" + g.id; });
        } else {
            card.title = "Not started; nothing to show yet";
        }
        return card;
    }

    async function showList(date) {
        page.hidden = false;
        setStatsInGame(false);
        pause();
        back.hidden = true;
        vizStatus.hidden = true;
        if (date < FIRST_DAY) date = FIRST_DAY;
        if (lastDay && date > lastDay) date = lastDay;
        if (date === shownDate && list.querySelector(".game-card")) return;
        shownDate = date;
        dayInput.value = date;
        if (lastDay) dayInput.max = lastDay;
        page.querySelector("#prev-day").disabled = date <= FIRST_DAY;
        page.querySelector("#next-day").disabled = !!lastDay && date >= lastDay;
        dayLabel.textContent = new Date(date + "T12:00:00Z").toLocaleDateString(
            [], { weekday: "short", month: "short", day: "2-digit", year: "numeric",
                timeZone: "UTC" });
        const seq = ++requestSeq;
        message("Loading games...");
        try {
            const s = await fetchJSON(`/v1/schedule/${date}`);
            if (seq !== requestSeq) return;
            const day = (s.gameWeek || []).find((d) => d.date === date);
            const games = day ? day.games : [];
            if (!games.length) {
                message("No games on this day.");
                return;
            }
            list.replaceChildren(...games.map(gameCard));
        } catch (e) {
            if (seq !== requestSeq) return;
            shownDate = null;
            message("Could not load games: " + e.message);
        }
    }

    async function showGame(id) {
        page.hidden = true;
        setStatsInGame(true);
        back.hidden = false;
        vizStatus.hidden = false;
        vizStatus.textContent = `Loading game ${id}...`;
        const seq = ++requestSeq;
        try {
            // shifts are optional: older seasons return no rows
            const [pbp, shifts] = await Promise.all([
                fetchJSON(`/v1/gamecenter/${id}/play-by-play`),
                fetchJSON(`/v1/shiftcharts/${id}`)
                    .then((json) => ({ json }), (e) => ({ error: e.message })),
            ]);
            if (seq !== requestSeq) return;
            loadGame(pbp, shifts.json ?? null, shifts.error ?? "");
            document.title = `${pbp.awayTeam.abbrev} @ ${pbp.homeTeam.abbrev} - hokej`;
            vizStatus.hidden = true;
            // the list returns to the game's own day when Back is pressed
            if (pbp.gameDate) shownDateForBack = pbp.gameDate;
        } catch (e) {
            if (seq !== requestSeq) return;
            vizStatus.textContent = `Could not load game ${id}: ${e.message}`;
        }
    }

    let shownDateForBack = null;
    let lastDay = null;

    function route() {
        const params = new URLSearchParams(location.hash.slice(1));
        const game = params.get("game");
        const date = params.get("date");
        if (game && GAME_ID_RE.test(game)) {
            showGame(game);
            return;
        }
        document.title = "hokej";
        // Today's games mostly start in the evening, so a fresh load shows
        // the last day that has finished games.
        showList(date && DATE_RE.test(date) ? date
            : shownDateForBack || shownDate || shiftDate(localToday(), -1));
    }

    function goToDate(date) {
        location.hash = "date=" + date;
    }

    page.querySelector("#prev-day").addEventListener("click",
        () => goToDate(shiftDate(shownDate || localToday(), -1)));
    page.querySelector("#next-day").addEventListener("click",
        () => goToDate(shiftDate(shownDate || localToday(), 1)));
    page.querySelector("#today").addEventListener("click",
        () => goToDate(localToday()));
    page.querySelector("#yesterday").addEventListener("click",
        () => goToDate(shiftDate(localToday(), -1)));
    page.querySelector("#pick-day").addEventListener("click", () => {
        try { dayInput.showPicker(); } catch { dayInput.focus(); }
    });
    dayInput.addEventListener("change", () => {
        if (DATE_RE.test(dayInput.value)) goToDate(dayInput.value);
    });
    back.addEventListener("click", () => {
        const date = shownDateForBack || shownDate;
        if (date) goToDate(date);
        else location.hash = "";
    });

    window.addEventListener("hashchange", route);
    const initialGame = new URLSearchParams(location.hash.slice(1)).get("game");
    if (initialGame && GAME_ID_RE.test(initialGame)) page.hidden = true;
    // today's schedule carries the current season's playoffEndDate, the
    // last day the API schedules; route anyway if it fails
    fetchJSON(`/v1/schedule/${localToday()}`)
        .then((s) => { lastDay = s.playoffEndDate || null; }, () => {})
        .finally(route);
})();
