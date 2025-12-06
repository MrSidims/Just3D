// Import Three.js and loaders
import * as THREE from '../libs/three.module.min.js';
import { OrbitControls } from '../libs/controls/OrbitControls.js';
import { TransformControls } from '../libs/controls/TransformControls.js';
import { STLLoader } from '../libs/loaders/STLLoader.js';
import { GLTFLoader } from '../libs/loaders/GLTFLoader.js';
import { OBJLoader } from '../libs/loaders/OBJLoader.js';
import { FBXLoader } from '../libs/loaders/FBXLoader.js';
import { ColladaLoader } from '../libs/loaders/ColladaLoader.js';
import { PLYLoader } from '../libs/loaders/PLYLoader.js';
import { GLTFExporter } from '../libs/exporters/GLTFExporter.js';
import { STLExporter } from '../libs/exporters/STLExporter.js';
import { OBJExporter } from '../libs/exporters/OBJExporter.js';
import { PLYExporter } from '../libs/exporters/PLYExporter.js';
import * as BufferGeometryUtils from '../libs/utils/BufferGeometryUtils.js';
import { loadModel as loadModelFromStorage } from './storage-helper.js';
import { generateProceduralTexture, generateSolidColorTexture } from './texture-generator.js';

// Three.js scene setup
let scene, camera, renderer, controls;
let currentModel = null;
let grid, axes;
let wireframeEnabled = false;
let transformControls = null;

// Lighting variables
let ambientLight, directionalLight, pointLight, spotLight, hemisphereLight;
let currentLightType = 'default';

// Background variables
let checkerboardFloor = null;

// Measurement variables
let dimensionBox = null;
let measurementUnits = 'm';

// Initialize scene
function init() {
  console.log('=== VIEWER.JS V2 INITIALIZING ===');

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2a2a2a);

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(5, 5, 5);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById('viewer-container').appendChild(renderer.domElement);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 1;
  controls.maxDistance = 100;

  // Lights - Initialize default lighting
  setupLighting('default');

  // Grid
  grid = new THREE.GridHelper(20, 20, 0x666666, 0x444444);
  scene.add(grid);

  // Axes
  axes = new THREE.AxesHelper(5);
  scene.add(axes);

  // Handle window resize
  window.addEventListener('resize', onWindowResize, false);

  // Setup controls
  setupControls();

  // Start animation loop
  animate();

  // Load model from storage
  loadModelData();
}

