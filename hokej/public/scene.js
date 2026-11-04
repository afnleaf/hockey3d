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
const SIDE_D = 110;
const END_D = 170;
export const CAMERA_PRESETS = [
    { name: "Penalty box side", pos: [0, -SIDE_D * Math.cos(TILT), SIDE_D * Math.sin(TILT)] },
    { name: "Bench side", pos: [0, SIDE_D * Math.cos(TILT), SIDE_D * Math.sin(TILT)] },
    { name: "Left net bottom", pos: [-END_D * Math.cos(TILT), 0, END_D * Math.sin(TILT)] },
    { name: "Right net bottom", pos: [END_D * Math.cos(TILT), 0, END_D * Math.sin(TILT)] },
];

const TWEEN_MS = 600;

// Presets orbit centre ice, so the tween runs in the controls' spherical state.
export function setCameraPreset(i, animate = true) {
    const p = CAMERA_PRESETS[i];
    if (!p) return;
    localStorage.setItem("hokej.camera", String(i));
    const [x, y, z] = p.pos;
    const dist = Math.hypot(x, y, z);
    controls.flyTo({ x: 0, y: 0, dist, az: Math.atan2(y, x), tilt: Math.asin(z / dist) },
        animate ? TWEEN_MS : 0);
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
    const urls = CAMERA_PRESETS.map((p) => {
        cam.position.set(...p.pos);
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

function renderTools() {
    const gridHelper = new THREE.GridHelper(1000, 40);
    gridHelper.rotation.x = Math.PI / 2;
    scene.add(gridHelper);
    scene.add(new THREE.AxesHelper(500));
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

export function setStatsVisible(shown) {
    stats.dom.style.display = shown ? "flex" : "none";
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
