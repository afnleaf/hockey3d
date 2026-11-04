// Renderer, camera, controls and the render loop. THREE is the
// global set by three_global.js.
import { RinkControls } from "./rinkControls.js";

const CAMERA_HOME = [0, -75, 75];

const w = window.innerWidth;
const h = window.innerHeight;
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.autoClear = false;
// Capped at 2: 3x displays would add 2.25x fill cost for little visible gain.
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(w, h);
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);
renderer.domElement.style.zIndex = "1";

// Near plane sets depth precision; at 0.1 the 0.05ft gaps between ice layers z-fight.
export const camera = new THREE.PerspectiveCamera(75, w / h, 1, 4000);

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x878787);

export const controls = new RinkControls(camera, renderer.domElement);
{
    const [x, y, z] = CAMERA_HOME;
    const dist = Math.hypot(x, y, z);
    controls.flyTo({ x: 0, y: 0, dist, az: Math.atan2(y, x), tilt: Math.asin(z / dist) }, 0);
}

// 35° elevation gives the broadcast look; nets sit at x=±89, benches at +y.
const TILT = 35 * Math.PI / 180;
// Matches the controls' TILT_MAX so a preset is not clamped after the tween.
const BIRD_TILT = 85 * Math.PI / 180;
// Boards outline plus cap height; the fit keeps all of it on screen.
const FIT_POINTS = [];
for (const x of [-100, 0, 100]) for (const y of [-42.5, 42.5]) for (const z of [0, 3.5])
    FIT_POINTS.push(new THREE.Vector3(x, y, z));
// Scoreboard on top, timeline at the bottom (CSS px).
const HUD_TOP = 64;
const HUD_BOTTOM = 72;
const HUD_SIDE = 8;
export const CAMERA_PRESETS = [
    { name: "Penalty box side", az: -Math.PI / 2, tilt: TILT },
    { name: "Bench side", az: Math.PI / 2, tilt: TILT },
    { name: "Left net bottom", az: Math.PI, tilt: TILT },
    { name: "Right net bottom", az: 0, tilt: TILT },
    { name: "Penalty box side, top", az: -Math.PI / 2, tilt: BIRD_TILT },
    { name: "Bench side, top", az: Math.PI / 2, tilt: BIRD_TILT },
    { name: "Left net bottom, top", az: Math.PI, tilt: BIRD_TILT },
    { name: "Right net bottom, top", az: 0, tilt: BIRD_TILT },
];

function presetPos(az, tilt, d) {
    return [d * Math.cos(tilt) * Math.cos(az), d * Math.cos(tilt) * Math.sin(az), d * Math.sin(tilt)];
}

const fitCam = new THREE.PerspectiveCamera();
const fitV = new THREE.Vector3();
// Smallest distance at which the rink fits inside the HUD-free area.
function fitDistance(az, tilt, aspect, insets) {
    fitCam.fov = camera.fov;
    fitCam.aspect = aspect;
    fitCam.near = camera.near;
    fitCam.far = camera.far;
    fitCam.up.set(0, 0, 1);
    fitCam.updateProjectionMatrix();
    const fits = (d) => {
        fitCam.position.set(...presetPos(az, tilt, d));
        fitCam.lookAt(0, 0, 0);
        fitCam.updateMatrixWorld();
        return FIT_POINTS.every((p) => {
            fitV.copy(p).project(fitCam);
            return fitV.z < 1 && fitV.x >= -1 + insets.side && fitV.x <= 1 - insets.side
                && fitV.y >= -1 + insets.bottom && fitV.y <= 1 - insets.top;
        });
    };
    let lo = 8, hi = 800;
    for (let k = 0; k < 30; k++) {
        const mid = (lo + hi) / 2;
        if (fits(mid)) hi = mid; else lo = mid;
    }
    return hi;
}

// Measured from the live HUD so phone and desktop layouts both fit.
function screenInsets() {
    const w = window.innerWidth, h = window.innerHeight;
    let top = HUD_TOP, bottom = HUD_BOTTOM;
    const board = document.getElementById("scoreboard")?.getBoundingClientRect();
    if (board && board.height) top = board.bottom + HUD_SIDE;
    const bar = document.getElementById("timeline")?.getBoundingClientRect();
    if (bar && bar.height) bottom = h - bar.top + HUD_SIDE;
    return { top: 2 * top / h, bottom: 2 * bottom / h, side: 2 * HUD_SIDE / w };
}

