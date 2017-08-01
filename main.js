var lastRenderTime = 0;
var vrDisplay;
var boxSize = 5;
var scene;
var cube;
var controls;
var effect;
var camera;
var vrButton;

function createBlock(x, y, z) {
    var geometry = new THREE.BoxGeometry(1, 1, 1);

    var materialArray = [];
    materialArray.push(new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture('img/grass-side.jpg')
    }));
    materialArray.push(new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture('img/grass-side.jpg')
    }));
    materialArray.push(new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture('img/grass-top.jpg')
    }));
    materialArray.push(new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture('img/grass-bottom.jpg')
    }));
    materialArray.push(new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture('img/grass-side.jpg')
    }));
    materialArray.push(new THREE.MeshBasicMaterial({
        map: THREE.ImageUtils.loadTexture('img/grass-side.jpg')
    }));
    var material = new THREE.MeshFaceMaterial(materialArray);

    cube = new THREE.Mesh(geometry, material);

    cube.position.set(x, y, z);

    scene.add(cube);
}

var lastX = 2;
var lastY = 1;
var lastZ = 2;
var rotation = 0;

function goForward(rotation, lastX, lastY, lastZ) {
    if (rotation == 0) {
        createBlock(++lastX, lastY, lastZ);
    } else if (rotation == 1) {
        createBlock(lastX, lastY, ++lastZ);
    } else if (rotation == 2) {
        createBlock(--lastX, lastY, lastZ);
    } else if (rotation == 3) {
        createBlock(lastX, lastY, --lastZ);
    }
}

function onLoad() {
    // Setup three.js WebGL renderer. Note: Antialiasing is a big performance hit.
    // Only enable it if you actually need to.
    var renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);

    // Append the canvas element created by the renderer to document body element.
    document.body.appendChild(renderer.domElement);

    // Create a three.js scene.
    scene = new THREE.Scene();

    // Create a three.js camera.
    var aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 10000);

    controls = new THREE.VRControls(camera);
    controls.standing = true;
    camera.position.y = controls.userHeight + 1;

    // Apply VR stereo rendering to renderer.
    effect = new THREE.VREffect(renderer);
    effect.setSize(window.innerWidth, window.innerHeight);

    // Add a repeating grid as a skybox.
    var loader = new THREE.TextureLoader();
    loader.load('img/box.png', onTextureLoaded);

    // Create 3D objects.
    for (var i = 0; i < 10; i++) {
        for (var j = 0; j < 10; j++) {
            createBlock(i - 5, 0, j - 5);
        }
    }

    //createBlock(2, 2, 2);
    //createBlock(2, 3, 2);
    //createBlock(2, 4, 2);
    //createBlock(2, 5, 2);
    //createBlock(2, 5, 2);


    var timer = setInterval(function() {
        $.ajax({
            url: 'command.txt',
            success: function(data) {
                if (data != "") {
                    clearInterval(timer);
                    var commandDo = data;

                    for (var i = 0; i < commandDo.length; i++) {
                        console.log(commandDo[i]);
                        if (commandDo[i] == 's') {
                            goForward(rotation, lastX, lastY, lastZ);
                        } else if (commandDo[i] == 'u') {
                            createBlock(lastX, ++lastY, lastZ);
                        } else if (commandDo[i] == 'l') {
                            goForward(rotation + 1, lastX, lastY, lastZ);
                        }
                    }
                }
            }
        });
    }, 1000);

    window.addEventListener('resize', onResize, true);
    window.addEventListener('vrdisplaypresentchange', onResize, true);

    // Initialize the WebVR UI.
    var uiOptions = {
        color: 'black',
        background: 'white',
        corners: 'square'
    };
    vrButton = new webvrui.EnterVRButton(renderer.domElement, uiOptions);
    vrButton.on('exit', function() {
        camera.quaternion.set(0, 0, 0, 1);
        camera.position.set(0, controls.userHeight, 0);
    });
    vrButton.on('hide', function() {
        document.getElementById('ui').style.display = 'none';
    });
    vrButton.on('show', function() {
        document.getElementById('ui').style.display = 'inherit';
    });
    document.getElementById('vr-button').appendChild(vrButton.domElement);
    document.getElementById('magic-window').addEventListener('click', function() {
        vrButton.requestEnterFullscreen();
    });
}

function onTextureLoaded(texture) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(boxSize, boxSize);

    var geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    var material = new THREE.MeshBasicMaterial({
        map: texture,
        color: 0x00F3EA,
        side: THREE.BackSide
    });
    setupStage();
}



// Request animation frame loop function
function animate(timestamp) {
    var delta = Math.min(timestamp - lastRenderTime, 500);
    lastRenderTime = timestamp;

    // Apply rotation to cube mesh
    //cube.rotation.y += delta * 0.0006;

    // Only update controls if we're presenting.
    if (vrButton.isPresenting()) {
        controls.update();
    }
    // Render the scene.
    effect.render(scene, camera);

    vrDisplay.requestAnimationFrame(animate);
}

function onResize(e) {
    effect.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

// Get the HMD, and if we're dealing with something that specifies
// stageParameters, rearrange the scene.
function setupStage() {
    navigator.getVRDisplays().then(function(displays) {
        if (displays.length > 0) {
            vrDisplay = displays[0];
            if (vrDisplay.stageParameters) {
                setStageDimensions(vrDisplay.stageParameters);
            }
            vrDisplay.requestAnimationFrame(animate);
        }
    });
}

function setStageDimensions(stage) {
    var skyboxMatArray = [];
    for (var i = 0; i < 6; i++) {
        skyboxMatArray.push(new THREE.MeshBasicMaterial({
            map: THREE.ImageUtils.loadTexture('img/box.png'),
            side: THREE.BackSide
        }));
    }
    var skyMaterial = new THREE.MeshFaceMaterial(skyboxMatArray);
    var skyGeometry = new THREE.CubeGeometry(100, 100, 100);
    skybox = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skybox);

    // Make the skybox fit the stage.
    var material = skybox.material;
    scene.remove(skybox);

    // Size the skybox according to the size of the actual stage.
    var geometry = new THREE.BoxGeometry(stage.sizeX, boxSize, stage.sizeZ);
    skybox = new THREE.Mesh(geometry, material);

    // Place it on the floor.
    skybox.position.y = boxSize / 2;
    scene.add(skybox);

    // Place the cube in the middle of the scene, at user height.
    cube.position.set(0, controls.userHeight, 0);
}

window.addEventListener('load', onLoad);
