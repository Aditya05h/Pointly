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
  // Allow microphone and media permissions
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
  registerIpcHandlers({
    getChatWindow: () => chatWindow,
    getOverlayWindow: () => overlayWindow
  });

  // Hotkey 1: Ctrl + Alt + Space -> Toggle full chat dashboard
  const toggleFullChat = () => {
    toggleChatWindow(chatWindow);
  };

  // Hotkey 2: Ctrl + Space -> Voice Command / Push-to-Talk on Cursor Companion
  const toggleCompanionVoice = () => {
    if (!overlayWindow || overlayWindow.isDestroyed()) {
      overlayWindow = createOverlayWindow();
    }
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('voice:toggle');
    }
  };

  // Hotkey 3: Ctrl + E -> End Voice Session / cancel speech & playback
  const endCompanionVoice = () => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('voice:end');
    }
  };

  // Hotkey 4: Ctrl + T -> Toggle text typing capsule beside cursor
  const toggleCompanionType = () => {
    if (!overlayWindow || overlayWindow.isDestroyed()) {
      overlayWindow = createOverlayWindow();
    }
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('capsule:toggle');
    }
  };

  registerGlobalHotkey({
    toggleWindow: toggleFullChat,
    toggleVoice: toggleCompanionVoice,
    endVoice: endCompanionVoice,
    openType: toggleCompanionType
  });

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
