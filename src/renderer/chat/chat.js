const form = document.querySelector('#chat-form');
const prompt = document.querySelector('#prompt');
const messages = document.querySelector('#messages');
const assistButton = document.querySelector('#assist');
let assistMode = false;

function addMessage(text, role) {
  const message = document.createElement('div');
  message.className = `message ${role}`;
  message.textContent = text;
  messages.append(message);
  messages.scrollTop = messages.scrollHeight;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = prompt.value.trim();
  if (!text) return;
  addMessage(text, 'user'); prompt.value = '';
  addMessage('Thinking...', 'assistant pending');
  try {
    const answer = await window.pointly.ask(text);
    messages.querySelector('.pending')?.remove(); addMessage(answer, 'assistant');
  } catch (error) {
    messages.querySelector('.pending')?.remove(); addMessage(error.message, 'assistant');
  }
});

assistButton.addEventListener('click', () => {
  assistMode = !assistMode;
  assistButton.classList.toggle('active', assistMode);
  assistButton.firstChild.textContent = assistMode ? '● Assist Mode' : '○ Assist Mode';
  window.pointly.saveSettings({ assistMode });
});
document.querySelector('#close').addEventListener('click', () => window.pointly.close());
document.querySelector('#minimize').addEventListener('click', () => window.pointly.minimize());
prompt.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); } });
