// Scrubber with play/pause and speed. Time is timeline seconds from
// parse.js (period start + time in period).
import { onFrame } from "./scene.js";
import { bottomSlot } from "./hud.js";
import { iconSvg } from "./icons.js";
import { secondsToMmss } from "./parse.js";

const MIN_SPEED = 1;
const MAX_SPEED = 120;
const DEFAULT_SPEED = 12;
const SLIDER_STEPS = 1000;

// Log mapping gives fine control at slow speeds and still reaches 120x.
const LOG_SPAN = Math.log(MAX_SPEED / MIN_SPEED);
const toSpeed = (v) => MIN_SPEED * Math.exp(v / SLIDER_STEPS * LOG_SPAN);
const toSlider = (s) => Math.round(Math.log(s / MIN_SPEED) / LOG_SPAN
    * SLIDER_STEPS);

const ICON_PX = 16;
// Gap between period bars, in px.
const PERIOD_GAP = 6;

const style = document.createElement("style");
// Glyph characters sit off-centre in the button; SVG paths do not.
const PLAY_SVG = '<svg viewBox="0 0 12 12"><path d="M2.5 1 L11 6 L2.5 11 Z"/></svg>';
const PAUSE_SVG = '<svg viewBox="0 0 12 12"><path d="M2 1h3v10H2zM7 1h3v10H7z"/></svg>';
style.textContent = `
  #timeline .tl-row { display: flex; align-items: center; gap: 10px;
    font-weight: 700; }
  #timeline-play { width: 30px; height: 30px; padding: 0; }
  #timeline-play svg { display: block; width: 18px; height: 18px; fill: currentColor; }
  #timeline-speed { width: 70px; margin: 0; accent-color: #fff; }
  #timeline-speed-label { min-width: 4ch; cursor: text; }
  #timeline .tl-hint { font-weight: 400; font-size: 12px; }
  #timeline .tl-time { margin-left: auto; font-variant-numeric: tabular-nums; }
  #timeline-track { position: relative; height: 56px; margin: 2px 8px 0;
    cursor: pointer; touch-action: none; }
  #timeline-track > * { position: absolute; }
  #timeline-track .per { top: 24px; height: 4px; border-radius: 2px;
    background: rgba(255, 255, 255, 0.45); box-shadow: 0 0 3px #000; }
  #timeline-track .done { top: 24px; left: 0; height: 4px; border-radius: 2px;
    background: #fff; pointer-events: none; }
  #timeline-track .lbl { top: 42px; font-size: 10px; font-weight: 500;
    pointer-events: none; }
  #timeline-track .tk { width: 2px; margin-left: -1px; height: 9px;
    box-shadow: 0 0 2px #000; }
  #timeline-track .tk.a { top: 14px; }
  #timeline-track .tk.h { top: 29px; }
  #timeline-track .tk.n { top: 14px; height: 24px; opacity: 0.5; }
  #timeline-track .mj { width: ${ICON_PX}px; height: ${ICON_PX}px;
    margin-left: -${ICON_PX / 2}px; border-radius: 50%; display: flex;
    align-items: center; justify-content: center; z-index: 2;
    box-shadow: 0 0 0 1.5px #fff, 0 0 4px #000; }
  #timeline-track .mj.a { top: -3px; }
  #timeline-track .mj.h, #timeline-track .mj.n { top: 39px; }
  #timeline-track .badge { position: absolute; top: -7px; right: -8px;
    font-size: 9px; line-height: 11px; min-width: 11px; padding: 0 2px;
    border-radius: 6px; text-align: center; background: #fff; color: #000;
    font-weight: 700; text-shadow: none; }
  #timeline-track .head { top: 15px; width: 3px; height: 22px;
    margin-left: -1.5px; background: #ff0; box-shadow: 0 0 4px #000;
    pointer-events: none; z-index: 3; }
  @media (max-width: 599px) {
    #timeline .tl-hint { display: none; }
    #timeline .tl-row { font-size: 12px; }
  }
`;
document.head.appendChild(style);

const bar = document.createElement("div");
bar.id = "timeline";
bar.className = "hud-el";
bar.innerHTML = `
  <div class="tl-row">
    <button id="timeline-play" class="hud-btn" title="Play/pause (space, k)"
      aria-label="Play/pause">${PLAY_SVG}</button>
    <input id="timeline-speed" type="range" title="Playback speed (log scale)"
      min="0" max="${SLIDER_STEPS}" step="1"
      value="${toSlider(DEFAULT_SPEED)}">
    <span id="timeline-speed-label" class="hud-num"
      title="Click to type a speed (&lt; &gt; step)">${DEFAULT_SPEED}x</span>
    <span class="tl-hint hud-dim">space play &middot; &larr;/&rarr; 5s
      &middot; j/l 10s &middot; &lt; &gt; speed &middot; 1-8 camera
      &middot; drag rotate &middot; right-drag pan &middot; wheel zoom
      &middot; double-click fly in</span>
    <span class="tl-time"></span>
  </div>
  <div id="timeline-track"></div>`;
