const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../../../server/.env') });
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

async function askGemini(message) {
  if (!message || !message.trim()) throw new Error('A message is required');
  const serverUrl = process.env.POINTLY_SERVER_URL || 'http://localhost:8787';

  // 1. First attempt to call the Pointly proxy server
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

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
    // If proxy server is unavailable, fallback directly to Google Gemini API
  }

  // 2. Direct fallback using GEMINI_API_KEY from environment
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return 'Pointly is ready, but GEMINI_API_KEY is not configured. Please check server/.env.';
  }

  try {
    const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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
              text: 'You are Pointly, a concise and helpful desktop assistant.'
            }
          ]
        }
      })
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      let errJson;
      try {
        errJson = JSON.parse(errText);
      } catch (_) {}
      const errMsg = errJson?.error?.message || `Gemini error (${apiResponse.status})`;
      return `Gemini Error: ${errMsg}`;
    }

    const data = await apiResponse.json();
    return (
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n') ||
      'No response received from Gemini.'
    );
  } catch (error) {
    return `Failed to connect to Gemini: ${error.message}`;
  }
}

module.exports = { askGemini };
