// main.js — Electron main process
// Handles window creation, IPC events, file system access, and Gemini API calls.
// dotenv is loaded here so process.env.GEMINI_API_KEY is available as a fallback.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const fs = require('fs');
const { readDocument, validateApiKey } = require('./gemini');
const { getApiKey, saveApiKey, deleteApiKey, hasSavedApiKey } = require('./config');

// Remove default File/Edit/View/Window/Help menu bar
Menu.setApplicationMenu(null);

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#faf7f2',
      symbolColor: '#1a1510',
      height: 48,
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#faf7f2',
    title: 'Paperclear',
  });

  // Ctrl+Shift+I opens DevTools in development only
  if (!app.isPackaged) {
    win.webContents.on('before-input-event', (_event, input) => {
      if (input.control && input.shift && input.key.toLowerCase() === 'i') {
        win.webContents.toggleDevTools();
      }
    });
  }

  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC: open file picker, read image, call Gemini, return structured result
ipcMain.handle('select-and-read-document', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select document photo',
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
    properties: ['openFile'],
  });

  if (canceled || filePaths.length === 0) return null;

  const filePath = filePaths[0];
  const imageData = fs.readFileSync(filePath);
  const base64 = imageData.toString('base64');
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

  // Also return the image as base64 so the renderer can display it
  const imageDataUrl = `data:${mimeType};base64,${base64}`;

  const apiKey = getApiKey();
  if (!apiKey) {
    return { error: 'no_api_key', imageDataUrl };
  }

  try {
    const result = await readDocument(apiKey, base64, mimeType);
    return { result, imageDataUrl };
  } catch (err) {
    const message = err.message || '';
    if (message === 'TIMEOUT' ||
        message.includes('503') || message.includes('429') ||
        message.toLowerCase().includes('unavailable') ||
        message.toLowerCase().includes('resource_exhausted') ||
        message.toLowerCase().includes('quota')) {
      return { error: 'rate_limit', imageDataUrl };
    }
    return { error: 'api_error', message, imageDataUrl };
  }
});

// IPC: validate and save API key
ipcMain.handle('validate-and-save-key', async (_event, apiKey) => {
  try {
    await validateApiKey(apiKey);
    saveApiKey(apiKey);
    return { success: true };
  } catch (err) {
    const message = err.message || '';
    if (message.includes('429') || message.toLowerCase().includes('quota')) {
      return { success: false, error: 'rate_limit' };
    }
    return { success: false, error: 'invalid_key' };
  }
});

// IPC: delete API key
ipcMain.handle('delete-api-key', () => {
  deleteApiKey();
  return { success: true };
});

// IPC: check if API key exists
ipcMain.handle('has-api-key', () => {
  return hasSavedApiKey() || !!process.env.GEMINI_API_KEY;
});

// IPC: open URL in system browser
ipcMain.handle('open-external', (_event, url) => {
  shell.openExternal(url);
});
