const form = document.querySelector('#chat-form');
const prompt = document.querySelector('#prompt');
const messages = document.querySelector('#messages');
const assistButton = document.querySelector('#assist');
const quickMicBtn = document.querySelector('#quick-mic');
const micBtn = document.querySelector('#mic-btn');
const voicePanel = document.querySelector('#voice-panel');
const voiceStatusText = document.querySelector('#voice-status-text');
const voiceLangSelect = document.querySelector('#voice-lang-select');
const voiceSpeakerSelect = document.querySelector('#voice-speaker-select');
const autoTtsToggle = document.querySelector('#auto-tts-toggle');

let assistMode = false;
let autoSpeak = true;
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let currentAudioPlayer = null;

// Initialize settings from store
if (window.pointly?.getSettings) {
  window.pointly.getSettings().then((settings) => {
    if (settings) {
      if (typeof settings.assistMode === 'boolean') {
        assistMode = settings.assistMode;
        assistButton.classList.toggle('active', assistMode);
        assistButton.textContent = assistMode ? '● Assist Mode' : '○ Assist Mode';
      }
      if (typeof settings.voiceAutoSpeak === 'boolean') {
        autoSpeak = settings.voiceAutoSpeak;
        autoTtsToggle.classList.toggle('active', autoSpeak);
      }
      if (settings.voiceLanguage && voiceLangSelect) {
        voiceLangSelect.value = settings.voiceLanguage;
      }
      if (settings.voiceSpeaker && voiceSpeakerSelect) {
        voiceSpeakerSelect.value = settings.voiceSpeaker;
      }
    }
  });
}

function updateVoiceStatus(status, text) {
  voicePanel.classList.remove('recording', 'speaking');
  if (status === 'recording') voicePanel.classList.add('recording');
  if (status === 'speaking') voicePanel.classList.add('speaking');
  if (voiceStatusText) voiceStatusText.textContent = text;
}

// Convert Audio Blob to Base64 WAV
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result.split(',')[1];
      resolve(base64data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Play TTS Audio from Sarvam
async function playTtsAudio(text, btn = null) {
  if (!text || !text.trim()) return;

  if (currentAudioPlayer) {
    currentAudioPlayer.pause();
    currentAudioPlayer = null;
    document.querySelectorAll('.btn-tts.playing').forEach((b) => {
      b.classList.remove('playing');
      b.textContent = '🔊 Speak';
    });
  }

  const speaker = voiceSpeakerSelect?.value || 'shubh';
  const targetLanguage = voiceLangSelect?.value || 'en-IN';

  updateVoiceStatus('speaking', `Speaking (${speaker})...`);
  if (btn) {
    btn.classList.add('playing');
    btn.textContent = '⏹ Playing...';
  }

  try {
    const res = await window.pointly.textToSpeech({
      text,
      speaker,
      target_language_code: targetLanguage,
      model: 'bulbul:v3'
    });

    const audioUrl = res?.audioDataUrl || (res?.audio ? `data:audio/wav;base64,${res.audio}` : null);
    if (!audioUrl) throw new Error('No audio returned from Sarvam');

    const audio = new Audio(audioUrl);
    currentAudioPlayer = audio;

    audio.onended = () => {
      updateVoiceStatus('idle', 'Press Mic or Ctrl+Space to speak');
      if (btn) {
        btn.classList.remove('playing');
        btn.textContent = '🔊 Speak';
      }
      currentAudioPlayer = null;
    };

    audio.onerror = () => {
      updateVoiceStatus('idle', 'Audio playback failed');
      if (btn) {
        btn.classList.remove('playing');
        btn.textContent = '🔊 Speak';
      }
      currentAudioPlayer = null;
    };

    await audio.play();
  } catch (err) {
    console.error('TTS Playback error:', err);
    updateVoiceStatus('idle', `TTS Error: ${err.message}`);
    if (btn) {
      btn.classList.remove('playing');
      btn.textContent = '🔊 Speak';
    }
  }
}

// Add message to chat list
function addMessage(text, role) {
  const message = document.createElement('div');
  message.className = `message ${role}`;

  const content = document.createElement('div');
  content.className = 'message-content';
  content.textContent = text;
  message.append(content);

  if (role.includes('assistant') && !role.includes('pending')) {
    const actions = document.createElement('div');
    actions.className = 'message-actions';

    const ttsBtn = document.createElement('button');
    ttsBtn.type = 'button';
    ttsBtn.className = 'btn-tts';
    ttsBtn.textContent = '🔊 Speak';
    ttsBtn.title = 'Listen with Sarvam TTS';
    ttsBtn.addEventListener('click', () => {
      if (ttsBtn.classList.contains('playing')) {
        if (currentAudioPlayer) currentAudioPlayer.pause();
        ttsBtn.classList.remove('playing');
        ttsBtn.textContent = '🔊 Speak';
        updateVoiceStatus('idle', 'Press Mic or Ctrl+Space to speak');
      } else {
        playTtsAudio(text, ttsBtn);
      }
    });

    actions.append(ttsBtn);
    message.append(actions);
  }

  messages.append(message);
  messages.scrollTop = messages.scrollHeight;
  return message;
}

// Start Voice Recording
async function startRecording() {
  if (isRecording) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      await processVoiceInput(audioBlob);
    };

    mediaRecorder.start();
    isRecording = true;
    updateVoiceStatus('recording', 'Listening... Click mic again to send');
  } catch (error) {
    console.error('Microphone error:', error);
    updateVoiceStatus('idle', `Mic Error: ${error.message}`);
  }
}

