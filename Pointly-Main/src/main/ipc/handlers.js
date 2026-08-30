const { app, BrowserWindow, Menu, ipcMain, clipboard, screen } = require('electron');
const { getSettings, saveSettings } = require('../store/settings');
const { askGemini, askGeminiWithVision } = require('../ai/gemini');
const { textToSpeech, transcribeAudio } = require('../ai/sarvam');
const { findDesktopItem, getDesktopSummary, captureDesktopScreen } = require('../assist/desktopAnalyzer');
const { handleOsCommand } = require('../assist/osController');
const { isDraftWorkflow, generateWordWorkflow } = require('../assist/workflowGuide');
const { isBrowserNavigation, handleBrowserCommand } = require('../assist/browserController');
const { saveMemory, getMemories, saveScreenshotBuffer } = require('../store/memoryStore');
const { glideCompanionTo, setTypingMode } = require('../windows/cursorOverlay');

function registerIpcHandlers({ getChatWindow, getOverlayWindow }) {
  ipcMain.handle('settings:get', () => getSettings());
  ipcMain.handle('settings:save', (_, settings) => saveSettings(settings));

  ipcMain.handle('ai:ask', async (_, message) => {
    const answer = await askGemini(message);
    saveMemory({
      userPrompt: message,
      response: answer,
      source: 'chat'
    });
    return answer;
  });

  ipcMain.handle('ai:tts', (_, options) => textToSpeech(options));
  ipcMain.handle('ai:stt', async (_, audio, options) => {
    try {
      console.log('[STT IPC] Received audio, base64 length:', audio?.length || 0);
      console.log('[STT IPC] Options:', JSON.stringify(options));
      const result = await transcribeAudio(audio, options);
      console.log('[STT IPC] Transcription result:', JSON.stringify(result));
      return result;
    } catch (err) {
      console.error('[STT IPC] ERROR:', err.message);
      console.error('[STT IPC] Full error:', err);
      return { transcript: '', text: '', error: err.message };
    }
  });

  ipcMain.handle('desktop:find', (_, query) => findDesktopItem(query));
  ipcMain.handle('desktop:capture', async () => {
    const cap = await captureDesktopScreen();
    if (cap) {
      const saved = saveScreenshotBuffer(cap.buffer);
      return { dataUrl: cap.dataUrl, screenshotFile: saved?.filename };
    }
    return null;
  });

  ipcMain.handle('memory:get-history', () => getMemories());

  ipcMain.on('clipboard:write', (_, text) => {
    try {
      clipboard.writeText(text || '');
    } catch (e) {
      console.error('Clipboard write error:', e);
    }
  });

  // Companion Command Processor (Handles Web/Chrome, Word Workflows, OS Actions, Desktop Search, and AI)
  ipcMain.handle('companion:execute-command', async (_, commandText, options = {}) => {
    const text = (commandText || '').trim();
    if (!text) return { error: 'Empty command' };

    let screenshotSaved = null;
    try {
      const screenCap = await captureDesktopScreen();
      if (screenCap) {
        screenshotSaved = saveScreenshotBuffer(screenCap.buffer);
      }
    } catch (_) {}

    // 1. Check for Chrome & Webpage Navigation (e.g. "search AI news on Chrome", "open youtube", "scroll down")
    if (isBrowserNavigation(text)) {
      const browserResult = await handleBrowserCommand(text);
      if (browserResult) {
        saveMemory({
          userPrompt: text,
          response: browserResult.message,
          action: browserResult.action || 'browser_navigation',
          source: options.source || 'companion',
          screenshotFile: screenshotSaved?.filename
        });
        return browserResult;
      }
    }

    // 2. Check for Guided Application Workflow (e.g. "Draft me a mail body in Word")
    if (isDraftWorkflow(text)) {
      const workflowResult = await generateWordWorkflow(text);
      saveMemory({
        userPrompt: text,
        response: workflowResult.message,
        action: 'guided_workflow',
        source: options.source || 'companion',
        screenshotFile: screenshotSaved?.filename
      });
      return workflowResult;
    }

    // 3. Check for Operating System / Window Actions (minimize, maximize, close, open apps, etc.)
    const osResult = await handleOsCommand(text);
    if (osResult) {
      saveMemory({
        userPrompt: text,
        response: osResult.message,
        action: osResult.action,
        source: options.source || 'companion',
        screenshotFile: screenshotSaved?.filename
      });

      return osResult;
    }

    // 4. Check for "What is in my desktop" / Desktop Overview
    const isDesktopOverview = /\b(what('s| is| are)|show|list|tell me|read)\b.*\b(in|on|of)?\s*(my\s+)?desktop\b/i.test(text) ||
                              /\bwhat\s+(files?|items?|folders?)\s+(are|is|do i have)\b/i.test(text);

    if (isDesktopOverview) {
      const summaryResult = getDesktopSummary();
      saveMemory({
        userPrompt: text,
        response: summaryResult.message,
        action: 'desktop_summary',
        source: options.source || 'companion',
        screenshotFile: screenshotSaved?.filename
      });

      return summaryResult;
    }

    // 4.5 Check for Screen / Background Visual Perception ("what do you see", "what is in my background", "look at my screen")
    const isScreenVision = /\b(what('s| is| are)\s+(in|on)\s+(my\s+)?(background|screen)|what\s+do\s+you\s+see|look\s+at\s+my\s+screen|see\s+(my\s+)?screen|what\s+am\s+i\s+looking\s+at|analyze\s+(my\s+)?screen|read\s+(my\s+)?screen|what\s+(is|are)\s+(this|open)\s+(window|app|screen)?)\b/i.test(text);

    if (isScreenVision) {
      let screenCapture = await captureDesktopScreen();
      let visionAnalysis;
      if (screenCapture && screenCapture.buffer) {
        visionAnalysis = await askGeminiWithVision({
          prompt: text,
          imageBuffer: screenCapture.buffer
        });
      } else {
        visionAnalysis = 'I tried to look at your screen, but could not capture the display.';
      }

      saveMemory({
        userPrompt: text,
        response: visionAnalysis,
        action: 'screen_vision',
        source: options.source || 'companion',
        screenshotFile: screenshotSaved?.filename
      });

      let targetX = 500, targetY = 300;
      try {
        const primary = screen.getPrimaryDisplay();
        if (primary && primary.workAreaSize) {
          targetX = Math.round(primary.workAreaSize.width / 2);
          targetY = Math.round(primary.workAreaSize.height / 3);
        }
      } catch (_) {}

      return {
        type: 'screen_vision',
        message: visionAnalysis,
        spokenText: visionAnalysis,
        targetX,
        targetY
      };
    }

    // 5. Check for Desktop File/Folder Search (locate names.txt, etc.)
    const isDesktopSearch = /(locate|find|where is|search for|open|show me|look for)\b.*(file|folder|desktop|\.txt|\.pdf|\.doc|\.png|\.jpg|\.csv|\.xlsx|\.zip|\.mp4|\bnames\b)/i.test(text) ||
                            /(locate|find|where is)\b/i.test(text);

    if (isDesktopSearch) {
      const findResult = findDesktopItem(text);
      if (findResult && findResult.found) {
        const spokenAffirmation = `Here is ${findResult.item.name} on your Desktop.`;
        const textAffirmation = `Located "${findResult.item.name}" on your Desktop. Showing it now.`;

        saveMemory({
          userPrompt: text,
          response: textAffirmation,
          action: 'desktop_find',
          source: options.source || 'companion',
          screenshotFile: screenshotSaved?.filename,
          itemPath: findResult.item.path
        });

        return {
          type: 'desktop_find',
          found: true,
          message: textAffirmation,
          spokenText: spokenAffirmation,
          targetX: findResult.targetX,
          targetY: findResult.targetY,
          item: findResult.item
        };
      } else {
        const notFoundMsg = findResult?.message || `Could not find the requested file on your Desktop.`;
        saveMemory({
          userPrompt: text,
          response: notFoundMsg,
          action: 'desktop_find_failed',
          source: options.source || 'companion',
          screenshotFile: screenshotSaved?.filename
        });
        return {
          type: 'desktop_find',
          found: false,
          message: notFoundMsg,
          spokenText: notFoundMsg
        };
      }
    }

    // 5. General Conversation & Knowledge Inquiries via Gemini
    const aiAnswer = await askGemini(text);
    saveMemory({
      userPrompt: text,
      response: aiAnswer,
      source: options.source || 'companion',
      screenshotFile: screenshotSaved?.filename
    });

    return {
      type: 'ai_answer',
      response: aiAnswer,
      spokenText: aiAnswer
    };
  });

  // Companion window controls
  ipcMain.on('companion:glide', (_, { x, y }) => {
    glideCompanionTo(x, y);
  });

  ipcMain.on('companion:set-typing', (_, active) => {
    setTypingMode(active);
  });

  ipcMain.on('companion:open-chat', () => {
    const win = getChatWindow();
    if (win) {
      win.show();
      win.focus();
    }
  });

  ipcMain.on('overlay:set-ignore-mouse', (_, { ignore, options }) => {
    const overlay = getOverlayWindow();
    if (overlay && !overlay.isDestroyed()) {
      overlay.setIgnoreMouseEvents(ignore, options);
    }
  });

  ipcMain.on('window:close', () => getChatWindow()?.hide());
  ipcMain.on('window:minimize', () => getChatWindow()?.minimize());

  ipcMain.on('overlay:show-menu', (event) => {
    const menu = Menu.buildFromTemplate([
      {
        label: 'Type Command (Ctrl+T)',
        click: () => {
          const overlay = getOverlayWindow();
          if (overlay) {
            overlay.webContents.send('capsule:toggle');
          }
        }
      },
      {
        label: 'Voice Command (Ctrl+Space)',
        click: () => {
          const overlay = getOverlayWindow();
          if (overlay) {
            overlay.webContents.send('voice:toggle');
          }
        }
      },
      {
        label: 'End Voice Session (Ctrl+E)',
        click: () => {
          const overlay = getOverlayWindow();
          if (overlay) {
            overlay.webContents.send('voice:end');
          }
        }
      },
      {
        label: 'Open Full Dashboard (Ctrl+Alt+Space)',
        click: () => {
          const win = getChatWindow();
          if (win) {
            win.show();
            win.focus();
          }
        }
      },
      { type: 'separator' },
      { label: 'Exit Pointly', click: () => app.exit(0) }
    ]);
    const window = BrowserWindow.fromWebContents(event.sender);
    menu.popup({ window });
  });
}

module.exports = { registerIpcHandlers };
