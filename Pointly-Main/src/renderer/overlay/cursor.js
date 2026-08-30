const wrapper = document.getElementById('clicky-wrapper');
const buddyContainer = document.getElementById('buddy-container');
const buddyOrb = document.getElementById('buddy-orb');
const speechBubble = document.getElementById('speech-bubble');
const bubbleContent = document.getElementById('bubble-content');
const workflowControls = document.getElementById('workflow-controls');
const stepIndicator = document.getElementById('step-indicator');
const btnCopyDraft = document.getElementById('btn-copy-draft');
const btnNextStep = document.getElementById('btn-next-step');
const typeCapsule = document.getElementById('type-capsule');
const capsuleInput = document.getElementById('capsule-input');
const spotlightBeacon = document.getElementById('spotlight-beacon');
const beaconTag = document.getElementById('beacon-tag');

let isRecording = false;
let isTypingActive = false;
let isGliding = false;
let audioContext = null;
let mediaStream = null;
let scriptProcessor = null;
let pcmData = [];
let currentAudioPlayer = null;
let userSpeaker = 'shubh';
let userLang = 'en-IN';
let bubbleDismissTimer = null;

// Guided Workflow State
let currentWorkflow = null;
let currentStepIndex = 0;
let currentDraftText = '';

// Position Tracking (Hardware Native Synchronized with Constant Offset & Bouncy Inertia)
let targetCursorX = window.innerWidth ? Math.round(window.innerWidth / 2) : 500;
let targetCursorY = window.innerHeight ? Math.round(window.innerHeight / 2) : 500;
let lastTargetX = targetCursorX;
let lastTargetY = targetCursorY;
let velocityX = 0;
let velocityY = 0;
let tiltAngle = 0;
let currentFollowX = targetCursorX + 12;
let currentFollowY = targetCursorY + 12;

// High-speed native cursor coordinate listener from Electron
if (window.pointlyCompanion?.onCursorPos) {
  window.pointlyCompanion.onCursorPos((pos) => {
    if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
      targetCursorX = pos.x;
      targetCursorY = pos.y;
    }
  });
}

// Fallback window mousemove listener
window.addEventListener('mousemove', (e) => {
  if (e.clientX && e.clientY) {
    targetCursorX = e.clientX;
    targetCursorY = e.clientY;
  }
});

// Hardware-accelerated GPU render loop with bouncy inertia physics
function animLoop() {
  if (!isGliding && !isTypingActive) {
    const dx = targetCursorX - lastTargetX;
    const dy = targetCursorY - lastTargetY;
    lastTargetX = targetCursorX;
    lastTargetY = targetCursorY;

    // Velocity & inertia damping
    velocityX += (dx - velocityX) * 0.3;
    velocityY += (dy - velocityY) * 0.3;

    // Subtle playful dynamic tilt into motion direction (-14deg to +14deg)
    const targetTilt = Math.max(-14, Math.min(14, velocityX * 0.4));
    tiltAngle += (targetTilt - tiltAngle) * 0.22;

    currentFollowX = targetCursorX + 12;
    currentFollowY = targetCursorY + 12;

    const screenW = window.innerWidth || 1920;
    const screenH = window.innerHeight || 1080;

    const isNearRightEdge = targetCursorX > screenW - 350;
    const isNearBottomEdge = targetCursorY > screenH - 220;

    if (isNearRightEdge) {
      wrapper.classList.add('flip-left');
    } else {
      wrapper.classList.remove('flip-left');
    }

    if (isNearBottomEdge) {
      wrapper.classList.add('flip-up');
    } else {
      wrapper.classList.remove('flip-up');
    }

    wrapper.style.transform = `translate3d(${currentFollowX}px, ${currentFollowY}px, 0)`;

    // Apply playful dynamic tilt to buddy orb when moving
    if (buddyOrb) {
      if (Math.abs(tiltAngle) > 0.2) {
        buddyOrb.style.transform = `rotate(${tiltAngle.toFixed(1)}deg)`;
      } else {
        buddyOrb.style.transform = '';
      }
    }
  }
  requestAnimationFrame(animLoop);
}
requestAnimationFrame(animLoop);

