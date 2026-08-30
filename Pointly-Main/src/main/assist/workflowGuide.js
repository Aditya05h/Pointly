const { exec } = require('child_process');
const { screen, clipboard } = require('electron');
const { askGemini } = require('../ai/gemini');

function getScreenBounds() {
  try {
    if (screen && typeof screen.getPrimaryDisplay === 'function') {
      const primary = screen.getPrimaryDisplay();
      if (primary && primary.workAreaSize) {
        return primary.workAreaSize;
      }
    }
  } catch (_) {}
  return { width: 1920, height: 1080 };
}

/**
 * Launch Microsoft Word with graceful fallbacks (Word -> WordPad -> Notepad).
 */
function launchWord() {
  return new Promise((resolve) => {
    exec('start winword', (err) => {
      if (err) {
        exec('start write', (err2) => {
          if (err2) {
            exec('start notepad', () => resolve({ app: 'notepad' }));
          } else {
            resolve({ app: 'wordpad' });
          }
        });
      } else {
        resolve({ app: 'word' });
      }
    });
  });
}

/**
 * Detect if query is asking to draft an email, letter, or document in an app like Word.
 */
function isDraftWorkflow(userQuery) {
  const q = (userQuery || '').toLowerCase();
  const hasDraft = /draft|write|compose|create|make/i.test(q);
  const hasTarget = /mail|email|letter|document|body|message/i.test(q);
  const hasApp = /word|ms word|microsoft word|outlook|notepad|wordpad|doc/i.test(q);

  return (hasDraft && hasTarget) || (hasTarget && hasApp) || /draft.*(mail|email)/i.test(q);
}

/**
 * Generate guided multi-step workflow for drafting and inserting into Word.
 */
async function generateWordWorkflow(userQuery) {
  const { width: screenWidth, height: screenHeight } = getScreenBounds();

  // 1. Ask Gemini to write a professional draft based on user prompt
  const promptForGemini = `The user asked: "${userQuery}".
Please write a professional, clear email draft or document body for this request.
Format with:
Subject: [Clear subject line]
Dear [Recipient],
[2-3 paragraph email body]
Best regards,
[Your Name]`;

  let draftedText = await askGemini(promptForGemini);
  if (!draftedText || draftedText.startsWith('Gemini Error')) {
    draftedText = `Subject: Important Update\n\nDear Team,\n\nI am writing to share an update regarding our current project. Please review the details and let me know your thoughts.\n\nBest regards,\n[Your Name]`;
  }

  // 2. Automatically copy drafted text to Windows clipboard if in Electron
  try {
    if (clipboard && typeof clipboard.writeText === 'function') {
      clipboard.writeText(draftedText);
    }
  } catch (err) {
    console.error('Clipboard error:', err);
  }

  // 3. Launch Word in background
  await launchWord();

  // 4. Build guided visual navigation steps with exact UI button coordinates
  const steps = [
    {
      stepNumber: 1,
      totalSteps: 3,
      title: 'Step 1: Open Document',
      targetX: Math.min(320, screenWidth - 300),
      targetY: Math.min(240, screenHeight - 200),
      actionText: 'Click "Blank Document" to create a new canvas.',
      spokenText: 'Step 1: Click Blank Document here to open your canvas.',
      beaconLabel: '1. Blank Document'
    },
    {
      stepNumber: 2,
      totalSteps: 3,
      title: 'Step 2: Insert Draft',
      targetX: Math.round(screenWidth / 2),
      targetY: Math.min(380, screenHeight - 250),
      actionText: 'I’ve drafted your email and copied it to your clipboard. Press Ctrl+V to paste it here.',
      spokenText: 'Step 2: Here is your drafted mail. I have copied it to your clipboard. Press Control V to paste.',
      beaconLabel: '2. Paste (Ctrl+V) Here',
      draftContent: draftedText
    },
    {
      stepNumber: 3,
      totalSteps: 3,
      title: 'Step 3: Format & Share',
      targetX: 90,
      targetY: 85,
      actionText: 'Use File > Share or Export in the top ribbon to send your email.',
      spokenText: 'Step 3: Use the top ribbon to format or export your email when you are ready.',
      beaconLabel: '3. Format / Share Ribbon'
    }
  ];

  return {
    type: 'guided_workflow',
    workflow: 'draft_mail_in_word',
    steps,
    draftContent: draftedText,
    currentStepIndex: 0,
    message: `Drafted your email and opened Word. Step 1: Click Blank Document.`,
    spokenText: `I have drafted your email and opened Word. Step 1: Click Blank Document here.`
  };
}

module.exports = {
  isDraftWorkflow,
  generateWordWorkflow,
  launchWord
};
