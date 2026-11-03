import { scene, renderer } from "./scene.js";

export function renderRink() {
    renderIce();
    renderBoards();
    renderGlass();
    renderBenches();
    renderLines();
    renderNets();
    renderLights();
    renderGoalLights();
}

// Unlit Daktronics units behind both nets; events.js overlays the lit domes on a goal.
function renderGoalLights() {
    const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 });
    const dome = new THREE.SphereGeometry(0.35, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    for (const dir of [-1, 1]) {
        const g = new THREE.Group();
        g.position.set(dir * 96, 0, 9);
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.2, 0.5), dark));
        for (const [y, color] of [[-0.75, 0xd01010], [0, 0x10a030], [0.75, 0xd01010]]) {
            const d = new THREE.Mesh(dome, new THREE.MeshStandardMaterial({ color,
                roughness: 0.3, transparent: true, opacity: 0.85 }));
            d.rotation.x = Math.PI / 2;
            d.position.set(0, y, 0.25);
            g.add(d);
        }
        scene.add(g);
    }
}

// position ranges from -100 to 100 meters on the x-axis and -42.5 to 42.5 meters on the y-axis 
function renderIce() {
    // NHL rink dimensions
    const geometry = new THREE.ShapeGeometry(roundedRect(RINK_W / 2, RINK_H / 2, CORNER_R));
    const base = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
        color: 0xf7f9fc, metalness: 0, roughness: 0.6,
        envMap: arenaEnvironment(), envMapIntensity: 0.9,
    }));
    base.renderOrder = -2;
    scene.add(base);
    // Clear layer over the paint, as in a real rink where lines are frozen in.
    // Above markings (z <= 0.06), below event discs (z 0.12).
    const coat = new THREE.MeshPhysicalMaterial({
        color: 0xf2f8fc, roughness: 0.05, transmission: 0.9, thickness: 0.1,
        side: THREE.DoubleSide, transparent: true, depthWrite: false,
    });
    const sheet = new THREE.Mesh(geometry, coat);
    sheet.position.z = 0.08;
    sheet.renderOrder = 5;
    scene.add(sheet);
}

// Arena surroundings for the ice to reflect: a dark bowl with a grid of
// light banks over the sheet. Built as a scene so the lights sit in the
// rink's z-up frame; a y-up equirect would put them on the horizon.
function arenaEnvironment() {
    const env = new THREE.Scene();
    env.background = new THREE.Color(0xd8dde3);
    // Dark stands band near the horizon: grazing views mirror it, which is what makes ice read as wet.
    const stands = new THREE.Mesh(
        new THREE.CylinderGeometry(150, 150, 60, 48, 1, true),
        new THREE.MeshBasicMaterial({ color: 0x34383f, side: THREE.DoubleSide }));
    stands.rotation.x = Math.PI / 2;
    stands.position.z = 20;
    env.add(stands);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const target = pmrem.fromScene(env, 0.01);
    pmrem.dispose();
    return target.texture;
}

// Artwork fits inside the 15 ft centre circle, clear of its line.
const LOGO_FIT_R = 14;
const LOGO_TEX = 1024;
let centerLogo = null;
let logoToken = 0;

