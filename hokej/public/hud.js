// HUD shell: see-through overlay with scoreboard, icon cluster, popovers
// and the slots other modules render into (legend, shifts, timeline).
import { CAMERA_PRESETS, setCameraPreset, presetSnapshots, setStatsVisible }
    from "./scene.js";

const NARROW = 600;

const style = document.createElement("style");
style.textContent = `
  #hud-container {
    --hud-fg: #fff;
    --hud-dim: rgba(255, 255, 255, 0.68);
    --hud-solid: rgba(14, 16, 22, 0.92);
    --hud-gap: 18px;
    --hud-mono: 'Atkinson Hyperlegible Mono', 'SF Mono', Menlo, monospace;
    /* Halo keeps white text legible over ice, boards and yellow seats. */
    --hud-sh: 0 0 2px #000, 0 0 2px #000, 0 1px 3px rgba(0, 0, 0, 0.9),
      0 0 8px rgba(0, 0, 0, 0.55);
    position: fixed; inset: 0; pointer-events: none; z-index: 1000;
    font: 13px/1.25 'Atkinson Hyperlegible Next', -apple-system, sans-serif;
    color: var(--hud-fg); text-shadow: var(--hud-sh);
    -webkit-tap-highlight-color: transparent;
  }
  .hud-el {
    pointer-events: auto; border-radius: 8px; padding: 6px 8px;
    box-sizing: border-box; transition: background 0.15s;
  }
  .hud-solid {
    background: var(--hud-solid); text-shadow: none;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
  }
  .hud-btn {
    width: 34px; height: 34px; display: grid; place-items: center;
    padding: 0; background: none; color: var(--hud-fg); font: inherit;
    font-size: 17px; line-height: 1; cursor: pointer;
    border: 1.5px solid rgba(255, 255, 255, 0.75); border-radius: 8px;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.6); text-shadow: var(--hud-sh);
  }
  .hud-btn[hidden] { display: none; }
  .hud-btn svg { filter: drop-shadow(0 0 1.5px #000); }
  #hud-icons .hud-btn[aria-expanded="true"],
  #hud-icons .hud-btn[aria-pressed="true"] {
    background: var(--hud-solid); text-shadow: none;
  }
  @media (hover: hover) {
    .hud-btn:hover { background: var(--hud-solid); text-shadow: none; }
  }
  .hud-mono { font-family: var(--hud-mono); }
  .hud-num { font-variant-numeric: tabular-nums; }
  .hud-dim { color: var(--hud-dim); }
  .hud-title {
    font-size: 11px; font-weight: 600; letter-spacing: 0.06em;
    text-transform: uppercase; color: var(--hud-dim); margin: 0 0 6px;
  }
  .hud-sw {
    display: inline-block; flex: none; width: 10px; height: 10px;
    border-radius: 50%; vertical-align: -1px;
    box-shadow: 0 0 0 1.5px #fff, 0 0 4px #000;
  }

  #scoreboard {
    position: absolute; top: var(--hud-gap); left: 50%;
    transform: translateX(-50%); display: grid;
    grid-template-columns: 56px 60px 44px 150px 44px 60px 56px;
    align-items: center; justify-items: center; column-gap: 10px;
    font-weight: 700; white-space: nowrap; cursor: default;
  }
  #scoreboard .logo { width: 56px; height: 56px; object-fit: contain; }
  #scoreboard .abbrev { font-size: 22px; letter-spacing: 0.5px;
    padding-bottom: 2px; border-bottom: 4px solid transparent; }
  #scoreboard .score { font: 700 30px var(--hud-mono);
    font-variant-numeric: tabular-nums; text-align: center; }
  #scoreboard .status { text-align: center; font-size: 15px; line-height: 1.1;
    font-variant-numeric: tabular-nums; }
  #scoreboard .sub { font-size: 11px; font-weight: 500; color: var(--hud-dim);
    margin-top: 2px; }
  #scoreboard .sog { display: grid; grid-template-columns: 3ch auto 3ch;
    column-gap: 4px; justify-content: center; }
  #scoreboard .sog .a { text-align: right; }
  #scoreboard .sog .h { text-align: left; }
  #scoreboard .team { display: flex; flex-direction: column; align-items: center; }
  #scoreboard .pp { display: block; height: 14px; line-height: 14px;
    margin-top: 3px; font-size: 10px; font-weight: 700; color: #fff; }

  #hud-icons {
    position: absolute; top: var(--hud-gap); left: var(--hud-gap);
    display: flex; gap: 6px; pointer-events: auto;
  }
  #game-info {
    position: absolute; top: calc(var(--hud-gap) + 42px); left: var(--hud-gap);
    font-size: 11px; color: var(--hud-dim);
  }

  .hud-popover {
    position: absolute; top: calc(var(--hud-gap) + 42px); left: var(--hud-gap);
    z-index: 1; padding: 10px 12px; max-width: calc(100% - 2 * var(--hud-gap));
    width: max-content; max-height: calc(100% - 200px); overflow: auto;
  }
  .hud-popover[hidden], #camera-popover[hidden] { display: none; }
  #camera-popover {
    display: grid; grid-template-columns: repeat(2, 160px); gap: 8px;
    padding: 8px;
  }
  #camera-popover button {
    padding: 0; border: 2px solid transparent; border-radius: 4px;
    background: none; color: inherit; font: inherit; font-size: 12px;
    cursor: pointer; text-align: left;
  }
  #camera-popover button:hover, #camera-popover button:focus-visible {
    border-color: var(--hud-dim); }
  #camera-popover img { display: block; width: 100%; aspect-ratio: 16 / 9;
    background: #333; }
  #camera-popover span { display: block; padding: 2px 4px; }

  #hud-bottom {
    position: absolute; left: var(--hud-gap); right: var(--hud-gap);
    bottom: var(--hud-gap); display: flex; flex-direction: column; gap: 6px;
  }
  #legend {
    position: fixed; left: var(--hud-gap); top: 20%; width: 340px;
  }
  #legend .row {
    display: grid; grid-template-columns: 44px 24px 16px minmax(0, 1fr);
    gap: 6px; align-items: center; padding: 2px 0; opacity: 0.8;
  }
  #legend .ev-logo { width: 24px; height: 24px; margin: -4px 0; object-fit: contain; }
  #legend .row:first-child { font-size: 15px; font-weight: 700; opacity: 1; }
  #legend .what { white-space: nowrap; overflow: hidden;
    text-overflow: ellipsis; }
  #shifts {
    position: fixed; right: var(--hud-gap); top: 20%; width: 300px;
    max-height: calc(100% - 190px); overflow: auto;
  }
  #shifts .sh-strip { display: none; }
  #event-key {
    position: fixed; left: var(--hud-gap); bottom: 160px;
    display: flex; flex-direction: column; gap: 3px; font-size: 12px;
  }
  #event-key .key-row { display: flex; align-items: center; gap: 6px;
    white-space: nowrap; }

  @media (max-width: ${NARROW - 1}px) {
    #hud-container { --hud-gap: 10px; }
    #scoreboard { top: var(--hud-gap); column-gap: 5px;
      grid-template-columns: 36px 46px 34px 110px 34px 46px 36px; }
    #scoreboard .logo { width: 36px; height: 36px; }
    #scoreboard .abbrev { font-size: 17px; }
    #scoreboard .score { font-size: 24px; }
    #scoreboard .status { font-size: 13px; }
    #scoreboard .sog { display: none; }
    #event-key, #legend, #shifts { display: none; }
    #hud-icons { top: 72px; flex-direction: column; }
    #game-info { display: none; }
    .hud-popover { top: 72px; left: 54px;
      max-width: calc(100% - 54px - var(--hud-gap)); }
    #camera-popover { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    #legend, #shifts { position: static; width: auto; }
    #legend { font-size: 12px; }
    #legend .row:first-child { font-size: 13px; }
    #legend .row:nth-child(n+4) { display: none; }
    #shifts { font-size: 11px; max-height: none; overflow: visible; }
    #shifts .sh-strip { display: block; cursor: pointer; }
    #shifts .sh-table { display: none; }
    #shifts.open .sh-table { display: table; margin-top: 6px; }
    #shifts.open { max-height: 50vh; overflow: auto; }
  }
`;
document.head.appendChild(style);

