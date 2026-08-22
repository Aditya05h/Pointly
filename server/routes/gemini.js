const express = require('express');
const router = express.Router();

router.post('/', async (request, response) => {
  const { message } = request.body || {};
  if (!message) return response.status(400).json({ error: 'message is required' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return response.status(503).json({ error: 'GEMINI_API_KEY is not configured' });

  const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
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
              text: 'You are Pointly, an intelligent, concise desktop assistant. Provide helpful, clear, and focused answers.'
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
      const errMsg = errJson?.error?.message || `Gemini API returned status ${apiResponse.status}`;
      return response.status(apiResponse.status).json({ error: errMsg });
    }

    const data = await apiResponse.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n') ||
      'No response generated.';
    return response.json({ text });
  } catch (error) {
    return response.status(500).json({ error: error.message || 'Failed to communicate with Gemini' });
  }
});

module.exports = router;
