const { app, BrowserWindow, session } = require('electron');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../../server/.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { createOverlayWindow } = require('./windows/cursorOverlay');
const { createChatWindow, toggleChatWindow } = require('./windows/chatWindow');
const { registerGlobalHotkey } = require('./hotkey/globalShortcut');
const { registerIpcHandlers } = require('./ipc/handlers');

let overlayWindow;
let chatWindow;

function createWindows() {
  overlayWindow = createOverlayWindow();
  chatWindow = createChatWindow();
}

app.whenReady().then(() => {
  // Allow media / microphone permissions without blocking prompt
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media' || permission === 'microphone') {
      return callback(true);
    }
    callback(true);
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    if (permission === 'media' || permission === 'microphone') {
      return true;
    }
    return true;
  });

  createWindows();
  registerIpcHandlers({ getChatWindow: () => chatWindow, getOverlayWindow: () => overlayWindow });

  const toggleVoice = () => {
    if (!chatWindow || chatWindow.isDestroyed()) {
      createWindows();
    }
    if (!chatWindow.isVisible()) {
      chatWindow.show();
    }
    chatWindow.focus();
    chatWindow.webContents.send('voice:toggle');
  };

  registerGlobalHotkey(
    () => toggleChatWindow(chatWindow),
    toggleVoice
  );

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindows();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  const { globalShortcut } = require('electron');
  globalShortcut.unregisterAll();
});
