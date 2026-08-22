const express = require('express');
const router = express.Router();
router.post('/transcribe', (request, response) => {
  if (!process.env.SARVAM_API_KEY) return response.status(503).json({ error: 'SARVAM_API_KEY is not configured' });
  response.json({ text: '', message: 'Sarvam proxy is configured. Add the provider request here.' });
});
module.exports = router;
