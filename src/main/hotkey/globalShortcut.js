const { globalShortcut } = require('electron');

function registerGlobalHotkey(toggleWindow, toggleVoice) {
  // Launch Pointly shortcut: Ctrl + Alt + Space
  const windowHotkey = process.env.POINTLY_HOTKEY || 'CommandOrControl+Alt+Space';
  const registeredWindow = globalShortcut.register(windowHotkey, () => {
    if (typeof toggleWindow === 'function') toggleWindow();
  });
  if (!registeredWindow) {
    console.warn(`Could not register Pointly window hotkey: ${windowHotkey}`);
  }

  // Voice Command shortcut: Ctrl + Space
  const voiceHotkey = process.env.POINTLY_VOICE_HOTKEY || 'CommandOrControl+Space';
  const registeredVoice = globalShortcut.register(voiceHotkey, () => {
    if (typeof toggleVoice === 'function') toggleVoice();
  });
  if (!registeredVoice) {
    console.warn(`Could not register Pointly voice command hotkey: ${voiceHotkey}`);
  }
}

module.exports = { registerGlobalHotkey };
