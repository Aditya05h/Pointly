async function transcribeAudio(audio) {
  const serverUrl = process.env.POINTLY_SERVER_URL || 'http://localhost:8787';
  const response = await fetch(`${serverUrl}/api/sarvam/transcribe`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ audio })
  });
  if (!response.ok) throw new Error(`STT proxy returned ${response.status}`);
  return response.json();
}

module.exports = { transcribeAudio };
