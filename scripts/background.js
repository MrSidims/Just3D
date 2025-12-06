// Background script for context menu and URL handling

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'open3DModel',
    title: 'Open in Just3D',
    contexts: ['link'],
    targetUrlPatterns: [
      '*://*/*.stl',
      '*://*/*.STL',
      '*://*/*.glb',
      '*://*/*.GLB',
      '*://*/*.gltf',
      '*://*/*.GLTF',
      '*://*/*.obj',
      '*://*/*.OBJ',
      '*://*/*.fbx',
      '*://*/*.FBX',
      '*://*/*.dae',
      '*://*/*.DAE',
      '*://*/*.ply',
      '*://*/*.PLY',
      '*://*/*.3ds',
      '*://*/*.3DS'
    ]
  });

  console.log('Just3D context menu created - Extension Loaded Successfully');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'open3DModel') {
    const modelUrl = info.linkUrl;
    console.log('Opening 3D model from URL:', modelUrl);

    // Store the URL in chrome.storage
    await chrome.storage.local.set({
      modelUrl: modelUrl,
      fromContextMenu: true
    });

    // Check if viewer tab is already open
    const viewerUrl = chrome.runtime.getURL('viewer.html');
    const tabs = await chrome.tabs.query({});
    const existingViewerTab = tabs.find(t => t.url && t.url.startsWith(viewerUrl));

    if (existingViewerTab) {
      // Focus existing tab and send message to load new model
      await chrome.tabs.update(existingViewerTab.id, { active: true });
      // The tab will check storage on becoming active, or we can send a message
      chrome.tabs.sendMessage(existingViewerTab.id, {
        action: 'loadNewModel',
        url: modelUrl
      }).catch(() => {
        // If tab isn't ready to receive messages, reload it
        chrome.tabs.reload(existingViewerTab.id);
      });
    } else {
      // Open viewer in new tab
      chrome.tabs.create({ url: viewerUrl });
    }
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchModelFromUrl') {
    fetchModelFromUrl(request.url)
      .then(data => sendResponse({ success: true, data: data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep the message channel open for async response
  }
});

// Convert GitHub URLs to raw content URLs
function convertToRawUrl(url) {
  try {
    const urlObj = new URL(url);

    // Handle GitHub URLs
    if (urlObj.hostname === 'github.com' && urlObj.pathname.includes('/blob/')) {
      // Convert: github.com/user/repo/blob/branch/path
      // To: raw.githubusercontent.com/user/repo/branch/path
      const pathParts = urlObj.pathname.split('/');
      const userIndex = pathParts.findIndex(p => p.length > 0);
      const blobIndex = pathParts.indexOf('blob');

      if (blobIndex > 0) {
        // Remove 'blob' from path
        pathParts.splice(blobIndex, 1);
        const newPath = pathParts.join('/');
        return `https://raw.githubusercontent.com${newPath}`;
      }
    }

    // Return original URL if no conversion needed
    return url;
  } catch (error) {
    console.error('Error converting URL:', error);
    return url;
  }
}

// Fetch model from URL
async function fetchModelFromUrl(url) {
  try {
    // Convert to raw URL if it's a GitHub link
    const fetchUrl = convertToRawUrl(url);
    console.log('Fetching from URL:', fetchUrl);

    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/octet-stream, model/gltf-binary, model/gltf+json, */*'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    // Convert ArrayBuffer to base64
    const base64String = arrayBufferToBase64(arrayBuffer);

    // Extract filename and extension from original URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
    const extension = filename.split('.').pop().toLowerCase();

    return {
      name: filename,
      data: base64String,
      extension: extension,
      url: url
    };
  } catch (error) {
    console.error('Error fetching model:', error);
    throw error;
  }
}

// Helper function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer) {
  const uint8Array = new Uint8Array(buffer);
  let binaryString = '';
  const chunkSize = 0x8000; // 32KB chunks

  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    binaryString += String.fromCharCode.apply(null, chunk);
  }

  return btoa(binaryString);
}
