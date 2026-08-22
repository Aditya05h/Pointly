const { globalShortcut } = require('electron');

function registerGlobalHotkey(toggle) {
  const accelerator = process.env.POINTLY_HOTKEY || 'CommandOrControl+Shift+Space';
  const registered = globalShortcut.register(accelerator, toggle);
  if (!registered) console.warn(`Could not register Pointly hotkey: ${accelerator}`);
}

module.exports = { registerGlobalHotkey };
