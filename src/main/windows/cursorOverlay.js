const { BrowserWindow, screen, ipcMain } = require('electron');
const path = require('node:path');

let companionWindow = null;
let isGliding = false;
let isTyping = false;
let followInterval = null;

function createOverlayWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const cursorPosition = screen.getCursorScreenPoint();

  const window = new BrowserWindow({
    width: 320,
    height: 180,
    x: Math.min(cursorPosition.x + 12, screenWidth - 330),
    y: Math.min(cursorPosition.y + 12, screenHeight - 190),
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

  window.setIgnoreMouseEvents(true, { forward: true });
  window.loadFile(path.join(__dirname, '../../renderer/overlay/cursor.html'));

  let lastPosition = cursorPosition;

  followInterval = setInterval(() => {
    if (window.isDestroyed()) {
      clearInterval(followInterval);
      return;
    }

    if (isGliding || isTyping) return; // Do not move when typing or gliding

    const nextPosition = screen.getCursorScreenPoint();
    if (nextPosition.x === lastPosition.x && nextPosition.y === lastPosition.y) return;

    const currentDisplay = screen.getDisplayNearestPoint(nextPosition);
    const bounds = currentDisplay.workArea;

    const targetX = Math.min(nextPosition.x + 12, bounds.x + bounds.width - 330);
    const targetY = Math.min(nextPosition.y + 12, bounds.y + bounds.height - 190);

    window.setPosition(Math.max(bounds.x + 4, targetX), Math.max(bounds.y + 4, targetY), false);
    lastPosition = nextPosition;
  }, 16);

  window.on('closed', () => {
    clearInterval(followInterval);
    companionWindow = null;
  });

  companionWindow = window;
  return window;
}

/**
 * Freeze companion movement when typing bar is open.
 */
function setTypingMode(active) {
  isTyping = Boolean(active);
}

/**
 * Smoothly glide companion window to target coordinates on desktop.
 */
function glideCompanionTo(targetX, targetY, durationMs = 800) {
  if (!companionWindow || companionWindow.isDestroyed()) return;

  isGliding = true;
  const [startX, startY] = companionWindow.getPosition();
  const startTime = Date.now();

  const glideTimer = setInterval(() => {
    if (!companionWindow || companionWindow.isDestroyed()) {
      clearInterval(glideTimer);
      isGliding = false;
      return;
    }

    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / durationMs, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // Ease out cubic

    const currentX = Math.round(startX + (targetX - startX) * ease);
    const currentY = Math.round(startY + (targetY - startY) * ease);

    companionWindow.setPosition(currentX, currentY, false);

    if (progress >= 1) {
      clearInterval(glideTimer);
      // Hold position on target for 4 seconds before resuming follow
      setTimeout(() => {
        isGliding = false;
      }, 4000);
    }
  }, 16);
}

function getCompanionWindow() {
  return companionWindow;
}

module.exports = {
  createOverlayWindow,
  setTypingMode,
  glideCompanionTo,
  getCompanionWindow
};
