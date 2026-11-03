// Renderer, camera, controls and the render loop. THREE is the
// global set by three_global.js.

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
camera.position.set(...CAMERA_HOME);
camera.lookAt(0, 0, 0);
camera.up.set(0, 0, 1);

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x878787);

export const controls = new THREE.TrackballControls(camera, renderer.domElement);
controls.minDistance = 5;
controls.maxDistance = 3000;
controls.staticMoving = false;
controls.zoomSpeed = 1.2;
controls.rotateSpeed = 1.0;
controls.panSpeed = 0.8;

export function resetCamera() {
    camera.position.set(...CAMERA_HOME);
    camera.lookAt(0, 0, 0);
    camera.up.set(0, 0, 1);
    controls.update();
}

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
// Reduced canvases in one row keep the panel above the HUD cards.
for (const c of stats.dom.children) Object.assign(c.style, { width: "60px", height: "36px" });
document.body.appendChild(stats.dom);

const frameHooks = [];

// fn(nowMs) runs once per animation frame before rendering.
export function onFrame(fn) {
    frameHooks.push(fn);
}

function animate(now) {
    requestAnimationFrame(animate);
    for (const fn of frameHooks) fn(now);
    controls.update();
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
    controls.update();
    renderer.setSize(w, h);
});

renderTools();
requestAnimationFrame(animate);
