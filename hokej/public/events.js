// One THREE.Group per drawable play-by-play event. The event's x/y is
// exact; shot arcs, rings and flips are illustrative. Visibility, fade
// and entry animation are driven by the timeline and filters.
import { scene, camera, onFrame } from "./scene.js";
import { iconTexture, glowTexture } from "./icons.js";

// [primary, secondary] from hockeyR team_logos_colors (danmorse314/hockeyR).
// Utah (59) is absent there; Mountain Blue and Rock Black come from
// smoothmojo.com/brands/nhl-brands/utah-mammoth (third-party, not NHL).
export const teamColors = {
    1: [0xCE1126, 0x000000], // NJD
    2: [0x00539B, 0xF47D30], // NYI
    3: [0x0038A8, 0xCE1126], // NYR
    4: [0xF74902, 0x000000], // PHI
    5: [0xFCB514, 0x000000], // PIT
    6: [0xFFB81C, 0x000000], // BOS
    7: [0x002654, 0xFCB514], // BUF
    8: [0xAF1E2D, 0x192168], // MTL
    9: [0xC52032, 0xC2912C], // OTT
    10: [0x00205B, 0xFFFFFF], // TOR
    12: [0xCC0000, 0x000000], // CAR
    13: [0x041E42, 0xC8102E], // FLA
    14: [0x002868, 0xFFFFFF], // TBL
    15: [0xC8102E, 0x041E42], // WSH
    16: [0xCF0A2C, 0x000000], // CHI
    17: [0xCE1126, 0xFFFFFF], // DET
    18: [0xFFB81C, 0x041E42], // NSH
    19: [0x002F87, 0xFCB514], // STL
    20: [0xC8102E, 0xF1BE48], // CGY
    21: [0x6F263D, 0x236192], // COL
    22: [0xFF4C00, 0x041E42], // EDM
    23: [0x00205B, 0x00843D], // VAN
    24: [0xF47A38, 0xB9975B], // ANA
    25: [0x006847, 0x8F8F8C], // DAL
    26: [0x111111, 0xA2AAAD], // LAK
    28: [0x006D75, 0x000000], // SJS
    29: [0x002654, 0xCE1126], // CBJ
    30: [0x154734, 0xA6192E], // MIN
    52: [0x041E42, 0xAC162C], // WPG
    53: [0x8C2633, 0xDDCBA4], // ARI
    54: [0xB4975A, 0x333F42], // VGK
    55: [0x99D9D9, 0x001628], // SEA
    59: [0x6CACE4, 0x010101], // UTA
};

const NEUTRAL = 0x888888;
const ANIM_MS = 900;
const GOAL_LINE_X = 89;
const ICON_SIZE = { 505: 8, 506: 5.8, 507: 5, 508: 5, 509: 6.2 };
const DEFAULT_ICON_SIZE = 4.8;
const ICON_Z = 4.5;

function hex(c) {
    return "#" + c.toString(16).padStart(6, "0");
}

function rgbDistance(a, b) {
    const d = (s) => ((a >> s) & 255) - ((b >> s) & 255);
    return Math.hypot(d(16), d(8), d(0));
}

// Relative luminance 0-1, sRGB weights without gamma.
function luminance(c) {
    return (0.2126 * ((c >> 16) & 255) + 0.7152 * ((c >> 8) & 255)
        + 0.0722 * (c & 255)) / 255;
}

// Above this a colour washes out against the white ice.
const MAX_ICE_LUMINANCE = 0.75;
const MIN_TEAM_DISTANCE = 90;

function readable(c) {
    return luminance(c) <= MAX_ICE_LUMINANCE;
}

// Hue turned 180 degrees with HSL lightness kept, so a dark navy stays
// dark enough to read on white ice; a plain RGB inverse would not.
function hueRotate180(c) {
    const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
    const sum = Math.max(r, g, b) + Math.min(r, g, b);
    return ((sum - r) << 16) | ((sum - g) << 8) | (sum - b);
}

// First pair, home preferred, where both are ice-readable and far apart
// (TOR and VAN share navy). TBL and TOR have no such pair; away takes the
// home colour turned 180 degrees in hue.
export function gameColors(awayId, homeId) {
    const homeSet = (teamColors[homeId] ?? [NEUTRAL]).filter(readable);
    const awaySet = (teamColors[awayId] ?? [NEUTRAL]).filter(readable);
    for (const home of homeSet) {
        const away = awaySet.find(
            (c) => rgbDistance(c, home) >= MIN_TEAM_DISTANCE);
        if (away !== undefined) {
            return new Map([[homeId, home], [awayId, away]]);
        }
    }
    const home = homeSet[0] ?? NEUTRAL;
    return new Map([[homeId, home], [awayId, hueRotate180(home)]]);
}

