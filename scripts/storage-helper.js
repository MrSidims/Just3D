// Storage Helper - Handles both Chrome Storage and IndexedDB
// Uses Chrome Storage for small files, IndexedDB for large files

const STORAGE_LIMIT = 4 * 1024 * 1024; // 4MB limit for Chrome Storage (conservative)
const DB_NAME = '3DModelViewerDB';
const DB_VERSION = 1;
const STORE_NAME = 'models';

// Initialize IndexedDB
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

// Save model data (chooses storage based on size)
async function saveModel(modelData) {
  console.log('saveModel: Starting save with data:', {
    isCreatorMode: modelData.isCreatorMode,
    name: modelData.name,
    extension: modelData.extension,
    hasData: !!modelData.data,
    dataLength: modelData.data ? modelData.data.length : 0
  });

  // For Creator mode, data is stored as object params (no data property)
  // For regular models, data is base64 string
  let dataSize = 0;

  if (modelData.isCreatorMode) {
    // Creator mode data is small, always use Chrome Storage
    dataSize = JSON.stringify(modelData).length;
  } else if (modelData.data) {
    // Regular model with base64 data
    dataSize = modelData.data.length;
  }

  console.log('saveModel: Data size:', dataSize, 'Limit:', STORAGE_LIMIT);

  if (dataSize < STORAGE_LIMIT) {
    // Use Chrome Storage for small files
    console.log('saveModel: Using Chrome Storage');
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({
        currentModel: modelData,
        storageType: 'chrome'
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('saveModel: Chrome Storage error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('saveModel: Saved to Chrome Storage successfully');
          resolve();
        }
      });
    });
  } else {
    // Use IndexedDB for large files
    console.log('saveModel: Using IndexedDB');
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(modelData, 'currentModel');

      request.onsuccess = () => {
        console.log('saveModel: Saved to IndexedDB successfully');
        // Store a flag in Chrome Storage
        chrome.storage.local.set({
          storageType: 'indexeddb',
          modelName: modelData.name
        }, resolve);
      };
      request.onerror = () => {
        console.error('saveModel: IndexedDB error:', request.error);
        reject(request.error);
      };
    });
  }
}

// Load model data (retrieves from appropriate storage)
async function loadModel() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['storageType'], async (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }

      if (result.storageType === 'indexeddb') {
        // Load from IndexedDB
        try {
          const db = await initDB();
          const transaction = db.transaction([STORE_NAME], 'readonly');
          const store = transaction.objectStore(STORE_NAME);
          const request = store.get('currentModel');

          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        } catch (error) {
          reject(error);
        }
      } else {
        // Load from Chrome Storage
        chrome.storage.local.get(['currentModel'], (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result.currentModel);
          }
        });
      }
    });
  });
}

// Clear all model data
async function clearModel() {
  // Clear Chrome Storage
  await new Promise((resolve) => {
    chrome.storage.local.remove(['currentModel', 'storageType', 'modelName'], resolve);
  });

  // Clear IndexedDB
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete('currentModel');
  } catch (error) {
    console.error('Error clearing IndexedDB:', error);
  }
}

// Export functions
export { saveModel, loadModel, clearModel };
