const express = require('express');
const router = express.Router();
const { SarvamAIClient } = require('sarvamai');

function getSarvamClient() {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) return null;
  return new SarvamAIClient({ apiSubscriptionKey: apiKey });
}

// Map speaker to appropriate Sarvam model (anushka requires bulbul:v2 or bulbul:v1)
function resolveTtsModel(speaker, requestedModel) {
  if (speaker && speaker.toLowerCase() === 'anushka') {
    return 'bulbul:v2';
  }
  return requestedModel || 'bulbul:v3';
}

// Text to Speech endpoint
router.post('/tts', async (request, response) => {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) return response.status(503).json({ error: 'SARVAM_API_KEY is not configured' });

  const {
    text,
    speaker = 'shubh',
    target_language_code = 'en-IN',
    model,
    pace = 1.0
  } = request.body || {};

  if (!text || !text.trim()) {
    return response.status(400).json({ error: 'text is required' });
  }

  const resolvedModel = resolveTtsModel(speaker, model);

  try {
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
      return response.json({
        audio: audioBase64,
        audioDataUrl: audioBase64 ? `data:audio/wav;base64,${audioBase64}` : null,
        model: resolvedModel,
        speaker,
        request_id: result?.request_id
      });
    }

    // Direct REST fallback
    const apiResponse = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey
      },
      body: JSON.stringify({
        text: text.trim(),
        target_language_code,
        speaker: speaker.toLowerCase(),
        model: resolvedModel,
        pace
      })
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      let errJson;
      try { errJson = JSON.parse(errText); } catch (_) {}
      return response.status(apiResponse.status).json({
        error: errJson?.error?.message || errJson?.message || `Sarvam TTS error (${apiResponse.status})`
      });
    }

    const data = await apiResponse.json();
    const audioBase64 = data?.audios?.[0] || '';
    return response.json({
      audio: audioBase64,
      audioDataUrl: audioBase64 ? `data:audio/wav;base64,${audioBase64}` : null,
      model: resolvedModel,
      speaker,
      request_id: data?.request_id
    });
  } catch (error) {
    console.error('Sarvam TTS Error:', error);
    return response.status(500).json({ error: error.message || 'Failed to convert text to speech' });
  }
});

// Speech to Text endpoint
router.post('/transcribe', async (request, response) => {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) return response.status(503).json({ error: 'SARVAM_API_KEY is not configured' });

  try {
    const {
      audio,
      language_code = 'unknown',
      model = 'saaras:v3',
      mode = 'transcribe'
    } = request.body || {};

    if (!audio) {
      return response.status(400).json({ error: 'audio data is required' });
    }

    const formData = new FormData();
    let audioBuffer;
    if (typeof audio === 'string') {
      const base64Data = audio.replace(/^data:audio\/\w+;base64,/, '');
      audioBuffer = Buffer.from(base64Data, 'base64');
    } else {
      audioBuffer = Buffer.from(audio);
    }

    if (audioBuffer.length < 50) {
      return response.status(400).json({ error: 'Audio recording was too short. Please speak again.' });
    }

    const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
    formData.append('file', audioBlob, 'recording.wav');
    if (model) formData.append('model', model);
    if (mode) formData.append('mode', mode);
    if (language_code && language_code !== 'unknown') {
      formData.append('language_code', language_code);
    }

    const apiResponse = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey
      },
      body: formData
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (_) {}
      const msg = errorJson?.error?.message || errorJson?.message || `Sarvam STT error (${apiResponse.status})`;
      return response.status(apiResponse.status).json({ error: msg });
    }

    const data = await apiResponse.json();
    return response.json({
      text: data.transcript || data.text || '',
      transcript: data.transcript || data.text || '',
      language_code: data.language_code,
      language_probability: data.language_probability,
      request_id: data.request_id
    });
  } catch (error) {
    console.error('Sarvam STT Route Error:', error);
    return response.status(500).json({ error: error.message || 'Failed to process audio with Sarvam' });
  }
});

module.exports = router;
