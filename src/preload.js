// preload.js — security bridge between the renderer and the main process
// contextBridge exposes only specific, safe methods to the renderer.
// The renderer cannot directly access Node.js or Electron APIs.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Slice 1: open file picker, send image to Gemini, return result
  selectAndReadDocument: () => ipcRenderer.invoke('select-and-read-document'),

  // Slice 3: API key setup and settings
  validateAndSaveKey: (apiKey) => ipcRenderer.invoke('validate-and-save-key', apiKey),
  deleteApiKey: () => ipcRenderer.invoke('delete-api-key'),
  hasApiKey: () => ipcRenderer.invoke('has-api-key'),

  // Utility: open a URL in the system browser
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
});
