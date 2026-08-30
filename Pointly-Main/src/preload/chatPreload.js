const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pointly', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  ask: (message) => ipcRenderer.invoke('ai:ask', message),
  textToSpeech: (options) => ipcRenderer.invoke('ai:tts', options),
  transcribeAudio: (audio, options) => ipcRenderer.invoke('ai:stt', audio, options),
  onVoiceToggle: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('voice:toggle', handler);
    return () => ipcRenderer.removeListener('voice:toggle', handler);
  },
  close: () => ipcRenderer.send('window:close'),
  minimize: () => ipcRenderer.send('window:minimize')
});
