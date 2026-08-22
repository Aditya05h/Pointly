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
let audioContext = null;
let mediaStream = null;
let scriptProcessor = null;
let pcmData = [];
let currentAudioPlayer = null;

// Initialize settings from store
if (window.pointly?.getSettings) {
  window.pointly.getSettings().then((settings) => {
    if (settings) {
      if (typeof settings.assistMode === 'boolean') {
        assistMode = settings.assistMode;
        assistButton?.classList.toggle('active', assistMode);
        if (assistButton) assistButton.textContent = assistMode ? '● Assist Mode' : '○ Assist Mode';
      }
      if (typeof settings.voiceAutoSpeak === 'boolean') {
        autoSpeak = settings.voiceAutoSpeak;
        autoTtsToggle?.classList.toggle('active', autoSpeak);
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
  if (!voicePanel) return;
  voicePanel.classList.remove('recording', 'speaking');
  if (status === 'recording') voicePanel.classList.add('recording');
  if (status === 'speaking') voicePanel.classList.add('speaking');
  if (voiceStatusText) voiceStatusText.textContent = text;
}

// Encode float PCM samples into 16kHz 16-bit Mono WAV
function encodeWav(samples, sampleRate = 16000) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
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
    btn.textContent = '⏹ Stop';
  }

  try {
    const res = await window.pointly.textToSpeech({
      text,
      speaker,
      target_language_code: targetLanguage
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
      updateVoiceStatus('idle', 'Audio playback error');
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

// Start 16kHz WAV Voice Recording
async function startRecording() {
  if (isRecording) return;
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true
      }
    });

    audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(mediaStream);
    scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
    pcmData = [];

    scriptProcessor.onaudioprocess = (e) => {
      if (!isRecording) return;
      const channel = e.inputBuffer.getChannelData(0);
      pcmData.push(new Float32Array(channel));
    };

    source.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.destination);

    isRecording = true;
    updateVoiceStatus('recording', 'Listening... Click mic to stop');
  } catch (error) {
    console.error('Microphone error:', error);
    updateVoiceStatus('idle', `Mic Error: ${error.message}`);
  }
}

// Stop 16kHz WAV Recording
async function stopRecording() {
  if (!isRecording) return;
  isRecording = false;
  updateVoiceStatus('idle', 'Transcribing with Sarvam saaras:v3...');

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
  if (scriptProcessor) {
    scriptProcessor.disconnect();
    scriptProcessor = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  const totalLength = pcmData.reduce((acc, chunk) => acc + chunk.length, 0);
  if (totalLength < 1600) {
    updateVoiceStatus('idle', 'Recording too short. Speak and try again.');
    return;
  }

  const mergedPCM = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of pcmData) {
    mergedPCM.set(chunk, offset);
    offset += chunk.length;
  }

  try {
    const wavBlob = encodeWav(mergedPCM, 16000);
    const base64Audio = await blobToBase64(wavBlob);
    const lang = voiceLangSelect?.value || 'unknown';

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
    if (prompt) prompt.value = transcript;
    await handleSend(transcript, true);
  } catch (error) {
    console.error('Voice processing error:', error);
    updateVoiceStatus('idle', `STT Error: ${error.message}`);
  }
}

function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

async function handleSend(customText = null, fromVoice = false) {
  const text = (customText !== null ? customText : prompt.value).trim();
  if (!text) return;

  addMessage(text, 'user');
  if (prompt) prompt.value = '';

  const pendingMsg = addMessage('Thinking...', 'assistant pending');
  try {
    const answer = await window.pointly.ask(text);
    pendingMsg.remove();
    addMessage(answer, 'assistant');

    if (autoSpeak || fromVoice) {
      playTtsAudio(answer);
    }
  } catch (error) {
    pendingMsg.remove();
    addMessage(error.message, 'assistant');
  }
}

// Bind initial static message TTS button
document.querySelectorAll('#messages .btn-tts').forEach((btn) => {
  const parentMsg = btn.closest('.message');
  const text = parentMsg?.querySelector('.message-content')?.textContent;
  if (text) {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('playing')) {
        if (currentAudioPlayer) currentAudioPlayer.pause();
        btn.classList.remove('playing');
        btn.textContent = '🔊 Speak';
        updateVoiceStatus('idle', 'Press Mic or Ctrl+Space to speak');
      } else {
        playTtsAudio(text, btn);
      }
    });
  }
});

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  await handleSend();
});

micBtn?.addEventListener('click', toggleRecording);
quickMicBtn?.addEventListener('click', toggleRecording);

autoTtsToggle?.addEventListener('click', () => {
  autoSpeak = !autoSpeak;
  autoTtsToggle.classList.toggle('active', autoSpeak);
  window.pointly?.saveSettings({ voiceAutoSpeak: autoSpeak });
});

voiceLangSelect?.addEventListener('change', (e) => {
  window.pointly?.saveSettings({ voiceLanguage: e.target.value });
});

voiceSpeakerSelect?.addEventListener('change', (e) => {
  window.pointly?.saveSettings({ voiceSpeaker: e.target.value });
});

assistButton?.addEventListener('click', () => {
  assistMode = !assistMode;
  assistButton.classList.toggle('active', assistMode);
  assistButton.textContent = assistMode ? '● Assist Mode' : '○ Assist Mode';
  window.pointly?.saveSettings({ assistMode });
});

document.querySelector('#close')?.addEventListener('click', () => window.pointly?.close());
document.querySelector('#minimize')?.addEventListener('click', () => window.pointly?.minimize());

prompt?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});
