function assertAssistEnabled(enabled) {
  if (!enabled) throw new Error('Assist Mode is disabled');
}

async function click(x, y, enabled) { assertAssistEnabled(enabled); return { action: 'click', x, y }; }
async function typeText(text, enabled) { assertAssistEnabled(enabled); return { action: 'type', text }; }
async function scroll(amount, enabled) { assertAssistEnabled(enabled); return { action: 'scroll', amount }; }

module.exports = { click, typeText, scroll };
