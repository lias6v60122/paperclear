// preload.js — security bridge between the renderer and the main process
// contextBridge exposes only specific, safe methods to the renderer.
// The renderer cannot directly access Node.js or Electron APIs.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Open file picker and return image data (base64 + mimeType + dataUrl)
  openFilePicker: () => ipcRenderer.invoke('open-file-picker'),

  // Slice 3: API key setup and settings
  validateAndSaveKey: (apiKey) => ipcRenderer.invoke('validate-and-save-key', apiKey),
  deleteApiKey: () => ipcRenderer.invoke('delete-api-key'),
  hasApiKey: () => ipcRenderer.invoke('has-api-key'),

  // Camera: send captured base64 image to Gemini, return result
  readDocumentFromBase64: (data) => ipcRenderer.invoke('read-document-from-base64', data),

  // Utility: open a URL in the system browser
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
});
