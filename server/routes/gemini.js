const express = require('express');
const router = express.Router();
router.post('/', async (request, response) => {
  const { message } = request.body;
  if (!message) return response.status(400).json({ error: 'message is required' });
  if (!process.env.GEMINI_API_KEY) return response.status(503).json({ error: 'GEMINI_API_KEY is not configured' });
  response.json({ text: 'Gemini proxy is configured. Add the provider request here.' });
});
module.exports = router;
