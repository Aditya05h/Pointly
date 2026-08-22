const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../../../server/.env') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const FALLBACK_MODELS = [
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash'
];

async function askGemini(message) {
  if (!message || !message.trim()) throw new Error('A message is required');
  const serverUrl = process.env.POINTLY_SERVER_URL || 'http://localhost:8787';

  // 1. Try server proxy first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${serverUrl}/api/gemini`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.text) return data.text;
    }
  } catch (_) {
    // If proxy server is down, fallback directly to Google Gemini API
  }

  // 2. Direct fallback using GEMINI_API_KEY from environment with model cascade
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return 'Pointly is ready, but GEMINI_API_KEY is not configured. Please check server/.env.';
  }

  const primaryModel = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const modelsToTry = [primaryModel, ...FALLBACK_MODELS.filter((m) => m !== primaryModel)];

  let lastError = null;

  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const apiResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: message }]
            }
          ],
          systemInstruction: {
            parts: [
              {
                text: 'You are Pointly, a concise and intelligent desktop assistant.'
              }
            ]
          }
        })
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        return (
          data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n') ||
          'No response received from Gemini.'
        );
      }

      const errText = await apiResponse.text();
      let errJson;
      try { errJson = JSON.parse(errText); } catch (_) { }
      lastError = errJson?.error?.message || `Status ${apiResponse.status}`;

      if (apiResponse.status === 429 || apiResponse.status === 404) {
        continue;
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  return `Gemini Error: ${lastError || 'Failed to connect to AI'}`;
}

async function askGeminiWithVision({ prompt, imageBuffer, imageBase64 } = {}) {
  let userPrompt = prompt && prompt.trim() ? prompt.trim() : 'Describe what you see on my screen concisely in 2-3 sentences.';
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return 'Pointly is ready, but GEMINI_API_KEY is not configured in .env.';
  }

  let base64Data = imageBase64;
  if (!base64Data && imageBuffer) {
    base64Data = Buffer.isBuffer(imageBuffer) ? imageBuffer.toString('base64') : '';
  }
  if (base64Data && base64Data.startsWith('data:')) {
    base64Data = base64Data.replace(/^data:image\/\w+;base64,/, '');
  }

  const primaryModel = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const modelsToTry = [primaryModel, ...FALLBACK_MODELS.filter((m) => m !== primaryModel)];

  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const parts = [{ text: userPrompt }];
    if (base64Data) {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: base64Data
        }
      });
    }

    try {
      const apiResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          systemInstruction: {
            parts: [
              {
                text: 'You are Pointly, an intelligent AI companion. You have real-time visual perception of the user desktop screen and background. Provide a crisp, concise, helpful summary (2-3 sentences max) of what apps, windows, documents, text, code, or content are visible on screen.'
              }
            ]
          }
        })
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n');
        if (text) return text.trim();
      }
    } catch (err) {
      console.error(`Gemini Vision error on ${model}:`, err.message);
    }
  }

  return 'I looked at your screen, but could not analyze the image details.';
}

module.exports = { askGemini, askGeminiWithVision };