// Smooth Gliding Animation Across Full Screen
function glideTo(targetX, targetY, durationMs = 700) {
  isGliding = true;
  const startX = currentFollowX;
  const startY = currentFollowY;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / durationMs, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // Ease out cubic

    currentFollowX = Math.round(startX + (targetX - startX) * ease);
    currentFollowY = Math.round(startY + (targetY - startY) * ease);

    wrapper.style.transform = `translate3d(${currentFollowX}px, ${currentFollowY}px, 0)`;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      setTimeout(() => {
        isGliding = false;
      }, 4000);
    }
  }
  requestAnimationFrame(step);
}

if (window.pointlyCompanion?.onGlideTo) {
  window.pointlyCompanion.onGlideTo(({ targetX, targetY, durationMs }) => {
    glideTo(targetX, targetY, durationMs || 700);
  });
}

// Initialize user voice preferences
if (window.pointlyCompanion?.getSettings) {
  window.pointlyCompanion.getSettings().then((settings) => {
    if (settings) {
      if (settings.voiceSpeaker) userSpeaker = settings.voiceSpeaker;
      if (settings.voiceLanguage) userLang = settings.voiceLanguage;
    }
  });
}

// Mouse Pass-Through Management
buddyContainer.addEventListener('mouseenter', () => {
  window.pointlyCompanion?.setIgnoreMouseEvents(false);
});

buddyContainer.addEventListener('mouseleave', () => {
  if (isTypingActive || isRecording || currentWorkflow) return;
  window.pointlyCompanion?.setIgnoreMouseEvents(true, { forward: true });
});

typeCapsule.addEventListener('mouseenter', () => {
  window.pointlyCompanion?.setIgnoreMouseEvents(false);
});

typeCapsule.addEventListener('mouseleave', () => {
  if (document.activeElement === capsuleInput || isRecording) return;
  if (!isTypingActive && !currentWorkflow) {
    window.pointlyCompanion?.setIgnoreMouseEvents(true, { forward: true });
  }
});

speechBubble.addEventListener('mouseenter', () => {
  window.pointlyCompanion?.setIgnoreMouseEvents(false);
});

speechBubble.addEventListener('mouseleave', () => {
  if (isTypingActive || isRecording) return;
  if (!currentWorkflow) {
    window.pointlyCompanion?.setIgnoreMouseEvents(true, { forward: true });
  }
});

