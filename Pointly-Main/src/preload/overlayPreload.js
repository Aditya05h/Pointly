const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pointlyCompanion', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  executeCommand: (command, options) => ipcRenderer.invoke('companion:execute-command', command, options),
  transcribeAudio: (audio, options) => ipcRenderer.invoke('ai:stt', audio, options),
  textToSpeech: (options) => ipcRenderer.invoke('ai:tts', options),
  findDesktopItem: (query) => ipcRenderer.invoke('desktop:find', query),
  captureScreen: () => ipcRenderer.invoke('desktop:capture'),
  glideTo: (x, y) => ipcRenderer.send('companion:glide', { x, y }),
  setTypingMode: (active) => ipcRenderer.send('companion:set-typing', active),
  copyToClipboard: (text) => ipcRenderer.send('clipboard:write', text),
  openFullChat: () => ipcRenderer.send('companion:open-chat'),
  setIgnoreMouseEvents: (ignore, options) => ipcRenderer.send('overlay:set-ignore-mouse', { ignore, options }),
  onCursorPos: (callback) => {
    const handler = (_, pos) => callback(pos);
    ipcRenderer.on('cursor:pos', handler);
    return () => ipcRenderer.removeListener('cursor:pos', handler);
  },
  onGlideTo: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('companion:glide-to', handler);
    return () => ipcRenderer.removeListener('companion:glide-to', handler);
  },
  onVoiceToggle: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('voice:toggle', handler);
    return () => ipcRenderer.removeListener('voice:toggle', handler);
  },
  onVoiceEnd: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('voice:end', handler);
    return () => ipcRenderer.removeListener('voice:end', handler);
  },
  onCapsuleToggle: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('capsule:toggle', handler);
    return () => ipcRenderer.removeListener('capsule:toggle', handler);
  }
});