export function presetPose(i, aspect = camera.aspect, insets = screenInsets()) {
    const p = CAMERA_PRESETS[i];
    const dist = fitDistance(p.az, p.tilt, aspect, insets);
    return { az: p.az, tilt: p.tilt, dist, pos: presetPos(p.az, p.tilt, dist) };
}

const TWEEN_MS = 600;

// Presets orbit centre ice, so the tween runs in the controls' spherical state.
export function setCameraPreset(i, animate = true) {
    const p = CAMERA_PRESETS[i];
    if (!p) return;
    localStorage.setItem("hokej.camera", String(i));
    const { az, tilt, dist } = presetPose(i);
    controls.flyTo({ x: 0, y: 0, dist, az, tilt }, animate ? TWEEN_MS : 0);
}

const THUMB_W = 160;
const THUMB_H = 90;

// Rendered once per call; toDataURL must run in the same task as render
// because the drawing buffer is not preserved.
export function presetSnapshots() {
    const cam = new THREE.PerspectiveCamera(camera.fov, THUMB_W / THUMB_H, camera.near, camera.far);
    const src = renderer.domElement;
    const out = document.createElement("canvas");
    out.width = THUMB_W;
    out.height = THUMB_H;
    const ctx = out.getContext("2d");
    const urls = CAMERA_PRESETS.map((p, i) => {
        cam.position.set(...presetPose(i, src.width / src.height).pos);
        cam.up.set(0, 0, 1);
        cam.lookAt(0, 0, 0);
        cam.aspect = src.width / src.height;
        cam.updateProjectionMatrix();
        renderer.clear();
        renderer.render(scene, cam);
        const sw = Math.min(src.width, src.height * THUMB_W / THUMB_H);
        const sh = sw * THUMB_H / THUMB_W;
        ctx.drawImage(src, (src.width - sw) / 2, (src.height - sh) / 2, sw, sh, 0, 0, THUMB_W, THUMB_H);
        return out.toDataURL("image/jpeg", 0.8);
    });
    renderer.clear();
    renderer.render(scene, camera);
    return urls;
}

const saved = Number(localStorage.getItem("hokej.camera"));
if (Number.isInteger(saved) && CAMERA_PRESETS[saved]) setCameraPreset(saved, false);

const debugHelpers = new THREE.Group();
function renderTools() {
    const gridHelper = new THREE.GridHelper(1000, 40);
    gridHelper.rotation.x = Math.PI / 2;
    debugHelpers.add(gridHelper, new THREE.AxesHelper(500));
    debugHelpers.visible = false;
    scene.add(debugHelpers);
}

// Exposed so headless probes can read renderer.info.
window.__renderer = renderer;

const stats = new THREE.Stats();
const triPanel = stats.addPanel(new THREE.Stats.Panel("ktri", "#ff8", "#221"));
const drawPanel = stats.addPanel(new THREE.Stats.Panel("draws", "#f8f", "#212"));
Object.assign(stats.dom.style, {
    zIndex: "3000", left: "auto", right: "0", top: "0",
    display: "flex", opacity: "0.8",
});
// One row of reduced canvases fits beside the scoreboard on a phone.
for (const c of stats.dom.children) Object.assign(c.style, { width: "60px", height: "36px" });
document.body.appendChild(stats.dom);

let statsWanted = false;
let statsInGame = false;
export function setStatsVisible(shown) {
    statsWanted = shown;
    const on = statsWanted && statsInGame;
    stats.dom.style.display = on ? "flex" : "none";
    debugHelpers.visible = on;
}
export function setStatsInGame(inGame) {
    statsInGame = inGame;
    setStatsVisible(statsWanted);
}

const frameHooks = [];

// fn(nowMs) runs once per animation frame before rendering.
export function onFrame(fn) {
    frameHooks.push(fn);
}

function animate(now) {
    requestAnimationFrame(animate);
    for (const fn of frameHooks) fn(now);
    controls.update(now);
    renderer.render(scene, camera);
    triPanel.update(renderer.info.render.triangles / 1000, 500);
    drawPanel.update(renderer.info.render.calls, 2000);
    stats.update();
}

window.addEventListener("resize", () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
});

renderTools();
requestAnimationFrame(animate);
