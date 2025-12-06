# 3D Model Viewer & Converter - Chrome Extension

A powerful Chrome extension for viewing and converting 3D models in multiple formats directly in your browser.

## Features

### 🎨 3D Model Viewing
- **Multiple Format Support**: STL, GLB, GLTF, OBJ, FBX, DAE (Collada), PLY, 3DS
- **Interactive Controls**: Rotate, zoom, and pan with mouse
- **Customizable Display**:
  - Toggle wireframe mode
  - Show/hide grid and axes
  - Adjust background color
  - Control lighting intensity
- **Model Information**: View vertex count, face count, and file details

### 🔄 Format Conversion
Convert between popular 3D formats:
- **Export to GLB** (Binary glTF)
- **Export to GLTF** (JSON glTF)
- **Export to OBJ** (Wavefront)
- **Export to STL** (STereoLithography)
- **Export to PLY** (Polygon File Format)

### ✨ Creator Mode
Create 3D objects from scratch without external software:
- **Primitive Shapes**: Sphere, Cube, Cylinder, Torus, Plane
- **Texture Options**:
  - Solid colors
  - Procedural textures using FBM (Fractional Brownian Motion)
  - Upload custom images
- **Material Properties**: Metalness, Roughness, Emission
- **Perfect for**: Creating procedural planets, suns, and basic 3D objects

### 🌐 URL Import & Context Menu
Load 3D models directly from the web:
- **Import from URL**: Paste any direct link to a 3D model file
- **Context Menu**: Right-click on 3D model links and select "Open in Just3D"
- **GitHub Support**: Automatically converts GitHub blob URLs to raw content
- **Universal**: Works with any publicly accessible 3D model URL

### ⚡ Key Features
- Import models from URLs or upload local files
- Right-click context menu for quick model viewing
- Fast and responsive 3D rendering using Three.js
- Clean, modern user interface
- Privacy-focused - only fetches URLs you explicitly provide
- Procedural generation algorithms for textures

## Installation

### From Chrome Web Store
*(Coming soon)*

### Manual Installation (Developer Mode)

1. **Download or Clone the Extension**
   ```bash
   git clone https://github.com/MrSidims/Just3D.git
   cd Just3D
   ```

2. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Or click Menu (⋮) → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the `Just3D` folder
   - The extension icon should appear in your toolbar

## Usage

### Viewing 3D Models

1. **Click the Extension Icon** in your Chrome toolbar
2. **Select "View & Create" Tab** (default)
3. **Click "Select 3D Model"** or drag and drop a file
4. **Supported formats**: .stl, .glb, .gltf, .obj, .fbx, .dae, .ply, .3ds
5. **Click "Open Viewer"** to view your model in a new tab

### Loading Models from URLs

#### Method 1: Import from URL in Creator Mode
1. **Open the viewer** (click extension icon → "Start Creating")
2. **Find the "Import from URL" section** in the Creator panel
3. **Paste the URL** to any publicly accessible 3D model file
   - Example: `https://example.com/model.stl`
   - GitHub: `https://github.com/user/repo/blob/main/model.glb` (auto-converted to raw URL)
4. **Click "🌐 Load URL"** to fetch and display the model

#### Method 2: Right-Click Context Menu
1. **Browse any webpage** with links to 3D model files
2. **Right-click on a 3D model link** (.stl, .glb, .gltf, .obj, .fbx, .dae, .ply, .3ds)
3. **Select "Open in Just3D"** from the context menu
4. The model will open automatically in a new viewer tab

**Supported URL Sources:**
- Direct links to 3D files on any server
- GitHub repositories (automatically converts blob URLs to raw content)
- Cloud storage services (Dropbox, Google Drive public links, etc.)
- Online 3D model repositories
- Personal websites and file hosting

### Viewer Controls

#### Mouse Controls
- **Left Click + Drag**: Rotate the model
- **Right Click + Drag**: Pan (move) the view
- **Scroll Wheel**: Zoom in/out
- **Middle Click + Drag**: Dolly (zoom)

