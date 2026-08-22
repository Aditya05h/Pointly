const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const { getSettings, saveSettings } = require('../store/settings');
const { askGemini } = require('../ai/gemini');
const { textToSpeech, transcribeAudio } = require('../ai/sarvam');

function registerIpcHandlers({ getChatWindow }) {
  ipcMain.handle('settings:get', () => getSettings());
  ipcMain.handle('settings:save', (_, settings) => saveSettings(settings));
  ipcMain.handle('ai:ask', (_, message) => askGemini(message));
  ipcMain.handle('ai:tts', (_, options) => textToSpeech(options));
  ipcMain.handle('ai:stt', (_, audio, options) => transcribeAudio(audio, options));

  ipcMain.on('window:close', () => getChatWindow()?.hide());
  ipcMain.on('window:minimize', () => getChatWindow()?.minimize());

  ipcMain.on('overlay:show-menu', (event) => {
    const menu = Menu.buildFromTemplate([
      {
        label: 'Open Pointly (Ctrl+Alt+Space)',
        click: () => {
          const win = getChatWindow();
          if (win) {
            win.show();
            win.focus();
          }
        }
      },
      {
        label: 'Voice Command (Ctrl+Space)',
        click: () => {
          const win = getChatWindow();
          if (win) {
            win.show();
            win.focus();
            win.webContents.send('voice:toggle');
          }
        }
      },
      { type: 'separator' },
      { label: 'Exit Pointly', click: () => app.exit(0) }
    ]);
    const window = BrowserWindow.fromWebContents(event.sender);
    menu.popup({ window });
  });
}

module.exports = { registerIpcHandlers };