export const hudContainer = document.createElement("div");
hudContainer.id = "hud-container";

const scoreboard = document.createElement("div");
scoreboard.id = "scoreboard";
scoreboard.className = "hud-el";
scoreboard.innerHTML = `
  <img class="logo" alt=""><div class="team"><span class="abbrev"></span><span class="pp"></span></div>
  <span class="score"></span>
  <div class="status"><div><span class="period"></span>
    <span class="clock"></span></div>
    <div class="sub sog"><span class="a"></span><span>SOG</span><span class="h"></span></div>
  </div>
  <span class="score"></span><div class="team"><span class="abbrev"></span><span class="pp"></span></div>
  <img class="logo" alt="">`;
const logoEls = scoreboard.querySelectorAll(".logo");
const abbrevEls = scoreboard.querySelectorAll(".abbrev");
const scoreEls = scoreboard.querySelectorAll(".score");
const periodEl = scoreboard.querySelector(".period");
const clockEl = scoreboard.querySelector(".clock");
const sogEl = scoreboard.querySelector(".sog");
const sogAway = sogEl.querySelector(".a");
const sogHome = sogEl.querySelector(".h");
const ppEls = scoreboard.querySelectorAll(".pp");

const icons = document.createElement("div");
icons.id = "hud-icons";
icons.innerHTML = `
  <button class="hud-btn" id="back-to-list" title="Back to games"
    aria-label="Back to games">&#8592;</button>
  <button class="hud-btn" id="filter-toggle" title="Event filters"
    aria-label="Event filters" aria-expanded="false">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
      stroke="#fff" stroke-width="1.8" stroke-linejoin="round">
      <path d="M1.5 2.5h13l-5 6v5l-3-1.5v-3.5z"/></svg></button>
  <button class="hud-btn" id="camera-toggle" title="Camera views (1-4)"
    aria-label="Camera views" aria-expanded="false">
    <svg width="18" height="16" viewBox="0 0 18 16" fill="none"
      stroke="#fff" stroke-width="1.8" stroke-linejoin="round">
      <path d="M1.5 4.5h3.5l1.5-2h5l1.5 2h3.5v9h-15z"/>
      <circle cx="9" cy="9" r="2.8"/></svg></button>
  <button class="hud-btn" id="stats-toggle" title="Render stats"
    aria-label="Render stats" aria-pressed="true">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
      stroke="#fff" stroke-width="1.8" stroke-linecap="round">
      <path d="M2 14V9M6 14V3M10 14V7M14 14V5"/></svg></button>`;
