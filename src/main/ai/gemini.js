async function askGemini(message) {
  if (!message || !message.trim()) throw new Error('A message is required');
  const serverUrl = process.env.POINTLY_SERVER_URL || 'http://localhost:8787';
  try {
    const response = await fetch(`${serverUrl}/api/gemini`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (!response.ok) throw new Error(`Proxy returned ${response.status}`);
    return (await response.json()).text;
  } catch (error) {
    return `I’m ready, but the AI proxy is unavailable. Start the server to connect Gemini. (${error.message})`;
  }
}

module.exports = { askGemini };