#### Button Controls
- **🔄 Reset**: Reset camera to default position
- **🔲 Wireframe**: Toggle wireframe display mode
- **⊞ Grid**: Show/hide ground grid
- **⊥ Axes**: Show/hide XYZ axes helper

#### Display Options
- **Background Color**: Click the color picker to change the background
- **Lighting Intensity**: Use the slider to adjust scene lighting (0-2x)

### Converting 3D Models

1. **Click the Extension Icon**
2. **Select "Converter" Tab**
3. **Click "Select Model to Convert"**
4. **Choose Output Format** from the dropdown:
   - GLB (Binary glTF) - Compact, widely supported
   - GLTF (JSON glTF) - Human-readable, web-optimized
   - OBJ (Wavefront) - Universal, simple format
   - STL (STereoLithography) - 3D printing standard
   - PLY (Polygon File Format) - Flexible, supports color
5. **Click "Convert & Download"**
6. The converted file will download automatically

## Supported Formats

| Format | Extension | Import | Export | Description |
|--------|-----------|--------|--------|-------------|
| STL | .stl | ✅ | ✅ | STereoLithography - Popular for 3D printing |
| GLB | .glb | ✅ | ✅ | Binary glTF - Compact, efficient format |
| GLTF | .gltf | ✅ | ✅ | JSON glTF - Web-optimized, readable |
| OBJ | .obj | ✅ | ✅ | Wavefront - Widely compatible |
| FBX | .fbx | ✅ | ❌ | Autodesk FBX - Industry standard |
| DAE | .dae | ✅ | ❌ | Collada - XML-based interchange |
| PLY | .ply | ✅ | ✅ | Stanford Polygon Format |
| 3DS | .3ds | ✅ | ❌ | 3D Studio - Legacy format |

## Technical Details

### Architecture

```
Just3D/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── viewer.html           # 3D viewer page
├── assets/               # Icons and images
├── _locales/             # Internationalization files
├── styles/               # CSS stylesheets
│   ├── popup.css
│   └── viewer.css
├── scripts/              # JavaScript files
│   ├── background.js    # Background service worker
│   ├── popup.js         # Popup interface logic
│   ├── viewer.js        # 3D viewer & converter logic
│   ├── i18n.js          # Internationalization
│   ├── storage-helper.js # Storage utilities
│   └── texture-generator.js # Procedural texture generation
└── libs/                 # Third-party libraries
    ├── three.min.js     # Three.js core
    ├── controls/        # Camera controls
    ├── loaders/         # Format loaders
    └── exporters/       # Format exporters
```

### Technologies Used

- **Three.js (r152)**: 3D graphics library
- **Chrome Extension Manifest V3**: Latest extension platform
- **WebGL**: Hardware-accelerated 3D rendering
- **Chrome Storage API**: Local data persistence

### Dependencies

All dependencies are bundled locally in the `libs/` directory:
- Three.js core library (r152)
- Three.js loaders (STL, GLTF, OBJ, FBX, Collada, PLY, 3DS)
- Three.js exporters (GLTF, STL, OBJ, PLY)
- OrbitControls and TransformControls for camera and object manipulation
- Additional utilities (BufferGeometryUtils, NURBS, fflate)

## Development

### Project Structure

The extension consists of three main components:

1. **Popup Interface** (`popup.html`, `popup.js`)
   - File selection and tab management
   - Initiates viewing and conversion operations

2. **3D Viewer** (`viewer.html`, `viewer.js`)
   - Renders 3D models using Three.js
   - Handles user interactions
   - Performs format conversions

3. **Styling** (`styles/`)
   - Responsive layouts
   - Accessible UI controls

### Key Functions

#### Viewer (`scripts/viewer.js`)

