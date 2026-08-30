const defaults = {
  avatar: 'orbit',
  language: 'English',
  assistMode: false,
  hotkey: 'CommandOrControl+Alt+Space',
  voiceHotkey: 'CommandOrControl+Space',
  voiceAutoSpeak: true,
  voiceSpeaker: 'shubh',
  voiceLanguage: 'en-IN'
};
let settings = { ...defaults };

function getSettings() {
  return { ...settings };
}
function saveSettings(next) {
  settings = { ...settings, ...next };
  return getSettings();
}

module.exports = { getSettings, saveSettings };