// url must allow CORS (relay /logo/), or the canvas taints and WebGL rejects it.
export function renderCenterLogo(url) {
    const token = ++logoToken;
    if (centerLogo) {
        scene.remove(centerLogo);
        centerLogo.geometry.dispose();
        centerLogo.material.map.dispose();
        centerLogo.material.dispose();
        centerLogo = null;
    }
    if (!url) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
        if (token !== logoToken) return;
        // SVGs without intrinsic size report 0; treat them as square.
        const w = img.naturalWidth || 1, h = img.naturalHeight || 1;
        const s = LOGO_TEX / Math.max(w, h);
        const dw = w * s, dh = h * s;
        const planeFt = 2 * LOGO_FIT_R;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = LOGO_TEX;
        const ctx = canvas.getContext("2d");
        // Painted-in ice logos read muted next to the arena's line paint.
        ctx.filter = "saturate(0.7)";
        ctx.drawImage(img, (LOGO_TEX - dw) / 2, (LOGO_TEX - dh) / 2, dw, dh);
        const map = new THREE.CanvasTexture(canvas);
        map.encoding = THREE.sRGBEncoding;
        map.anisotropy = 8;
        const material = new THREE.MeshBasicMaterial({ map, transparent: true,
            opacity: 0.42, depthWrite: false,
            polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
        centerLogo = new THREE.Mesh(new THREE.PlaneGeometry(planeFt, planeFt), material);
        // Painted under the lines in real arenas; drawn before them so the line always wins.
        centerLogo.position.set(0, 0, 0.02);
        centerLogo.renderOrder = -1;
        scene.add(centerLogo);
    };
    img.src = url;
}

const RINK_W = 200;
const RINK_H = 85;
const CORNER_R = 28;
const BOARD_T = 0.3;
const BOARD_H = 3.5;
// NHL kick plates are yellow, about 10 in high.
const KICK_H = 10 / 12;

function roundedRect(hw, hh, r) {
    const s = new THREE.Shape();
    s.moveTo(-hw + r, -hh);
    s.lineTo(hw - r, -hh);
    s.absarc(hw - r, -hh + r, r, -Math.PI / 2, 0, false);
    s.lineTo(hw, hh - r);
    s.absarc(hw - r, hh - r, r, 0, Math.PI / 2, false);
    s.lineTo(-hw + r, hh);
    s.absarc(-hw + r, hh - r, r, Math.PI / 2, Math.PI, false);
    s.lineTo(-hw, -hh + r);
    s.absarc(-hw + r, -hh + r, r, Math.PI, Math.PI * 1.5, false);
    return s;
}

function boardRing(z, height, color, t = BOARD_T) {
    const outer = roundedRect(RINK_W / 2 + t, RINK_H / 2 + t, CORNER_R + t);
    outer.holes.push(roundedRect(RINK_W / 2, RINK_H / 2, CORNER_R));
    const geometry = new THREE.ExtrudeGeometry(outer, {
        depth: height, bevelEnabled: false, curveSegments: 24,
    });
    const mesh = new THREE.Mesh(geometry,
        new THREE.MeshStandardMaterial({ color, roughness: 0.6 }));
    mesh.position.z = z;
    scene.add(mesh);
}

function renderBoards() {
    boardRing(0, KICK_H, 0xf2c500);
    boardRing(KICK_H, BOARD_H - KICK_H, 0xf4f4f0);
    // A 0.01 ft gap alone z-fights at camera distance; depth bias settles it.
    const stripes = [[0, 1, 0xce3434], [-25.5, 1, 0x032cc4], [25.5, 1, 0x032cc4]];
    const h = BOARD_H;
    for (const [x, w, color] of stripes) {
        const material = new THREE.MeshStandardMaterial({ color, roughness: 0.6,
            polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
        for (const side of [-1, 1]) {
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
            mesh.rotation.x = side * Math.PI / 2;
            // In front of the door panels (0.02) and jambs (0.05) so doors carry the paint.
            mesh.position.set(x, side * (RINK_H / 2 - 0.06), h / 2);
            scene.add(mesh);
        }
    }
}

// Rule 1.3: 8ft above the boards at the ends, at least 6ft along the sides,
// and glass in front of the penalty benches. Player benches stay open.
const GLASS_END_H = 8;
const GLASS_SIDE_H = 6;
const GLASS_PANEL = 5;
// Stanchions must stay wider than a pixel on the far boards or the glass reads as one sheet.
const STANCHION_W = 0.25;

function renderGlass() {
    const W = RINK_W / 2 + BOARD_T / 2, H = RINK_H / 2 + BOARD_T / 2, r = CORNER_R + BOARD_T / 2;
    const sx = W - r, sy = H - r;
    const quads = [], posts = [];
    const pushPanel = (a, b, top, base = BOARD_H) => {
        quads.push(a.x, a.y, base, b.x, b.y, base, b.x, b.y, top,
            a.x, a.y, base, b.x, b.y, top, a.x, a.y, top);
        posts.push([a, b, top, base]);
    };
    const ringPanel = (a, b) => {
        const mx = (a.x + b.x) / 2;
        pushPanel(a, b, BOARD_H + (Math.abs(mx) > sx + 0.01 ? GLASS_END_H : GLASS_SIDE_H));
    };
    // Each straight run and arc is split on its own so panels stay even and every cut gets a post.
    const line = (x0, y0, x1, y1) => {
        const k = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / GLASS_PANEL));
        for (let i = 0; i < k; i++) ringPanel(
            { x: x0 + (x1 - x0) * i / k, y: y0 + (y1 - y0) * i / k },
            { x: x0 + (x1 - x0) * (i + 1) / k, y: y0 + (y1 - y0) * (i + 1) / k });
    };
    const arc = (cx, cy, t0) => {
        const k = Math.max(1, Math.round(Math.PI / 2 * r / GLASS_PANEL));
        const p = (i) => { const t = t0 + Math.PI / 2 * i / k; return { x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) }; };
        for (let i = 0; i < k; i++) ringPanel(p(i), p(i + 1));
    };
    line(-sx, -H, sx, -H);
    arc(sx, -sy, -Math.PI / 2);
    line(W, -sy, W, sy);
    arc(sx, sy, 0);
    const cuts = [sx, ...BENCH_SPANS.flat().sort((p, q) => q - p), -sx];
    for (let i = 0; i < cuts.length; i += 2) line(cuts[i], H, cuts[i + 1], H);
    arc(-sx, sy, Math.PI / 2);
    line(-W, sy, -W, -sy);
    arc(-sx, -sy, Math.PI);
    // Rule 1.10: partitions around benches and penalty boxes, glass on the back and ends.
    const edge = RINK_H / 2 + BOARD_T;
    const top = BOARD_H + GLASS_SIDE_H;
    for (const [spans, side] of [[BENCH_SPANS, 1], [PBOX_SPANS, -1]]) {
        const back = side * (edge + BENCH_DEPTH);
        for (const [x0, x1] of spans) {
            // Photo: penalty boxes have a low rear wall with no glass above it.
            const k = side > 0 ? Math.max(1, Math.round((x1 - x0) / GLASS_PANEL)) : 0;
            for (let i = 0; i < k; i++) {
                const xa = x0 + (x1 - x0) * i / k, xb = x0 + (x1 - x0) * (i + 1) / k;
                pushPanel({ x: xa, y: back }, { x: xb, y: back }, top, BOARD_H + FRAME_H);
            }
            for (const x of [x0, x1]) {
                pushPanel({ x, y: side * edge }, { x, y: back }, top);
            }
        }
    }
    const capMat = new THREE.MeshStandardMaterial({ color: 0x1a3c8c, roughness: 0.5 });
    for (const [x0, x1] of [...PBOX_SPANS, OFFICIALS_SPAN]) {
        const cap = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.35, 0.35), capMat);
        cap.position.set((x0 + x1) / 2, -(RINK_H / 2 + BOARD_T / 2), top);
        scene.add(cap);
    }
    const pane = new THREE.BufferGeometry();
    pane.setAttribute("position", new THREE.Float32BufferAttribute(quads, 3));
    pane.computeVertexNormals();
    // depthWrite off so the ice and players behind the glass still draw through it.
    scene.add(new THREE.Mesh(pane, new THREE.MeshStandardMaterial({
        color: 0xcfdde6, roughness: 0.1, metalness: 0, transparent: true, opacity: 0.12,
        side: THREE.DoubleSide, depthWrite: false })));
    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.translate(0, 0, 0.5);
    const mat = new THREE.MeshStandardMaterial({ color: 0xe8eef2, roughness: 0.5,
        transparent: true, opacity: 0.7 });
    const inst = new THREE.InstancedMesh(geo, mat, posts.length * 3);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), z = new THREE.Vector3(0, 0, 1);
    let k = 0;
    for (const [a, b, top, base] of posts) {
        const ang = Math.atan2(b.y - a.y, b.x - a.x);
        q.setFromAxisAngle(z, ang);
        const h = top - base;
        m.compose(new THREE.Vector3(a.x, a.y, base), q, new THREE.Vector3(STANCHION_W, 0.15, h));
        inst.setMatrixAt(k++, m);
        // End post too: where a tall panel meets a short one, the short panel's post leaves the step unframed.
        m.compose(new THREE.Vector3(b.x, b.y, base), q, new THREE.Vector3(STANCHION_W, 0.15, h));
        inst.setMatrixAt(k++, m);
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        m.compose(new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2, top - 0.1), q,
            new THREE.Vector3(len, 0.2, 0.2));
        inst.setMatrixAt(k++, m);
    }
    scene.add(inst);
}

