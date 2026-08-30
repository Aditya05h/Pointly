require('dotenv').config({ path: require('node:path').join(__dirname, '.env') });
const express = require('express');
const geminiRoute = require('./routes/gemini');
const sarvamRoute = require('./routes/sarvam');
const app = express();
const port = process.env.PORT || 8787;
app.use(express.json({ limit: '10mb' }));
app.get('/health', (_, response) => response.json({ ok: true, service: 'pointly-proxy' }));
app.use('/api/gemini', geminiRoute);
app.use('/api/sarvam', sarvamRoute);
function startProxyServer() {
  try {
    const server = app.listen(port, () => console.log(`Pointly proxy listening on http://localhost:${port}`));
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is already in use; reusing existing Pointly proxy server.`);
      } else {
        console.error('Pointly proxy server error:', err.message);
      }
    });
  } catch (err) {
    console.log('Failed to launch Pointly proxy server:', err.message);
  }
}

if (require.main === module) {
  startProxyServer();
}

module.exports = { app, startProxyServer };