// rendered: { event, group, mats: [{ m, base }], anim, bornAt, wasVisible }
const rendered = [];
let colors = new Map();
let lastTime = null;

function colorOf(teamId) {
    return colors.get(teamId) ?? NEUTRAL;
}

// +1 if team attacks the x>0 net in raw feed coordinates for that period.
function makeSideResolver(game) {
    const votes = new Map();
    for (const p of game.plays) {
        const z = p.details.zoneCode;
        if (!p.teamId || !p.x || (z !== "O" && z !== "D")) continue;
        const k = p.period + ":" + p.teamId;
        const v = Math.sign(p.x) * (z === "O" ? 1 : -1);
        votes.set(k, (votes.get(k) ?? 0) + v);
    }
    const home = game.home.id;
    return (period, teamId, play) => {
        const defending = play?.homeDefending;
        if (defending === "left" || defending === "right") {
            const homeSide = defending === "left" ? 1 : -1;
            return teamId === home ? homeSide : -homeSide;
        }
        const v = votes.get(period + ":" + teamId) ?? 0;
        return v >= 0 ? 1 : -1;
    };
}

// Even periods are mirrored so each team attacks one end all game.
function mirror(e) {
    return e.period % 2 === 0 ? -1 : 1;
}

function track(entry, m, base = m.opacity) {
    m.transparent = true;
    entry.mats.push({ m, base });
    return m;
}

// Icons whose glyph points toward the attacked net.
const DIRECTIONAL = new Set(["shot-on-goal", "missed-shot", "blocked-shot",
    "failed-shot-attempt", "goal", "hit", "giveaway", "takeaway"]);

// Sprite shaders take length() of the scale, so a negative scale.x is lost.
// One shared geometry with mirrored UVs flips the glyph on one texture.
let flippedGeometry = null;
function mirroredGeometry(base) {
    if (flippedGeometry) return flippedGeometry;
    flippedGeometry = base.clone();
    const uv = flippedGeometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
    return flippedGeometry;
}

function sprite(entry, type, color, size, flip = false, z = ICON_Z) {
    const m = track(entry, new THREE.SpriteMaterial({
        map: iconTexture(type, hex(color)), depthWrite: false }), 1);
    const s = new THREE.Sprite(m);
    if (flip) s.geometry = mirroredGeometry(s.geometry);
    s.scale.set(size, size, 1);
    s.position.set(0, 0, z);
    s.userData.entry = entry;
    (entry.sprites ??= []).push(s);
    s.renderOrder = 3;
    return s;
}

function flat(entry, geometry, color, opacity, z = 0.12) {
    const m = track(entry, new THREE.MeshBasicMaterial({
        color, opacity, side: THREE.DoubleSide, depthWrite: false }));
    const mesh = new THREE.Mesh(geometry, m);
    mesh.position.z = z;
    mesh.renderOrder = 2;
    return mesh;
}

// Origin marker on the ice at the exact recorded location.
function originMark(entry, color) {
    const g = new THREE.Group();
    g.add(flat(entry, new THREE.CircleGeometry(1.1, 24), color, 0.95));
    g.add(flat(entry, new THREE.RingGeometry(1.1, 1.5, 24), 0xffffff, 0.95,
        0.13));
    return g;
}

function stem(entry, color, top) {
    const geom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0.1), new THREE.Vector3(0, 0, top)]);
    return new THREE.Line(geom, track(entry, new THREE.LineBasicMaterial({
        color, opacity: 0.6 })));
}

// Shot end point, local to the shot origin, in mirrored rink space.
function shotEnd(e, side, x, y) {
    const netX = side * GOAL_LINE_X;
    const reason = e.details.reason ?? "";
    switch (e.typeCode) {
        case 505:
            return new THREE.Vector3(netX + side * 1.5,
                THREE.MathUtils.clamp(y * 0.15, -2.2, 2.2), 1.6);
        case 506:
            return new THREE.Vector3(netX - side * 2.5,
                THREE.MathUtils.clamp(y * 0.3, -2.5, 2.5), 1.4);
        case 507: {
            if (/crossbar|over|high/.test(reason) && !/wide/.test(reason)) {
                return new THREE.Vector3(netX + side * 1.5,
                    THREE.MathUtils.clamp(y * 0.15, -2, 2), 5.5);
            }
            const wing = Math.sign(y) || 1;
            const high = /high/.test(reason) ? 5.5 : 1.5;
            const post = /post/.test(reason) ? 3.1 : 6;
            return new THREE.Vector3(netX + side * 3, wing * post, high);
        }
        default: {
            const dir = new THREE.Vector2(netX - x, -y);
            const len = Math.min(9, dir.length() * 0.3);
            dir.normalize().multiplyScalar(len);
            return new THREE.Vector3(x + dir.x, y + dir.y, 0.8);
        }
    }
}

