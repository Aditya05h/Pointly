const wrapper = document.getElementById('clicky-wrapper');
const buddyContainer = document.getElementById('buddy-container');
const buddyOrb = document.getElementById('buddy-orb');
const speechBubble = document.getElementById('speech-bubble');
const bubbleContent = document.getElementById('bubble-content');
const typeCapsule = document.getElementById('type-capsule');
const capsuleInput = document.getElementById('capsule-input');
const spotlightBeacon = document.getElementById('spotlight-beacon');
const beaconTag = document.getElementById('beacon-tag');

let isRecording = false;
let isTypingActive = false;
let audioContext = null;
let mediaStream = null;
let scriptProcessor = null;
let pcmData = [];
let currentAudioPlayer = null;
let userSpeaker = 'shubh';
let userLang = 'en-IN';
let bubbleDismissTimer = null;

// Initialize user voice preferences
if (window.pointlyCompanion?.getSettings) {
  window.pointlyCompanion.getSettings().then((settings) => {
    if (settings) {
      if (settings.voiceSpeaker) userSpeaker = settings.voiceSpeaker;
      if (settings.voiceLanguage) userLang = settings.voiceLanguage;
    }
  });
}

// Mouse Event Pass-Through Management
buddyContainer.addEventListener('mouseenter', () => {
  window.pointlyCompanion?.setIgnoreMouseEvents(false);
});

buddyContainer.addEventListener('mouseleave', () => {
  if (isTypingActive || isRecording) return;
  window.pointlyCompanion?.setIgnoreMouseEvents(true, { forward: true });
});

typeCapsule.addEventListener('mouseenter', () => {
  window.pointlyCompanion?.setIgnoreMouseEvents(false);
});

typeCapsule.addEventListener('mouseleave', () => {
  if (document.activeElement === capsuleInput || isRecording) return;
  if (!isTypingActive) {
    window.pointlyCompanion?.setIgnoreMouseEvents(true, { forward: true });
  }
});

// UI State Management
function setBuddyState(state) {
  wrapper.classList.remove('listening', 'thinking', 'speaking');
  if (state === 'listening') wrapper.classList.add('listening');
  if (state === 'thinking') wrapper.classList.add('thinking');
  if (state === 'speaking') wrapper.classList.add('speaking');
}

function showSpeechBubble(text, html = false, autoDismissDelay = 5000) {
  if (bubbleDismissTimer) {
    clearTimeout(bubbleDismissTimer);
    bubbleDismissTimer = null;
  }

  if (html) {
    bubbleContent.innerHTML = text;
  } else {
    bubbleContent.textContent = text;
  }

  speechBubble.classList.add('visible');

  if (autoDismissDelay > 0) {
    bubbleDismissTimer = setTimeout(() => {
      speechBubble.classList.remove('visible');
      bubbleDismissTimer = null;
    }, autoDismissDelay);
  }
}

function hideSpeechBubble() {
  if (bubbleDismissTimer) {
    clearTimeout(bubbleDismissTimer);
    bubbleDismissTimer = null;
  }
  speechBubble.classList.remove('visible');
}

// Typing Capsule Controls
function openTypingCapsule() {
  isTypingActive = true;
  typeCapsule.classList.add('visible');
  // Lock companion window position so it stays in place while user types
  window.pointlyCompanion?.setTypingMode(true);
  window.pointlyCompanion?.setIgnoreMouseEvents(false);

  setTimeout(() => {
    capsuleInput.focus();
    capsuleInput.select();
  }, 60);
}

function closeTypingCapsule() {
  isTypingActive = false;
  typeCapsule.classList.remove('visible');
  capsuleInput.blur();
  // Resume following mouse
  window.pointlyCompanion?.setTypingMode(false);
  window.pointlyCompanion?.setIgnoreMouseEvents(true, { forward: true });
}

function toggleTypingCapsule() {
  if (isTypingActive) {
    closeTypingCapsule();
  } else {
    openTypingCapsule();
  }
}

// Encode 16kHz 16-bit Mono WAV
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

// Start Push-to-Talk Voice Recording (16kHz PCM)
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
    setBuddyState('listening');
    showSpeechBubble('Listening (Push-to-Talk)... Speak now.', false, 0);
  } catch (err) {
    console.error('Mic recording error:', err);
    setBuddyState('idle');
    showSpeechBubble(`Mic error: ${err.message}`, false, 3500);
  }
}

// Stop Voice Recording and Process
async function stopRecording() {
  if (!isRecording) return;
  isRecording = false;
  setBuddyState('thinking');
  showSpeechBubble('Thinking...', false, 0);

  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
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
    setBuddyState('idle');
    showSpeechBubble('Hold Ctrl+Space to speak.', false, 2500);
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
    const base64Wav = await blobToBase64(wavBlob);

    const sttResult = await window.pointlyCompanion.transcribeAudio(base64Wav, {
      model: 'saaras:v3',
      mode: 'transcribe',
      language_code: userLang !== 'unknown' ? userLang : undefined
    });

    const transcript = sttResult?.transcript || sttResult?.text;
    if (!transcript || !transcript.trim()) {
      setBuddyState('idle');
      showSpeechBubble('Could not hear clearly. Speak again.', false, 3000);
      return;
    }

    showSpeechBubble(`"${transcript}"`, false, 0);
    await executeTask(transcript, 'voice');
  } catch (err) {
    console.error('STT Error:', err);
    setBuddyState('idle');
    showSpeechBubble(`Voice Error: ${err.message}`, false, 3500);
  }
}

