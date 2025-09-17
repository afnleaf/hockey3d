
function renderRink() {
    renderIce();
    renderLines();
    renderNets();
    renderLights();
}

// position ranges from -100 to 100 meters on the x-axis and -42.5 to 42.5 meters on the y-axis 
function renderIce() {
    // NHL rink dimensions
    const geometry = new THREE.PlaneGeometry(200, 85); 
    
    // ice material with realistic properties
    const material = new THREE.MeshPhysicalMaterial({
        color: 0xf2f8fc,            // slight blue-white tint
        metalness: 0.0,             // low metalness for more icy look
        roughness: 0.05,            // smooth surface, ice
        transmission: 0.9,
        thickness: 0.1,             // material thickness for transmission
        // clearcoat worse when on
        //clearcoat: 0.0,           // add clearcoat for extra shine
        //clearcoatRoughness: 0.0,  // smooth clearcoat
        transparent: true,
        //opacity: 0.95,
        side: THREE.DoubleSide,
        //side: THREE.FrontSide,
    });

    const rink = new THREE.Mesh(geometry, material);
    rink.position.set(0, 0, 0);
    
    scene.add(rink);
    
    // subtle fog for depth
    //scene.fog = new THREE.Fog(0x878787, 100, 700);
}


function renderLines() {
    const geometry = new THREE.PlaneGeometry(1, 85); 
    const material = new THREE.MeshPhysicalMaterial({
        color: 0xff0000,
        metalness: 0.0,
        roughness: 0.05,
        transmission: 0.9,
        thickness: 0.1,
        transparent: true,
        opacity: 0.6,
        side: THREE.FrontSide,
    });
    const centerLine = new THREE.Mesh(geometry, material);
    centerLine.position.set(0, 0, 0.05);
    scene.add(centerLine);

    renderOffsides();
    renderGoalLines();
    renderFaceoffCircles();
}

function renderGoalLines() {
    const geometry = new THREE.PlaneGeometry(0.5, 85); 
    const material = new THREE.MeshPhysicalMaterial({
        color: 0xff0000,
        metalness: 0.0,
        roughness: 0.05,
        transmission: 0.9,
        thickness: 0.1,
        transparent: true,
        opacity: 0.8,
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
    const geometry = new THREE.PlaneGeometry(1.5, 85); 
    const material = new THREE.MeshPhysicalMaterial({
        color: 0x0000ff,
        metalness: 0.0,
        roughness: 0.05,
        transmission: 0.9,
        thickness: 0.1,
        transparent: true,
        opacity: 0.8,
        side: THREE.FrontSide,
    });

    const left_offside_line = new THREE.Mesh(geometry, material);
    left_offside_line.position.set(-26.5, 0, 0.05);
    
    const right_offside_line = new THREE.Mesh(geometry, material);
    right_offside_line.position.set(26.5, 0, 0.05);
    
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

// hockey Net dimensions in feet
const NET_WIDTH = 6;
const NET_HEIGHT = 4;
const NET_DEPTH = 2.5;
const PIPE_RADIUS = 0.1;

function createHockeyNet() {
    const netGroup = new THREE.Group();
    
    const pipeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      metalness: 0.8,
      //roughness: 0.2
    });

    // pipe geometry
    function createPipe(start, end) {
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        
        const geometry = new THREE.CylinderGeometry(
          PIPE_RADIUS, 
          PIPE_RADIUS, 
          length,
          8  // n segments
        );
        
        const pipe = new THREE.Mesh(geometry, pipeMaterial);
        
        // position and rotate the pipe according to start and end positions
        pipe.position.copy(start);
        pipe.position.add(direction.multiplyScalar(0.5));
        pipe.lookAt(end);
        pipe.rotateX(Math.PI / 2);
        
        return pipe;
    }

    // create the frame pipes positions
    const corners = {
        bottomLeft: new THREE.Vector3(-NET_WIDTH/2, 0, 0),
        bottomRight: new THREE.Vector3(NET_WIDTH/2, 0, 0),
        topLeft: new THREE.Vector3(-NET_WIDTH/2, NET_HEIGHT, 0),
        topRight: new THREE.Vector3(NET_WIDTH/2, NET_HEIGHT, 0),
        bottomBackLeft: new THREE.Vector3(-NET_WIDTH/2, 0, -NET_DEPTH),
        bottomBackRight: new THREE.Vector3(NET_WIDTH/2, 0, -NET_DEPTH),
        topBackLeft: new THREE.Vector3(-NET_WIDTH/2, NET_HEIGHT, -NET_DEPTH),
        topBackRight: new THREE.Vector3(NET_WIDTH/2, NET_HEIGHT, -NET_DEPTH)
    };

    // front frame
    netGroup.add(createPipe(corners.bottomLeft, corners.topLeft));
    netGroup.add(createPipe(corners.bottomRight, corners.topRight));
    netGroup.add(createPipe(corners.topLeft, corners.topRight));
    
    // back frame
    netGroup.add(createPipe(corners.bottomBackLeft, corners.bottomBackRight));
    netGroup.add(createPipe(corners.bottomBackLeft, corners.topBackLeft));
    netGroup.add(createPipe(corners.bottomBackRight, corners.topBackRight));
    netGroup.add(createPipe(corners.topBackLeft, corners.topBackRight));
    
    // connecting pipes
    netGroup.add(createPipe(corners.bottomLeft, corners.bottomBackLeft));
    netGroup.add(createPipe(corners.bottomRight, corners.bottomBackRight));
    netGroup.add(createPipe(corners.topLeft, corners.topBackLeft));
    netGroup.add(createPipe(corners.topRight, corners.topBackRight));
    
    // support pipes at back to indicate so
    const centerBottom = new THREE.Vector3(0, 0, -NET_DEPTH);
    const centerTop = new THREE.Vector3(0, NET_HEIGHT, -NET_DEPTH);
    netGroup.add(createPipe(centerBottom, centerTop));

    return netGroup;
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

function renderFaceoffCircles() {
    renderCenterFaceoffCircle();
    // puck drop
    const radius = 1;
    const segments = 64;
    const circleGeometry = new THREE.CircleGeometry(radius, segments);
    const circleMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xff0000,
        metalness: 0.0,
        roughness: 0.05,
        transmission: 0.9,
        thickness: 0.1,
        transparent: true,
        opacity: 0.95,
        side: THREE.FrontSide,
    });
    const outlineMaterial = new THREE.LineBasicMaterial({ 
        color: 0xff0000,
        linewidth: 1,
    });
    // loop through end zone faceoff pos
    endZoneFaceoffPositions.forEach(pos => {
        // puck drop
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        circle.position.set(pos.x, pos.y, 0.06);
        scene.add(circle);
        // outline
        const curve = new THREE.EllipseCurve(
            pos.x, pos.y,
            15, 15,
            0, 2 * Math.PI,
            false,
            0
        );
        const points = curve.getPoints(500);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const outline = new THREE.Line(geometry, outlineMaterial);
        scene.add(outline);
    });

    // loop through neutral zone faceoff pos
    neutralZoneFaceoffPositions.forEach(pos => {
        // puck drop
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        circle.position.set(pos.x, pos.y, 0.06);
        scene.add(circle);
    });
}