function shotArc(entry, e, side, x, y, color) {
    const end = shotEnd(e, side, x, y);
    const start = new THREE.Vector3(x, y, 0.4);
    const dist = start.distanceTo(end);
    const lift = e.typeCode === 508 ? 2.5 : 2 + dist * 0.12;
    const mid = start.clone().lerp(end, 0.5);
    mid.z = Math.max(start.z, end.z) + lift;
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const radius = e.typeCode === 505 ? 0.45 : 0.28;
    const geom = new THREE.TubeGeometry(curve, 48, radius, 6, false);
    const m = track(entry, new THREE.MeshBasicMaterial({ color,
        opacity: e.typeCode === 507 ? 0.7 : 0.95, depthWrite: false }));
    const tube = new THREE.Mesh(geom, m);
    tube.renderOrder = 2;
    const g = new THREE.Group();
    g.add(tube);
    // arc lives in world space; the group is offset back by the origin
    g.position.set(-x, -y, 0);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(radius * 2.2, 12, 8),
        track(entry, new THREE.MeshBasicMaterial({ color: 0x111111,
            opacity: 1 })));
    tip.position.copy(end);
    g.add(tip);
    if (e.typeCode === 505) {
        const gm = track(entry, new THREE.SpriteMaterial({
            map: glowTexture(), color: 0xffd040,
            blending: THREE.AdditiveBlending, depthWrite: false }), 1);
        const glow = new THREE.Sprite(gm);
        glow.scale.set(12, 12, 1);
        glow.position.copy(end);
        g.add(glow);
    }
    const total = geom.index.count;
    return {
        object: g,
        step(p) {
            geom.setDrawRange(0, Math.ceil(total * p / 3) * 3);
            tip.position.copy(curve.getPoint(Math.max(0.001, p)));
        },
    };
}

function buildEvent(e, ctx) {
    const sx = mirror(e);
    const x = e.x * sx;
    const y = e.y * sx;
    const entry = { event: e, group: new THREE.Group(), mats: [],
        anim: null, bornAt: -Infinity, wasVisible: false };
    const g = entry.group;
    g.position.set(x, y, 0);
    const c = e.typeCode;
    const own = colorOf(e.teamId);
    const size = ICON_SIZE[c] ?? DEFAULT_ICON_SIZE;
    const actor = c === 508
        ? ctx.roster.get(e.details.shootingPlayerId)?.teamId ?? e.teamId
        : e.teamId;
    const flip = DIRECTIONAL.has(e.type)
        && ctx.side(e.period, actor, e) * sx < 0;

    if (c >= 505 && c <= 508) {
        const color = colorOf(actor);
        const side = ctx.side(e.period, actor, e) * sx;
        g.add(originMark(entry, color));
        const arc = shotArc(entry, e, side, x, y, color);
        g.add(arc.object);
        g.add(stem(entry, color, ICON_Z));
        g.add(sprite(entry, e.type, color, size, flip));
        entry.anim = arc.step;
    } else if (c === 503) {
        g.add(originMark(entry, own));
        const ringGeom = new THREE.RingGeometry(0.85, 1, 48);
        const ring = flat(entry, ringGeom, own, 0.9, 0.15);
        const ringMat = entry.mats[entry.mats.length - 1];
        g.add(ring);
        g.add(sprite(entry, e.type, own, size, flip));
        entry.anim = (p) => {
            // shockwave expands and dies; the origin mark stays
            const r = 1.5 + p * 6;
            ring.scale.set(r, r, 1);
            ringMat.base = 0.9 * (1 - p);
            ring.visible = p < 1;
        };
    } else if (c === 504 || c === 525) {
        const other = colorOf(ctx.opponent(e.teamId));
        // giveaway: owner loses the puck; takeaway: owner wins it
        const [from, to] = c === 504 ? [own, other] : [other, own];
        const disc = new THREE.Group();
        disc.position.z = 1.2;
        const top = flat(entry, new THREE.CircleGeometry(1.8, 32), from, 1, 0);
        const bottom = flat(entry, new THREE.CircleGeometry(1.8, 32), to, 1,
            0);
        top.material.side = THREE.FrontSide;
        bottom.material.side = THREE.FrontSide;
        bottom.rotation.x = Math.PI;
        top.position.z = 0.05;
        bottom.position.z = -0.05;
        disc.add(top, bottom);
        g.add(flat(entry, new THREE.RingGeometry(1.8, 2.2, 32), 0xffffff,
            0.9, 0.11));
        g.add(disc);
        g.add(sprite(entry, e.type, own, size, flip));
        entry.anim = (p) => {
            disc.rotation.x = Math.PI * (1 - p);
        };
    } else if (c === 502) {
        const dir = ctx.side(e.period, e.teamId, e) * sx;
        g.add(originMark(entry, own));
        const shape = new THREE.Shape();
        shape.moveTo(0, -0.6);
        shape.lineTo(3.2, -0.6);
        shape.lineTo(3.2, -1.5);
        shape.lineTo(5.4, 0);
        shape.lineTo(3.2, 1.5);
        shape.lineTo(3.2, 0.6);
        shape.lineTo(0, 0.6);
        const arrow = flat(entry, new THREE.ShapeGeometry(shape), own, 0.95,
            0.14);
        arrow.scale.x = dir;
        g.add(arrow);
        g.add(sprite(entry, e.type, own, size, flip));
        entry.anim = (p) => {
            arrow.scale.x = dir * (0.2 + 0.8 * p);
        };
    } else {
        g.add(originMark(entry, own));
        g.add(stem(entry, own, ICON_Z));
        g.add(sprite(entry, e.type, own, size, flip));
    }
    return entry;
}