bottomSlot.appendChild(bar);

const playBtn = bar.querySelector("#timeline-play");
const track = bar.querySelector("#timeline-track");
const timeLabel = bar.querySelector(".tl-time");
const speedSlider = bar.querySelector("#timeline-speed");
const speedLabel = bar.querySelector("#timeline-speed-label");
const done = document.createElement("div");
done.className = "done";
const head = document.createElement("div");
head.className = "head";
let speed = DEFAULT_SPEED;

const roundSpeed = (s) => s < 10 ? Math.round(s * 10) / 10 : Math.round(s);

function setSpeed(s) {
    speed = roundSpeed(Math.min(MAX_SPEED, Math.max(MIN_SPEED, s)));
    speedSlider.value = String(toSlider(speed));
    speedLabel.textContent = `${speed}x`;
}

speedSlider.addEventListener("input", () => {
    speed = roundSpeed(toSpeed(Number(speedSlider.value)));
    speedLabel.textContent = `${speed}x`;
});

speedLabel.addEventListener("click", () => {
    if (speedLabel.isContentEditable) return;
    speedLabel.contentEditable = "true";
    speedLabel.textContent = String(speed);
    speedLabel.focus();
    getSelection().selectAllChildren(speedLabel);
});
speedLabel.addEventListener("keydown", (e) => {
    // Keep typed keys away from any global shortcuts.
    e.stopPropagation();
    if (e.key === "Enter") { e.preventDefault(); speedLabel.blur(); }
    if (e.key === "Escape") {
        speedLabel.textContent = String(speed);
        speedLabel.blur();
    }
});
speedLabel.addEventListener("blur", () => {
    speedLabel.contentEditable = "false";
    const typed = parseFloat(speedLabel.textContent);
    setSpeed(Number.isFinite(typed) ? typed : speed);
});

let duration = 0;
let time = 0;
let playing = false;
let lastFrame = null;
let listener = () => {};
let markerItems = [];
let periods = [];

const pct = (t) => duration ? t / duration * 100 : 0;

function periodTag(t) {
    let current = periods[0];
    for (const p of periods) if (p.start <= t) current = p;
    if (!current) return "";
    return current.type === "REG" ? `P${current.number}` : current.type;
}

function emit() {
    done.style.width = `${pct(time)}%`;
    head.style.left = `${pct(time)}%`;
    timeLabel.textContent = `${periodTag(time)} \u00b7 `
        + `${secondsToMmss(time)} / ${secondsToMmss(duration)}`;
    listener(time);
}

function setPlaying(p) {
    playing = p;
    lastFrame = null;
    playBtn.innerHTML = p ? PAUSE_SVG : PLAY_SVG;
}

playBtn.addEventListener("click", () => {
    if (!playing && time >= duration) time = 0;
    setPlaying(!playing);
});

const SPEED_STEPS = [1, 2, 5, 10, 12, 20, 30, 60, 120];

function stepSpeed(dir) {
    const next = dir > 0
        ? SPEED_STEPS.find((s) => s > speed) ?? MAX_SPEED
        : SPEED_STEPS.findLast((s) => s < speed) ?? MIN_SPEED;
    setSpeed(next);
}

// YouTube-style: k/space toggle play, < and > step speed.
addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    if (t.isContentEditable || t.tagName === "TEXTAREA"
        || (t.tagName === "INPUT" && t.type !== "range")) return;
    // A focused button already toggles on space by itself.
    if (e.key === " " && t.tagName === "BUTTON") return;
    if (e.key === "k" || e.key === " ") playBtn.click();
    else if (e.key === "ArrowLeft") setTime(time - 5);
    else if (e.key === "ArrowRight") setTime(time + 5);
    else if (e.key === "j") setTime(time - 10);
    else if (e.key === "l") setTime(time + 10);
    else if (e.key === "<") stepSpeed(-1);
    else if (e.key === ">") stepSpeed(1);
    else return;
    e.preventDefault();
});
document.addEventListener("visibilitychange", () => {
    if (document.hidden && playing) setPlaying(false);
});

function timeAtX(clientX) {
    const r = track.getBoundingClientRect();
    return r.width ? (clientX - r.left) / r.width * duration : 0;
}

// Markers handle their own clicks; anywhere else on the track scrubs.
track.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || e.target.closest(".mj, .tk")) return;
    track.setPointerCapture(e.pointerId);
    setTime(timeAtX(e.clientX));
});
track.addEventListener("pointermove", (e) => {
    if (track.hasPointerCapture(e.pointerId)) setTime(timeAtX(e.clientX));
});

onFrame((now) => {
    if (!playing) return;
    if (lastFrame !== null) {
        time = Math.min(duration,
            time + (now - lastFrame) / 1000 * speed);
        emit();
        if (time >= duration) setPlaying(false);
    }
    lastFrame = now;
});

