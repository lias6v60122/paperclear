// config.js — API key management and app-wide constants
// The API key is read from userData/config.json (set via the setup screen),
// falling back to .env during development. Never stored in the project folder.

const path = require('path');
const fs = require('fs');
const { app } = require('electron');

function getConfigPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

function getApiKey() {
  // Prefer key saved via setup screen (userData/config.json)
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.apiKey) return config.apiKey;
    }
  } catch (_) {}

  // Fall back to .env (development only)
  return process.env.GEMINI_API_KEY || null;
}

function saveApiKey(apiKey) {
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify({ apiKey }, null, 2), 'utf-8');
}

function deleteApiKey() {
  const configPath = getConfigPath();
  if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
}

function hasSavedApiKey() {
  try {
    const configPath = getConfigPath();
    if (!fs.existsSync(configPath)) return false;
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return !!config.apiKey;
  } catch (_) {
    return false;
  }
}

module.exports = { getApiKey, saveApiKey, deleteApiKey, hasSavedApiKey };