capsuleInput.addEventListener('blur', () => {
  setTimeout(() => {
    if (!isRecording && !typeCapsule.classList.contains('visible') && !currentWorkflow) {
      window.pointlyCompanion?.setIgnoreMouseEvents(true, { forward: true });
    }
  }, 150);
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

  if (autoDismissDelay > 0 && !currentWorkflow) {
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
  if (workflowControls) workflowControls.classList.remove('active');
  currentWorkflow = null;
}

// Typing Capsule Controls
function openTypingCapsule() {
  isTypingActive = true;
  typeCapsule.classList.add('visible');
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
  window.pointlyCompanion?.setTypingMode(false);
  if (!currentWorkflow) {
    window.pointlyCompanion?.setIgnoreMouseEvents(true, { forward: true });
  }
}

function toggleTypingCapsule() {
  if (isTypingActive) {
    closeTypingCapsule();
  } else {
    openTypingCapsule();
  }
}

// High-Quality Downsampling from Native Hardware Rate (44.1k/48k) to Exact 16kHz
function downsampleTo16k(samples, inputSampleRate) {
  if (!inputSampleRate || inputSampleRate === 16000) return samples;
  const ratio = inputSampleRate / 16000;
  const newLength = Math.round(samples.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetInput = 0;

  while (offsetResult < result.length) {
    const nextOffsetInput = Math.round((offsetResult + 1) * ratio);
    let sum = 0;
    let count = 0;
    for (let i = offsetInput; i < nextOffsetInput && i < samples.length; i++) {
      sum += samples[i];
      count++;
    }
    result[offsetResult] = count ? sum / count : 0;
    offsetResult++;
    offsetInput = nextOffsetInput;
  }
  return result;
}

// Encode Standard 16kHz 16-bit Mono WAV
function encodeWav(samples, sampleRate = 16000) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

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
  view.setUint16(20, 1, true); // PCM Format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view.buffer], { type: 'audio/wav' });
}

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

let mediaRecorder = null;
let mediaChunks = [];
let vadCheckInterval = null;
let vadMaxRecordingTimer = null;
let vadSpeechDetected = false;
let vadSilenceStart = 0;

const VAD_SPEECH_THRESHOLD = 0.01;     // RMS level to consider as speech
const VAD_SILENCE_TIMEOUT_MS = 2500;   // Auto-stop after 2.5s silence post-speech
const VAD_MAX_RECORD_MS = 12000;       // Hard max recording duration 12s

// Start Voice Recording (Native MediaRecorder + VAD)
async function startRecording() {
  if (isRecording) return;
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    mediaChunks = [];
    mediaRecorder = new MediaRecorder(mediaStream);
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        mediaChunks.push(e.data);
      }
    };

    // WebAudio Analyser for VAD silence tracking
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const source = audioContext.createMediaStreamSource(mediaStream);
    const vadAnalyser = audioContext.createAnalyser();
    vadAnalyser.fftSize = 512;
    source.connect(vadAnalyser);

    vadSpeechDetected = false;
    vadSilenceStart = 0;
    const timeData = new Float32Array(vadAnalyser.fftSize);

    vadCheckInterval = setInterval(() => {
      if (!isRecording) return;
      vadAnalyser.getFloatTimeDomainData(timeData);
      let sumSq = 0;
      for (let i = 0; i < timeData.length; i++) {
        sumSq += timeData[i] * timeData[i];
      }
      const rms = Math.sqrt(sumSq / timeData.length);

      if (rms >= VAD_SPEECH_THRESHOLD) {
        if (!vadSpeechDetected) {
          console.log('[VAD] Speech detected, RMS:', rms.toFixed(4));
          showSpeechBubble('🎙️ Hearing you... keep speaking', false, 0);
        }
        vadSpeechDetected = true;
        vadSilenceStart = 0;
      } else if (vadSpeechDetected) {
        if (!vadSilenceStart) {
          vadSilenceStart = Date.now();
        } else if (Date.now() - vadSilenceStart >= VAD_SILENCE_TIMEOUT_MS) {
          console.log('[VAD] Auto-stopping: 2.5s silence detected after speech');
          stopRecording();
        }
      }
    }, 100);

    mediaRecorder.start(100);
    isRecording = true;
    setBuddyState('listening');
    showSpeechBubble('🎤 Listening... Speak now! (auto-stops when you pause)', false, 0);

    vadMaxRecordingTimer = setTimeout(() => {
      if (isRecording) {
        console.log('[VAD] Max recording duration reached');
        stopRecording();
      }
    }, VAD_MAX_RECORD_MS);

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

  if (vadCheckInterval) {
    clearInterval(vadCheckInterval);
    vadCheckInterval = null;
  }
  if (vadMaxRecordingTimer) {
    clearTimeout(vadMaxRecordingTimer);
    vadMaxRecordingTimer = null;
  }

  setBuddyState('thinking');
  showSpeechBubble('Processing speech...', false, 0);

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    await new Promise((resolve) => {
      mediaRecorder.onstop = resolve;
      mediaRecorder.stop();
    });
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }

  if (audioContext) {
    audioContext.close().catch(() => {});
    audioContext = null;
  }

  if (!mediaChunks.length) {
    setBuddyState('idle');
    showSpeechBubble('No audio recorded. Press Ctrl+Space and try again.', false, 2500);
    return;
  }

  try {
    const rawBlob = new Blob(mediaChunks, { type: mediaRecorder?.mimeType || 'audio/webm' });
    const arrayBuffer = await rawBlob.arrayBuffer();

    // Decode recorded audio into pristine AudioBuffer via Chrome native decoder
    const decodeCtx = new (window.AudioContext || window.webkitAudioContext)();
    const decodedAudio = await decodeCtx.decodeAudioData(arrayBuffer);
    const pcmData = decodedAudio.getChannelData(0);
    const nativeSampleRate = decodedAudio.sampleRate;
    decodeCtx.close();

    console.log('[VOICE] Decoded PCM samples:', pcmData.length, 'at', nativeSampleRate, 'Hz');
    const duration = (pcmData.length / nativeSampleRate).toFixed(2);
    console.log('[VOICE] Recording duration:', duration, 'seconds');

    if (pcmData.length < nativeSampleRate * 0.3) {
      setBuddyState('idle');
      showSpeechBubble('Recording too short. Speak clearly and try again.', false, 2500);
      return;
    }

    const downsampled = downsampleTo16k(pcmData, nativeSampleRate);
    const wavBlob = encodeWav(downsampled, 16000);
    const base64Wav = await blobToBase64(wavBlob);

    console.log('[VOICE] Final WAV blob size:', wavBlob.size, 'bytes');

    const sttResult = await window.pointlyCompanion.transcribeAudio(base64Wav, {
      model: 'saaras:v3',
      mode: 'transcribe',
      language_code: 'en-IN'
    });

    console.log('[VOICE] STT Result:', JSON.stringify(sttResult));

    if (sttResult?.error) {
      setBuddyState('idle');
      showSpeechBubble(`STT Error: ${sttResult.error}`, false, 4000);
      return;
    }

    const transcript = (sttResult?.transcript || sttResult?.text || '').trim();
    if (!transcript) {
      setBuddyState('idle');
      showSpeechBubble('Could not understand speech. Speak clearly & try again.', false, 3000);
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
  if (vadCheckInterval) {
    clearInterval(vadCheckInterval);
    vadCheckInterval = null;
  }
  if (vadMaxRecordingTimer) {
    clearTimeout(vadMaxRecordingTimer);
    vadMaxRecordingTimer = null;
  }

  if (isRecording) {
    isRecording = false;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      mediaStream = null;
    }
    if (audioContext) {
      audioContext.close().catch(() => {});
      audioContext = null;
    }
  }

  if (currentAudioPlayer) {
    currentAudioPlayer.pause();
    currentAudioPlayer = null;
  }

  hideSpeechBubble();
  setBuddyState('idle');
}