// Force Stop / End Voice Session Immediately (Ctrl + E)
function endVoiceSession() {
  if (isRecording) {
    isRecording = false;
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
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
  }

  if (currentAudioPlayer) {
    currentAudioPlayer.pause();
    currentAudioPlayer = null;
  }

  setBuddyState('idle');
  showSpeechBubble('Voice session ended.', false, 2000);
}

// Play Sarvam TTS Voice Response
async function playVoiceResponse(text) {
  if (!text || !text.trim()) return;

  if (currentAudioPlayer) {
    currentAudioPlayer.pause();
    currentAudioPlayer = null;
  }

  try {
    setBuddyState('speaking');
    const res = await window.pointlyCompanion.textToSpeech({
      text,
      speaker: userSpeaker || 'shubh',
      target_language_code: userLang || 'en-IN'
    });

    const audioUrl = res?.audioDataUrl || (res?.audio ? `data:audio/wav;base64,${res.audio}` : null);
    if (!audioUrl) {
      setBuddyState('idle');
      return;
    }

    const audio = new Audio(audioUrl);
    currentAudioPlayer = audio;

    audio.onended = () => {
      setBuddyState('idle');
      currentAudioPlayer = null;
      setTimeout(() => hideSpeechBubble(), 4000);
    };

    audio.onerror = () => {
      setBuddyState('idle');
      currentAudioPlayer = null;
      setTimeout(() => hideSpeechBubble(), 4000);
    };

    await audio.play();
  } catch (err) {
    console.error('TTS playback error:', err);
    setBuddyState('idle');
    setTimeout(() => hideSpeechBubble(), 4000);
  }
}

// Execute Task (Desktop file search, OS window control, or Gemini inquiry)
async function executeTask(commandText, source = 'text') {
  if (!commandText || !commandText.trim()) return;

  setBuddyState('thinking');

  try {
    const result = await window.pointlyCompanion.executeCommand(commandText.trim(), {
      source,
      speaker: userSpeaker,
      language: userLang
    });

    // 1. Desktop File Locating
    if (result.type === 'desktop_find' && result.found) {
      showSpeechBubble(result.message, false, 0);

      if (result.targetX && result.targetY) {
        window.pointlyCompanion.glideTo(result.targetX, result.targetY);
      }

      if (result.spokenText) {
        await playVoiceResponse(result.spokenText);
      } else {
        setBuddyState('idle');
        setTimeout(() => hideSpeechBubble(), 4000);
      }
      return;
    }

    // 2. OS / Window Control Action (minimize, maximize, close, open app)
    if (result.type === 'os_action' && result.found) {
      showSpeechBubble(result.message, false, 0);

      if (result.targetX && result.targetY) {
        window.pointlyCompanion.glideTo(result.targetX, result.targetY);
      }

      if (result.spokenText) {
        await playVoiceResponse(result.spokenText);
      } else {
        setBuddyState('idle');
        setTimeout(() => hideSpeechBubble(), 4000);
      }
      return;
    }

    // 3. General AI Answer
    const resp = result.response || result.message || 'Done.';
    showSpeechBubble(resp, false, 0);

    if (result.spokenText || result.response) {
      await playVoiceResponse(result.spokenText || result.response);
    } else {
      setBuddyState('idle');
      setTimeout(() => hideSpeechBubble(), 4000);
    }
  } catch (err) {
    console.error('Execution error:', err);
    setBuddyState('idle');
    showSpeechBubble(`Error: ${err.message}`, false, 3500);
  }
}

// Buddy Orb Click: Toggle Typing Capsule
buddyOrb.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleTypingCapsule();
});

// Typing Capsule Submission (Enter key)
typeCapsule.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = capsuleInput.value.trim();
  if (!text) return;
  capsuleInput.value = '';
  closeTypingCapsule();
  await executeTask(text, 'text');
});

// Keyboard shortcuts within overlay window
window.addEventListener('keydown', (event) => {
  // Ctrl + Space: Push-to-Talk Start
  if (event.ctrlKey && event.code === 'Space' && !isRecording) {
    event.preventDefault();
    startRecording();
  }
  // Ctrl + E: End Voice Session
  if (event.ctrlKey && (event.key === 'e' || event.key === 'E')) {
    event.preventDefault();
    endVoiceSession();
  }
  // Ctrl + T: Toggle Typing Capsule
  if (event.ctrlKey && (event.key === 't' || event.key === 'T')) {
    event.preventDefault();
    toggleTypingCapsule();
  }
  // Escape: Close typing capsule or bubble
  if (event.key === 'Escape') {
    closeTypingCapsule();
    hideSpeechBubble();
  }
});

// Keyup for Push-to-Talk release
window.addEventListener('keyup', (event) => {
  if (event.code === 'Space' && isRecording) {
    stopRecording();
  }
});

// Global Push-To-Talk IPC Listener (Ctrl + Space)
if (window.pointlyCompanion?.onVoiceToggle) {
  window.pointlyCompanion.onVoiceToggle(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });
}

// Global End Voice Session IPC Listener (Ctrl + E)
if (window.pointlyCompanion?.onVoiceEnd) {
  window.pointlyCompanion.onVoiceEnd(() => {
    endVoiceSession();
  });
}

// Global Toggle Text Typing IPC Listener (Ctrl + T)
if (window.pointlyCompanion?.onCapsuleToggle) {
  window.pointlyCompanion.onCapsuleToggle(() => {
    toggleTypingCapsule();
  });
}