// onChange(t) fires on every scrub or playback step.
export function initTimeline(total, onChange) {
    setPlaying(false);
    duration = total;
    listener = onChange;
    time = total;
    emit();
}

// items: [{ t, type, color, title, major, side }]; side 0 = away (above
// the bar), 1 = home (below), null = no team. Majors merge into a counted
// badge when they would overlap; minors are ticks.
// periods: [{ start, length, type, number }] draw the bars and labels.
export function setMarkers(items, gamePeriods = []) {
    markerItems = items;
    periods = gamePeriods;
    layoutMarkers();
    emit();
}

const sideClass = (s) => s === 0 ? "a" : s === 1 ? "h" : "n";

function clusterMajors(width) {
    const majors = markerItems.filter((m) => m.major)
        .sort((a, b) => a.t - b.t);
    const rows = new Map();
    for (const m of majors) {
        const x = duration ? m.t / duration * width : 0;
        const row = sideClass(m.side);
        if (!rows.has(row)) rows.set(row, []);
        const clusters = rows.get(row);
        const last = clusters.at(-1);
        if (last && x - last.x < ICON_PX + 2) last.items.push(m);
        else clusters.push({ x, row, items: [m] });
    }
    return [...rows.values()].flat();
}

function seek(t) {
    setPlaying(false);
    setTime(t);
}

const tip = document.createElement("div");
tip.style.cssText = "position:fixed;z-index:2000;pointer-events:none;"
    + "display:none;padding:6px 9px;border-radius:6px;"
    + "font:14px 'Atkinson Hyperlegible Next',sans-serif;"
    + "line-height:1.4;background:rgba(10,14,22,0.94);color:#fff;"
    + "box-shadow:0 4px 14px rgba(0,0,0,0.5);max-width:320px";
document.body.append(tip);

function showTip(el, items) {
    tip.replaceChildren(...items.map((m) => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex;align-items:center;gap:7px;"
            + "white-space:nowrap";
        const dot = document.createElement("span");
        dot.style.cssText = "flex:none;width:9px;height:9px;"
            + `border-radius:50%;background:${m.color}`;
        row.append(dot, m.title);
        return row;
    }));
    tip.style.display = "block";
    const r = el.getBoundingClientRect();
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    const x = Math.max(4, Math.min(innerWidth - w - 4,
        r.left + r.width / 2 - w / 2));
    tip.style.left = `${x}px`;
    tip.style.top = `${Math.max(4, r.top - h - 8)}px`;
}

function hideTip() {
    tip.style.display = "none";
}

// Touch has no hover; the first tap shows the tip, pointerleave clears it.
function attachTip(el, items) {
    el.addEventListener("pointerenter", () => showTip(el, items));
    el.addEventListener("pointerleave", hideTip);
}

function layoutMarkers() {
    const width = track.clientWidth;
    const els = [];
    periods.forEach((p, i) => {
        // Zero-length shootout slot still gets a label but no bar.
        const per = document.createElement("div");
        per.className = "per";
        const inset = width ? PERIOD_GAP / 2 / width * 100 : 0;
        const left = pct(p.start) + (i ? inset : 0);
        const right = pct(p.start + p.length)
            - (i < periods.length - 1 ? inset : 0);
        per.style.left = `${left}%`;
        per.style.width = `${Math.max(0, right - left)}%`;
        const lbl = document.createElement("div");
        lbl.className = "lbl hud-dim";
        lbl.textContent = p.type === "REG" ? `P${p.number}` : p.type;
        lbl.style.left = `calc(${pct(p.start)}% + 2px)`;
        els.push(per, lbl);
    });
    els.push(done);
    for (const m of markerItems) {
        if (m.major) continue;
        const el = document.createElement("div");
        el.className = `tk ${sideClass(m.side)}`;
        attachTip(el, [m]);
        el.style.left = `${pct(m.t)}%`;
        el.style.background = m.color;
        el.addEventListener("click", () => seek(m.t));
        els.push(el);
    }
    for (const c of clusterMajors(width)) {
        const first = c.items[0];
        const el = document.createElement("div");
        el.className = `mj ${c.row}`;
        el.dataset.type = first.type;
        attachTip(el, c.items);
        el.style.left = `${width ? c.x / width * 100 : 0}%`;
        el.style.background = first.color;
        el.innerHTML = iconSvg(first.type, "#fff", ICON_PX - 4);
        if (c.items.length > 1) {
            const badge = document.createElement("span");
            badge.className = "badge";
            badge.textContent = String(c.items.length);
            el.append(badge);
        }
        el.addEventListener("click", () => seek(first.t));
        els.push(el);
    }
    els.push(head);
    hideTip();
    track.replaceChildren(...els);
}

new ResizeObserver(layoutMarkers).observe(track);

export function setTime(t) {
    time = Math.max(0, Math.min(duration, t));
    emit();
}

export function pause() {
    setPlaying(false);
}
