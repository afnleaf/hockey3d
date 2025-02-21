/* 
 * THIS IS CODE THAT IS NOT BEING USED RIGHT NOW
 * very rough llm slop for async texture loading
 * need to cleanup the svg
 * turn it into a proper texture
 * hand coding the scene is fine for now
 */

/*

const ice_svg = fetch(ice_url, {
  mode: 'cors'  // This is needed for Wikipedia
})
    .then(response => response.text())
    .then(svgContent => {
        document.getElementById('container').innerHTML = svgContent;
    })
    .catch(error => console.error('Error:', error));
console.log(ice_svg);
// SVG string to a base64 data URL
const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(ice_svg);

// do this once
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load(
                    svgDataUrl,
                );
texture.minFilter = THREE.LinearFilter;
texture.magFilter = THREE.LinearFilter;
texture.generateMipmaps = false;
*/

const ice_url = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/NHL_Hockey_Rink.svg/1241px-NHL_Hockey_Rink.svg.png";
const textureLoader = new THREE.TextureLoader();

// First create a function to handle the texture loading
async function loadTexture(url) {
  try {
    console.log("loading texture");
    // Setup fetch request with appropriate headers
    const response = await fetch(url, {
      headers: {
        'Accept': 'image/png',
        'User-Agent': 'Three.js Texture Loader'
      },
      mode: 'cors',  // Enable CORS for cross-origin requests
      cache: 'force-cache' // Use cached version if available
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Convert the response to a blob
    const blob = await response.blob();
    
    // Create an object URL from the blob
    const objectUrl = URL.createObjectURL(blob);
    
    // Create a Three.js texture loader
    const textureLoader = new THREE.TextureLoader();
    
    // Return a promise that resolves with the loaded texture
    return new Promise((resolve, reject) => {
      textureLoader.load(
        objectUrl,
        (texture) => {
          // Configure texture properties
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.generateMipmaps = false;
          
          // Clean up the object URL
          URL.revokeObjectURL(objectUrl);
          
        console.log("done");
          resolve(texture);
        },
        undefined, // onProgress callback (optional)
        (error) => {
          URL.revokeObjectURL(objectUrl);
          reject(error);
        }
      );
    });
  } catch (error) {
    console.error('Error loading texture:', error);
    throw error;
  }
}

function renderIce2() {
    console.log(iceTexture)
    const geo = new THREE.PlaneGeometry(200, 85); 
    const mat = new THREE.MeshBasicMaterial({
        map: iceTexture
    });
    const ice = new THREE.Mesh(geo, mat);
    ice.position.set(0, 0, 0);
    //ice.rotation.x = -Math.PI / 2;
    scene.add(ice)
}

async function renderIce() {

    // Usage example:
    const ice_url = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/NHL_Hockey_Rink.svg/1241px-NHL_Hockey_Rink.svg.png";
    
    let iceTexture; // Declare variable to store the texture
    
    // Load the texture
    loadTexture(ice_url)
        .then(texture => {
            iceTexture = texture; // Store the loaded texture
            console.log(iceTexture);
            
            console.log("test1");
            // Now you can use iceTexture in your materials
            const material = new THREE.MeshBasicMaterial({ 
                map: iceTexture,
                side: THREE.FrontSide,
            });
            console.log(material);
            
            // Example: Apply to a plane geometry for the ice rink
            const planeGeometry = new THREE.PlaneGeometry(85, 200); // NHL rink dimensions
            const icePlane = new THREE.Mesh(planeGeometry, material);
            icePlane.position.set(0, 0, 0);
            
            // Rotate the plane to lay flat on the XY plane (90 degrees around X-axis)
            //icePlane.rotation.x = -Math.PI / 2; // Rotate -90 degrees (π/2 radians)
            icePlane.rotation.z = Math.PI / 2;
            //icePlane.rotation.y = -Math.PI / 2;
            // If you need to fine-tune the rotation on other axes:
            // icePlane.rotation.y = 0; // No rotation on Y
            // icePlane.rotation.z = 0; // No rotation on Z
            
            // Add to your scene
            scene.add(icePlane);
        })
        .catch(error => {
            console.error('Failed to load texture:', error);
        });
}