// Spans are typical arena values, not rulebook: benches far side from the
// home camera, penalty boxes and officials' box on the camera side.
const BENCH_DEPTH = 6;
// Reference photo: bench runs end ~4 ft past the blue lines.
const BENCH_SPANS = [[-31, -3], [3, 31]];
const PBOX_SPANS = [[-13, -3], [3, 13]];
const OFFICIALS_SPAN = [-2.5, 2.5];
const FRAME_H = 4;
const DOOR_W = 4;
const benchStrips = [];

function renderBenches() {
    const m = (color, roughness = 0.7) => new THREE.MeshStandardMaterial({ color, roughness });
    const mats = {
        floor: m(0x2a2a2e, 0.9),
        wall: m(0x3a3a40),
        frame: m(0x14224a, 0.5),
        pad: m(0x1c1c20, 0.8),
        desk: m(0x5a4a3a, 0.6),
        seat: m(0x24242a, 0.9),
        door: new THREE.MeshStandardMaterial({ color: 0xd8d8d2, roughness: 0.6,
            polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    };
    BENCH_SPANS.forEach(([x0, x1], i) => {
        const len = x1 - x0;
        addEnclosure([x0, x1], 1, mats, [x0 + 1 + DOOR_W / 2, x1 - 1 - DOOR_W / 2]);
        const { box, edge } = enclosureBox(1);
        // Riser step, then padded bench along the back wall.
        box(len - 0.6, 3, 0.5, (x0 + x1) / 2, edge + BENCH_DEPTH - 1.5, 0.45, mats.wall);
        box(len - 0.6, 1.5, 1.2, (x0 + x1) / 2, edge + BENCH_DEPTH - 0.9, 1.3, mats.pad);
        const strip = m(0x888888, 0.5);
        benchStrips[i] = strip;
        box(len - 0.6, 0.05, 1, (x0 + x1) / 2, edge + BENCH_DEPTH - 0.2, BOARD_H + 1.5, strip);
    });
    for (const [x0, x1] of PBOX_SPANS) {
        const door = x0 < 0 ? x1 - DOOR_W / 2 - 0.5 : x0 + DOOR_W / 2 + 0.5;
        addEnclosure([x0, x1], -1, mats, [door]);
        const { box, edge } = enclosureBox(-1);
        box(x1 - x0 - 0.6, 1.5, 1.5, (x0 + x1) / 2, -(edge + BENCH_DEPTH - 1), 0.95, mats.pad);
    }
    addEnclosure(OFFICIALS_SPAN, -1, mats, [0]);
    const { box, edge } = enclosureBox(-1);
    box(OFFICIALS_SPAN[1] - OFFICIALS_SPAN[0] - 0.6, 2, 3, 0, -(edge + BENCH_DEPTH - 1.2), 1.5, mats.desk);
}

// Home on the -x bench, away on the +x bench.
export function setBenchColors(home, away) {
    if (benchStrips[0]) benchStrips[0].color.set(home);
    if (benchStrips[1]) benchStrips[1].color.set(away);
}

const BOX_SEATS = 3;
const boxFigures = [[], []];

// +y faces the ice, +z is up; sizes in feet for a padded seated player.
function makeSeatedPlayer() {
    const group = new THREE.Group();
    const jersey = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8, flatShading: true });
    const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6, flatShading: true });
    const part = (geo, mat, x, y, z, rx = 0) => {
        const m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        m.rotation.x = rx;
        group.add(m);
        return m;
    };
    const limb = (r0, r1, len) => new THREE.CylinderGeometry(r0, r1, len, 6);
    part(new THREE.BoxGeometry(1.5, 1.0, 0.6), dark, 0, 0, 1.75);
    const torso = part(new THREE.CylinderGeometry(0.9, 0.68, 1.9, 8), jersey, 0, 0, 3.0, Math.PI / 2);
    torso.scale.z = 0.62;
    part(new THREE.BoxGeometry(2.0, 1.1, 0.35), jersey, 0, 0, 3.85);
    part(limb(0.22, 0.22, 0.3), dark, 0, 0, 4.1, Math.PI / 2);
    const helmet = part(new THREE.SphereGeometry(0.42, 8, 6), dark, 0, 0, 4.45);
    helmet.scale.y = 1.12;
    part(new THREE.BoxGeometry(0.6, 0.08, 0.25), new THREE.MeshStandardMaterial({
        color: 0xbcd4e6, transparent: true, opacity: 0.5, roughness: 0.1 }), 0, 0.46, 4.4);
    for (const s of [-1, 1]) {
        part(limb(0.3, 0.26, 1.6), dark, s * 0.4, 0.8, 1.75);
        part(limb(0.24, 0.2, 1.5), dark, s * 0.4, 1.6, 0.95, Math.PI / 2);
        part(new THREE.BoxGeometry(0.35, 1.05, 0.35), dark, s * 0.4, 1.75, 0.2);
        part(limb(0.24, 0.2, 1.2), jersey, s * 1.02, 0.05, 3.2, Math.PI / 2);
        part(limb(0.2, 0.18, 1.0), jersey, s * 0.9, 0.55, 2.6);
        part(new THREE.BoxGeometry(0.42, 0.45, 0.4), dark, s * 0.85, 1.1, 2.6);
    }
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const tex = new THREE.CanvasTexture(canvas);
    const chest = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    // Y flip first keeps the number upright once X turns it to face the ice.
    chest.rotation.set(Math.PI / 2, Math.PI, 0);
    chest.position.set(0, 0.56, 2.9);
    group.add(chest);
    group.visible = false;
    scene.add(group);
    return { group, jersey, canvas, tex, key: "" };
}

