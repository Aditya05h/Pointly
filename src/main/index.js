const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const { createOverlayWindow } = require('./windows/cursorOverlay');
const { createChatWindow, toggleChatWindow } = require('./windows/chatWindow');
const { registerGlobalHotkey } = require('./hotkey/globalShortcut');
const { registerIpcHandlers } = require('./ipc/handlers');

let overlayWindow;
let chatWindow;

function createWindows() {
  overlayWindow = createOverlayWindow();
  chatWindow = createChatWindow(() => toggleChatWindow(chatWindow));
}

app.whenReady().then(() => {
  createWindows();
  registerIpcHandlers({ getChatWindow: () => chatWindow, getOverlayWindow: () => overlayWindow });
  registerGlobalHotkey(() => toggleChatWindow(chatWindow));
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
