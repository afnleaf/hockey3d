// Main page (daily game list) and visualizer routing.
import { loadGame } from "./viz.js";
import { pause } from "./timeline.js";

// Routes: "" = game list, "#date=YYYY-MM-DD" = list for a day,
// "#game=ID" = visualizer.

const RELAY_BASE = "http://127.0.0.1:8790";
const GAME_ID_RE = /^(20090[2-9]|20[1-9]\d{3})\d{4}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// 2009-10 opening night; 2009 preseason feed has goals only
const FIRST_DAY = "2009-10-01";

(function () {
    const style = document.createElement("style");
    style.textContent = `
      #main-page { position: fixed; inset: 0; z-index: 2000; overflow: auto;
        background: #15171c; color: #eee;
        font: 15px 'Atkinson Hyperlegible Next', sans-serif; }
      #main-page header { position: sticky; top: 0; background: #1d2027;
        display: flex; align-items: center; justify-content: center; gap: 12px;
        padding: 14px; border-bottom: 1px solid #2c3039; }
      #main-page h1 { margin: 0 24px 0 0; font-size: 20px; letter-spacing: 2px; }
      #main-page .day-label { min-width: 210px; text-align: center;
        font-size: 17px; font-weight: bold; }
      #main-page button, #main-page input, #back-to-list {
        background: #2c3039; color: #eee; border: 1px solid #3c414d;
        border-radius: 6px; padding: 6px 12px; font: inherit; cursor: pointer; }
      #main-page button:hover, #back-to-list:hover { background: #3a3f4b; }
      #prev-day, #next-day { width: 40px; height: 34px; padding: 0;
        display: inline-flex; align-items: center; justify-content: center; }
      #main-page button:disabled { opacity: 0.25; cursor: default;
        background: #2c3039; }
      #main-page input { color-scheme: dark; }
      #game-list { max-width: 720px; margin: 20px auto; padding: 0 16px;
        display: flex; flex-direction: column; gap: 10px; }
      #game-list .message { text-align: center; padding: 40px; opacity: 0.8; }
      .game-card { display: grid; grid-template-columns: 1fr auto 1fr auto;
        align-items: center; gap: 16px; padding: 12px 18px; border-radius: 8px;
        background: #1f232b; border: 1px solid #2c3039; text-align: left;
        width: 100%; color: inherit; font: inherit; }
      button.game-card { cursor: pointer; }
      button.game-card:hover { border-color: #6a7385; background: #262b35; }
      .game-card.unavailable { opacity: 0.55; }
      .game-card .team { display: flex; align-items: center; gap: 10px; }
      .game-card .team.home { justify-content: flex-end; }
      .game-card img { width: 40px; height: 40px; }
      .game-card .abbrev { font-size: 20px; font-weight: bold; }
      .game-card .score { font-size: 22px; font-weight: bold;
        min-width: 70px; text-align: center; }
      .game-card .state { display: flex; flex-direction: column; align-items: center;
        justify-content: center; gap: 4px; width: 84px; font-size: 13px;
        color: #b8bfcc; text-align: center; white-space: nowrap; }
      .game-card .state.live { color: #ff5a5a; font-weight: bold; }
      .game-card .type { display: inline-block; min-width: 36px; padding: 2px 6px;
        border-radius: 4px; font-size: 10px; font-weight: bold; letter-spacing: 0.5px;
        color: #e6e9ef; background: #3c414d; }
      .game-card .type.t1 { background: #5a4a1e; }
      .game-card .type.t3 { background: #6b1f2a; }
      #main-page .type-filter button.active { background: #4a5263; border-color: #8a93a5; }
      #game-list[data-filter="1"] .game-card:not([data-type="1"]),
      #game-list[data-filter="2"] .game-card:not([data-type="2"]),
      #game-list[data-filter="3"] .game-card:not([data-type="3"]),
      #game-list[data-filter="4"] .game-card:not([data-type="4"]) { display: none; }
      .game-card .type.t4 { background: #1f4a6b; }
      #back-to-list { position: fixed; top: 20px; left: 20px; z-index: 1100;
        font: 15px 'Atkinson Hyperlegible Next', sans-serif; }
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
        <button id="prev-day" title="Previous day">&#9664;</button>
        <span class="day-label" id="day-label"></span>
        <button id="next-day" title="Next day">&#9654;</button>
        <input type="date" id="day-input" min="2009-10-01" title="Jump to date">
        <button id="today">Today</button>
        <span class="type-filter">
          <button data-filter="" class="active">All</button>
          <button data-filter="1">Preseason</button>
          <button data-filter="2">Regular</button>
          <button data-filter="3">Playoffs</button>
          <button data-filter="4">All-Star</button>
        </span>
      </header>
      <div id="game-list"></div>`;
    document.body.appendChild(page);

    const back = document.createElement("button");
    back.id = "back-to-list";
    back.textContent = "\u2190 Games";
    const vizStatus = document.createElement("div");
    vizStatus.id = "visualizer-status";
    document.body.append(back, vizStatus);

    const list = page.querySelector("#game-list");
    const dayLabel = page.querySelector("#day-label");
    const dayInput = page.querySelector("#day-input");
    const TYPE_LABELS = { 1: "PRE", 2: "REG", 3: "PO", 4: "ASG" };
    page.querySelectorAll(".type-filter button").forEach((b) => {
        b.addEventListener("click", () => {
            page.querySelectorAll(".type-filter button")
                .forEach((x) => x.classList.toggle("active", x === b));
            if (b.dataset.filter) list.dataset.filter = b.dataset.filter;
            else delete list.dataset.filter;
        });
    });

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
            r = await fetch(RELAY_BASE + path);
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
        if (team.darkLogo) {
            const img = document.createElement("img");
            img.src = team.darkLogo;
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
                const t = new Date(g.startTimeUTC);
                const text = g.gameScheduleState === "PPD" ? "Postponed"
                    : t.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
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
        if (TYPE_LABELS[g.gameType]) {
            const type = document.createElement("span");
            type.className = "type t" + g.gameType;
            type.textContent = TYPE_LABELS[g.gameType];
            state.append(type);
        }
        state.append(st.text);
        card.append(teamCell(g.awayTeam, "away"), score,
            teamCell(g.homeTeam, "home"), state);
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
            [], { weekday: "short", month: "short", day: "numeric", year: "numeric",
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
        showList(date && DATE_RE.test(date) ? date
            : shownDateForBack || shownDate || localToday());
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
    dayInput.addEventListener("change", () => {
        if (DATE_RE.test(dayInput.value)) goToDate(dayInput.value);
    });
    back.addEventListener("click", () => {
        const date = shownDateForBack || shownDate;
        if (date) goToDate(date);
        else location.hash = "";
    });

    window.addEventListener("hashchange", route);
    // today's schedule carries the current season's playoffEndDate, the
    // last day the API schedules; route anyway if it fails
    fetchJSON(`/v1/schedule/${localToday()}`)
        .then((s) => { lastDay = s.playoffEndDate || null; }, () => {})
        .finally(route);
})();