function paintNumber(fig, number) {
    const ctx = fig.canvas.getContext("2d");
    ctx.clearRect(0, 0, 128, 128);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 84px 'Atkinson Hyperlegible', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(number ?? ""), 64, 68);
    fig.tex.needsUpdate = true;
}

// occupants: [{ box: 0 home (-x) | 1 away (+x), color, number }], soonest release first.
export function setPenaltyBoxOccupants(occupants) {
    const edge = RINK_H / 2 + BOARD_T;
    for (const box of [0, 1]) {
        const [x0, x1] = PBOX_SPANS[box];
        const inBox = occupants.filter((o) => o.box === box).slice(0, BOX_SEATS);
        const figs = boxFigures[box];
        while (figs.length < BOX_SEATS) figs.push(makeSeatedPlayer());
        const step = (x1 - x0 - 2) / BOX_SEATS;
        figs.forEach((fig, i) => {
            const o = inBox[i];
            fig.group.visible = !!o;
            if (!o) return;
            const key = `${o.color}|${o.number}`;
            if (fig.key !== key) {
                fig.jersey.color.set(o.color);
                paintNumber(fig, o.number);
                fig.key = key;
            }
            fig.group.position.set(x0 + 1 + step * (i + 0.5), -(edge + BENCH_DEPTH - 2.6), 0);
        });
    }
}

function enclosureBox() {
    const edge = RINK_H / 2 + BOARD_T;
    const box = (w, d, h, x, y, z, mat) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, d, h), mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
    };
    return { box, edge };
}

