const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../../../server/.env') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const { SarvamAIClient } = require('sarvamai');

function getSarvamClient() {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) return null;
  return new SarvamAIClient({ apiSubscriptionKey: apiKey });
}

function resolveTtsModel(speaker, requestedModel) {
  if (speaker && speaker.toLowerCase() === 'anushka') {
    return 'bulbul:v2';
  }
  return requestedModel || 'bulbul:v3';
}

/**
 * Convert text to speech using Sarvam AI.
 * Automatically selects bulbul:v2 for Anushka and bulbul:v3 for Shubh/Aditya/etc.
 */
async function textToSpeech({
  text,
  speaker = 'shubh',
  target_language_code = 'en-IN',
  model,
  pace = 1.0
} = {}) {
  if (!text || !text.trim()) throw new Error('Text is required for TTS');
  const serverUrl = process.env.POINTLY_SERVER_URL || 'http://localhost:8787';
  const resolvedModel = resolveTtsModel(speaker, model);

  // 1. Try server proxy first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${serverUrl}/api/sarvam/tts`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: text.trim(),
        speaker: speaker.toLowerCase(),
        target_language_code,
        model: resolvedModel,
        pace
      }),
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
      speaker: speaker.toLowerCase(),
      model: resolvedModel,
      pace
    });
    const audioBase64 = result?.audios?.[0] || '';
    return {
      audio: audioBase64,
      audioDataUrl: audioBase64 ? `data:audio/wav;base64,${audioBase64}` : null,
      model: resolvedModel,
      speaker,
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

  console.log('[SARVAM STT] Starting transcription, audio length:', audio?.length || 0);
  console.log('[SARVAM STT] Options:', JSON.stringify(options));
  console.log('[SARVAM STT] API Key present:', !!process.env.SARVAM_API_KEY);

  // 1. Try server proxy first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for large audio

    const response = await fetch(`${serverUrl}/api/sarvam/transcribe`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ audio, ...options }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json();
      console.log('[SARVAM STT] Server proxy result:', JSON.stringify(result));
      return result;
    } else {
      const errText = await response.text();
      console.error('[SARVAM STT] Server proxy error:', response.status, errText);
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

  if (audioBuffer.length < 50) {
    throw new Error('Audio was too short. Please speak again.');
  }

  const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
  formData.append('file', audioBlob, 'recording.wav');
  formData.append('model', options.model || 'saaras:v3');
  formData.append('mode', options.mode || 'transcribe');
  formData.append('language_code', options.language_code || 'en-IN');

  const apiResponse = await fetch('https://api.sarvam.ai/speech-to-text', {
    method: 'POST',
    headers: { 'api-subscription-key': apiKey },
    body: formData
  });

  if (!apiResponse.ok) {
    const err = await apiResponse.text();
    let errJson;
    try {
      errJson = JSON.parse(err);
    } catch (_) { }
    throw new Error(errJson?.error?.message || errJson?.message || `Sarvam STT error (${apiResponse.status})`);
  }

  const data = await apiResponse.json();
  let transcript = (data.transcript || data.text || '').trim();

  // If saaras:v3 returned empty transcript, automatically retry with saarika:v2.5 model
  if (!transcript && options.model !== 'saarika:v2.5') {
    try {
      console.log('[SARVAM STT] saaras:v3 returned empty, retrying with saarika:v2.5...');
      const fallbackFormData = new FormData();
      const fallbackBlob = new Blob([audioBuffer], { type: 'audio/wav' });
      fallbackFormData.append('file', fallbackBlob, 'recording.wav');
      fallbackFormData.append('model', 'saarika:v2.5');
      fallbackFormData.append('mode', 'transcribe');
      fallbackFormData.append('language_code', options.language_code || 'en-IN');

      const fallbackRes = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: { 'api-subscription-key': apiKey },
        body: fallbackFormData
      });

      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        transcript = (fallbackData.transcript || fallbackData.text || '').trim();
        console.log('[SARVAM STT] saarika:v2.5 fallback result:', transcript);
        if (transcript) {
          return {
            text: transcript,
            transcript,
            language_code: fallbackData.language_code || 'en-IN',
            request_id: fallbackData.request_id
          };
        }
      }
    } catch (e) {
      console.error('[SARVAM STT] Fallback error:', e.message);
    }
  }

  return {
    text: transcript,
    transcript,
    language_code: data.language_code || 'en-IN',
    language_probability: data.language_probability,
    request_id: data.request_id
  };
}

module.exports = { textToSpeech, transcribeAudio };