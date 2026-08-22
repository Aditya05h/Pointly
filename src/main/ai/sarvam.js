const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../../../server/.env') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const { SarvamAIClient } = require('sarvamai');

function getSarvamClient() {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) return null;
  return new SarvamAIClient({ apiSubscriptionKey: apiKey });
}

/**
 * Convert text to speech using Sarvam AI (bulbul:v3).
 */
async function textToSpeech({
  text,
  speaker = 'shubh',
  target_language_code = 'en-IN',
  model = 'bulbul:v3',
  pace = 1.0
} = {}) {
  if (!text || !text.trim()) throw new Error('Text is required for TTS');
  const serverUrl = process.env.POINTLY_SERVER_URL || 'http://localhost:8787';

  // 1. Try server proxy first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${serverUrl}/api/sarvam/tts`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, speaker, target_language_code, model, pace }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      return await response.json();
    }
  } catch (_) {
    // If proxy server is down, fallback directly to SDK / REST API
  }

  // 2. Direct fallback using SDK
  const client = getSarvamClient();
  if (client) {
    const result = await client.textToSpeech.convert({
      text: text.trim(),
      target_language_code,
      speaker,
      model,
      pace
    });
    const audioBase64 = result?.audios?.[0] || '';
    return {
      audio: audioBase64,
      audioDataUrl: audioBase64 ? `data:audio/wav;base64,${audioBase64}` : null,
      request_id: result?.request_id
    };
  }

  throw new Error('SARVAM_API_KEY is not configured');
}

/**
 * Transcribe audio using Sarvam AI (saaras:v3).
 */
async function transcribeAudio(audio, options = {}) {
  if (!audio) throw new Error('Audio data is required for transcription');
  const serverUrl = process.env.POINTLY_SERVER_URL || 'http://localhost:8787';

  // 1. Try server proxy first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${serverUrl}/api/sarvam/transcribe`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ audio, ...options }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      return await response.json();
    }
  } catch (_) {
    // If proxy server is down, fallback to direct Sarvam API
  }

  // 2. Direct fallback using REST / SDK
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) throw new Error('SARVAM_API_KEY is not configured');

  const formData = new FormData();
  let audioBuffer;
  if (typeof audio === 'string') {
    const base64Data = audio.replace(/^data:audio\/\w+;base64,/, '');
    audioBuffer = Buffer.from(base64Data, 'base64');
  } else {
    audioBuffer = Buffer.from(audio);
  }

  const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
  formData.append('file', audioBlob, 'recording.wav');
  formData.append('model', options.model || 'saaras:v3');
  formData.append('mode', options.mode || 'transcribe');
  if (options.language_code && options.language_code !== 'unknown') {
    formData.append('language_code', options.language_code);
  }

  const apiResponse = await fetch('https://api.sarvam.ai/speech-to-text', {
    method: 'POST',
    headers: { 'api-subscription-key': apiKey },
    body: formData
  });

  if (!apiResponse.ok) {
    const err = await apiResponse.text();
    let errJson;
    try { errJson = JSON.parse(err); } catch (_) {}
    throw new Error(errJson?.error?.message || errJson?.message || `Sarvam STT failed (${apiResponse.status})`);
  }

  const data = await apiResponse.json();
  return {
    text: data.transcript || data.text || '',
    transcript: data.transcript || data.text || '',
    language_code: data.language_code,
    language_probability: data.language_probability,
    request_id: data.request_id
  };
}

module.exports = { textToSpeech, transcribeAudio };