function renderCenterFaceoffCircle() {
    // puck drop
    const radius = 1;
    const segments = 64;
    const centerCircleGeometry = new THREE.CircleGeometry(radius, segments);
    const centerCircleMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x0000ff,
        metalness: 0.0,
        roughness: 0.05,
        transmission: 0.9,
        thickness: 0.1,
        transparent: true,
        opacity: 0.95,
        side: THREE.FrontSide,
    });
    const centerCircle = new THREE.Mesh(
        centerCircleGeometry, 
        centerCircleMaterial
    );
    centerCircle.position.set(0, 0, 0.06);
    scene.add(centerCircle);

    // outline
    // Create a curve that forms a circle
    const curve = new THREE.EllipseCurve(
        0, 0,            // Center x, y
        15, 15,         // X radius, Y radius
        0, 2 * Math.PI,  // Start angle, end angle
        false,           // Clockwise
        0               // Rotation
    );
    
    // Create points along the curve
    const points = curve.getPoints(500);
    
    // Convert points to a geometry
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Create a line material
    const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
    
    // Create the final circle
    const circle = new THREE.Line(geometry, material);
    scene.add(circle);
}

function renderLights() {
    // overhead lights
    const mainLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight1.position.set(0, 100, 100);
    scene.add(mainLight1);
    const mainLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight2.position.set(0, -100, 100);
    scene.add(mainLight2);
    
    // corner lights for more realistic rink lighting
    const cornerLights = [
        { x: 100, y: 42.5 },
        { x: -100, y: 42.5 },
        { x: 100, y: -42.5 },
        { x: -100, y: -42.5 }
    ];
    
    cornerLights.forEach(pos => {
        const light = new THREE.PointLight(0xffffff, 0.3);
        light.position.set(pos.x, pos.y, 50);
        scene.add(light);
    });
    
    // subtle ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // subtle hemisphere light for better color blending
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xb4d4ff, 0.3);
    scene.add(hemiLight);
}
