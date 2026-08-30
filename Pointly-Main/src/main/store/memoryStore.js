const fs = require('node:fs');
const path = require('node:path');
const { app } = require('electron');

function getMemoryDir() {
  let baseDir;
  try {
    baseDir = app ? app.getPath('userData') : path.join(process.cwd(), 'data');
  } catch (_) {
    baseDir = path.join(process.cwd(), 'data');
  }
  const memoryDir = path.join(baseDir, 'pointly_memory');
  const screenshotsDir = path.join(memoryDir, 'screenshots');

  if (!fs.existsSync(memoryDir)) fs.mkdirSync(memoryDir, { recursive: true });
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  return { memoryDir, screenshotsDir };
}

function getMemoryFilePath() {
  const { memoryDir } = getMemoryDir();
  return path.join(memoryDir, 'memory_history.json');
}

/**
 * Read all stored memories.
 */
function getMemories(limit = 100) {
  const filePath = getMemoryFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return Array.isArray(data) ? data.slice(-limit) : [];
    }
  } catch (err) {
    console.error('Error reading memory store:', err);
  }
  return [];
}

/**
 * Save a new interaction, speech command, or task to memory.
 */
function saveMemory(entry) {
  const filePath = getMemoryFilePath();
  const memories = getMemories(500);

  const newEntry = {
    id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
    displayTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type: entry.type || 'conversation',
    userPrompt: entry.userPrompt || entry.text || '',
    response: entry.response || '',
    source: entry.source || 'voice', // 'voice', 'text', 'desktop-action'
    action: entry.action || null,
    screenshotFile: entry.screenshotFile || null,
    ...entry
  };

  memories.push(newEntry);

  try {
    fs.writeFileSync(filePath, JSON.stringify(memories, null, 2), 'utf8');
    return newEntry;
  } catch (err) {
    console.error('Error writing to memory store:', err);
    return null;
  }
}

/**
 * Save screenshot buffer into local screenshot storage.
 */
function saveScreenshotBuffer(pngBuffer) {
  if (!pngBuffer) return null;
  const { screenshotsDir } = getMemoryDir();
  const filename = `snap_${Date.now()}.png`;
  const filePath = path.join(screenshotsDir, filename);

  try {
    fs.writeFileSync(filePath, pngBuffer);
    return {
      filename,
      filePath,
      url: `file://${filePath.replace(/\\/g, '/')}`
    };
  } catch (err) {
    console.error('Error saving screenshot file:', err);
    return null;
  }
}

module.exports = {
  getMemories,
  saveMemory,
  saveScreenshotBuffer
};
