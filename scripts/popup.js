// Import storage helper
import { saveModel } from './storage-helper.js';

console.log('=== POPUP.JS V2 LOADING ===');

try {
  console.log('popup.js V2: Imports successful');

  // Helper function to convert ArrayBuffer to base64 (chunked to avoid stack overflow)
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

  console.log('popup.js: Helper function defined');

  // Tab switching
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  console.log('popup.js: Found', tabButtons.length, 'tab buttons');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;

      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });

  // View & Create Workspace
  const openWorkspaceBtn = document.getElementById('open-workspace');

  openWorkspaceBtn.addEventListener('click', async () => {
    try {
      // Store Creator mode flag to open in workspace mode
      await saveModel({ isCreatorMode: true, emptyScene: true });

      // Open workspace in new tab
      chrome.tabs.create({ url: chrome.runtime.getURL('viewer.html') });
    } catch (error) {
      console.error('Error opening workspace:', error);
      alert('Error opening workspace: ' + error.message);
    }
  });

  // Converter Tab
  let convertFile = null;
  const convertFileInput = document.getElementById('convert-file-input');
  const convertBtn = document.getElementById('convert-btn');
  const outputFormat = document.getElementById('output-format');
  const statusMessage = document.getElementById('conversion-status');

  convertFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      convertFile = file;
      convertBtn.disabled = false;
      convertBtn.textContent = `Convert ${file.name}`;
    }
  });

  convertBtn.addEventListener('click', async () => {
    if (convertFile) {
      const targetFormat = outputFormat.value;

      statusMessage.className = 'status-message info';
      statusMessage.textContent = 'Converting... Please wait.';
      convertBtn.disabled = true;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64String = arrayBufferToBase64(e.target.result);

          const fileData = {
            name: convertFile.name,
            type: convertFile.type,
            data: base64String,
            extension: convertFile.name.split('.').pop().toLowerCase(),
            targetFormat: targetFormat,
            isConversion: true
          };

          // Store file data using storage helper
          await saveModel(fileData);

          // Open viewer in new tab for conversion
          chrome.tabs.create({ url: chrome.runtime.getURL('viewer.html') });

          // Reset UI after a short delay
          setTimeout(() => {
            statusMessage.className = 'status-message success';
            statusMessage.textContent = 'Conversion started! Check the viewer tab.';
            convertBtn.disabled = false;
            convertBtn.textContent = 'Convert & Download';
          }, 1000);
        } catch (error) {
          console.error('Error saving model:', error);
          statusMessage.className = 'status-message error';
          statusMessage.textContent = 'Error: ' + error.message;
          convertBtn.disabled = false;
        }
      };
      reader.readAsArrayBuffer(convertFile);
    }
  });

  // Help link
  document.getElementById('help-link').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/MrSidims/Just3D' });
  });

  console.log('popup.js: All event listeners attached successfully');

} catch (error) {
  console.error('popup.js: Fatal error during initialization:', error);
  alert('Error loading popup: ' + error.message);
}