// app.js owns the navigation this button triggers.
export const backButton = icons.querySelector("#back-to-list");

const gameInfo = document.createElement("div");
gameInfo.id = "game-info";

const statsToggle = icons.querySelector("#stats-toggle");
function setStatsShown(shown) {
    setStatsVisible(shown);
    statsToggle.setAttribute("aria-pressed", String(shown));
    localStorage.setItem("hokej.stats", shown ? "1" : "0");
}
setStatsShown(localStorage.getItem("hokej.stats") === "1");
statsToggle.addEventListener("click", () =>
    setStatsShown(statsToggle.getAttribute("aria-pressed") !== "true"));

const cameraPanel = document.createElement("div");
cameraPanel.id = "camera-popover";
cameraPanel.className = "hud-popover hud-el hud-solid";
cameraPanel.hidden = true;
const cameraToggle = icons.querySelector("#camera-toggle");
const presetButtons = CAMERA_PRESETS.map((p, i) => {
    const b = document.createElement("button");
    b.innerHTML = `<img alt=""><span>${i + 1}. ${p.name}</span>`;
    b.addEventListener("click", () => { setCameraPreset(i); setCameraOpen(false); });
    return b;
});
cameraPanel.append(...presetButtons);

function setCameraOpen(open) {
    // Snapshots on each open so they show the current game's ice logo.
    if (open) {
        setFiltersOpen(false);
        presetSnapshots().forEach((url, i) => {
            presetButtons[i].querySelector("img").src = url;
        });
    }
    cameraPanel.hidden = !open;
    cameraToggle.setAttribute("aria-expanded", String(open));
}
cameraToggle.addEventListener("click", () => setCameraOpen(cameraPanel.hidden));