function addEnclosure([x0, x1], side, mats, doors) {
    const len = x1 - x0, cx = (x0 + x1) / 2;
    const edge = RINK_H / 2 + BOARD_T;
    const cy = side * (edge + BENCH_DEPTH / 2);
    const box = (w, d, h, x, y, z, mat) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, d, h), mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
    };
    box(len, BENCH_DEPTH, 0.2, cx, cy, 0.1, mats.floor);
    box(len, 0.3, BOARD_H + FRAME_H, cx, side * (edge + BENCH_DEPTH),
        (BOARD_H + FRAME_H) / 2, mats.wall);
    for (const x of [x0, x1]) {
        box(0.3, BENCH_DEPTH, BOARD_H, x, cy, BOARD_H / 2, mats.wall);
        box(0.3, 0.3, BOARD_H, x, side * edge, BOARD_H / 2, mats.frame);
    }
    for (const x of doors) {
        // Door panel on the rink face of the boards, with frame jambs.
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(DOOR_W, BOARD_H - 0.2), mats.door);
        panel.rotation.x = side * Math.PI / 2;
        panel.position.set(x, side * (RINK_H / 2 - 0.02), BOARD_H / 2);
        scene.add(panel);
        for (const jx of [x - DOOR_W / 2, x + DOOR_W / 2]) {
            box(0.15, 0.1, BOARD_H, jx, side * (RINK_H / 2 - 0.05), BOARD_H / 2, mats.frame);
        }
    }
}


function renderLines() {
    const geometry = new THREE.PlaneGeometry(1, 85); 
    const material = new THREE.MeshStandardMaterial({
        color: 0xce3434,
        metalness: 0.0,
        roughness: 0.3,
        transparent: true,
        opacity: 0.92,
        side: THREE.FrontSide,
        depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    });
    const centerLine = new THREE.Mesh(geometry, material);
    centerLine.position.set(0, 0, 0.05);
    centerLine.renderOrder = 1;
    scene.add(centerLine);

    renderOffsides();
    renderGoalLines();
    renderFaceoffCircles();
}

function renderGoalLines() {
    // Goal lines sit inside the rounded corners; the chord at x=89 ends at the boards.
    const dx = 89 - (RINK_W / 2 - CORNER_R);
    const length = RINK_H - 2 * CORNER_R + 2 * Math.sqrt(CORNER_R ** 2 - dx ** 2);
    const geometry = new THREE.PlaneGeometry(2 / 12, length);
    const material = new THREE.MeshStandardMaterial({
        color: 0xce3434,
        metalness: 0.0,
        roughness: 0.3,
        transparent: true,
        opacity: 0.92,
        side: THREE.FrontSide,
    });

    const leftGoalLine = new THREE.Mesh(geometry, material);
    leftGoalLine.position.set(-89, 0, 0.05);
    
    const rightGoalLine = new THREE.Mesh(geometry, material);
    rightGoalLine.position.set(89, 0, 0.05);
    
    scene.add(leftGoalLine);
    scene.add(rightGoalLine);
}

function renderOffsides() {
    const geometry = new THREE.PlaneGeometry(1, 85);
    const material = new THREE.MeshStandardMaterial({
        color: 0x032cc4,
        metalness: 0.0,
        roughness: 0.3,
        transparent: true,
        opacity: 0.92,
        side: THREE.FrontSide,
    });

    const left_offside_line = new THREE.Mesh(geometry, material);
    left_offside_line.position.set(-25.5, 0, 0.05);
    
    const right_offside_line = new THREE.Mesh(geometry, material);
    right_offside_line.position.set(25.5, 0, 0.05);
    
    scene.add(left_offside_line);
    scene.add(right_offside_line);
}

function renderNets() {
    const netL = createHockeyNet();
    netL.rotation.z = Math.PI / 2;
    netL.rotation.y = Math.PI / 2;
    netL.position.set(-89, 0, 0);
    const netR = createHockeyNet();
    netR.rotation.z = -Math.PI / 2;
    netR.rotation.y = -Math.PI / 2;
    netR.position.set(89, 0, 0);
    
    scene.add(netL);
    scene.add(netR);
}

// Dimensions and derivation: reference/nhl_goal_frame.md. Inches, pipe centrelines.
const IN = 1 / 12;
const NET_POST_X = 74.375 / 2;
const NET_BAR_Y = 48 + 2.375 / 2;
const NET_BASE_HALF_W = (88 - 1.9) / 2;
const NET_BASE_DEPTH = 40 - 1.9 / 2;
const NET_BASE_R = 18;
const NET_TOP_DEPTH = 18;
const NET_TOP_R = 18;

// Polyline: posts' bottom ends sweep back on a tangent into the corner arcs.
function netBasePath() {
    const cx = NET_BASE_HALF_W - NET_BASE_R, cy = NET_BASE_DEPTH - NET_BASE_R;
    const dx = NET_POST_X - cx, dy = -cy, d = Math.hypot(dx, dy);
    const t0 = Math.atan2(dy, dx) + Math.acos(NET_BASE_R / d);
    const right = [[NET_POST_X, 0]];
    for (let i = 0; i <= 16; i++) {
        const t = t0 + (Math.PI / 2 - t0) * i / 16;
        right.push([cx + NET_BASE_R * Math.cos(t), cy + NET_BASE_R * Math.sin(t)]);
    }
    return [...right, ...right.slice().reverse().map(([x, y]) => [-x, y])];
}

