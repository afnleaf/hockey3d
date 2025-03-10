//event_id,             0
//type_code,            1
//event_type,           2
//period,               3
//time_period_mmss,     4
//time_period_seconds,  5
//time_game_seconds,    6
//x_coord,              7
//y_coord,              8
//player_id,            9
//team_id,              10
//shot_type,            11
//shot_miss_reason,     12
//highlight_clip_url    13


// parse data from csv string
function parseCSV() {
    const ds = [];
    let l = "";
    for(let i = 0; i < csv.length; i++) {
        if(csv[i] != "\n") {
            l += csv[i];
        } else {
            l += ",";
            ds.push(parseLine(l));
            l = "";
        }
    }
    return ds;
}

// parse line for values
function parseLine(l) {
    const d = [];
    let v = "";
    for(let i = 0; i < l.length; i++) {
        if(l[i] != ",") {
            v += l[i];
        } else {
            d.push(parseFloat(v));
            v = "";
        }
    }
    return d;
}

function calcVectors(xyz) {
    let vectors = [];
    for(let i = 0; i < xyz.length; i++) {
        vectors.push(new THREE.Vector3(xyz[i][0], xyz[i][1], xyz[i][2]));
    }
    return vectors;
}

//goal                //505
//shot-on-goal        //506
//missed-shot         //507
//blocked-shot        //508
//takeaway            //525
//penalty             //509
//giveaway            //504
//hit                 //503
//faceoff             //502
//failed-shot-attempt //537

//505
//506
//507
//508
//525
//509
//504
//503
//502
//537





const DEFAULT_SIZE = 1.5;
const DEFAULT_HEIGHT = 1;
const DEFAULT_ALPHA = 0.1;

const sizes = {
    505: 6,
    506: 3.5,
    507: 2,
    508: 1.9,
    525: 4,
    509: 4,
    504: 5,
    503: 3.5,
    502: 1.5,
    537: 1.5,
}

const heights = {
    505: 4,
    506: 3,
    507: 2,
}

const alphas = {
    505: 1.0,
    506: 0.75,
    507: 0.5,
} 

//503
//502
//506
//508
//507
//504
//525
//509
//505
//537

// hash table for team id: hex colors
//const colors = {
//    //10: 0x082057,
//    //23: 0x0a1b2b
//    //23: 0xf5e4d4,
//    //23: 0xff1111,
//    66: 0xfed000,
//    60: 0xff1111,
//}
//
const teamColors = {
    1: 0xCC0000,
    2: 0x00468B,
    3: 0x154B94,
    4: 0x000000,
    5: 0x000000,
    6: 0x010101,
    7: 0x003087,
    8: 0xA6192E,
    9: 0x010101,
    10: 0x00205B,
    12: 0xFFFFFF,
    13: 0x041E42,
    14: 0x00205B,
    15: 0x041E42,
    16: 0x010101,
    17: 0xC8102E,
    18: 0xFFFFFF,
    19: 0x004986,
    20: 0xC8102E,
    21: 0xFFFFFF,
    22: 0x00205B,
    23: 0x00205B,
    24: 0x010101,
    25: 0x000000,
    26: 0xA2AAAD,
    28: 0x010101,
    29: 0x041E42,
    30: 0x0E4431,
    52: 0x041E42,
    54: 0x000000,
    55: 0x001425,
    59: 0x6CACE4,
};

function renderPoint(d) {
    const c = d[1];
    const p = d[3];

    let x = d[7];
    let y = d[8];
    
    // mirror during 2nd period
    // easy to do cause around 0,0,0
    if((p % 2) == 0) {
        x = -x;
        y = -y;
    }

    // if code in table then take the value else default
    const size = sizes.hasOwnProperty(c) ? sizes[c] : DEFAULT_SIZE;
    const z = heights.hasOwnProperty(c) ? heights[c] : DEFAULT_HEIGHT;
    const alpha = alphas.hasOwnProperty(c) ? alphas[c] : DEFAULT_ALPHA;
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', 
        new THREE.Float32BufferAttribute([
            x,
            y,
            z,
        ], 3));

    const color = teamColors[parseInt(d[10])]
    const material = new THREE.PointsMaterial({ 
        color: color,
        size: size,
        transparent: true,
        opacity: alpha
    });
    
    const point = new THREE.Points(geometry, material);
    scene.add(point);
}

function renderEvents(data) {
    //let points = [];
    data.forEach((d) => {
        renderPoint(d);
    //points.push(point);
    });
}

// render the river and animate it
function renderGame() {
    console.log("test1");
    let data = parseCSV();
    renderEvents(data);
    console.log("test2");
    renderRink();
}


// render visual helpers
function renderTools() {
    const size = 1000;
    const divisions = 40;
    const gridHelper = new THREE.GridHelper( size, divisions );
    gridHelper.rotation.x = Math.PI / 2;
    scene.add( gridHelper );
    const axesHelper = new THREE.AxesHelper( 500 );
    //const red = new THREE.Color("rgb(255, 0, 0)");
    //const green = new THREE.Color("rgb(0, 255, 0)");
    //const blue = new THREE.Color("rgb(0, 0, 255)");
    //axesHelper.setColors(red, green, blue);
    scene.add(axesHelper);
}

// global render
const w = window.innerWidth;
const h = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.autoClear = false;
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

// global cam
const fov = 75;
const aspect = w / h;
const near = 0.1;
const far = 10000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
// set cam default
//x, y, z
camera.position.set(0, -75, 75);
//camera.position.set(50, -200, 75);
camera.lookAt(0, 0, 0);
camera.up.set(0, 0, 1);

// global scene
const scene = new THREE.Scene();

//scene.background = new THREE.Color(0xe8e6d8);
scene.background = new THREE.Color(0x878787);

// update the renderer for better visual effects
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// do this once
//const textureLoader = new THREE.TextureLoader();
//const icogeo = new THREE.IcosahedronGeometry(1, 16);

// make sure three.js canvas is below the HUD
document.querySelector('canvas').style.zIndex = '1';

render();


// global controls
const controls = new THREE.TrackballControls(camera, renderer.domElement);
controls.enable = true;
controls.minDistance = 5;
controls.maxDistance = 3000;
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.staticMoving = false;
controls.zoomSpeed = 1.2;
controls.rotateSpeed = 1.0;
controls.panSpeed = 0.8;

renderTools();
renderGame();



// render the rendering renderer
function render() {
    renderer.render(scene, camera)
}

// animate the scene lel
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    render();
}

window.addEventListener("resize", () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    controls.update();
    renderer.setSize(w, h);
    render();
});

animate();