// filters.js fills this popover
export const filterPanel = document.createElement("div");
filterPanel.id = "filter-popover";
filterPanel.className = "hud-popover hud-el hud-solid";
filterPanel.hidden = true;
const filterToggle = icons.querySelector("#filter-toggle");

function setFiltersOpen(open) {
    if (open) setCameraOpen(false);
    filterPanel.hidden = !open;
    filterToggle.setAttribute("aria-expanded", String(open));
}
filterToggle.addEventListener("click", () => setFiltersOpen(filterPanel.hidden));
document.addEventListener("pointerdown", (e) => {
    if (!filterPanel.hidden && !filterPanel.contains(e.target)
        && !filterToggle.contains(e.target)) setFiltersOpen(false);
    if (!cameraPanel.hidden && !cameraPanel.contains(e.target)
        && !cameraToggle.contains(e.target)) setCameraOpen(false);
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { setFiltersOpen(false); setCameraOpen(false); return; }
    const t = e.target;
    if (t.isContentEditable || t.tagName === "INPUT" || e.metaKey || e.ctrlKey) return;
    const i = Number(e.key) - 1;
    if (CAMERA_PRESETS[i]) { setCameraPreset(i); e.preventDefault(); }
});

// Phone stacks legend, shifts and timeline at the bottom; desktop pulls
// legend and shifts out to the sides with position: fixed.
const bottom = document.createElement("div");
bottom.id = "hud-bottom";
export const legendSection = document.createElement("div");
legendSection.id = "legend";
legendSection.className = "hud-el";
export const shiftsSection = document.createElement("div");
export const keySection = document.createElement("div");
keySection.id = "event-key";
keySection.className = "hud-el";
shiftsSection.id = "shifts";
shiftsSection.className = "hud-el";
bottom.append(legendSection, shiftsSection);
// timeline.js appends its bar last
export const bottomSlot = bottom;

hudContainer.append(scoreboard, icons, gameInfo, filterPanel, cameraPanel,
    keySection, bottom);
document.body.appendChild(hudContainer);

// teams: [away, home] as { abbrev, color }; info is a dim subtitle line.
export function setScoreboard(teams, info) {
    teams.forEach((t, i) => {
        const side = i === 0 ? 0 : 1;
        if (t.logo) logoEls[side].src = t.logo;
        logoEls[side].alt = t.abbrev;
        abbrevEls[side].textContent = t.abbrev;
        abbrevEls[side].style.borderBottomColor = t.color;
    });
    gameInfo.textContent = info;
}

// s: { period, clock, awayScore, homeScore, awaySog, homeSog, lastGoal, pp }
export function setGameState(s) {
    periodEl.textContent = s.period;
    clockEl.textContent = s.clock;
    scoreEls[0].textContent = s.awayScore;
    scoreEls[1].textContent = s.homeScore;
    sogAway.textContent = s.awaySog;
    sogHome.textContent = s.homeSog;
    ppEls.forEach((el, i) => { el.textContent = s.ppSide === i ? s.pp : ""; });
    scoreboard.title = s.lastGoal;
}
