const { globalShortcut } = require('electron');

function registerGlobalHotkey({
  toggleWindow,
  toggleVoice,
  endVoice,
  openType
} = {}) {
  // 1. Launch / Toggle Full Dashboard: Ctrl + Alt + Space
  const windowHotkey = process.env.POINTLY_HOTKEY || 'CommandOrControl+Alt+Space';
  globalShortcut.register(windowHotkey, () => {
    if (typeof toggleWindow === 'function') toggleWindow();
  });

  // 2. Voice Command / Push-to-Talk: Ctrl + Space
  const voiceHotkey = process.env.POINTLY_VOICE_HOTKEY || 'CommandOrControl+Space';
  globalShortcut.register(voiceHotkey, () => {
    if (typeof toggleVoice === 'function') toggleVoice();
  });

  // 3. End Voice Session: Ctrl + E
  const endVoiceHotkey = process.env.POINTLY_END_VOICE_HOTKEY || 'CommandOrControl+E';
  globalShortcut.register(endVoiceHotkey, () => {
    if (typeof endVoice === 'function') endVoice();
  });

  // 4. Open Text Typing Capsule: Ctrl + T
  const typeHotkey = process.env.POINTLY_TYPE_HOTKEY || 'CommandOrControl+T';
  globalShortcut.register(typeHotkey, () => {
    if (typeof openType === 'function') openType();
  });
}

module.exports = { registerGlobalHotkey };
