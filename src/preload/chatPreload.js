const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pointly', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  ask: (message) => ipcRenderer.invoke('ai:ask', message),
  close: () => ipcRenderer.send('window:close'),
  minimize: () => ipcRenderer.send('window:minimize')
});
