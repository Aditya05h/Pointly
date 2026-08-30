const { app, BrowserWindow } = require('electron');
const path = require('node:path');

function createChatWindow(onClose) {
  const window = new BrowserWindow({
    width: 430,
    height: 650,
    minWidth: 360,
    minHeight: 520,
    show: false,
    frame: false,
    backgroundColor: '#f5f4ef',
    webPreferences: { preload: path.join(__dirname, '../../preload/chatPreload.js') }
  });
  window.loadFile(path.join(__dirname, '../../renderer/chat/index.html'));
  window.on('close', (event) => {
    if (app.isQuitting) return;
    if (!window.isDestroyed()) {
      event.preventDefault();
      window.hide();
      if (typeof onClose === 'function') onClose();
    }
  });
  return window;
}

function toggleChatWindow(window) {
  if (!window || window.isDestroyed()) return;
  if (window.isVisible()) window.hide();
  else { window.show(); window.focus(); }
}

module.exports = { createChatWindow, toggleChatWindow };
