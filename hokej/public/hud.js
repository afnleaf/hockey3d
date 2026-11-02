// HUD shell: top bar, event strip, filter popover and the shared panel
// style. Other modules render into the exported slots.
import { resetCamera } from "./scene.js";

const NARROW = 600;

const style = document.createElement("style");
style.textContent = `
  #hud-container {
    --hud-bg: rgba(18, 20, 26, 0.82);
    --hud-border: rgba(255, 255, 255, 0.10);
    --hud-fg: #e8eaef;
    --hud-dim: #9aa1ae;
    --hud-gap: 10px;
    --hud-radius: 8px;
    --hud-mono: 'Atkinson Hyperlegible Mono', 'SF Mono', Menlo, monospace;
    --topbar-h: 48px;
    --timeline-h: 52px;
    position: fixed; inset: 0; pointer-events: none; z-index: 1000;
    font: 13px/1.35 'Atkinson Hyperlegible Next', -apple-system, sans-serif;
    color: var(--hud-fg);
  }
  .hud-panel {
    background: var(--hud-bg); border: 1px solid var(--hud-border);
    border-radius: var(--hud-radius); pointer-events: auto;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  }
  .hud-btn {
    background: rgba(255, 255, 255, 0.06); color: var(--hud-fg);
    border: 1px solid var(--hud-border); border-radius: 6px;
    font: inherit; padding: 4px 8px; cursor: pointer; line-height: 1;
    min-height: 26px;
  }
  .hud-btn:hover, .hud-btn[aria-expanded="true"] {
    background: rgba(255, 255, 255, 0.16);
  }
  .hud-mono { font-family: var(--hud-mono); }
  .hud-dim { color: var(--hud-dim); }
  .hud-title {
    font-size: 11px; font-weight: 600; letter-spacing: 0.06em;
    text-transform: uppercase; color: var(--hud-dim); margin: 0 0 6px;
  }
  .hud-team-mark { border-left: 3px solid; padding-left: 6px; }

  #topbar {
    position: absolute; top: var(--hud-gap); left: 50%;
    transform: translateX(-50%); display: flex; flex-direction: column;
    align-items: center; gap: 4px; padding: 6px 8px;
    max-width: calc(100% - 2 * var(--hud-gap)); box-sizing: border-box;
  }
  #topbar .row { display: flex; align-items: center; gap: 14px; }
  #topbar .team { display: flex; align-items: center; gap: 10px; }
  #topbar .team img { height: 44px; width: 44px; object-fit: contain; }
  #topbar .abbrev { font-weight: 700; font-size: 24px; }
  #topbar .score {
    font: 700 32px var(--hud-mono); color: #fff; min-width: 1.2ch;
    text-align: center;
  }
  #topbar .sog { font-size: 15px; color: var(--hud-dim); }
  #topbar .status {
    display: flex; flex-direction: column; align-items: center;
    min-width: 72px;
  }
  #topbar .period { font-size: 15px; color: var(--hud-dim); }
  #topbar .clock { font: 600 24px var(--hud-mono); }

  #strip {
    position: absolute; top: calc(var(--hud-gap) * 2 + var(--topbar-h));
    left: var(--hud-gap); right: var(--hud-gap); max-height: 200px;
    display: grid; grid-template-columns: minmax(0, 2fr) auto minmax(0, 1fr);
    gap: 18px; padding: 8px 12px; box-sizing: border-box; overflow: hidden;
  }
  #strip > section { min-width: 0; }
  #strip .recent-cols {
    display: grid; grid-template-columns: 1fr 1fr; gap: 0 14px;
  }
  #event-key {
    display: grid; grid-auto-flow: column; grid-template-rows: repeat(5, auto);
    gap: 3px 14px; font-size: 12px; align-content: start;
  }
  #event-key .key-row { display: flex; align-items: center; gap: 6px;
    white-space: nowrap; }

  #filter-popover {
    position: absolute; top: calc(var(--hud-gap) * 2 + var(--topbar-h));
    left: 50%; transform: translateX(-50%); padding: 10px 12px;
    width: max-content; max-width: calc(100% - 2 * var(--hud-gap));
    box-sizing: border-box;
  }
  #filter-popover { z-index: 1; }
  #filter-popover[hidden] { display: none; }

  @media (max-width: ${NARROW - 1}px) {
    #strip { display: none; }
  }
  @media (max-width: ${NARROW - 1}px) {
    /* app.js puts the games button in the top-left corner */
    #topbar { top: 52px; left: var(--hud-gap); right: var(--hud-gap);
      transform: none; }
    #topbar .row { gap: 6px; width: 100%; justify-content: space-between; }
    #topbar .team img, #topbar .sog { display: none; }
    #filter-popover { top: calc(52px + var(--hud-gap) + var(--topbar-h)); }
  }
`;
document.head.appendChild(style);

