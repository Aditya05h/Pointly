const { BrowserWindow, screen } = require('electron');
const path = require('node:path');

function createOverlayWindow() {
  const cursorPosition = screen.getCursorScreenPoint();
  const window = new BrowserWindow({
    width: 32,
    height: 32,
    x: cursorPosition.x,
    y: cursorPosition.y,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    webPreferences: { preload: path.join(__dirname, '../../preload/overlayPreload.js') }
  });
  window.setIgnoreMouseEvents(true, { forward: true });
  window.loadFile(path.join(__dirname, '../../renderer/overlay/cursor.html'));

  let lastPosition = cursorPosition;
  const followCursor = setInterval(() => {
    if (window.isDestroyed()) {
      clearInterval(followCursor);
      return;
    }

    const nextPosition = screen.getCursorScreenPoint();
    if (nextPosition.x === lastPosition.x && nextPosition.y === lastPosition.y) return;
    window.setPosition(nextPosition.x, nextPosition.y, false);
    lastPosition = nextPosition;
  }, 16);

  window.on('closed', () => clearInterval(followCursor));

  createAvatarWindow();
  return window;
}

function createAvatarWindow() {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;
  const avatarWindow = new BrowserWindow({
    width: 74,
    height: 74,
    x: width - 100,
    y: height - 110,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    webPreferences: { preload: path.join(__dirname, '../../preload/overlayPreload.js') }
  });
  avatarWindow.loadFile(path.join(__dirname, '../../renderer/overlay/index.html'));
  return avatarWindow;
}

module.exports = { createOverlayWindow };
