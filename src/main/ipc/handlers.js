const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const { getSettings, saveSettings } = require('../store/settings');
const { askGemini } = require('../ai/gemini');

function registerIpcHandlers({ getChatWindow }) {
  ipcMain.handle('settings:get', () => getSettings());
  ipcMain.handle('settings:save', (_, settings) => saveSettings(settings));
  ipcMain.handle('ai:ask', (_, message) => askGemini(message));
  ipcMain.on('window:close', () => getChatWindow()?.hide());
  ipcMain.on('window:minimize', () => getChatWindow()?.minimize());
  ipcMain.on('overlay:show-menu', (event) => {
    const menu = Menu.buildFromTemplate([
      { label: 'Open Pointly', click: () => getChatWindow()?.show() },
      { type: 'separator' },
      { label: 'Exit Pointly', click: () => app.exit(0) }
    ]);
    const window = BrowserWindow.fromWebContents(event.sender);
    menu.popup({ window });
  });
}

module.exports = { registerIpcHandlers };
