const { BrowserWindow, screen, ipcMain } = require('electron');
const path = require('node:path');

let companionWindow = null;
let followInterval = null;
let isTyping = false;

function createOverlayWindow() {
  const displays = screen.getAllDisplays();
  let minX = 0, minY = 0, maxX = 0, maxY = 0;
  displays.forEach((d) => {
    minX = Math.min(minX, d.bounds.x);
    minY = Math.min(minY, d.bounds.y);
    maxX = Math.max(maxX, d.bounds.x + d.bounds.width);
    maxY = Math.max(maxY, d.bounds.y + d.bounds.height);
  });
  const width = Math.max(1920, maxX - minX);
  const height = Math.max(1080, maxY - minY);

  const window = new BrowserWindow({
    x: minX,
    y: minY,
    width,
    height,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, '../../preload/overlayPreload.js')
    }
  });

  window.setAlwaysOnTop(true, 'screen-saver');
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  window.setIgnoreMouseEvents(true, { forward: true });
  window.loadFile(path.join(__dirname, '../../renderer/overlay/cursor.html'));

  let lastX = -1;
  let lastY = -1;

  // High-frequency 120Hz native cursor tracking loop
  followInterval = setInterval(() => {
    if (window.isDestroyed()) {
      clearInterval(followInterval);
      return;
    }

    const pt = screen.getCursorScreenPoint();
    const relX = pt.x - minX;
    const relY = pt.y - minY;

    if (relX !== lastX || relY !== lastY) {
      window.webContents.send('cursor:pos', { x: relX, y: relY });
      lastX = relX;
      lastY = relY;
    }
  }, 8);

  window.on('closed', () => {
    clearInterval(followInterval);
    companionWindow = null;
  });

  companionWindow = window;
  return window;
}

/**
 * Handle typing mode focus state.
 */
function setTypingMode(active) {
  isTyping = Boolean(active);
  if (!companionWindow || companionWindow.isDestroyed()) return;

  if (isTyping) {
    companionWindow.setIgnoreMouseEvents(false);
    companionWindow.focus();
  } else {
    companionWindow.setIgnoreMouseEvents(true, { forward: true });
    companionWindow.blur();
  }
}

/**
 * Smoothly glide companion to target coordinates on desktop.
 */
function glideCompanionTo(targetX, targetY, durationMs = 800) {
  if (!companionWindow || companionWindow.isDestroyed()) return;
  companionWindow.webContents.send('companion:glide-to', { targetX, targetY, durationMs });
}

module.exports = {
  createOverlayWindow,
  setTypingMode,
  glideCompanionTo
};