function netTopPath() {
    const cx = NET_POST_X - NET_TOP_R, cy = NET_TOP_DEPTH - NET_TOP_R;
    const right = [[NET_POST_X, 0]];
    for (let i = 0; i <= 12; i++) {
        const t = Math.PI / 2 * i / 12;
        right.push([cx + NET_TOP_R * Math.cos(t), cy + NET_TOP_R * Math.sin(t)]);
    }
    return [...right, ...right.slice().reverse().map(([x, y]) => [-x, y])];
}

function createHockeyNet() {
    const netGroup = new THREE.Group();
    const red = new THREE.MeshStandardMaterial({ color: 0xce3434, metalness: 0, roughness: 0.8 });
    const white = new THREE.MeshStandardMaterial({ color: 0xf4f4f4, metalness: 0.2, roughness: 0.6 });

    // One cylinder per segment plus a sphere per vertex: a single TubeGeometry
    // over sharp corners resamples by arc length, cutting corners and twisting
    // its frames into self-intersecting, flickering faces.
    function tube(points, odInches, material) {
        const group = new THREE.Group();
        const r = odInches / 2 * IN;
        const pts = points.map(([x, y, z]) => new THREE.Vector3(x * IN, y * IN, z * IN));
        const up = new THREE.Vector3(0, 1, 0);
        for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1], b = pts[i];
            const len = a.distanceTo(b);
            const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 16, 1, true), material);
            c.position.copy(a).add(b).multiplyScalar(0.5);
            c.quaternion.setFromUnitVectors(up, b.clone().sub(a).normalize());
            group.add(c);
        }
        for (const p of pts) group.add(joint(p.x / IN, p.y / IN, p.z / IN, odInches, material));
        return group;
    }
    function joint(x, y, z, odInches, material) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(odInches / 2 * IN, 16, 12), material);
        s.position.set(x * IN, y * IN, z * IN);
        return s;
    }

    // Rule 2.1: posts and crossbar red, every other exterior surface white.
    netGroup.add(tube([[-NET_POST_X, 0, 0], [-NET_POST_X, NET_BAR_Y, 0],
        [NET_POST_X, NET_BAR_Y, 0], [NET_POST_X, 0, 0]], 2.375, red));
    netGroup.add(tube(netBasePath().map(([x, d]) => [x, 1.9 / 2, -d]), 1.9, white));
    netGroup.add(tube(netTopPath().map(([x, d]) => [x, NET_BAR_Y, -d]), 1.9, white));
    netGroup.add(tube([[0, NET_BAR_Y, -NET_TOP_DEPTH], [0, 1.9 / 2, -NET_BASE_DEPTH]], 1.315, white));
    netGroup.add(netting());
    netGroup.add(skirt());

    return netGroup;
}

