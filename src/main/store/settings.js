const defaults = {
  avatar: 'orbit',
  language: 'English',
  assistMode: false,
  hotkey: 'CommandOrControl+Shift+Space'
};
let settings = { ...defaults };

function getSettings() { return { ...settings }; }
function saveSettings(next) { settings = { ...settings, ...next }; return getSettings(); }

module.exports = { getSettings, saveSettings };
