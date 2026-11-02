// Renderer, camera, controls and the render loop. THREE and
// THREE.TrackballControls come from the classic CDN scripts in index.html.

const CAMERA_HOME = [0, -75, 75];

const w = window.innerWidth;
const h = window.innerHeight;
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.autoClear = false;
renderer.setSize(w, h);
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);
renderer.domElement.style.zIndex = "1";

export const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 10000);
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