// Arc-length resample so paths with different vertex counts loft row-for-row.
function resample(path, n) {
    const acc = [0];
    for (let i = 1; i < path.length; i++) {
        acc.push(acc[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
    }
    const total = acc[acc.length - 1], out = [];
    for (let k = 0; k <= n; k++) {
        const s = total * k / n;
        let i = 1;
        while (i < acc.length - 1 && acc[i] < s) i++;
        const f = (s - acc[i - 1]) / (acc[i] - acc[i - 1] || 1);
        out.push([path[i - 1][0] + (path[i][0] - path[i - 1][0]) * f,
            path[i - 1][1] + (path[i][1] - path[i - 1][1]) * f]);
    }
    return out;
}

let netMeshTexture = null;
// Rule 2.2: 2.5in mesh, hung as diamonds. One canvas tile is one mesh cell; UVs are in cells.
function netMaterial() {
    if (!netMeshTexture) {
        const c = document.createElement("canvas");
        c.width = c.height = 128;
        const g = c.getContext("2d");
        g.strokeStyle = "rgba(255,255,255,0.95)";
        g.lineWidth = 9;
        g.lineCap = "round";
        g.beginPath();
        g.moveTo(64, 0); g.lineTo(128, 64); g.lineTo(64, 128); g.lineTo(0, 64); g.closePath();
        g.stroke();
        netMeshTexture = new THREE.CanvasTexture(c);
        netMeshTexture.wrapS = netMeshTexture.wrapT = THREE.RepeatWrapping;
        netMeshTexture.anisotropy = 8;
        netMeshTexture.colorSpace = THREE.SRGBColorSpace;
    }
    return new THREE.MeshStandardMaterial({ map: netMeshTexture, transparent: true,
        alphaTest: 0.05, depthWrite: false, side: THREE.DoubleSide, roughness: 0.9 });
}

// rows[r][i]: one surface through several rows, so sagging cloth keeps its mesh spacing.
function loft(rows, material) {
    const n = rows[0].length, pos = [], uv = [], idx = [];
    const v = rows.map(() => 0);
    for (let r = 0; r < rows.length; r++) {
        let run = 0;
        for (let i = 0; i < n; i++) {
            if (i) run += rows[r][i].distanceTo(rows[r][i - 1]) / IN;
            const down = r ? v[r - 1] + rows[r][i].distanceTo(rows[r - 1][i]) / IN : 0;
            if (i === Math.floor(n / 2)) v[r] = down;
            const p = rows[r][i];
            pos.push(p.x, p.y, p.z);
            uv.push(run / 2.5, down / 2.5);
            if (r && i) {
                const a = (r - 1) * n + i - 1, b = a + 1, c = r * n + i - 1, d = c + 1;
                idx.push(a, c, b, b, c, d);
            }
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, material);
    m.renderOrder = 3;
    return m;
}

// Reference photo: the cord hangs slack and bellies outward between top frame and base.
const NET_SAG = 4;
function sagRows(from, to, rows) {
    const out = [];
    for (let r = 0; r <= rows; r++) {
        const t = r / rows, bulge = NET_SAG * IN * Math.sin(Math.PI * t);
        out.push(from.map((a, i) => {
            const p = a.clone().lerp(to[i], t);
            const h = new THREE.Vector2(p.x, p.z);
            const len = h.length() || 1;
            p.x += (h.x / len) * bulge;
            p.z += (h.y / len) * bulge;
            p.y -= bulge * 0.5;
            return p;
        }));
    }
    return out;
}

function netting() {
    const N = 64, v = ([x, d], y) => new THREE.Vector3(x * IN, y * IN, -d * IN);
    const top = resample(netTopPath(), N).map((p) => v(p, NET_BAR_Y));
    const base = resample(netBasePath(), N).map((p) => v(p, SKIRT_TOP));
    const bar = resample([[-NET_POST_X, 0], [NET_POST_X, 0]], N).map((p) => v(p, NET_BAR_Y));
    const material = netMaterial();
    const group = new THREE.Group();
    group.add(loft(sagRows(top, base, 12), material));
    group.add(loft([bar, top.slice().reverse()], material));
    return group;
}

// Rule 2.2: skirt starts 6in behind each post and rises at most 1in above the base.
const SKIRT_PAD_R = 1.5;
const SKIRT_TOP = 2 * SKIRT_PAD_R;
function skirt() {
    const out = netBasePath().filter((p) => p[1] >= 6);
    const pts = resample(out, 48);
    const material = new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.95 });
    const roll = new THREE.CatmullRomCurve3(pts.map(([x, d]) =>
        new THREE.Vector3(x * IN * 0.98, SKIRT_PAD_R * IN, -d * IN * 0.98)));
    return new THREE.Mesh(new THREE.TubeGeometry(roll, 96, SKIRT_PAD_R * IN, 12, false), material);
}

const endZoneFaceoffPositions = [
    { x: -69, y: -22 },
    { x: -69, y: 22 },
    { x: 69, y: -22 },
    { x: 69, y: 22 }
];

const neutralZoneFaceoffPositions = [
    { x: -20, y: -22 },
    { x: -20, y: 22 },
    { x: 20, y: -22 },
    { x: 20, y: 22 }
]

const RED = 0xce3434;
const BLUE = 0x032cc4;
const LINE_W = 2 / 12;

function markingMaterial(color, opacity) {
    return new THREE.MeshStandardMaterial({
        color, metalness: 0.0, roughness: 0.3,
        transparent: true, opacity, side: THREE.FrontSide,
        // Flat on the ice; depth bias keeps them from z-fighting with it.
        polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    });
}

function addMark(geometry, material, x, y) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, 0.06);
    scene.add(mesh);
}

function renderFaceoffCircles() {
    const red = markingMaterial(RED, 0.7);
    const ring = new THREE.RingGeometry(15 - LINE_W, 15, 160);
    const dot = new THREE.CircleGeometry(1, 48);
    const dotRing = new THREE.RingGeometry(1 - LINE_W, 1, 48);
    const dotBand = spotBand();
    const white = markingMaterial(0xffffff, 0.8);
    const whiteDot = new THREE.CircleGeometry(1 - LINE_W, 48);
    const hash = new THREE.PlaneGeometry(LINE_W, 2);
    const lLong = new THREE.PlaneGeometry(4, LINE_W);
    const lShort = new THREE.PlaneGeometry(LINE_W, 2 + 10 / 12);
    // Hash pairs are 5 ft 7 in apart (inside edges) and start at the circle.
    const hashX = (5 + 7 / 12) / 2 + LINE_W / 2;
    const hashY = Math.sqrt(15 ** 2 - hashX ** 2) + 1;

    endZoneFaceoffPositions.forEach(({ x, y }) => {
        addMark(ring, red, x, y);
        addMark(whiteDot, white, x, y);
        addMark(dotRing, red, x, y);
        addMark(dotBand, red, x, y);
        for (const sx of [-1, 1]) {
            for (const sy of [-1, 1]) {
                addMark(hash, red, x + sx * hashX, y + sy * hashY);
                addMark(lLong, red, x + sx * 4, y + sy * (0.75 + LINE_W / 2));
                addMark(lShort, red, x + sx * (2 + LINE_W / 2), y + sy * (0.75 + (2 + 10 / 12) / 2));
            }
        }
    });
    neutralZoneFaceoffPositions.forEach(({ x, y }) => addMark(dot, red, x, y));

    const blue = markingMaterial(BLUE, 0.7);
    addMark(new THREE.RingGeometry(15 - LINE_W, 15, 160), blue, 0, 0);
    addMark(new THREE.CircleGeometry(0.5, 32), blue, 0, 0);

    renderCreases();
    renderTrapezoids();
    renderRefereeCrease();
    renderGoalPaint();
}