// Initialize TransformControls for creator mode
function initTransformControls() {
  if (transformControls) {
    scene.remove(transformControls);
  }

  transformControls = new TransformControls(camera, renderer.domElement);
  transformControls.addEventListener('dragging-changed', (event) => {
    controls.enabled = !event.value;
    // Save to history when dragging ends
    if (!event.value && selectedObject) {
      saveToHistory();
    }
  });
  transformControls.addEventListener('objectChange', () => {
    if (selectedObject) {
      updateTransformInputs(selectedObject);
      updateResizeHandles(selectedObject);
    }
  });
  scene.add(transformControls);

  // Keyboard shortcuts for transform modes
  window.addEventListener('keydown', (event) => {
    if (!creatorMode) return;

    // Undo (Ctrl+Z or Cmd+Z)
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      undo();
      return;
    }

    // Redo (Ctrl+Y or Cmd+Y or Ctrl+Shift+Z)
    if (((event.ctrlKey || event.metaKey) && event.key === 'y') ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z')) {
      event.preventDefault();
      redo();
      return;
    }

    // Delete key
    if (event.key === 'Delete' && selectedObject) {
      event.preventDefault();
      deleteCreatorObject();
      return;
    }

    // Copy (Ctrl+C or Cmd+C)
    if ((event.ctrlKey || event.metaKey) && event.key === 'c' && selectedObject) {
      event.preventDefault();
      copyObject();
      return;
    }

    // Paste (Ctrl+V or Cmd+V)
    if ((event.ctrlKey || event.metaKey) && event.key === 'v' && copiedObject) {
      event.preventDefault();
      pasteObject();
      return;
    }

    // Duplicate (Shift+D)
    if (event.shiftKey && event.key.toLowerCase() === 'd' && selectedObject) {
      event.preventDefault();
      duplicateObject();
      return;
    }

    // Don't trigger transform modes if modifier keys are pressed
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

    switch (event.key.toLowerCase()) {
      case 'g':
        if (transformControls.object) transformControls.setMode('translate');
        break;
      case 'r':
        if (transformControls.object) transformControls.setMode('rotate');
        break;
      case 's':
        if (transformControls.object) transformControls.setMode('scale');
        break;
      case 'escape':
        deselectObject();
        break;
    }
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(currentTime) {
  requestAnimationFrame(animate);

  // Animate camera if needed
  if (cameraAnimating) {
    animateCamera(currentTime);
  }

  controls.update();

  try {
    renderer.render(scene, camera);
  } catch (error) {
    // Catch rendering errors (e.g., TransformControls with invalid object)
    if (error.message && error.message.includes('updateMatrixWorld')) {
      console.warn('Rendering error caught, detaching transform controls:', error.message);
      if (transformControls && transformControls.object && !transformControls.object.parent) {
        transformControls.detach();
      }
    } else {
      console.error('Rendering error:', error);
    }
  }
}

// Creator mode variables
let creatorMode = false;
let createdObjects = [];
let selectedObject = null;
let selectedObjects = [];
let textureImageData = null;
let copiedObject = null;
let boundingBoxHelper = null;
let resizeHandles = null;
let isDraggingHandle = false;
let draggedHandle = null;
let isUpdatingTransform = false;

// History management for undo/redo
let history = [];
let historyIndex = -1;
const MAX_HISTORY = 50;

// Load model from storage (Chrome Storage or IndexedDB)
async function loadModelData() {
  try {
    console.log('loadModelData: Starting to load model data');

    // Check if this was triggered by context menu (right-click on link)
    const result = await chrome.storage.local.get(['fromContextMenu', 'modelUrl']);
    if (result.fromContextMenu && result.modelUrl) {
      console.log('loadModelData: Loading from context menu URL:', result.modelUrl);
      // Clear the flag
      await chrome.storage.local.remove(['fromContextMenu', 'modelUrl']);
      // Fetch and load the model from URL
      await importObjectFromUrl(result.modelUrl);
      return;
    }

    // Load from storage
    console.log('loadModelData: Loading from storage');
    const modelData = await loadModelFromStorage();
    console.log('loadModelData: Model data loaded:', modelData);

    if (modelData) {
      // Check if this is creator mode
      if (modelData.isCreatorMode && modelData.emptyScene) {
        console.log('loadModelData: Entering creator mode with empty scene');
        // Enter Creator mode with empty scene
        enterCreatorMode();
      } else if (modelData.isCreatorMode) {
        console.log('loadModelData: Old creator mode (deprecated)');
        // Old creator mode (deprecated)
        createObject(modelData);
      } else {
        console.log('loadModelData: Regular model loading', modelData.name, modelData.extension);
        // Regular model loading
        loadModel(modelData);
      }
    } else {
      console.error('loadModelData: No model data found');
      hideLoading();
      alert('No model data found. Please select a file from the extension popup.');
    }
  } catch (error) {
    console.error('Error loading model:', error);
    hideLoading();
    alert('Error loading model: ' + error.message);
  }
}

// Enter Creator mode
function enterCreatorMode() {
  // Don't reinitialize if already in creator mode
  if (creatorMode) {
    return;
  }

  creatorMode = true;
  hideLoading();

  // Show creator panel and object list
  document.getElementById('creator-panel').style.display = 'block';
  document.getElementById('object-list-panel').style.display = 'block';

  // Initialize TransformControls
  initTransformControls();

  // Setup creator controls
  setupCreatorControls();

  // Initialize object list
  updateObjectList();

  // Add resize handle event listeners
  renderer.domElement.addEventListener('mousedown', onResizeHandleMouseDown);
  renderer.domElement.addEventListener('mousemove', onResizeHandleMouseMove);
  renderer.domElement.addEventListener('mouseup', onResizeHandleMouseUp);

  // Setup transform inputs
  setupTransformInputs();

  // Setup multi-object operation buttons
  document.getElementById('merge-objects').addEventListener('click', mergeSelectedObjects);

  // Initialize history with empty state
  saveToHistory();
}

// Create object from creator parameters
function createObject(creatorData) {
  showLoading();

  const { objectParams, materialParams, textureParams, name } = creatorData;

  // Create geometry based on object type
  let geometry;
  switch (objectParams.type) {
    case 'sphere':
      geometry = new THREE.SphereGeometry(
        objectParams.radius,
        objectParams.widthSegments,
        objectParams.heightSegments
      );
      break;
    case 'cube':
      geometry = new THREE.BoxGeometry(
        objectParams.size,
        objectParams.size,
        objectParams.size
      );
      break;
    case 'cylinder':
      geometry = new THREE.CylinderGeometry(
        objectParams.radius,
        objectParams.radius,
        objectParams.height,
        objectParams.radialSegments
      );
      break;
    case 'torus':
      geometry = new THREE.TorusGeometry(
        objectParams.radius,
        objectParams.tube,
        objectParams.radialSegments,
        objectParams.tubularSegments
      );
      break;
    case 'plane':
      geometry = new THREE.PlaneGeometry(
        objectParams.width,
        objectParams.height
      );
      break;
    default:
      console.error('Unknown object type:', objectParams.type);
      hideLoading();
      return;
  }

  // Generate texture
  let texture;
  switch (textureParams.type) {
    case 'color':
      const colorCanvas = generateSolidColorTexture(512, 512, textureParams.color);
      texture = new THREE.CanvasTexture(colorCanvas);
      break;
    case 'procedural':
      const procCanvas = generateProceduralTexture(1024, 512, {
        color1: textureParams.color1,
        color2: textureParams.color2,
        octaves: textureParams.octaves
      });
      texture = new THREE.CanvasTexture(procCanvas);
      break;
    case 'image':
      if (textureParams.imageData) {
        const img = new Image();
        img.onload = () => {
          texture = new THREE.Texture(img);
          texture.needsUpdate = true;
          mesh.material.map = texture;
          mesh.material.needsUpdate = true;
        };
        img.src = textureParams.imageData;
        texture = null; // Will be set asynchronously
      }
      break;
  }

  // Create material
  const materialConfig = {
    metalness: materialParams.metalness,
    roughness: materialParams.roughness
  };

  if (texture) {
    materialConfig.map = texture;
  }

  // Add emissive if emission strength > 0
  if (materialParams.emissiveIntensity > 0) {
    materialConfig.emissive = new THREE.Color(textureParams.color1 || textureParams.color || '#ffffff');
    materialConfig.emissiveIntensity = materialParams.emissiveIntensity;
    if (textureParams.type === 'procedural' || textureParams.type === 'image') {
      materialConfig.emissiveMap = texture;
    }
  }

  const material = new THREE.MeshStandardMaterial(materialConfig);

  // Create mesh
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // Add to scene
  addModelToScene(mesh, geometry);

  hideLoading();
}

// Import 3D model from URL
async function importObjectFromUrl(urlParam = null) {
  try {
    const urlInput = document.getElementById('creator-url-input');
    const url = urlParam || (urlInput ? urlInput.value.trim() : null);

    if (!url) {
      alert('Please enter a valid URL');
      return;
    }

    showLoading();

    console.log('Requesting model from URL:', url);

    // Send message to background script to fetch the model
    const response = await chrome.runtime.sendMessage({
      action: 'fetchModelFromUrl',
      url: url
    });

    console.log('Response from background:', response);

    if (response.success) {
      const modelData = response.data;
      console.log('Model data received:', modelData);

      // Clear the input field if it exists
      if (urlInput) {
        urlInput.value = '';
      }

      // Load the model
      loadModel(modelData);
    } else {
      hideLoading();
      alert('Error loading model from URL: ' + response.error);
    }
  } catch (error) {
    hideLoading();
    console.error('Error importing from URL:', error);
    alert('Error loading model from URL: ' + error.message);
  }
}

// Load model based on file extension
function loadModel(modelData) {
  showLoading();

  const { data, extension, name, isConversion, targetFormat } = modelData;

  // Convert base64 string back to ArrayBuffer
  const binaryString = atob(data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Convert ArrayBuffer to appropriate format for loaders
  const blob = new Blob([bytes]);
  const url = URL.createObjectURL(blob);

  // Select appropriate loader
  let loader;
  switch (extension) {
    case 'stl':
      loader = new STLLoader();
      loadSTL(loader, url, name, isConversion, targetFormat);
      break;
    case 'glb':
    case 'gltf':
      loader = new GLTFLoader();
      loadGLTF(loader, url, name, isConversion, targetFormat);
      break;
    case 'obj':
      loader = new OBJLoader();
      loadOBJ(loader, url, name, isConversion, targetFormat);
      break;
    case 'fbx':
      loader = new FBXLoader();
      loadFBX(loader, url, name, isConversion, targetFormat);
      break;
    case 'dae':
      loader = new ColladaLoader();
      loadCollada(loader, url, name, isConversion, targetFormat);
      break;
    case 'ply':
      loader = new PLYLoader();
      loadPLY(loader, url, name, isConversion, targetFormat);
      break;
    default:
      hideLoading();
      alert(`Unsupported file format: ${extension}`);
      return;
  }
}

// STL Loader
function loadSTL(loader, url, name, isConversion, targetFormat) {
  loader.load(
    url,
    (geometry) => {
      const material = new THREE.MeshPhongMaterial({
        color: 0x888888,
        specular: 0x111111,
        shininess: 200
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      addModelToScene(mesh, geometry, name);

      if (isConversion) {
        convertModel(mesh, targetFormat, name);
      }

      hideLoading();
    },
    undefined,
    (error) => {
      console.error('Error loading STL:', error);
      hideLoading();
      alert('Error loading STL file');
    }
  );
}

// GLTF/GLB Loader
function loadGLTF(loader, url, name, isConversion, targetFormat) {
  loader.load(
    url,
    (gltf) => {
      const model = gltf.scene;

      addModelToScene(model, null, name);

      if (isConversion) {
        convertModel(model, targetFormat, name);
      }

      hideLoading();
    },
    undefined,
    (error) => {
      console.error('Error loading GLTF:', error);
      hideLoading();
      alert('Error loading GLTF/GLB file');
    }
  );
}

// OBJ Loader
function loadOBJ(loader, url, name, isConversion, targetFormat) {
  loader.load(
    url,
    (object) => {
      addModelToScene(object, null, name);

      if (isConversion) {
        convertModel(object, targetFormat, name);
      }

      hideLoading();
    },
    undefined,
    (error) => {
      console.error('Error loading OBJ:', error);
      hideLoading();
      alert('Error loading OBJ file');
    }
  );
}

// FBX Loader
function loadFBX(loader, url, name, isConversion, targetFormat) {
  loader.load(
    url,
    (object) => {
      addModelToScene(object, null, name);

      if (isConversion) {
        convertModel(object, targetFormat, name);
      }

      hideLoading();
    },
    undefined,
    (error) => {
      console.error('Error loading FBX:', error);
      hideLoading();
      alert('Error loading FBX file');
    }
  );
}

// Collada Loader
function loadCollada(loader, url, name, isConversion, targetFormat) {
  loader.load(
    url,
    (collada) => {
      const model = collada.scene;
      addModelToScene(model, null, name);

      if (isConversion) {
        convertModel(model, targetFormat, name);
      }

      hideLoading();
    },
    undefined,
    (error) => {
      console.error('Error loading DAE:', error);
      hideLoading();
      alert('Error loading Collada file');
    }
  );
}

// PLY Loader
function loadPLY(loader, url, name, isConversion, targetFormat) {
  loader.load(
    url,
    (geometry) => {
      geometry.computeVertexNormals();
      const material = new THREE.MeshPhongMaterial({
        color: 0x888888,
        specular: 0x111111,
        shininess: 200
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      addModelToScene(mesh, geometry, name);

      if (isConversion) {
        convertModel(mesh, targetFormat, name);
      }

      hideLoading();
    },
    undefined,
    (error) => {
      console.error('Error loading PLY:', error);
      hideLoading();
      alert('Error loading PLY file');
    }
  );
}

// Add model to scene with proper positioning
function addModelToScene(model, geometry, modelName = 'Imported Model') {
  currentModel = model;

  // Add metadata first
  if (!model.userData) {
    model.userData = {};
  }
  model.userData.creatorId = Date.now();
  model.userData.name = modelName;

  // Set shadow properties
  if (model.castShadow !== undefined) {
    model.castShadow = true;
    model.receiveShadow = true;
  }

  // Add to scene first
  scene.add(model);

  // If in creator mode, also add to createdObjects array
  if (creatorMode) {
    createdObjects.push(model);
  }

  // Calculate bounding box after adding to scene
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  // Center the model
  if (model.position) {
    model.position.sub(center);
  }

  // Position camera
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
  cameraZ *= 1.5;

  camera.position.set(cameraZ, cameraZ, cameraZ);
  camera.lookAt(0, 0, 0);
  controls.target.set(0, 0, 0);

  // Update object list if in creator mode
  if (creatorMode) {
    updateObjectList();
    saveToHistory();
  }
}

// Convert model to different format
function convertModel(model, targetFormat, originalName) {
  const baseName = originalName.replace(/\.[^/.]+$/, '');

  switch (targetFormat) {
    case 'glb':
    case 'gltf':
      exportGLTF(model, baseName, targetFormat === 'glb', true);
      break;
    case 'obj':
      exportOBJ(model, baseName, true);
      break;
    case 'stl':
      exportSTL(model, baseName, true);
      break;
    case 'ply':
      exportPLY(model, baseName, true);
      break;
    default:
      alert(`Conversion to ${targetFormat} is not yet supported`);
  }
}

// Export to GLTF/GLB
function exportGLTF(model, name, binary, isConversion = false) {
  const exporter = new GLTFExporter();

  exporter.parse(
    model,
    (result) => {
      if (binary) {
        downloadFile(result, `${name}.glb`, 'application/octet-stream');
      } else {
        const output = JSON.stringify(result, null, 2);
        downloadFile(output, `${name}.gltf`, 'application/json');
      }

      if (isConversion) {
        // Close tab after short delay to allow download to start
        setTimeout(() => {
          window.close();
          // If window.close() doesn't work, show message
          setTimeout(() => {
            alert('Download complete! You can close this tab.');
          }, 500);
        }, 1000);
      } else {
        alert(`Model exported as ${binary ? 'GLB' : 'GLTF'} successfully!`);
      }
    },
    (error) => {
      console.error('Export error:', error);
      alert('Error exporting model');
    },
    { binary: binary }
  );
}

// Export to OBJ
function exportOBJ(model, name, isConversion = false) {
  try {
    const exporter = new OBJExporter();
    const result = exporter.parse(model);
    downloadFile(result, `${name}.obj`, 'text/plain');

    if (isConversion) {
      // Close tab after short delay to allow download to start
      setTimeout(() => {
        window.close();
        // If window.close() doesn't work, show message
        setTimeout(() => {
          alert('Download complete! You can close this tab.');
        }, 500);
      }, 1000);
    } else {
      alert('Model exported as OBJ successfully!');
    }
  } catch (error) {
    console.error('OBJ export error:', error);

    if (error instanceof RangeError || error.message.includes('Invalid string length')) {
      alert(
        'Scene is too large for OBJ export!\n\n' +
        'The scene contains too many objects/vertices for OBJ format.\n\n' +
        'Recommendation: Use GLB (Binary glTF) format instead,\n' +
        'which handles large scenes efficiently.'
      );
    } else {
      alert('Failed to export OBJ: ' + error.message);
    }
  }
}

// Export to STL
function exportSTL(model, name, isConversion = false) {
  try {
    const exporter = new STLExporter();
    const result = exporter.parse(model, { binary: true });
    downloadFile(result, `${name}.stl`, 'application/octet-stream');

    if (isConversion) {
      // Close tab after short delay to allow download to start
      setTimeout(() => {
        window.close();
        // If window.close() doesn't work, show message
        setTimeout(() => {
          alert('Download complete! You can close this tab.');
        }, 500);
      }, 1000);
    } else {
      alert('Model exported as STL successfully!');
    }
  } catch (error) {
    console.error('STL export error:', error);

    if (error instanceof RangeError || error.message.includes('Invalid string length') || error.message.includes('Invalid array length')) {
      alert(
        'Scene is too large for STL export!\n\n' +
        'The scene contains too many objects/vertices for STL format.\n\n' +
        'Recommendation: Use GLB (Binary glTF) format instead,\n' +
        'which handles large scenes efficiently.'
      );
    } else {
      alert('Failed to export STL: ' + error.message);
    }
  }
}

// Export to PLY
function exportPLY(model, name, isConversion = false) {
  try {
    const exporter = new PLYExporter();
    exporter.parse(
      model,
      (result) => {
        downloadFile(result, `${name}.ply`, 'application/octet-stream');

        if (isConversion) {
          // Close tab after short delay to allow download to start
          setTimeout(() => {
            window.close();
            // If window.close() doesn't work, show message
            setTimeout(() => {
              alert('Download complete! You can close this tab.');
            }, 500);
          }, 1000);
        } else {
          alert('Model exported as PLY successfully!');
        }
      },
      { binary: true },
      (error) => {
        // Error callback
        console.error('PLY export error:', error);

        if (error instanceof RangeError || error.message.includes('Invalid string length') || error.message.includes('Invalid array length')) {
          alert(
            'Scene is too large for PLY export!\n\n' +
            'The scene contains too many objects/vertices for PLY format.\n\n' +
            'Recommendation: Use GLB (Binary glTF) format instead,\n' +
            'which handles large scenes efficiently.'
          );
        } else {
          alert('Failed to export PLY: ' + error.message);
        }
      }
    );
  } catch (error) {
    console.error('PLY export error:', error);

    if (error instanceof RangeError || error.message.includes('Invalid string length') || error.message.includes('Invalid array length')) {
      alert(
        'Scene is too large for PLY export!\n\n' +
        'The scene contains too many objects/vertices for PLY format.\n\n' +
        'Recommendation: Use GLB (Binary glTF) format instead,\n' +
        'which handles large scenes efficiently.'
      );
    } else {
      alert('Failed to export PLY: ' + error.message);
    }
  }
}

// Download file helper
function downloadFile(data, filename, type) {
  const blob = new Blob([data], { type: type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Setup UI controls
function setupControls() {
  // Quick action panel toggles
  const screenshotPanel = document.getElementById('screenshot-panel');
  const cameraPanel = document.getElementById('camera-panel');
  const optionsPanel = document.getElementById('options-panel');
  const screenshotBtn = document.getElementById('screenshot-menu-toggle');
  const cameraBtn = document.getElementById('camera-menu-toggle');
  const optionsBtn = document.getElementById('options-toggle');

  function closeAllPanels() {
    screenshotPanel.style.display = 'none';
    cameraPanel.style.display = 'none';
    optionsPanel.style.display = 'none';
    screenshotBtn.classList.remove('active');
    cameraBtn.classList.remove('active');
    optionsBtn.classList.remove('active');
  }

  screenshotBtn.addEventListener('click', () => {
    if (screenshotPanel.style.display === 'none') {
      closeAllPanels();
      screenshotPanel.style.display = 'block';
      screenshotBtn.classList.add('active');
    } else {
      closeAllPanels();
    }
  });

  cameraBtn.addEventListener('click', () => {
    if (cameraPanel.style.display === 'none') {
      closeAllPanels();
      cameraPanel.style.display = 'block';
      cameraBtn.classList.add('active');
    } else {
      closeAllPanels();
    }
  });

  optionsBtn.addEventListener('click', () => {
    if (optionsPanel.style.display === 'none') {
      closeAllPanels();
      optionsPanel.style.display = 'block';
      optionsBtn.classList.add('active');
    } else {
      closeAllPanels();
    }
  });

  // GitHub and Coffee link buttons
  const githubBtn = document.getElementById('github-link');
  const coffeeBtn = document.getElementById('coffee-link');

  githubBtn.addEventListener('click', () => {
    window.open('https://github.com/MrSidims/Just3D', '_blank');
  });

  coffeeBtn.addEventListener('click', () => {
    window.open('https://buymeacoffee.com/justanotherdev', '_blank');
  });

  // Close panels when clicking outside
  document.addEventListener('click', (e) => {
    const isClickInsidePanel = screenshotPanel.contains(e.target) ||
                               cameraPanel.contains(e.target) ||
                               optionsPanel.contains(e.target);
    const isClickOnButton = screenshotBtn.contains(e.target) ||
                            cameraBtn.contains(e.target) ||
                            optionsBtn.contains(e.target);

    if (!isClickInsidePanel && !isClickOnButton) {
      closeAllPanels();
    }
  });

  // Reset view
  document.getElementById('reset-view').addEventListener('click', () => {
    if (currentModel) {
      const box = new THREE.Box3().setFromObject(currentModel);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 1.5;

      camera.position.set(cameraZ, cameraZ, cameraZ);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
    }
  });

  // Wireframe toggle
  document.getElementById('wireframe-toggle').addEventListener('click', (e) => {
    wireframeEnabled = !wireframeEnabled;
    if (currentModel) {
      currentModel.traverse((child) => {
        if (child.isMesh) {
          child.material.wireframe = wireframeEnabled;
        }
      });
    }
    e.target.classList.toggle('active');
  });

  // Grid toggle
  document.getElementById('grid-toggle').addEventListener('click', (e) => {
    grid.visible = !grid.visible;
    e.target.classList.toggle('active');
  });

  // Axes toggle
  document.getElementById('axes-toggle').addEventListener('click', (e) => {
    axes.visible = !axes.visible;
    e.target.classList.toggle('active');
  });

  // Background color
  document.getElementById('bg-color').addEventListener('input', (e) => {
    scene.background = new THREE.Color(e.target.value);
  });

  // Light intensity
  document.getElementById('light-intensity').addEventListener('input', (e) => {
    const intensity = parseFloat(e.target.value);
    scene.children.forEach((child) => {
      if (child.isDirectionalLight) {
        child.intensity = intensity * 0.8;
      } else if (child.isAmbientLight) {
        child.intensity = intensity * 0.6;
      }
    });
  });

  // Screenshot options
  document.getElementById('screenshot-normal').addEventListener('click', () => takeScreenshot('normal'));
  document.getElementById('screenshot-clean').addEventListener('click', () => takeScreenshot('clean'));
  document.getElementById('screenshot-transparent').addEventListener('click', () => takeScreenshot('transparent'));

  // Camera Presets
  document.getElementById('camera-front').addEventListener('click', () => setCameraPreset('front'));
  document.getElementById('camera-back').addEventListener('click', () => setCameraPreset('back'));
  document.getElementById('camera-left').addEventListener('click', () => setCameraPreset('left'));
  document.getElementById('camera-right').addEventListener('click', () => setCameraPreset('right'));
  document.getElementById('camera-top').addEventListener('click', () => setCameraPreset('top'));
  document.getElementById('camera-bottom').addEventListener('click', () => setCameraPreset('bottom'));
  document.getElementById('camera-isometric').addEventListener('click', () => setCameraPreset('isometric'));

  // Keyboard shortcuts for camera presets
  setupCameraKeyboardShortcuts();

  // Background controls
  document.getElementById('bg-type').addEventListener('change', handleBackgroundTypeChange);
  document.getElementById('bg-color').addEventListener('input', (e) => updateBackground());
  document.getElementById('bg-gradient-top').addEventListener('input', (e) => updateBackground());
  document.getElementById('bg-gradient-bottom').addEventListener('input', (e) => updateBackground());

  // Lighting controls
  document.getElementById('light-type').addEventListener('change', (e) => {
    setupLighting(e.target.value);
  });
  document.getElementById('light-intensity').addEventListener('input', (e) => {
    document.getElementById('light-intensity-val').textContent = parseFloat(e.target.value).toFixed(1);
    updateLighting();
  });
  document.getElementById('light-color').addEventListener('input', (e) => {
    updateLighting();
  });
  document.getElementById('shadow-intensity').addEventListener('input', (e) => {
    document.getElementById('shadow-intensity-val').textContent = parseFloat(e.target.value).toFixed(1);
    updateShadowIntensity(parseFloat(e.target.value));
  });

  // Measurement controls
  document.getElementById('measurement-units').addEventListener('change', (e) => {
    measurementUnits = e.target.value;
    if (dimensionBox) showDimensions(); // Refresh if dimensions are showing
  });
  document.getElementById('show-dimensions').addEventListener('click', showDimensions);
  document.getElementById('clear-measurements').addEventListener('click', clearMeasurements);
}

// Keyboard shortcuts for camera presets
function setupCameraKeyboardShortcuts() {
  window.addEventListener('keydown', (event) => {
    // Don't trigger if user is typing in an input field
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    // Don't trigger if modifier keys are pressed (Ctrl, Alt, Shift, Meta) for non-arrow keys
    if ((event.ctrlKey || event.altKey || event.metaKey) && !event.key.startsWith('Arrow')) {
      return;
    }

    const key = event.key;

    // Arrow key camera panning
    if (key.startsWith('Arrow')) {
      event.preventDefault();
      moveCameraWithArrows(key);
      return;
    }

    const presets = {
      '1': 'front',
      '2': 'back',
      '3': 'left',
      '4': 'right',
      '5': 'top',
      '6': 'bottom',
      '7': 'isometric'
    };

    if (presets[key]) {
      event.preventDefault();
      setCameraPreset(presets[key]);
    }
  });

  // Listen for keyup to stop camera movement
  window.addEventListener('keyup', (event) => {
    // Don't trigger if user is typing in an input field
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    const key = event.key;

    // Stop arrow key camera panning
    if (key.startsWith('Arrow')) {
      event.preventDefault();
      stopCameraMovement(key);
    }
  });
}

// Arrow key movement state
const arrowKeyState = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false
};
let arrowMovementAnimationId = null;
let currentVelocity = new THREE.Vector2(0, 0);

// Move camera using arrow keys with smooth continuous movement
function moveCameraWithArrows(arrowKey) {
  arrowKeyState[arrowKey] = true;

  // Start animation loop if not already running
  if (!arrowMovementAnimationId) {
    arrowMovementAnimationId = requestAnimationFrame(animateArrowMovement);
  }
}

// Stop camera movement when arrow key is released
function stopCameraMovement(arrowKey) {
  if (arrowKeyState.hasOwnProperty(arrowKey)) {
    arrowKeyState[arrowKey] = false;
  }

  // Stop animation if no keys are pressed
  const anyKeyPressed = Object.values(arrowKeyState).some(pressed => pressed);
  if (!anyKeyPressed && arrowMovementAnimationId) {
    cancelAnimationFrame(arrowMovementAnimationId);
    arrowMovementAnimationId = null;
    currentVelocity.set(0, 0);
  }
}

// Smooth animation loop for arrow key movement
function animateArrowMovement() {
  // Calculate movement direction from pressed keys
  let horizontal = 0;
  let vertical = 0;

  if (arrowKeyState.ArrowUp) vertical += 1;
  if (arrowKeyState.ArrowDown) vertical -= 1;
  if (arrowKeyState.ArrowLeft) horizontal -= 1;
  if (arrowKeyState.ArrowRight) horizontal += 1;

  // Normalize diagonal movement
  if (horizontal !== 0 && vertical !== 0) {
    horizontal *= 0.707; // 1/sqrt(2)
    vertical *= 0.707;
  }

  // Smooth acceleration/deceleration
  const acceleration = 0.15;
  const maxSpeed = 1.0;

  const targetVelocityX = horizontal * maxSpeed;
  const targetVelocityY = vertical * maxSpeed;

  currentVelocity.x += (targetVelocityX - currentVelocity.x) * acceleration;
  currentVelocity.y += (targetVelocityY - currentVelocity.y) * acceleration;

  // Only move if velocity is significant
  if (Math.abs(currentVelocity.x) > 0.001 || Math.abs(currentVelocity.y) > 0.001) {
    // Calculate movement amount based on distance from target
    const distance = camera.position.distanceTo(controls.target);
    const basePanSpeed = distance * 0.02;

    // Get camera's right and up vectors in world space
    const right = new THREE.Vector3();
    const up = new THREE.Vector3();

    camera.getWorldDirection(new THREE.Vector3());
    right.setFromMatrixColumn(camera.matrix, 0);
    up.setFromMatrixColumn(camera.matrix, 1);

    // Calculate offset
    const offset = new THREE.Vector3();
    offset.add(right.multiplyScalar(currentVelocity.x * basePanSpeed));
    offset.add(up.multiplyScalar(currentVelocity.y * basePanSpeed));

    // Apply offset to both camera and controls target
    camera.position.add(offset);
    controls.target.add(offset);
    controls.update();
  }

  // Continue animation loop
  arrowMovementAnimationId = requestAnimationFrame(animateArrowMovement);
}

// Loading screen helpers
function showLoading() {
  document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading').classList.add('hidden');
}

// Take Screenshot with different modes
function takeScreenshot(mode = 'normal') {
  try {
    // Store current state
    const originalBackground = scene.background;
    const gridVisible = grid.visible;
    const axesVisible = axes.visible;
    const originalAlpha = renderer.getClearAlpha();

    // Apply mode settings
    switch (mode) {
      case 'clean':
        // Hide grid and axes
        grid.visible = false;
        axes.visible = false;
        break;
      case 'transparent':
        // Transparent background + no grid/axes
        scene.background = null;
        grid.visible = false;
        axes.visible = false;
        renderer.setClearAlpha(0); // Fully transparent
        break;
      case 'normal':
      default:
        // Keep everything as is
        break;
    }

    // Render one frame with new settings
    renderer.render(scene, camera);

    // Get canvas data as blob
    renderer.domElement.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const modePrefix = mode === 'transparent' ? 'transparent-' : mode === 'clean' ? 'clean-' : '';
      link.download = `3d-model-${modePrefix}${timestamp}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      // Restore original state
      scene.background = originalBackground;
      grid.visible = gridVisible;
      axes.visible = axesVisible;
      renderer.setClearAlpha(originalAlpha);

      console.log(`Screenshot captured (${mode} mode)`);
    }, 'image/png');

  } catch (error) {
    console.error('Error taking screenshot:', error);
    alert('Error capturing screenshot: ' + error.message);

    // Restore state in case of error
    scene.background = originalBackground;
    grid.visible = gridVisible;
    axes.visible = axesVisible;
    renderer.setClearAlpha(originalAlpha);
  }
}

// Camera animation variables
let cameraAnimating = false;
let cameraAnimationStart = null;
let cameraStartPos = null;
let cameraTargetPos = null;
const CAMERA_ANIMATION_DURATION = 500; // milliseconds

// Set Camera Preset
function setCameraPreset(preset) {
  if (!currentModel && createdObjects.length === 0) {
    alert('No model loaded to view');
    return;
  }

  // Calculate bounding box for proper camera distance
  let box;
  if (currentModel) {
    box = new THREE.Box3().setFromObject(currentModel);
  } else if (createdObjects.length > 0) {
    box = new THREE.Box3();
    createdObjects.forEach(obj => {
      box.expandByObject(obj);
    });
  } else {
    return;
  }

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
  cameraZ *= 2; // Add some padding

  let targetPosition = new THREE.Vector3();

  switch (preset) {
    case 'front':
      targetPosition.set(0, 0, cameraZ);
      break;
    case 'back':
      targetPosition.set(0, 0, -cameraZ);
      break;
    case 'left':
      targetPosition.set(-cameraZ, 0, 0);
      break;
    case 'right':
      targetPosition.set(cameraZ, 0, 0);
      break;
    case 'top':
      targetPosition.set(0, cameraZ, 0);
      break;
    case 'bottom':
      targetPosition.set(0, -cameraZ, 0);
      break;
    case 'isometric':
      // 45-45-45 isometric view
      const isoDistance = cameraZ * 1.2;
      targetPosition.set(isoDistance, isoDistance, isoDistance);
      break;
    default:
      return;
  }

  // Start smooth camera animation
  cameraStartPos = camera.position.clone();
  cameraTargetPos = targetPosition;
  cameraAnimating = true;
  cameraAnimationStart = performance.now();
  controls.target.copy(center);

  console.log(`Camera preset: ${preset}`);
}

// Animate camera to target position
function animateCamera(currentTime) {
  if (!cameraAnimating) return;

  const elapsed = currentTime - cameraAnimationStart;
  const progress = Math.min(elapsed / CAMERA_ANIMATION_DURATION, 1);

  // Easing function (ease-in-out)
  const eased = progress < 0.5
    ? 2 * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

  // Interpolate camera position
  camera.position.lerpVectors(cameraStartPos, cameraTargetPos, eased);

  // Check if animation is complete
  if (progress >= 1) {
    cameraAnimating = false;
    camera.position.copy(cameraTargetPos);
  }
}

// Saved camera views
let savedCameraViews = [];

// Load saved views from localStorage
function loadSavedViews() {
  try {
    const saved = localStorage.getItem('savedCameraViews');
    if (saved) {
      savedCameraViews = JSON.parse(saved);
      updateSavedViewsUI();
    }
  } catch (error) {
    console.error('Error loading saved views:', error);
  }
}

// Save camera view
function saveCameraView() {
  const name = prompt('Enter a name for this camera view:', `View ${savedCameraViews.length + 1}`);
  if (!name) return;

  const view = {
    id: Date.now(),
    name: name,
    position: {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    },
    target: {
      x: controls.target.x,
      y: controls.target.y,
      z: controls.target.z
    }
  };

  savedCameraViews.push(view);

  // Save to localStorage
  try {
    localStorage.setItem('savedCameraViews', JSON.stringify(savedCameraViews));
    updateSavedViewsUI();
    console.log('Camera view saved:', name);
  } catch (error) {
    console.error('Error saving view:', error);
    alert('Error saving camera view');
  }
}

// Restore camera view
function restoreCameraView(viewId) {
  const view = savedCameraViews.find(v => v.id === viewId);
  if (!view) return;

  // Animate to saved view
  cameraStartPos = camera.position.clone();
  cameraTargetPos = new THREE.Vector3(view.position.x, view.position.y, view.position.z);
  cameraAnimating = true;
  cameraAnimationStart = performance.now();
  controls.target.set(view.target.x, view.target.y, view.target.z);

  console.log('Restored camera view:', view.name);
}

// Delete saved camera view
function deleteSavedView(viewId) {
  savedCameraViews = savedCameraViews.filter(v => v.id !== viewId);

  // Save to localStorage
  try {
    localStorage.setItem('savedCameraViews', JSON.stringify(savedCameraViews));
    updateSavedViewsUI();
    console.log('Camera view deleted');
  } catch (error) {
    console.error('Error deleting view:', error);
  }
}

// Update saved views UI
function updateSavedViewsUI() {
  const container = document.getElementById('saved-views-container');
  if (!container) return;

  container.innerHTML = '';

  if (savedCameraViews.length === 0) {
    container.innerHTML = '<p style="font-size: 11px; color: #999; margin: 5px 0;">No saved views</p>';
    return;
  }

  savedCameraViews.forEach(view => {
    const item = document.createElement('div');
    item.className = 'saved-view-item';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'saved-view-name';
    nameSpan.textContent = view.name;
    nameSpan.onclick = () => restoreCameraView(view.id);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'saved-view-delete';
    deleteBtn.textContent = '✕';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm(`Delete view "${view.name}"?`)) {
        deleteSavedView(view.id);
      }
    };

    item.appendChild(nameSpan);
    item.appendChild(deleteBtn);
    container.appendChild(item);
  });
}

// ==================== LIGHTING SYSTEM ====================

// Setup lighting based on type
function setupLighting(type) {
  // Remove existing lights
  if (ambientLight) scene.remove(ambientLight);
  if (directionalLight) scene.remove(directionalLight);
  if (pointLight) scene.remove(pointLight);
  if (spotLight) scene.remove(spotLight);
  if (hemisphereLight) scene.remove(hemisphereLight);

  currentLightType = type;
  const intensity = parseFloat(document.getElementById('light-intensity').value);
  const color = document.getElementById('light-color').value;

  switch (type) {
    case 'default':
      ambientLight = new THREE.AmbientLight(color, intensity * 0.6);
      scene.add(ambientLight);

      directionalLight = new THREE.DirectionalLight(color, intensity * 0.8);
      directionalLight.position.set(10, 10, 10);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);

      const light2 = new THREE.DirectionalLight(color, intensity * 0.4);
      light2.position.set(-10, -10, -10);
      scene.add(light2);
      break;

    case 'point':
      ambientLight = new THREE.AmbientLight(color, intensity * 0.3);
      scene.add(ambientLight);

      pointLight = new THREE.PointLight(color, intensity * 2, 50);
      pointLight.position.set(5, 10, 5);
      pointLight.castShadow = true;
      pointLight.shadow.mapSize.width = 1024;
      pointLight.shadow.mapSize.height = 1024;
      scene.add(pointLight);
      break;

    case 'spot':
      ambientLight = new THREE.AmbientLight(color, intensity * 0.3);
      scene.add(ambientLight);

      spotLight = new THREE.SpotLight(color, intensity * 1.5);
      spotLight.position.set(10, 20, 10);
      spotLight.angle = Math.PI / 6;
      spotLight.penumbra = 0.2;
      spotLight.castShadow = true;
      spotLight.shadow.mapSize.width = 2048;
      spotLight.shadow.mapSize.height = 2048;
      scene.add(spotLight);
      break;

    case 'hemisphere':
      hemisphereLight = new THREE.HemisphereLight(color, 0x444444, intensity);
      scene.add(hemisphereLight);

      directionalLight = new THREE.DirectionalLight(color, intensity * 0.5);
      directionalLight.position.set(5, 10, 7.5);
      directionalLight.castShadow = true;
      scene.add(directionalLight);
      break;
  }

  console.log(`Lighting setup: ${type}`);
}

// Update lighting intensity and color
function updateLighting() {
  const intensity = parseFloat(document.getElementById('light-intensity').value);
  const color = new THREE.Color(document.getElementById('light-color').value);

  if (ambientLight) {
    ambientLight.color.copy(color);
    ambientLight.intensity = intensity * 0.6;
  }
  if (directionalLight) {
    directionalLight.color.copy(color);
    directionalLight.intensity = currentLightType === 'default' ? intensity * 0.8 : intensity * 0.5;
  }
  if (pointLight) {
    pointLight.color.copy(color);
    pointLight.intensity = intensity * 2;
  }
  if (spotLight) {
    spotLight.color.copy(color);
    spotLight.intensity = intensity * 1.5;
  }
  if (hemisphereLight) {
    hemisphereLight.color.copy(color);
    hemisphereLight.intensity = intensity;
  }
}

// Update shadow intensity
function updateShadowIntensity(intensity) {
  renderer.shadowMap.enabled = intensity > 0;

  // Update shadow darkness for all lights
  [directionalLight, pointLight, spotLight].forEach(light => {
    if (light && light.shadow) {
      light.shadow.camera.updateProjectionMatrix();
    }
  });

  // Update plane shadow opacity if it exists
  scene.traverse((obj) => {
    if (obj.receiveShadow && obj.material) {
      // Shadows are baked into rendering, but we can adjust ambient
      const adjustment = 1 - (intensity * 0.3);
      if (ambientLight) {
        ambientLight.intensity = parseFloat(document.getElementById('light-intensity').value) * 0.6 * adjustment;
      }
    }
  });
}

// ==================== BACKGROUND SYSTEM ====================

// Handle background type change
function handleBackgroundTypeChange(e) {
  const type = e.target.value;

  // Show/hide appropriate options
  document.getElementById('bg-solid-options').style.display = type === 'solid' ? 'block' : 'none';
  document.getElementById('bg-gradient-options').style.display = type === 'gradient' ? 'block' : 'none';

  updateBackground();
}

// Update background based on current settings
function updateBackground() {
  const type = document.getElementById('bg-type').value;

  // Remove checkerboard floor if it exists
  if (checkerboardFloor) {
    scene.remove(checkerboardFloor);
    checkerboardFloor = null;
  }

  switch (type) {
    case 'solid':
      const color = document.getElementById('bg-color').value;
      scene.background = new THREE.Color(color);
      break;

    case 'gradient':
      const topColor = document.getElementById('bg-gradient-top').value;
      const bottomColor = document.getElementById('bg-gradient-bottom').value;
      createGradientBackground(topColor, bottomColor);
      break;

    case 'checkerboard':
      scene.background = new THREE.Color(0xcccccc);
      createCheckerboardFloor();
      break;
  }
}

// Create gradient background using canvas texture
function createGradientBackground(topColor, bottomColor) {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, topColor);
  gradient.addColorStop(1, bottomColor);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 2, 256);

  const texture = new THREE.CanvasTexture(canvas);
  scene.background = texture;
}

// Create checkerboard floor
function createCheckerboardFloor() {
  const size = 50;
  const divisions = 50;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const squareSize = canvas.width / divisions;

  for (let i = 0; i < divisions; i++) {
    for (let j = 0; j < divisions; j++) {
      ctx.fillStyle = (i + j) % 2 === 0 ? '#ffffff' : '#cccccc';
      ctx.fillRect(i * squareSize, j * squareSize, squareSize, squareSize);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(divisions / 2, divisions / 2);

  const geometry = new THREE.PlaneGeometry(size, size);
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    side: THREE.DoubleSide
  });

  checkerboardFloor = new THREE.Mesh(geometry, material);
  checkerboardFloor.rotation.x = -Math.PI / 2;
  checkerboardFloor.position.y = -0.01; // Slightly below grid
  checkerboardFloor.receiveShadow = true;
  scene.add(checkerboardFloor);
}

// ==================== MEASUREMENT SYSTEM ====================

// Unit conversion
function convertUnits(valueInMeters, targetUnit) {
  const conversions = {
    'm': 1,
    'cm': 100,
    'mm': 1000,
    'in': 39.3701
  };
  return valueInMeters * conversions[targetUnit];
}

// Format measurement value
function formatMeasurement(value) {
  return value.toFixed(2) + ' ' + measurementUnits;
}

// Start distance measurement mode
function startDistanceMeasurement() {
  clearMeasurements();
  measurementMode = 'distance';
  measurementPoints = [];

  const display = document.getElementById('measurement-display');
  display.className = 'active';
  display.innerHTML = '<p>Click two points on the model to measure distance</p>';

  document.getElementById('measure-distance').textContent = '⏸️ Cancel';
  document.getElementById('measure-distance').onclick = cancelMeasurement;

  // Enable click detection
  renderer.domElement.addEventListener('click', handleMeasurementClick);
}

// Cancel measurement mode
function cancelMeasurement() {
  measurementMode = null;
  renderer.domElement.removeEventListener('click', handleMeasurementClick);

  const display = document.getElementById('measurement-display');
  display.className = '';
  display.innerHTML = '';

  document.getElementById('measure-distance').textContent = '📏 Measure Distance';
  document.getElementById('measure-distance').onclick = startDistanceMeasurement;
}

// Handle click for measurements
function handleMeasurementClick(event) {
  if (!measurementMode) return;

  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  let objects = [];
  if (currentModel) objects.push(currentModel);
  objects = objects.concat(createdObjects);

  const intersects = raycaster.intersectObjects(objects, true);

  if (intersects.length > 0) {
    const point = intersects[0].point;
    measurementPoints.push(point);

    // Create visual marker
    const markerGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.copy(point);
    scene.add(marker);
    measurementLines.push(marker);

    if (measurementPoints.length === 2) {
      // Calculate distance
      const distance = measurementPoints[0].distanceTo(measurementPoints[1]);
      const convertedDistance = convertUnits(distance, measurementUnits);

      // Draw line between points
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(measurementPoints);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      measurementLines.push(line);

      // Display result
      const display = document.getElementById('measurement-display');
      display.className = '';
      display.innerHTML = `<p><span class="dimension-label">Distance:</span> ${formatMeasurement(convertedDistance)}</p>`;

      // Reset measurement mode
      cancelMeasurement();
    } else {
      const display = document.getElementById('measurement-display');
      display.innerHTML = '<p>Click second point...</p>';
    }
  }
}

// Show bounding box dimensions
function showDimensions() {
  let targetObject = null;

  if (currentModel) {
    targetObject = currentModel;
  } else if (createdObjects.length > 0) {
    // Create group from all objects
    const group = new THREE.Group();
    createdObjects.forEach(obj => group.add(obj.clone()));
    targetObject = group;
  }

  if (!targetObject) {
    alert('No model loaded');
    return;
  }

  // Remove existing dimension box
  if (dimensionBox) {
    scene.remove(dimensionBox);
  }

  // Calculate bounding box
  const box = new THREE.Box3().setFromObject(targetObject);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // Create box helper
  const boxHelper = new THREE.Box3Helper(box, 0x00ff00);
  scene.add(boxHelper);
  dimensionBox = boxHelper;

  // Convert dimensions
  const width = convertUnits(size.x, measurementUnits);
  const height = convertUnits(size.y, measurementUnits);
  const depth = convertUnits(size.z, measurementUnits);

  // Display dimensions
  const display = document.getElementById('measurement-display');
  display.className = '';
  display.innerHTML = `
    <p><span class="dimension-label">Width (X):</span> ${formatMeasurement(width)}</p>
    <p><span class="dimension-label">Height (Y):</span> ${formatMeasurement(height)}</p>
    <p><span class="dimension-label">Depth (Z):</span> ${formatMeasurement(depth)}</p>
  `;

  console.log('Dimensions shown:', { width, height, depth });
}

// Clear all measurements
function clearMeasurements() {
  // Remove dimension box
  if (dimensionBox) {
    scene.remove(dimensionBox);
    dimensionBox = null;
  }

  // Clear display
  const display = document.getElementById('measurement-display');
  display.className = '';
  display.innerHTML = '';

  console.log('Measurements cleared');
}

// Creator Controls Setup
function setupCreatorControls() {
  // Object type change
  const objectTypeSelect = document.getElementById('creator-object-type');
  objectTypeSelect.addEventListener('change', (e) => {
    // Hide all param sections
    document.querySelectorAll('.creator-params').forEach(section => {
      section.style.display = 'none';
    });
    // Show relevant param section
    const paramSection = document.getElementById(`creator-${e.target.value}-params`);
    if (paramSection) {
      paramSection.style.display = 'block';
    }
  });

  // Texture type change
  const textureTypeSelect = document.getElementById('creator-texture-type');
  textureTypeSelect.addEventListener('change', (e) => {
    // Hide all texture options
    document.querySelectorAll('.creator-texture-options').forEach(section => {
      section.style.display = 'none';
    });
    // Show relevant texture options
    const textureSection = document.getElementById(`creator-${e.target.value}-texture`);
    if (textureSection) {
      textureSection.style.display = 'block';
    }
  });

  // Texture image upload
  const textureImageInput = document.getElementById('creator-texture-image');
  textureImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        textureImageData = evt.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // Range value displays
  setupCreatorRangeDisplay('creator-sphere-radius', 'creator-sphere-radius-val');
  setupCreatorRangeDisplay('creator-sphere-segments', 'creator-sphere-segments-val');
  setupCreatorRangeDisplay('creator-cube-size', 'creator-cube-size-val');
  setupCreatorRangeDisplay('creator-parallelepiped-width', 'creator-parallelepiped-width-val');
  setupCreatorRangeDisplay('creator-parallelepiped-height', 'creator-parallelepiped-height-val');
  setupCreatorRangeDisplay('creator-parallelepiped-depth', 'creator-parallelepiped-depth-val');
  setupCreatorRangeDisplay('creator-cylinder-radius', 'creator-cylinder-radius-val');
  setupCreatorRangeDisplay('creator-cylinder-height', 'creator-cylinder-height-val');
  setupCreatorRangeDisplay('creator-pyramid-base', 'creator-pyramid-base-val');
  setupCreatorRangeDisplay('creator-pyramid-height', 'creator-pyramid-height-val');
  setupCreatorRangeDisplay('creator-torus-radius', 'creator-torus-radius-val');
  setupCreatorRangeDisplay('creator-torus-tube', 'creator-torus-tube-val');
  setupCreatorRangeDisplay('creator-plane-width', 'creator-plane-width-val');
  setupCreatorRangeDisplay('creator-plane-height', 'creator-plane-height-val');
  setupCreatorRangeDisplay('creator-proc-octaves', 'creator-proc-octaves-val');
  setupCreatorRangeDisplay('creator-emission', 'creator-emission-val');
  setupCreatorRangeDisplay('creator-metalness', 'creator-metalness-val');
  setupCreatorRangeDisplay('creator-roughness', 'creator-roughness-val');

  // Add object button
  document.getElementById('creator-add-object').addEventListener('click', addCreatorObject);

  // Update object button
  document.getElementById('creator-update-object').addEventListener('click', updateCreatorObject);

  // Delete object button
  document.getElementById('creator-delete-object').addEventListener('click', deleteCreatorObject);

  // Import object button
  document.getElementById('creator-import-object').addEventListener('click', importObjectToScene);

  // Export all button
  document.getElementById('creator-export-all').addEventListener('click', exportAllObjects);

  // Import from URL button
  const importUrlBtn = document.getElementById('creator-import-url');
  if (importUrlBtn) {
    importUrlBtn.addEventListener('click', () => importObjectFromUrl());
  }

  // Click on objects to select them
  window.addEventListener('click', onCreatorClick);
}

function setupCreatorRangeDisplay(rangeId, displayId) {
  const range = document.getElementById(rangeId);
  const display = document.getElementById(displayId);
  if (range && display) {
    range.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      display.textContent = value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
    });
  }
}

// Helper function to set object name for both userData and Three.js
function setObjectName(object, name) {
  object.userData.name = name;
  object.name = name;
}

// Add new object in Creator mode
function addCreatorObject() {
  const mesh = createMeshFromCreatorParams();
  if (mesh) {
    mesh.userData.creatorId = Date.now(); // Unique ID
    const objectType = document.getElementById('creator-object-type').value;
    const objectName = `${objectType.charAt(0).toUpperCase() + objectType.slice(1)} ${createdObjects.length + 1}`;
    setObjectName(mesh, objectName);
    createdObjects.push(mesh);
    scene.add(mesh);

    // Update object list
    updateObjectList();

    // Save to history
    saveToHistory();
  }
}

// Update selected object
function updateCreatorObject() {
  if (!selectedObject) return;

  // Check if this is an imported model
  const isImported = selectedObject.userData && selectedObject.userData.isImported;

  if (isImported) {
    // Imported model - only update material, preserve geometry
    updateImportedObjectMaterial(selectedObject);
  } else {
    // Created primitive - update both geometry and material
    updateCreatedObject(selectedObject);
  }
}

// Update material for imported objects (preserves geometry)
function updateImportedObjectMaterial(object) {
  // Generate new material based on current texture/material settings
  const textureType = document.getElementById('creator-texture-type').value;
  let texture;

  switch (textureType) {
    case 'color':
      const color = document.getElementById('creator-base-color').value;
      const colorCanvas = generateSolidColorTexture(512, 512, color);
      texture = new THREE.CanvasTexture(colorCanvas);
      break;
    case 'procedural':
      const procCanvas = generateProceduralTexture(1024, 512, {
        color1: document.getElementById('creator-proc-color1').value,
        color2: document.getElementById('creator-proc-color2').value,
        octaves: parseInt(document.getElementById('creator-proc-octaves').value)
      });
      texture = new THREE.CanvasTexture(procCanvas);
      break;
    case 'image':
      if (textureImageData) {
        const img = new Image();
        img.src = textureImageData;
        texture = new THREE.Texture(img);
        img.onload = () => {
          texture.needsUpdate = true;
        };
      }
      break;
  }

  // Create new material config
  const materialConfig = {
    metalness: parseFloat(document.getElementById('creator-metalness').value),
    roughness: parseFloat(document.getElementById('creator-roughness').value)
  };

  if (texture) {
    materialConfig.map = texture;
  }

  const emissionValue = parseFloat(document.getElementById('creator-emission').value);
  if (emissionValue > 0) {
    const baseColor = textureType === 'color' ?
      document.getElementById('creator-base-color').value :
      document.getElementById('creator-proc-color1').value;
    materialConfig.emissive = new THREE.Color(baseColor);
    materialConfig.emissiveIntensity = emissionValue;
    if (textureType === 'procedural' || textureType === 'image') {
      materialConfig.emissiveMap = texture;
    }
  }

  // Apply material to the object
  // For simple meshes with direct material
  if (object.material) {
    const newMaterial = new THREE.MeshStandardMaterial(materialConfig);
    object.material.dispose(); // Clean up old material
    object.material = newMaterial;
  }

  // For complex objects (Groups, GLTF models) with child meshes
  object.traverse((child) => {
    if (child.isMesh && child.material) {
      const newMaterial = new THREE.MeshStandardMaterial(materialConfig);
      if (child.material.dispose) {
        child.material.dispose(); // Clean up old material
      }
      child.material = newMaterial;
    }
  });

  // Save to history
  saveToHistory();

  console.log('Material updated for imported object:', object.userData.name);
}

// Update geometry and material for created primitives
function updateCreatedObject(object) {
  // Store current transformation
  const position = object.position ? object.position.clone() : new THREE.Vector3();
  const rotation = object.rotation ? object.rotation.clone() : new THREE.Euler();
  const scale = object.scale ? object.scale.clone() : new THREE.Vector3(1, 1, 1);

  // Remove old object
  scene.remove(object);
  const index = createdObjects.indexOf(object);

  // Create updated object
  const newMesh = createMeshFromCreatorParams();
  if (newMesh) {
    newMesh.userData.creatorId = object.userData.creatorId;
    newMesh.userData.name = object.userData.name;
    // Preserve isImported flag if it exists (shouldn't for created objects, but just in case)
    if (object.userData.isImported) {
      newMesh.userData.isImported = object.userData.isImported;
    }

    // Restore transformation
    newMesh.position.copy(position);
    newMesh.rotation.copy(rotation);
    newMesh.scale.copy(scale);

    createdObjects[index] = newMesh;
    scene.add(newMesh);

    // Select the new object
    deselectObject();
    selectObject(newMesh);

    // Save to history
    saveToHistory();
  }
}

// Delete selected object
function deleteCreatorObject() {
  if (!selectedObject) return;

  scene.remove(selectedObject);
  const index = createdObjects.indexOf(selectedObject);
  if (index > -1) {
    createdObjects.splice(index, 1);
  }

  deselectObject();

  // Update object list
  updateObjectList();

  // Save to history
  saveToHistory();
}

// Create mesh from current creator parameters
function createMeshFromCreatorParams() {
  const objectType = document.getElementById('creator-object-type').value;

  // Create geometry
  let geometry;
  switch (objectType) {
    case 'sphere':
      geometry = new THREE.SphereGeometry(
        parseFloat(document.getElementById('creator-sphere-radius').value),
        parseInt(document.getElementById('creator-sphere-segments').value),
        parseInt(document.getElementById('creator-sphere-segments').value)
      );
      break;
    case 'cube':
      const size = parseFloat(document.getElementById('creator-cube-size').value);
      geometry = new THREE.BoxGeometry(size, size, size);
      break;
    case 'parallelepiped':
      geometry = new THREE.BoxGeometry(
        parseFloat(document.getElementById('creator-parallelepiped-width').value),
        parseFloat(document.getElementById('creator-parallelepiped-height').value),
        parseFloat(document.getElementById('creator-parallelepiped-depth').value)
      );
      break;
    case 'cylinder':
      geometry = new THREE.CylinderGeometry(
        parseFloat(document.getElementById('creator-cylinder-radius').value),
        parseFloat(document.getElementById('creator-cylinder-radius').value),
        parseFloat(document.getElementById('creator-cylinder-height').value),
        32
      );
      break;
    case 'pyramid':
      geometry = createPyramidGeometry(
        parseFloat(document.getElementById('creator-pyramid-base').value),
        parseFloat(document.getElementById('creator-pyramid-height').value)
      );
      break;
    case 'torus':
      geometry = new THREE.TorusGeometry(
        parseFloat(document.getElementById('creator-torus-radius').value),
        parseFloat(document.getElementById('creator-torus-tube').value),
        16,
        100
      );
      break;
    case 'plane':
      geometry = new THREE.PlaneGeometry(
        parseFloat(document.getElementById('creator-plane-width').value),
        parseFloat(document.getElementById('creator-plane-height').value)
      );
      break;
    default:
      console.error('Unknown object type:', objectType);
      return null;
  }

  // Generate texture
  const textureType = document.getElementById('creator-texture-type').value;
  let texture;

  switch (textureType) {
    case 'color':
      const color = document.getElementById('creator-base-color').value;
      const colorCanvas = generateSolidColorTexture(512, 512, color);
      texture = new THREE.CanvasTexture(colorCanvas);
      break;
    case 'procedural':
      const procCanvas = generateProceduralTexture(1024, 512, {
        color1: document.getElementById('creator-proc-color1').value,
        color2: document.getElementById('creator-proc-color2').value,
        octaves: parseInt(document.getElementById('creator-proc-octaves').value)
      });
      texture = new THREE.CanvasTexture(procCanvas);
      break;
    case 'image':
      if (textureImageData) {
        const img = new Image();
        img.src = textureImageData;
        texture = new THREE.Texture(img);
        img.onload = () => {
          texture.needsUpdate = true;
        };
      }
      break;
  }

  // Create material
  const materialConfig = {
    metalness: parseFloat(document.getElementById('creator-metalness').value),
    roughness: parseFloat(document.getElementById('creator-roughness').value)
  };

  if (texture) {
    materialConfig.map = texture;
  }

  const emissionValue = parseFloat(document.getElementById('creator-emission').value);
  if (emissionValue > 0) {
    const baseColor = textureType === 'color' ?
      document.getElementById('creator-base-color').value :
      document.getElementById('creator-proc-color1').value;
    materialConfig.emissive = new THREE.Color(baseColor);
    materialConfig.emissiveIntensity = emissionValue;
    if (textureType === 'procedural' || textureType === 'image') {
      materialConfig.emissiveMap = texture;
    }
  }

  const material = new THREE.MeshStandardMaterial(materialConfig);

  // Create mesh
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

// Handle clicks to select objects
function onCreatorClick(event) {
  if (!creatorMode) return;

  // Ignore clicks on the transform controls
  if (event.target !== renderer.domElement) return;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(createdObjects, true); // true = recursive

  if (intersects.length > 0) {
    // Find the top-level object (the one in createdObjects array)
    let clickedObject = intersects[0].object;
    while (clickedObject.parent && !createdObjects.includes(clickedObject)) {
      clickedObject = clickedObject.parent;
    }

    // Multi-select with Shift key
    if (event.shiftKey) {
      toggleObjectSelection(clickedObject);
    } else {
      // Single select
      selectObject(clickedObject);
    }
  } else {
    if (!event.shiftKey) {
      deselectObject();
    }
  }
}

// Select an object
function selectObject(object) {
  // Validate object is in scene graph
  if (!object || !object.parent) {
    console.warn('Cannot select object: object is not in scene graph');
    return;
  }

  // Clear multi-selection
  clearMultiSelection();

  selectedObject = object;
  selectedObjects = [object];

  // Attach transform controls
  if (transformControls) {
    transformControls.attach(object);
  }

  // Create resize handles
  createResizeHandles(object);

  // Highlight selected object
  highlightObject(object, true);

  // Check if this is an imported model
  const isImported = object.userData && object.userData.isImported;

  if (isImported) {
    // Imported model - hide geometry controls, show material-only mode
    document.getElementById('geometry-controls').style.display = 'none';
    document.getElementById('imported-model-indicator').style.display = 'block';
    document.getElementById('creator-update-object').textContent = '✏️ Update Material';
  } else {
    // Created primitive - show geometry controls
    document.getElementById('geometry-controls').style.display = 'block';
    document.getElementById('imported-model-indicator').style.display = 'none';
    document.getElementById('creator-update-object').textContent = '✏️ Update Object';
  }

  // Show update/delete buttons
  document.getElementById('creator-update-object').style.display = 'block';
  document.getElementById('creator-delete-object').style.display = 'block';

  // Show transform properties
  document.getElementById('transform-properties').style.display = 'block';
  updateTransformInputs(object);

  // Hide multi-select operations
  document.getElementById('multi-select-ops').style.display = 'none';

  // Update object list selection
  updateObjectListSelection();
}

// Toggle object selection (for multi-select)
function toggleObjectSelection(object) {
  const index = selectedObjects.indexOf(object);

  if (index > -1) {
    // Deselect this object
    selectedObjects.splice(index, 1);
    highlightObject(object, false);
  } else {
    // Add to selection
    selectedObjects.push(object);
    highlightObject(object, true);
  }

  // Update UI based on selection count
  if (selectedObjects.length === 0) {
    deselectObject();
  } else if (selectedObjects.length === 1) {
    selectedObject = selectedObjects[0];
    // Validate object is in scene graph before attaching controls
    if (selectedObject && selectedObject.parent && transformControls) {
      transformControls.attach(selectedObject);
    }
    createResizeHandles(selectedObject);
    document.getElementById('transform-properties').style.display = 'block';
    updateTransformInputs(selectedObject);
    document.getElementById('multi-select-ops').style.display = 'none';
  } else {
    // Multiple objects selected
    selectedObject = null;
    if (transformControls) {
      transformControls.detach();
    }
    removeResizeHandles();
    document.getElementById('transform-properties').style.display = 'none';
    document.getElementById('multi-select-ops').style.display = 'block';
  }

  updateObjectListSelection();
}

// Highlight object
function highlightObject(object, highlighted) {
  // Handle objects with material directly
  if (object.material) {
    if (highlighted) {
      // Store original emissive if not already stored
      if (!object.userData.originalEmissive && object.material.emissive) {
        object.userData.originalEmissive = object.material.emissive.clone();
        object.userData.originalEmissiveIntensity = object.material.emissiveIntensity || 0;
      }
      if (object.material.emissive) {
        object.material.emissive = new THREE.Color(0x00ff00);
        object.material.emissiveIntensity = 0.3;
      }
    } else {
      // Restore original emissive
      if (object.userData.originalEmissive && object.material.emissive) {
        object.material.emissive.copy(object.userData.originalEmissive);
        object.material.emissiveIntensity = object.userData.originalEmissiveIntensity;
      }
    }
  }

  // For Groups and complex objects, highlight all child meshes
  if (object.children && object.children.length > 0) {
    object.traverse((child) => {
      if (child.isMesh && child.material) {
        if (highlighted) {
          if (!child.userData.originalEmissive && child.material.emissive) {
            child.userData.originalEmissive = child.material.emissive.clone();
            child.userData.originalEmissiveIntensity = child.material.emissiveIntensity || 0;
          }
          if (child.material.emissive) {
            child.material.emissive = new THREE.Color(0x00ff00);
            child.material.emissiveIntensity = 0.3;
          }
        } else {
          if (child.userData.originalEmissive && child.material.emissive) {
            child.material.emissive.copy(child.userData.originalEmissive);
            child.material.emissiveIntensity = child.userData.originalEmissiveIntensity;
          }
        }
      }
    });
  }
}

// Clear multi-selection
function clearMultiSelection() {
  selectedObjects.forEach(obj => {
    highlightObject(obj, false);
  });
  selectedObjects = [];
}

// Deselect object
function deselectObject() {
  clearMultiSelection();

  if (selectedObject) {
    highlightObject(selectedObject, false);
    selectedObject = null;
  }

  // Detach transform controls
  if (transformControls) {
    transformControls.detach();
  }

  // Remove resize handles
  removeResizeHandles();

  // Hide update/delete buttons
  document.getElementById('creator-update-object').style.display = 'none';
  document.getElementById('creator-delete-object').style.display = 'none';

  // Hide transform properties
  document.getElementById('transform-properties').style.display = 'none';

  // Hide multi-select operations
  document.getElementById('multi-select-ops').style.display = 'none';

  // Reset geometry controls visibility and imported indicator
  document.getElementById('geometry-controls').style.display = 'block';
  document.getElementById('imported-model-indicator').style.display = 'none';

  // Update object list selection
  updateObjectListSelection();
}

// Update transform input fields
function updateTransformInputs(object) {
  if (!object || isUpdatingTransform) return;

  isUpdatingTransform = true;

  // Position
  document.getElementById('pos-x').value = object.position.x.toFixed(2);
  document.getElementById('pos-y').value = object.position.y.toFixed(2);
  document.getElementById('pos-z').value = object.position.z.toFixed(2);

  // Rotation (convert to degrees)
  document.getElementById('rot-x').value = THREE.MathUtils.radToDeg(object.rotation.x).toFixed(1);
  document.getElementById('rot-y').value = THREE.MathUtils.radToDeg(object.rotation.y).toFixed(1);
  document.getElementById('rot-z').value = THREE.MathUtils.radToDeg(object.rotation.z).toFixed(1);

  // Scale
  document.getElementById('scale-x').value = object.scale.x.toFixed(2);
  document.getElementById('scale-y').value = object.scale.y.toFixed(2);
  document.getElementById('scale-z').value = object.scale.z.toFixed(2);

  isUpdatingTransform = false;
}

// Setup transform input listeners
function setupTransformInputs() {
  // Position inputs
  ['x', 'y', 'z'].forEach(axis => {
    const input = document.getElementById(`pos-${axis}`);
    input.addEventListener('input', (e) => {
      if (!selectedObject || isUpdatingTransform) return;
      selectedObject.position[axis] = parseFloat(e.target.value) || 0;
      updateResizeHandles(selectedObject);
    });
    input.addEventListener('change', () => {
      if (!selectedObject || isUpdatingTransform) return;
      saveToHistory();
    });
  });

  // Rotation inputs (convert from degrees)
  ['x', 'y', 'z'].forEach(axis => {
    const input = document.getElementById(`rot-${axis}`);
    input.addEventListener('input', (e) => {
      if (!selectedObject || isUpdatingTransform) return;
      selectedObject.rotation[axis] = THREE.MathUtils.degToRad(parseFloat(e.target.value) || 0);
      updateResizeHandles(selectedObject);
    });
    input.addEventListener('change', () => {
      if (!selectedObject || isUpdatingTransform) return;
      saveToHistory();
    });
  });

  // Scale inputs
  ['x', 'y', 'z'].forEach(axis => {
    const input = document.getElementById(`scale-${axis}`);
    input.addEventListener('input', (e) => {
      if (!selectedObject || isUpdatingTransform) return;
      const value = parseFloat(e.target.value);
      if (value > 0) {
        selectedObject.scale[axis] = value;
        updateResizeHandles(selectedObject);
      }
    });
    input.addEventListener('change', () => {
      if (!selectedObject || isUpdatingTransform) return;
      saveToHistory();
    });
  });
}

// Import object from file
function importObjectToScene() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.stl,.glb,.gltf,.obj,.fbx,.dae,.ply';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();
    const reader = new FileReader();

    reader.onload = (evt) => {
      const arrayBuffer = evt.target.result;
      const blob = new Blob([arrayBuffer]);
      const url = URL.createObjectURL(blob);

      let loader;
      switch (extension) {
        case 'stl':
          loader = new STLLoader();
          loader.load(url, (geometry) => {
            const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData.creatorId = Date.now();
            setObjectName(mesh, file.name);
            mesh.userData.isImported = true;
            createdObjects.push(mesh);
            scene.add(mesh);
            updateObjectList();
            saveToHistory();
            URL.revokeObjectURL(url);
          });
          break;
        case 'glb':
        case 'gltf':
          loader = new GLTFLoader();
          loader.load(url, (gltf) => {
            const model = gltf.scene;
            model.userData.creatorId = Date.now();
            setObjectName(model, file.name);
            model.userData.isImported = true;
            createdObjects.push(model);
            scene.add(model);
            updateObjectList();
            saveToHistory();
            URL.revokeObjectURL(url);
          });
          break;
        case 'obj':
          loader = new OBJLoader();
          loader.load(url, (object) => {
            object.userData.creatorId = Date.now();
            setObjectName(object, file.name);
            object.userData.isImported = true;
            createdObjects.push(object);
            scene.add(object);
            updateObjectList();
            saveToHistory();
            URL.revokeObjectURL(url);
          });
          break;
        case 'ply':
          loader = new PLYLoader();
          loader.load(url, (geometry) => {
            geometry.computeVertexNormals();
            const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData.creatorId = Date.now();
            setObjectName(mesh, file.name);
            mesh.userData.isImported = true;
            createdObjects.push(mesh);
            scene.add(mesh);
            updateObjectList();
            saveToHistory();
            URL.revokeObjectURL(url);
          });
          break;
        default:
          alert(`Unsupported format: ${extension}`);
          URL.revokeObjectURL(url);
      }
    };

    reader.readAsArrayBuffer(file);
  };
  input.click();
}

// Get geometry statistics for an object
function getObjectStats(obj) {
  let vertices = 0;
  let faces = 0;

  obj.traverse((child) => {
    if (child.isMesh && child.geometry) {
      const geometry = child.geometry;
      if (geometry.attributes && geometry.attributes.position) {
        vertices += geometry.attributes.position.count;
        faces += geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3;
      }
    }
  });

  return {
    vertices: vertices,
    faces: Math.floor(faces)
  };
}

// Update object list
function updateObjectList() {
  const listContainer = document.getElementById('object-list-container');
  if (!listContainer) return;

  listContainer.innerHTML = '';

  createdObjects.forEach((obj, index) => {
    const item = document.createElement('div');
    item.className = 'object-list-item';
    if (obj === selectedObject) {
      item.classList.add('selected');
    }

    const name = obj.userData.name || `Object ${index + 1}`;
    const stats = getObjectStats(obj);

    // Create name element
    const nameDiv = document.createElement('div');
    nameDiv.className = 'object-name';
    nameDiv.textContent = name;

    // Create info element
    const infoDiv = document.createElement('div');
    infoDiv.className = 'object-info';
    infoDiv.textContent = `V: ${stats.vertices.toLocaleString()} | F: ${stats.faces.toLocaleString()}`;

    item.appendChild(nameDiv);
    item.appendChild(infoDiv);

    item.onclick = () => selectObject(obj);

    listContainer.appendChild(item);
  });
}

// Update object list selection
function updateObjectListSelection() {
  const items = document.querySelectorAll('.object-list-item');
  items.forEach((item, index) => {
    if (createdObjects[index] === selectedObject) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}

// Export all objects
function exportAllObjects() {
  if (createdObjects.length === 0) {
    alert('No objects to export');
    return;
  }

  // Read export settings from UI
  const formatSelect = document.getElementById('export-format');
  const preserveCheckbox = document.getElementById('export-preserve-objects');

  const format = formatSelect.value;
  const preserveObjects = preserveCheckbox.checked;

  // Create a group containing all objects with proper names
  const group = new THREE.Group();
  group.name = 'Scene';

  createdObjects.forEach((obj, index) => {
    if (obj && obj.clone) {
      const clonedObj = obj.clone();
      // Ensure object has a name
      if (!clonedObj.name || clonedObj.name === '') {
        clonedObj.name = obj.userData.name || `Object_${index + 1}`;
      }
      group.add(clonedObj);
    }
  });

  const baseName = 'scene';

  // Determine export target based on preserve/merge choice
  let exportTarget = group;

  // If user wants to merge, create merged geometry for all formats
  if (!preserveObjects) {
    exportTarget = createMergedMesh(group);
  }

  // Export based on format
  switch (format) {
    case 'glb':
      exportGLTF(exportTarget, baseName, true, false);
      break;
    case 'gltf':
      exportGLTF(exportTarget, baseName, false, false);
      break;
    case 'obj':
      exportOBJ(exportTarget, baseName, false);
      break;
    case 'stl':
      exportSTL(exportTarget, baseName, false);
      break;
    case 'ply':
      exportPLY(exportTarget, baseName, false);
      break;
    default:
      alert('Unknown format selected');
  }
}

// Create a merged mesh from a group of objects
function createMergedMesh(group) {
  const geometries = [];
  let material = null;

  group.traverse((child) => {
    if (child.isMesh && child.geometry) {
      // Clone and apply transformations
      const geom = child.geometry.clone();
      geom.applyMatrix4(child.matrixWorld);
      geometries.push(geom);

      // Use first material found
      if (!material && child.material) {
        material = child.material;
      }
    }
  });

  if (geometries.length === 0) {
    return group; // Return original if no meshes found
  }

  // Merge geometries using BufferGeometryUtils
  const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, false);
  const mergedMesh = new THREE.Mesh(
    mergedGeometry,
    material || new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mergedMesh.name = 'MergedScene';

  return mergedMesh;
}

// Copy object
function copyObject() {
  if (!selectedObject) return;

  // For complex objects (Groups, GLTF models), clone the entire object
  // For simple meshes, store individual properties
  if (selectedObject.geometry && selectedObject.material) {
    copiedObject = {
      geometry: selectedObject.geometry.clone(),
      material: selectedObject.material.clone(),
      userData: JSON.parse(JSON.stringify(selectedObject.userData || {})),
      position: selectedObject.position ? selectedObject.position.clone() : new THREE.Vector3(),
      rotation: selectedObject.rotation ? selectedObject.rotation.clone() : new THREE.Euler(),
      scale: selectedObject.scale ? selectedObject.scale.clone() : new THREE.Vector3(1, 1, 1),
      isSimpleMesh: true
    };
  } else {
    // Complex object - clone the entire thing
    copiedObject = {
      clonedObject: selectedObject.clone(),
      userData: JSON.parse(JSON.stringify(selectedObject.userData || {})),
      position: selectedObject.position ? selectedObject.position.clone() : new THREE.Vector3(),
      rotation: selectedObject.rotation ? selectedObject.rotation.clone() : new THREE.Euler(),
      scale: selectedObject.scale ? selectedObject.scale.clone() : new THREE.Vector3(1, 1, 1),
      isSimpleMesh: false
    };
  }

  console.log('Object copied');
}

// Paste object
function pasteObject() {
  if (!copiedObject) return;

  let newObject;

  if (copiedObject.isSimpleMesh) {
    // Simple mesh - create from geometry and material
    newObject = new THREE.Mesh(copiedObject.geometry.clone(), copiedObject.material.clone());
    newObject.castShadow = true;
    newObject.receiveShadow = true;
  } else {
    // Complex object - use the cloned object
    newObject = copiedObject.clonedObject.clone();
  }

  newObject.userData = JSON.parse(JSON.stringify(copiedObject.userData));
  newObject.userData.creatorId = Date.now();

  // Offset position slightly so it's visible
  newObject.position.copy(copiedObject.position).add(new THREE.Vector3(0.5, 0.5, 0.5));
  newObject.rotation.copy(copiedObject.rotation);
  newObject.scale.copy(copiedObject.scale);

  // Generate new name
  const baseName = newObject.userData.name || 'Object';
  newObject.userData.name = `${baseName} Copy`;

  createdObjects.push(newObject);
  scene.add(newObject);

  updateObjectList();

  // Select the new object
  deselectObject();
  selectObject(newObject);

  // Save to history
  saveToHistory();

  console.log('Object pasted');
}

// Duplicate object (Shift+D)
function duplicateObject() {
  if (!selectedObject) return;

  copyObject();
  pasteObject();
}

// History management functions
function saveToHistory() {
  // Remove any history after current index (when undoing then making new changes)
  if (historyIndex < history.length - 1) {
    history = history.slice(0, historyIndex + 1);
  }

  // Save current state
  const state = serializeScene();
  history.push(state);

  // Limit history size
  if (history.length > MAX_HISTORY) {
    history.shift();
  } else {
    historyIndex++;
  }
}

function serializeScene() {
  // Save the current state of all created objects
  return createdObjects.map(obj => {
    let serializedMaterial = null;

    if (obj.material) {
      // Deep clone material to preserve all properties
      serializedMaterial = obj.material.clone();

      // Handle texture cloning properly
      if (obj.material.map) {
        serializedMaterial.map = obj.material.map.clone();
        serializedMaterial.map.needsUpdate = true;
      }
      if (obj.material.emissiveMap) {
        serializedMaterial.emissiveMap = obj.material.emissiveMap.clone();
        serializedMaterial.emissiveMap.needsUpdate = true;
      }
      if (obj.material.normalMap) {
        serializedMaterial.normalMap = obj.material.normalMap.clone();
        serializedMaterial.normalMap.needsUpdate = true;
      }
      if (obj.material.roughnessMap) {
        serializedMaterial.roughnessMap = obj.material.roughnessMap.clone();
        serializedMaterial.roughnessMap.needsUpdate = true;
      }
      if (obj.material.metalnessMap) {
        serializedMaterial.metalnessMap = obj.material.metalnessMap.clone();
        serializedMaterial.metalnessMap.needsUpdate = true;
      }
    }

    return {
      position: obj.position ? obj.position.clone() : new THREE.Vector3(),
      rotation: obj.rotation ? obj.rotation.clone() : new THREE.Euler(),
      scale: obj.scale ? obj.scale.clone() : new THREE.Vector3(1, 1, 1),
      geometry: obj.geometry ? obj.geometry.clone() : null,
      material: serializedMaterial,
      userData: JSON.parse(JSON.stringify(obj.userData || {})),
      uuid: obj.uuid,
      isGroup: obj.isGroup || false
    };
  });
}

function restoreScene(state) {
  // Clear current objects and dispose resources
  createdObjects.forEach(obj => {
    if (resizeHandles && resizeHandles.parent === obj) {
      obj.remove(resizeHandles);
    }
    if (boundingBoxHelper && boundingBoxHelper.object === obj) {
      scene.remove(boundingBoxHelper);
    }

    // Dispose geometry and material to free memory
    if (obj.geometry) {
      obj.geometry.dispose();
    }
    if (obj.material) {
      if (obj.material.map) obj.material.map.dispose();
      if (obj.material.emissiveMap) obj.material.emissiveMap.dispose();
      if (obj.material.normalMap) obj.material.normalMap.dispose();
      if (obj.material.roughnessMap) obj.material.roughnessMap.dispose();
      if (obj.material.metalnessMap) obj.material.metalnessMap.dispose();
      obj.material.dispose();
    }

    scene.remove(obj);
  });

  if (transformControls && transformControls.object) {
    transformControls.detach();
  }

  createdObjects = [];
  selectedObject = null;
  selectedObjects = [];
  resizeHandles = null;
  boundingBoxHelper = null;

  // Restore objects from state
  state.forEach(objData => {
    let obj;

    if (objData.geometry && objData.material) {
      // Regular mesh object - clone material and geometry
      const material = objData.material.clone();
      const geometry = objData.geometry.clone();

      // Clone textures properly
      if (objData.material.map) {
        material.map = objData.material.map.clone();
        material.map.needsUpdate = true;
      }
      if (objData.material.emissiveMap) {
        material.emissiveMap = objData.material.emissiveMap.clone();
        material.emissiveMap.needsUpdate = true;
      }
      if (objData.material.normalMap) {
        material.normalMap = objData.material.normalMap.clone();
        material.normalMap.needsUpdate = true;
      }
      if (objData.material.roughnessMap) {
        material.roughnessMap = objData.material.roughnessMap.clone();
        material.roughnessMap.needsUpdate = true;
      }
      if (objData.material.metalnessMap) {
        material.metalnessMap = objData.material.metalnessMap.clone();
        material.metalnessMap.needsUpdate = true;
      }

      obj = new THREE.Mesh(geometry, material);
      obj.castShadow = true;
      obj.receiveShadow = true;
    } else {
      // Group or other object type - create empty group
      // Note: This is a simplified restoration for complex objects
      obj = new THREE.Group();
    }

    obj.position.copy(objData.position);
    obj.rotation.copy(objData.rotation);
    obj.scale.copy(objData.scale);
    obj.userData = JSON.parse(JSON.stringify(objData.userData));
    obj.uuid = objData.uuid;

    scene.add(obj);
    createdObjects.push(obj);
  });

  // Update UI
  updateObjectList();
}

function undo() {
  if (historyIndex <= 0) {
    console.log('Nothing to undo');
    return;
  }

  historyIndex--;
  const state = history[historyIndex];
  restoreScene(state);
}

function redo() {
  if (historyIndex >= history.length - 1) {
    console.log('Nothing to redo');
    return;
  }

  historyIndex++;
  const state = history[historyIndex];
  restoreScene(state);
}

// Create pyramid geometry
function createPyramidGeometry(baseSize, height) {
  const geometry = new THREE.BufferGeometry();
  const halfBase = baseSize / 2;

  // Vertices
  const vertices = new Float32Array([
    // Base (square)
    -halfBase, 0, -halfBase,  // 0
     halfBase, 0, -halfBase,  // 1
     halfBase, 0,  halfBase,  // 2
    -halfBase, 0,  halfBase,  // 3
    // Top (apex)
     0, height, 0             // 4
  ]);

  // Indices (triangles)
  const indices = [
    // Base
    0, 1, 2,
    0, 2, 3,
    // Sides
    0, 4, 1,  // Front
    1, 4, 2,  // Right
    2, 4, 3,  // Back
    3, 4, 0   // Left
  ];

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

// Create resize handles for selected object
function createResizeHandles(object) {
  if (resizeHandles) {
    scene.remove(resizeHandles);
  }

  resizeHandles = new THREE.Group();

  // Create bounding box
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // Create 8 corner handles
  const handleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  const handleMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });

  const positions = [
    new THREE.Vector3(-size.x / 2, -size.y / 2, -size.z / 2),
    new THREE.Vector3( size.x / 2, -size.y / 2, -size.z / 2),
    new THREE.Vector3( size.x / 2,  size.y / 2, -size.z / 2),
    new THREE.Vector3(-size.x / 2,  size.y / 2, -size.z / 2),
    new THREE.Vector3(-size.x / 2, -size.y / 2,  size.z / 2),
    new THREE.Vector3( size.x / 2, -size.y / 2,  size.z / 2),
    new THREE.Vector3( size.x / 2,  size.y / 2,  size.z / 2),
    new THREE.Vector3(-size.x / 2,  size.y / 2,  size.z / 2)
  ];

  positions.forEach((pos, index) => {
    const handle = new THREE.Mesh(handleGeometry, handleMaterial.clone());
    handle.position.copy(pos);
    handle.userData.isResizeHandle = true;
    handle.userData.corner = index;
    resizeHandles.add(handle);
  });

  resizeHandles.position.copy(center);
  scene.add(resizeHandles);

  return resizeHandles;
}

// Remove resize handles
function removeResizeHandles() {
  if (resizeHandles) {
    scene.remove(resizeHandles);
    resizeHandles = null;
  }
}

// Update resize handles to match object
function updateResizeHandles(object) {
  if (!resizeHandles || !object) return;

  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const positions = [
    new THREE.Vector3(-size.x / 2, -size.y / 2, -size.z / 2),
    new THREE.Vector3( size.x / 2, -size.y / 2, -size.z / 2),
    new THREE.Vector3( size.x / 2,  size.y / 2, -size.z / 2),
    new THREE.Vector3(-size.x / 2,  size.y / 2, -size.z / 2),
    new THREE.Vector3(-size.x / 2, -size.y / 2,  size.z / 2),
    new THREE.Vector3( size.x / 2, -size.y / 2,  size.z / 2),
    new THREE.Vector3( size.x / 2,  size.y / 2,  size.z / 2),
    new THREE.Vector3(-size.x / 2,  size.y / 2,  size.z / 2)
  ];

  resizeHandles.children.forEach((handle, index) => {
    handle.position.copy(positions[index]);
  });

  resizeHandles.position.copy(center);
}

// Handle mouse events for resize handles
function onResizeHandleMouseDown(event) {
  if (!creatorMode || !resizeHandles) return;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(resizeHandles.children);

  if (intersects.length > 0) {
    isDraggingHandle = true;
    draggedHandle = intersects[0].object;
    controls.enabled = false;
    event.preventDefault();
  }
}

function onResizeHandleMouseMove(event) {
  if (!isDraggingHandle || !draggedHandle || !selectedObject) return;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Create a plane for dragging
  const plane = new THREE.Plane();
  const normal = camera.position.clone().normalize();
  plane.setFromNormalAndCoplanarPoint(normal, draggedHandle.getWorldPosition(new THREE.Vector3()));

  const intersection = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, intersection);

  if (intersection) {
    // Calculate scale change based on handle movement
    const corner = draggedHandle.userData.corner;
    const worldPos = draggedHandle.getWorldPosition(new THREE.Vector3());
    const delta = intersection.clone().sub(worldPos);

    // Apply scale change (simplified - scales uniformly)
    const scaleFactor = 1 + delta.length() * 0.05;
    if (delta.dot(camera.position) > 0) {
      selectedObject.scale.multiplyScalar(scaleFactor);
    } else {
      selectedObject.scale.multiplyScalar(1 / scaleFactor);
    }

    updateResizeHandles(selectedObject);

    // Update transform controls
    if (transformControls) {
      transformControls.updateMatrixWorld();
    }
  }

  event.preventDefault();
}

function onResizeHandleMouseUp(event) {
  if (isDraggingHandle) {
    isDraggingHandle = false;
    draggedHandle = null;
    controls.enabled = true;
    event.preventDefault();

    // Save to history after resize is complete
    saveToHistory();
  }
}

// Merge selected objects
function mergeSelectedObjects() {
  if (selectedObjects.length < 2) {
    alert('Please select at least 2 objects to merge');
    return;
  }

  // Create a merged geometry
  const mergedGeometry = new THREE.BufferGeometry();
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  let vertexOffset = 0;

  // Get the first object's material as base
  const baseMaterial = selectedObjects[0].material.clone();

  selectedObjects.forEach(obj => {
    if (!obj.geometry) return;

    // Clone and apply transformations
    const tempGeometry = obj.geometry.clone();
    tempGeometry.applyMatrix4(obj.matrixWorld);

    // Extract vertex data
    const posAttr = tempGeometry.attributes.position;
    const normAttr = tempGeometry.attributes.normal;
    const uvAttr = tempGeometry.attributes.uv;

    if (posAttr) {
      for (let i = 0; i < posAttr.count; i++) {
        positions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
      }
    }

    if (normAttr) {
      for (let i = 0; i < normAttr.count; i++) {
        normals.push(normAttr.getX(i), normAttr.getY(i), normAttr.getZ(i));
      }
    }

    if (uvAttr) {
      for (let i = 0; i < uvAttr.count; i++) {
        uvs.push(uvAttr.getX(i), uvAttr.getY(i));
      }
    }

    // Handle indices
    if (tempGeometry.index) {
      const indexAttr = tempGeometry.index;
      for (let i = 0; i < indexAttr.count; i++) {
        indices.push(indexAttr.getX(i) + vertexOffset);
      }
    } else {
      for (let i = 0; i < posAttr.count; i++) {
        indices.push(i + vertexOffset);
      }
    }

    vertexOffset += posAttr.count;
  });

  // Set attributes
  mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (normals.length > 0) {
    mergedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  } else {
    mergedGeometry.computeVertexNormals();
  }
  if (uvs.length > 0) {
    mergedGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  }
  mergedGeometry.setIndex(indices);

  // Create merged mesh
  const mergedMesh = new THREE.Mesh(mergedGeometry, baseMaterial);
  mergedMesh.castShadow = true;
  mergedMesh.receiveShadow = true;
  mergedMesh.userData.creatorId = Date.now();
  mergedMesh.userData.name = 'Merged Object';

  // Remove selected objects from scene
  selectedObjects.forEach(obj => {
    scene.remove(obj);
    const index = createdObjects.indexOf(obj);
    if (index > -1) {
      createdObjects.splice(index, 1);
    }
  });

  // Add merged object
  createdObjects.push(mergedMesh);
  scene.add(mergedMesh);

  // Clear selection and select new merged object
  deselectObject();
  selectObject(mergedMesh);
  updateObjectList();

  // Save to history
  saveToHistory();

  console.log('Objects merged successfully');
}

// Listen for messages from background script to load new models
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'loadNewModel') {
    // Fetch and load the new model
    showLoading();
    document.getElementById('loading').querySelector('p').textContent = 'Loading new model...';

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'fetchModelFromUrl',
        url: request.url
      });

      if (response.success) {
        loadModel(response.data);
      } else {
        alert('Error loading model: ' + response.error);
        hideLoading();
      }
    } catch (error) {
      console.error('Error loading new model:', error);
      alert('Error loading new model: ' + error.message);
      hideLoading();
    }
  }
});

// Initialize on page load
window.addEventListener('DOMContentLoaded', init);
