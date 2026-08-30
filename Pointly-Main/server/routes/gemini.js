const express = require('express');
const router = express.Router();

const FALLBACK_MODELS = [
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash'
];

router.post('/', async (request, response) => {
  const { message } = request.body || {};
  if (!message) return response.status(400).json({ error: 'message is required' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return response.status(503).json({ error: 'GEMINI_API_KEY is not configured' });

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
                text: 'You are Pointly, a focused, intelligent, and concise desktop companion.'
              }
            ]
          }
        })
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        const text =
          data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n') ||
          'No response generated.';
        return response.json({ text, model });
      }

      const errText = await apiResponse.text();
      let errJson;
      try { errJson = JSON.parse(errText); } catch (_) { }
      lastError = errJson?.error?.message || `Status ${apiResponse.status}`;

      // If rate limited or model not found, try the next model
      if (apiResponse.status === 429 || apiResponse.status === 404) {
        continue;
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  return response.status(500).json({ error: lastError || 'Failed to communicate with Gemini' });
});

module.exports = router;