// Stop Voice Recording
function stopRecording() {
  if (!isRecording || !mediaRecorder) return;
  isRecording = false;
  updateVoiceStatus('idle', 'Transcribing with Sarvam saaras:v3...');
  try {
    mediaRecorder.stop();
  } catch (err) {
    console.error('Error stopping recorder:', err);
  }
}

function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

// Process Audio -> Sarvam STT -> Gemini -> Sarvam TTS
async function processVoiceInput(audioBlob) {
  try {
    const base64Audio = await blobToBase64(audioBlob);
    const lang = voiceLangSelect?.value || 'unknown';

    updateVoiceStatus('idle', 'Transcribing audio...');
    const sttResult = await window.pointly.transcribeAudio(base64Audio, {
      model: 'saaras:v3',
      mode: 'transcribe',
      language_code: lang !== 'unknown' ? lang : undefined
    });

    const transcript = sttResult?.transcript || sttResult?.text;
    if (!transcript || !transcript.trim()) {
      updateVoiceStatus('idle', 'Could not detect speech. Try again.');
      return;
    }

    updateVoiceStatus('idle', `Transcribed: "${transcript}"`);
    prompt.value = transcript;

    // Send query
    await handleSend(transcript, true);
  } catch (error) {
    console.error('Voice processing error:', error);
    updateVoiceStatus('idle', `STT Error: ${error.message}`);
  }
}

// Submit message handler
async function handleSend(customText = null, fromVoice = false) {
  const text = (customText !== null ? customText : prompt.value).trim();
  if (!text) return;

  addMessage(text, 'user');
  prompt.value = '';

  const pendingMsg = addMessage('Thinking...', 'assistant pending');
  try {
    const answer = await window.pointly.ask(text);
    pendingMsg.remove();
    addMessage(answer, 'assistant');

    // Auto-speak response if enabled or from voice command
    if (autoSpeak || fromVoice) {
      playTtsAudio(answer);
    }
  } catch (error) {
    pendingMsg.remove();
    addMessage(error.message, 'assistant');
  }
}

// Form submit event
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  await handleSend();
});

// UI Event Listeners
micBtn.addEventListener('click', toggleRecording);
quickMicBtn.addEventListener('click', toggleRecording);

autoTtsToggle.addEventListener('click', () => {
  autoSpeak = !autoSpeak;
  autoTtsToggle.classList.toggle('active', autoSpeak);
  window.pointly.saveSettings({ voiceAutoSpeak: autoSpeak });
});

voiceLangSelect?.addEventListener('change', (e) => {
  window.pointly.saveSettings({ voiceLanguage: e.target.value });
});

voiceSpeakerSelect?.addEventListener('change', (e) => {
  window.pointly.saveSettings({ voiceSpeaker: e.target.value });
});

assistButton.addEventListener('click', () => {
  assistMode = !assistMode;
  assistButton.classList.toggle('active', assistMode);
  assistButton.textContent = assistMode ? '● Assist Mode' : '○ Assist Mode';
  window.pointly.saveSettings({ assistMode });
});

document.querySelector('#close').addEventListener('click', () => window.pointly.close());
document.querySelector('#minimize').addEventListener('click', () => window.pointly.minimize());

// Enter key submit & Ctrl+Space voice shortcut
prompt.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

// Keyboard shortcut inside the window: Ctrl + Space to toggle voice
window.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.code === 'Space') {
    event.preventDefault();
    toggleRecording();
  }
});

// Global hotkey trigger from main process
if (window.pointly?.onVoiceToggle) {
  window.pointly.onVoiceToggle(() => {
    toggleRecording();
  });
}