// Play Voice Response (Sarvam TTS with Native SpeechSynthesis Fallback)
async function playVoiceResponse(text) {
  if (!text || !text.trim()) return;

  if (currentAudioPlayer) {
    currentAudioPlayer.pause();
    currentAudioPlayer = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  setBuddyState('speaking');

  try {
    const res = await window.pointlyCompanion.textToSpeech({
      text,
      speaker: userSpeaker || 'shubh',
      target_language_code: userLang || 'en-IN'
    });

    const audioUrl = res?.audioDataUrl || (res?.audio ? `data:audio/wav;base64,${res.audio}` : null);
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      currentAudioPlayer = audio;

      audio.onended = () => {
        setBuddyState('idle');
        currentAudioPlayer = null;
        if (!currentWorkflow) {
          setTimeout(() => hideSpeechBubble(), 4000);
        }
      };

      audio.onerror = () => {
        currentAudioPlayer = null;
        playNativeVoice(text);
      };

      await audio.play();
      return;
    }
  } catch (err) {
    console.warn('Sarvam TTS error, falling back to native voice:', err);
  }

  // Fallback to Native Web Speech API
  playNativeVoice(text);
}

function playNativeVoice(text) {
  if (!('speechSynthesis' in window)) {
    setBuddyState('idle');
    if (!currentWorkflow) setTimeout(() => hideSpeechBubble(), 4000);
    return;
  }

  try {
    const cleanText = text.replace(/[*_~#>`]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = userLang || 'en-IN';
    utterance.rate = 1.05;

    utterance.onend = () => {
      setBuddyState('idle');
      if (!currentWorkflow) setTimeout(() => hideSpeechBubble(), 4000);
    };

    utterance.onerror = () => {
      setBuddyState('idle');
      if (!currentWorkflow) setTimeout(() => hideSpeechBubble(), 4000);
    };

    window.speechSynthesis.speak(utterance);
  } catch (_) {
    setBuddyState('idle');
  }
}

// Play Guided Workflow Step
async function playWorkflowStep(stepIndex) {
  if (!currentWorkflow || !currentWorkflow.steps || stepIndex >= currentWorkflow.steps.length) {
    if (workflowControls) workflowControls.classList.remove('active');
    currentWorkflow = null;
    showSpeechBubble('Workflow complete! Your draft is ready.', false, 4000);
    return;
  }

  currentStepIndex = stepIndex;
  const step = currentWorkflow.steps[stepIndex];

  // Update UI Step controls
  workflowControls.classList.add('active');
  stepIndicator.textContent = `Step ${stepIndex + 1}/${currentWorkflow.steps.length}`;
  btnNextStep.textContent = stepIndex === currentWorkflow.steps.length - 1 ? 'Finish ✓' : 'Next Step ➔';

  showSpeechBubble(`<strong>${step.title}</strong>: ${step.actionText}`, true, 0);

  // Glide companion to button coordinates on screen
  if (step.targetX && step.targetY) {
    glideTo(step.targetX, step.targetY);
  }

  // Speak step guidance
  if (step.spokenText) {
    await playVoiceResponse(step.spokenText);
  }
}

// Execute Task (Guided Workflows, Desktop search, OS controls, Browser, or AI)
async function executeTask(commandText, source = 'text') {
  if (!commandText || !commandText.trim()) return;

  setBuddyState('thinking');

  try {
    const result = await window.pointlyCompanion.executeCommand(commandText.trim(), {
      source,
      speaker: userSpeaker,
      language: userLang
    });

    // 1. Guided Multi-Step Workflow (e.g. Draft mail in Word or Web Search)
    if (result.type === 'guided_workflow' && result.steps) {
      currentWorkflow = result;
      currentDraftText = result.draftContent || '';
      window.pointlyCompanion?.setIgnoreMouseEvents(false);
      await playWorkflowStep(0);
      return;
    }

    // 2. Desktop File Locating
    if (result.type === 'desktop_find' && result.found) {
      showSpeechBubble(result.message, false, 0);

      if (result.targetX && result.targetY) {
        glideTo(result.targetX, result.targetY);
      }

      if (result.spokenText) {
        await playVoiceResponse(result.spokenText);
      } else {
        setBuddyState('idle');
        setTimeout(() => hideSpeechBubble(), 4000);
      }
      return;
    }

    // 2.5 Desktop Overview / Summary (e.g. "what is in my desktop")
    if (result.type === 'desktop_summary') {
      showSpeechBubble(result.message, false, 0);

      if (result.targetX && result.targetY) {
        glideTo(result.targetX, result.targetY);
      }

      if (result.spokenText) {
        await playVoiceResponse(result.spokenText);
      } else {
        setBuddyState('idle');
        setTimeout(() => hideSpeechBubble(), 5000);
      }
      return;
    }

    // 2.7 Screen & Background Vision ("what is in my background", "what do you see on my screen")
    if (result.type === 'screen_vision') {
      showSpeechBubble(result.message, false, 0);

      if (result.targetX && result.targetY) {
        glideTo(result.targetX, result.targetY);
      }

      if (result.spokenText) {
        await playVoiceResponse(result.spokenText);
      } else {
        setBuddyState('idle');
        setTimeout(() => hideSpeechBubble(), 6000);
      }
      return;
    }

    // 3. OS / Window Control Action (minimize, maximize, close, open app)
    if (result.type === 'os_action' && result.found) {
      showSpeechBubble(result.message, false, 0);

      if (result.targetX && result.targetY) {
        glideTo(result.targetX, result.targetY);
      }

      if (result.spokenText) {
        await playVoiceResponse(result.spokenText);
      } else {
        setBuddyState('idle');
        setTimeout(() => hideSpeechBubble(), 4000);
      }
      return;
    }

    // 4. Browser / Webpage Navigation Action (Chrome, search, scroll, tab)
    if (result.type === 'browser_action' && result.found) {
      showSpeechBubble(result.message, false, 0);

      if (result.targetX && result.targetY) {
        glideTo(result.targetX, result.targetY);
      }

      if (result.spokenText) {
        await playVoiceResponse(result.spokenText);
      } else {
        setBuddyState('idle');
        setTimeout(() => hideSpeechBubble(), 4000);
      }
      return;
    }

    // 5. General AI Answer
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

// Next Step Button Click
btnNextStep.addEventListener('click', (e) => {
  e.stopPropagation();
  playWorkflowStep(currentStepIndex + 1);
});

// Copy Draft Button Click
btnCopyDraft.addEventListener('click', (e) => {
  e.stopPropagation();
  if (currentDraftText) {
    window.pointlyCompanion?.copyToClipboard(currentDraftText);
    btnCopyDraft.textContent = '✓ Copied!';
    setTimeout(() => {
      btnCopyDraft.textContent = '📋 Copy Draft';
    }, 2000);
  }
});

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
  // Escape: Close typing capsule, bubble, or workflow
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
