const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pointlyOverlay', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  showMenu: () => ipcRenderer.send('overlay:show-menu')
});