export const hudContainer = document.createElement("div");
hudContainer.id = "hud-container";

const topbar = document.createElement("div");
topbar.id = "topbar";
topbar.className = "hud-panel";
topbar.innerHTML = `
  <div class="row">
    <button class="hud-btn" id="filter-toggle" title="Event filters"
      aria-expanded="false">Filters</button>
    <div class="team away"></div>
    <div class="status"><span class="period"></span>
      <span class="clock"></span></div>
    <div class="team home"></div>
    <button class="hud-btn" id="reset-camera" title="Reset camera view"
      aria-label="Reset camera view">&#128247;</button>
  </div>`;
const teamSlots = [topbar.querySelector(".away"),
    topbar.querySelector(".home")];
const periodEl = topbar.querySelector(".period");
const clockEl = topbar.querySelector(".clock");
topbar.querySelector("#reset-camera").addEventListener("click", resetCamera);

// filters.js fills this popover
export const filterPanel = document.createElement("div");
filterPanel.id = "filter-popover";
filterPanel.className = "hud-panel";
filterPanel.hidden = true;
const filterToggle = topbar.querySelector("#filter-toggle");

function setFiltersOpen(open) {
    filterPanel.hidden = !open;
    filterToggle.setAttribute("aria-expanded", String(open));
}
filterToggle.addEventListener("click", () => setFiltersOpen(filterPanel.hidden));
document.addEventListener("pointerdown", (e) => {
    if (!filterPanel.hidden && !filterPanel.contains(e.target)
        && !filterToggle.contains(e.target)) setFiltersOpen(false);
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setFiltersOpen(false);
});

const strip = document.createElement("div");
strip.id = "strip";
strip.className = "hud-panel";
strip.innerHTML = `<section id="recent-events"></section>
  <section><div id="event-key"></div></section>
  <section id="shift-overlay"></section>`;
// shifts.js, viz.js and filters.js render into these
export const onIceSection = strip.querySelector("#shift-overlay");
export const recentSection = strip.querySelector("#recent-events");
export const keySection = strip.querySelector("#event-key");

new ResizeObserver(() => hudContainer.style.setProperty("--topbar-h",
    `${topbar.offsetHeight}px`)).observe(topbar);

hudContainer.append(topbar, filterPanel, strip);
document.body.appendChild(hudContainer);

// teams: [away, home] as { abbrev, color, logo }
export function setScoreboard(teams) {
    teams.forEach((t, i) => {
        const slot = teamSlots[i];
        const img = document.createElement("img");
        img.src = t.logo;
        img.alt = "";
        const abbrev = document.createElement("span");
        abbrev.className = "abbrev hud-team-mark";
        abbrev.style.borderColor = t.color;
        abbrev.textContent = t.abbrev;
        const score = document.createElement("span");
        score.className = "score";
        const sog = document.createElement("span");
        sog.className = "sog";
        sog.title = "Shots on goal";
        const parts = [img, abbrev, score, sog];
        slot.replaceChildren(...(i === 0 ? parts : parts.reverse()));
    });
}

// s: { period, clock, awayScore, homeScore, awaySog, homeSog, lastGoal }
export function setGameState(s) {
    periodEl.textContent = s.period;
    clockEl.textContent = s.clock;
    const scores = [s.awayScore, s.homeScore];
    const sogs = [s.awaySog, s.homeSog];
    teamSlots.forEach((slot, i) => {
        const score = slot.querySelector(".score");
        if (!score) return;
        score.textContent = scores[i];
        slot.querySelector(".sog").textContent = `SOG ${sogs[i]}`;
    });
    topbar.title = s.lastGoal;
}

