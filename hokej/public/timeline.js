// Scrubber with play/pause and speed. Time is timeline seconds from
// parse.js (period start + time in period).
import { onFrame } from "./scene.js";
import { hudContainer } from "./hud.js";
import { iconSvg } from "./icons.js";

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
const TICK_PX = 8;

const bar = document.createElement("div");
bar.id = "timeline";
bar.className = "hud-panel";
bar.style.cssText = `
  position: absolute; bottom: var(--hud-gap); left: var(--hud-gap);
  right: var(--hud-gap); display: flex; align-items: center;
  gap: 12px; padding: 6px 12px;
`;
bar.innerHTML = `
  <span style="display:flex;align-items:center;gap:8px;flex:none">
    <button id="timeline-play" class="hud-btn" title="Play/pause"
      style="width:34px;height:30px">&#9654;</button>
  </span>
  <span style="display:flex;align-items:center;gap:6px;flex:none">
    <input id="timeline-speed" type="range" title="Playback speed (log scale)"
      min="0" max="${SLIDER_STEPS}" step="1"
      value="${toSlider(DEFAULT_SPEED)}" style="width:80px;margin:0">
    <span id="timeline-speed-label" class="hud-mono hud-dim"
      title="Click to type a speed"
      style="min-width:4ch;cursor:text">${DEFAULT_SPEED}x</span>
  </span>
  <div style="flex:1 1 300px;min-width:0;position:relative">
    <div id="timeline-markers"
      style="position:relative;margin:0 7px;height:${ICON_PX + 14}px"></div>
    <input id="timeline-range" type="range" min="0" max="0" step="1"
      value="0" style="width:100%;margin:0;display:block">
  </div>`;
hudContainer.appendChild(bar);
new ResizeObserver(() => hudContainer.style.setProperty("--timeline-h",
    `${bar.offsetHeight}px`)).observe(bar);

const playBtn = bar.querySelector("#timeline-play");
const range = bar.querySelector("#timeline-range");
const markers = bar.querySelector("#timeline-markers");
const speedSlider = bar.querySelector("#timeline-speed");
const speedLabel = bar.querySelector("#timeline-speed-label");
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

function emit() {
    range.value = String(Math.floor(time));
    listener(time);
}

function setPlaying(p) {
    playing = p;
    lastFrame = null;
    playBtn.innerHTML = p ? "&#10073;&#10073;" : "&#9654;";
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
range.addEventListener("input", () => {
    time = Number(range.value);
    emit();
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
    range.max = String(total);
    time = total;
    emit();
}

let markerItems = [];
let periods = [];

// items: [{ t, type, color, title, major }]; majors share one row and
// merge into a counted badge when they would overlap; minors are ticks.
// periods: [{ start, length, type, number }] draw dividers and labels.
export function setMarkers(items, gamePeriods = []) {
    markerItems = items;
    periods = gamePeriods;
    layoutMarkers();
}

function clusterMajors(width) {
    const majors = markerItems.filter((m) => m.major)
        .sort((a, b) => a.t - b.t);
    const clusters = [];
    for (const m of majors) {
        const x = duration ? m.t / duration * width : 0;
        const last = clusters.at(-1);
        if (last && x - last.x < ICON_PX + 2) last.items.push(m);
        else clusters.push({ x, items: [m] });
    }
    return clusters;
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
    const width = markers.clientWidth;
    const pct = (t) => duration ? t / duration * 100 : 0;
    const els = [];
    for (const p of periods) {
        const tag = document.createElement("span");
        tag.className = "hud-dim";
        tag.textContent = p.type === "REG" ? `P${p.number}` : p.type;
        tag.style.cssText = `position:absolute;top:0;font-size:10px;`
            + `left:calc(${pct(p.start)}% + 4px)`;
        els.push(tag);
        if (p.start > 0) {
            const line = document.createElement("span");
            line.style.cssText = `position:absolute;top:0;bottom:-18px;`
                + `width:1px;left:${pct(p.start)}%;`
                + `background:rgba(255,255,255,0.35)`;
            els.push(line);
        }
    }
    for (const m of markerItems) {
        if (m.major) continue;
        const el = document.createElement("span");
        attachTip(el, [m]);
        el.style.cssText = `position:absolute;bottom:0;width:2px;`
            + `margin-left:-1px;height:${TICK_PX}px;cursor:pointer;`
            + `left:${pct(m.t)}%;background:${m.color};opacity:0.7`;
        el.addEventListener("click", () => seek(m.t));
        els.push(el);
    }
    for (const c of clusterMajors(width)) {
        const first = c.items[0];
        const el = document.createElement("span");
        el.className = "timeline-marker";
        el.dataset.type = first.type;
        attachTip(el, c.items);
        el.style.cssText = `position:absolute;bottom:0;display:flex;`
            + `align-items:center;justify-content:center;cursor:pointer;`
            + `z-index:2;border-radius:50%;width:${ICON_PX}px;`
            + `height:${ICON_PX}px;margin-left:-${ICON_PX / 2}px;`
            + `left:${width ? c.x / width * 100 : 0}%;`
            + `background:${first.color};box-shadow:0 0 0 1px #fff`;
        el.innerHTML = iconSvg(first.type, "#fff", ICON_PX - 4);
        if (c.items.length > 1) {
            const badge = document.createElement("span");
            badge.textContent = String(c.items.length);
            badge.style.cssText = "position:absolute;top:-7px;right:-8px;"
                + "font-size:9px;line-height:11px;min-width:11px;"
                + "padding:0 2px;border-radius:6px;text-align:center;"
                + "background:#fff;color:#000;font-weight:700";
            el.append(badge);
        }
        el.addEventListener("click", () => seek(first.t));
        els.push(el);
    }
    hideTip();
    markers.replaceChildren(...els);
}

new ResizeObserver(layoutMarkers).observe(markers);

export function setTime(t) {
    time = Math.max(0, Math.min(duration, t));
    emit();
}

export function pause() {
    setPlaying(false);
}