- `init()` - Initialize Three.js scene, camera, renderer
- `loadModel(modelData)` - Load model based on file extension
- `loadSTL()`, `loadGLTF()`, `loadOBJ()`, etc. - Format-specific loaders
- `addModelToScene()` - Position and display model
- `convertModel()` - Convert to target format
- `exportGLTF()`, `exportSTL()`, `exportOBJ()`, etc. - Format-specific exporters
- `setupControls()` - Initialize UI controls

### Adding New Format Support

To add support for a new 3D format:

1. Download the Three.js loader file and add it to `libs/loaders/`:
   ```
   libs/loaders/YourLoader.js
   ```

2. Import the loader in `viewer.js`:
   ```javascript
   import { YourLoader } from '../libs/loaders/YourLoader.js';
   ```

3. Add file extension to accept attribute in `popup.html`:
   ```html
   <input type="file" accept=".stl,.glb,.newformat" />
   ```

4. Add case to `loadModel()` switch statement in `viewer.js`

## Performance Considerations

- **Large Models**: Models with >1M vertices may cause performance issues
- **Format Complexity**: FBX and Collada files may take longer to load
- **Conversion Time**: Large models take longer to convert
- **Memory Usage**: Complex models use significant browser memory

## Privacy & Security

- **Local Processing**: All 3D rendering, conversion, and processing happens in your browser
- **No Data Collection**: We don't collect, store, or transmit any user data or analytics
- **No Upload Servers**: Your models are never uploaded to external servers
- **User-Initiated Network Requests**: Only fetches URLs you explicitly provide or right-click
- **Permissions**:
  - `storage` - Save user preferences and camera views locally
  - `contextMenus` - Add "Open in Just3D" to right-click menu on 3D file links
  - `<all_urls>` - Fetch 3D models from URLs you provide (no background activity)
- **Open Source**: All code is publicly auditable on GitHub
- **See PERMISSIONS.md** for detailed permission justification

## Troubleshooting

### Model Won't Load
- **Check Format**: Ensure the file extension matches the actual format
- **File Size**: Very large files (>100MB) may not load
- **Corruption**: Try opening the file in another 3D application
- **Browser Console**: Check for error messages (F12)

### Conversion Fails
- **Unsupported Features**: Some formats don't support all model features
- **Complex Geometry**: Highly complex models may fail to convert
- **Memory Issues**: Close other tabs to free up memory
- **Try Different Format**: Not all conversions preserve all data

### Display Issues
- **Update GPU Drivers**: Ensure your graphics drivers are current
- **Enable Hardware Acceleration**: Check Chrome settings
- **WebGL Support**: Visit `chrome://gpu` to verify WebGL is enabled
- **Disable Extensions**: Other extensions might interfere

### Common Error Messages

- **"Unsupported file format"**: File extension not recognized
- **"Error loading model"**: File may be corrupted or invalid
- **"Conversion failed"**: Model too complex or format incompatible
- **"Out of memory"**: Model too large for available RAM

## FAQ

**Q: Does this work offline?**
A: Yes, all libraries are bundled locally and the extension works completely offline after installation.

**Q: What's the maximum file size?**
A: There's no hard limit, but files over 100MB may cause performance issues.

**Q: Can I view multiple models at once?**
A: Yes, you can import and view multiple models in the same scene.

**Q: Why isn't my FBX animation showing?**
A: Animation support is not currently implemented. Models display in their default pose.

**Q: Can I edit models?**
A: You can re-color models and adjust their materials. For advanced editing, use dedicated 3D software like Blender.

**Q: Does it support textures?**
A: Yes, for formats that include texture data (GLTF, FBX, OBJ+MTL).

## License

See the [LICENSE](LICENSE) file for details.

## Credits

- **Three.js**: https://threejs.org/

## Version History

### Version 1.0.0 (Initial Release)
- 3D model viewer with 8 format support
- Format converter (5 export formats)
- Interactive controls (rotate, zoom, pan)
- Customizable display options
- Model information display

## Support

For issues, questions, or feature requests:
- Open an issue on [GitHub](https://github.com/MrSidims/Just3D/issues)
- Review the troubleshooting section above

---

**Built with ❤️ for the 3D community**