function dispose(object) {
    object.traverse((o) => {
        o.geometry?.dispose();
        // icon and glow textures are cached and shared
        o.material?.dispose();
    });
}

export function clearEvents() {
    for (const { group } of rendered) {
        scene.remove(group);
        dispose(group);
    }
    rendered.length = 0;
    lastTime = null;
    pinned = null;
}

// colorMap: teamId -> 0xRRGGBB, from gameColors().
export function loadEvents(game, colorMap) {
    clearEvents();
    colors = colorMap;
    const ids = [game.away.id, game.home.id];
    const ctx = {
        roster: game.roster,
        side: makeSideResolver(game),
        opponent: (id) => (id === ids[0] ? ids[1] : ids[0]),
    };
    for (const event of game.events) {
        const entry = buildEvent(event, ctx);
        entry.group.visible = false;
        scene.add(entry.group);
        rendered.push(entry);
    }
}

function setOpacity(entry, f) {
    for (const { m, base } of entry.mats) m.opacity = base * f;
}

// Opacity by recency rank, newest first; time-based fade dimmed an
// event while its own animation was still playing.
const RECENT_OPACITY = [1, 0.92, 0.84, 0.76, 0.68, 0.6, 0.52, 0.45, 0.38, 0.31, 0.25, 0.2];

// Shows events at or before t that pass the filter. With showAll every
// such event is opaque; otherwise only the newest RECENT_OPACITY.length
// stay, dimmer by rank. Entry animation runs only on small forward steps,
// so scrubs and loads land on the settled state. Returns the visible count.
export function applyVisibility(t, passes, showAll) {
    const stepping = lastTime !== null && t >= lastTime
        && t - lastTime <= 30;
    const now = performance.now();
    const shown = [];
    for (const entry of rendered) {
        const e = entry.event;
        if (e.gameSeconds <= t && passes(e)) shown.push(entry);
        else entry.rank = -1;
    }
    shown.sort((a, b) => b.event.gameSeconds - a.event.gameSeconds);
    shown.forEach((entry, i) => {
        entry.rank = showAll || i < RECENT_OPACITY.length ? i : -1;
    });
    // A pinned event stays opaque whatever the fade window or time.
    if (pinned) pinned.rank = Math.max(pinned.rank, 0);
    let n = 0;
    for (const entry of rendered) {
        const visible = entry.rank >= 0;
        if (visible && !entry.wasVisible) {
            entry.bornAt = stepping ? now : -Infinity;
        }
        entry.wasVisible = visible;
        entry.group.visible = visible;
        entry.opacity = showAll || entry === pinned ? 1
            : RECENT_OPACITY[entry.rank] ?? 0;
        if (visible) n++;
    }
    lastTime = t;
    updateFrame(now);
    return n;
}

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let pinned = null;

// Returns the event whose icon is under client point (x, y), or null.
export function pickEvent(x, y, rect) {
    ndc.set((x - rect.left) / rect.width * 2 - 1,
        -((y - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const targets = [];
    for (const entry of rendered) {
        if (entry.group.visible && entry.sprites) targets.push(...entry.sprites);
    }
    const hit = raycaster.intersectObjects(targets, false)[0];
    return hit ? hit.object.userData.entry.event : null;
}

export function setPinned(event) {
    pinned = event ? rendered.find((r) => r.event === event) ?? null : null;
}

function updateFrame(now) {
    for (const entry of rendered) {
        if (!entry.group.visible) continue;
        const p = Math.min(1, (now - entry.bornAt) / ANIM_MS);
        if (entry.anim) entry.anim(1 - (1 - p) ** 3);
        setOpacity(entry, entry.opacity);
    }
}

onFrame(updateFrame);
