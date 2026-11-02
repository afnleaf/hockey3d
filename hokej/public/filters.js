// Event type and team checkboxes plus the show-all toggle, rendered into
// the HUD filter popover.
import { filterPanel, keySection } from "./hud.js";
import { iconElement } from "./icons.js";

// display order; types not listed here are appended as found
const TYPE_ORDER = ["goal", "shot-on-goal", "missed-shot", "blocked-shot",
    "hit", "faceoff", "penalty", "giveaway", "takeaway",
    "failed-shot-attempt"];

const hiddenTypes = new Set();
const hiddenTeams = new Set();
let showAll = false;
let listener = () => {};

function checkbox(text, checked, onToggle, swatch, icon) {
    const row = document.createElement("label");
    row.style.cssText = "display:flex;align-items:center;gap:6px;"
        + "cursor:pointer;white-space:nowrap";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = checked;
    box.addEventListener("change", () => onToggle(box.checked));
    row.append(box);
    if (icon) row.append(icon);
    if (swatch) {
        const s = document.createElement("span");
        s.style.cssText = `display:inline-block;width:10px;height:10px;`
            + `border-radius:50%;background:${swatch};border:1px solid #888`;
        row.append(s);
    }
    row.append(text);
    return row;
}

function toggler(set, key) {
    return (checked) => {
        if (checked) set.delete(key);
        else set.add(key);
        listener();
    };
}

// teams: [{ id, abbrev, color }]; onChange() fires on every toggle.
export function initFilters(events, teams, onChange) {
    hiddenTypes.clear();
    hiddenTeams.clear();
    listener = onChange;
    const counts = new Map();
    for (const e of events) counts.set(e.type, (counts.get(e.type) ?? 0) + 1);
    const types = [...TYPE_ORDER.filter((t) => counts.has(t)),
        ...[...counts.keys()].filter((t) => !TYPE_ORDER.includes(t)).sort()];

    const title = document.createElement("h3");
    title.className = "hud-title";
    title.textContent = "Events";
    const count = document.createElement("div");
    count.id = "visible-count";
    count.className = "hud-dim";
    count.style.cssText = "font-size:12px;margin-bottom:8px";
    const typeGrid = document.createElement("div");
    typeGrid.style.cssText = "display:grid;grid-template-columns:1fr 1fr;"
        + "gap:4px 12px;margin-bottom:10px";
    for (const t of types) {
        const row = checkbox(`${t.replace(/-/g, " ")} (${counts.get(t)})`, true,
            toggler(hiddenTypes, t), null, iconElement(t, "#fff", 14));
        row.dataset.type = t;
        typeGrid.append(row);
    }
    const teamRow = document.createElement("div");
    teamRow.style.cssText = "display:flex;gap:16px;margin-bottom:8px";
    for (const team of teams) {
        teamRow.append(checkbox(team.abbrev, true,
            toggler(hiddenTeams, team.id), team.color));
    }
    const all = checkbox("Show all (else last 12)", showAll, (checked) => {
        showAll = checked;
        listener();
    });
    all.id = "show-all";
    filterPanel.replaceChildren(title, count, typeGrid, teamRow, all);
    keySection.replaceChildren(...types.map((t) => {
        const row = document.createElement("div");
        row.className = "key-row";
        row.append(iconElement(t, "#fff", 14), t.replace(/-/g, " "));
        return row;
    }));
}

export function passesFilters(e) {
    return !hiddenTypes.has(e.type) && !hiddenTeams.has(e.teamId);
}

export function isShowAll() {
    return showAll;
}

export function showVisibleCount(visible, total) {
    const el = filterPanel.querySelector("#visible-count");
    if (el) el.textContent = `${visible} of ${total} shown`;
}