// Rule 1.7: end-zone spots keep a 3in white strip inside the ring on each goal-facing side.
function spotBand() {
    const r = 1 - LINE_W, h = 0.75;
    const y0 = Math.sqrt(r ** 2 - h ** 2);
    const s = new THREE.Shape();
    s.moveTo(h, -y0);
    s.lineTo(h, y0);
    s.absarc(0, 0, r, Math.atan2(y0, h), Math.atan2(y0, -h), false);
    s.lineTo(-h, -y0);
    s.absarc(0, 0, r, Math.atan2(-y0, -h), Math.atan2(-y0, h) + 2 * Math.PI, false);
    return new THREE.ShapeGeometry(s, 32);
}

function renderRefereeCrease() {
    const red = markingMaterial(RED, 0.7);
    addMark(new THREE.RingGeometry(10 - LINE_W, 10, 96, 1, 0, Math.PI), red, 0, -RINK_H / 2);
}

// Rule 2.3: gloss white paint between the goal line and the base of the net.
function renderGoalPaint() {
    const material = markingMaterial(0xffffff, 0.9);
    const path = netBasePath();
    for (const side of [-1, 1]) {
        const shape = new THREE.Shape(path.map(([x, d]) =>
            new THREE.Vector2(side * (89 + 1 / 12 + d * IN), x * IN)));
        const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), material);
        mesh.position.z = 0.055;
        scene.add(mesh);
    }
}

// Crease: 8 ft wide, 6 ft radius arc centred on the goal line, red outline, light blue fill.
function creaseShape(r, half) {
    const s = new THREE.Shape();
    const a = Math.asin(half / r);
    s.moveTo(0, -half);
    s.absarc(0, 0, r, -Math.PI / 2 - (Math.PI / 2 - a), Math.PI / 2 + (Math.PI / 2 - a), true);
    s.lineTo(0, half);
    s.lineTo(0, -half);
    return s;
}

function renderCreases() {
    const inner = creaseShape(6 - LINE_W, 4 - LINE_W);
    const outline = creaseShape(6, 4);
    outline.holes.push(inner);
    const fill = new THREE.ShapeGeometry(inner, 48);
    const edge = new THREE.ShapeGeometry(outline, 48);
    const fillMat = markingMaterial(0x0ba1dc, 0.45);
    const red = markingMaterial(RED, 0.7);
    for (const side of [-1, 1]) {
        for (const [g, m] of [[fill, fillMat], [edge, red]]) {
            const mesh = new THREE.Mesh(g, m);
            mesh.position.set(side * 89, 0, 0.055);
            // Shape opens toward -x; mirror for the left net.
            if (side < 0) mesh.rotation.z = Math.PI;
            scene.add(mesh);
        }
    }
    // Rule 1.7: 5in notches on each crease side, 4ft out from the goal line.
    const notch = new THREE.PlaneGeometry(LINE_W, 5 / 12);
    for (const side of [-1, 1]) {
        for (const sy of [-1, 1]) {
            addMark(notch, red, side * (89 - 4), sy * (4 - LINE_W - 5 / 24));
        }
    }
}

// Goalie may play the puck behind the goal line only inside this: 22 ft wide at the goal line, 28 ft at the end boards.
function renderTrapezoids() {
    const red = markingMaterial(RED, 0.7);
    const dx = 100 - 89;
    const dy = 14 - 11;
    const geometry = new THREE.PlaneGeometry(Math.hypot(dx, dy), LINE_W);
    for (const side of [-1, 1]) {
        for (const sy of [-1, 1]) {
            const mesh = new THREE.Mesh(geometry, red);
            mesh.position.set(side * (89 + dx / 2), sy * (11 + dy / 2), 0.06);
            mesh.rotation.z = Math.atan2(sy * dy, side * dx);
            scene.add(mesh);
        }
    }
}

function renderLights() {
    // overhead lights
    const mainLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight1.position.set(0, 100, 100);
    scene.add(mainLight1);
    const mainLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight2.position.set(0, -100, 100);
    scene.add(mainLight2);
    
    // Arena light banks: 3 rows x 6 along, 80 ft up, so ice highlights move with the camera.
    // physicallyCorrectLights: candela with 1/d^2 falloff, so values are tuned against the render.
    for (const y of [-28, 0, 28]) {
        for (let i = 0; i < 6; i++) {
            const light = new THREE.PointLight(0xffffff, 8);
            light.position.set(-75 + i * 30, y, 80);
            scene.add(light);
        }
    }

    // subtle ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // subtle hemisphere light for better color blending
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xb4d4ff, 0.3);
    scene.add(hemiLight);
}
