const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { shell, desktopCapturer, screen } = require('electron');

/**
 * Get all desktop paths on the current system (handles OneDrive & local).
 */
function getDesktopPaths() {
  const home = os.homedir();
  const paths = [
    path.join(home, 'Desktop'),
    path.join(home, 'OneDrive', 'Desktop'),
    path.join(home, 'OneDrive - Personal', 'Desktop'),
    path.join(process.env.PUBLIC || 'C:\\Users\\Public', 'Desktop')
  ];

  return paths.filter((p) => {
    try {
      return fs.existsSync(p) && fs.statSync(p).isDirectory();
    } catch (_) {
      return false;
    }
  });
}

/**
 * Scan desktop directories for files and folders.
 */
function listDesktopItems() {
  const desktopDirs = getDesktopPaths();
  const items = [];

  for (const dir of desktopDirs) {
    try {
      const files = fs.readdirSync(dir);
      for (const name of files) {
        if (name.startsWith('.') || name.toLowerCase() === 'desktop.ini') continue;
        const fullPath = path.join(dir, name);
        try {
          const stat = fs.statSync(fullPath);
          items.push({
            name,
            path: fullPath,
            directory: dir,
            isDirectory: stat.isDirectory(),
            size: stat.size,
            mtime: stat.mtime
          });
        } catch (_) {}
      }
    } catch (_) {}
  }
  return items;
}

/**
 * Search for a file or folder on the desktop matching query.
 */
function findDesktopItem(query) {
  if (!query) return null;
  const cleanQuery = query
    .toLowerCase()
    .replace(/locate|find|where is|open|show me|the|file|folder|on my desktop|desktop/gi, '')
    .trim();

  if (!cleanQuery) return null;

  const items = listDesktopItems();
  if (items.length === 0) return null;

  // 1. Exact name match
  let matched = items.find(
    (item) => item.name.toLowerCase() === cleanQuery ||
              path.parse(item.name).name.toLowerCase() === cleanQuery
  );

  // 2. Partial match
  if (!matched) {
    matched = items.find(
      (item) => item.name.toLowerCase().includes(cleanQuery) ||
                cleanQuery.includes(path.parse(item.name).name.toLowerCase())
    );
  }

  // 3. Word match
  if (!matched) {
    const queryWords = cleanQuery.split(/\s+/).filter((w) => w.length > 2);
    matched = items.find((item) =>
      queryWords.some((word) => item.name.toLowerCase().includes(word))
    );
  }

  if (matched) {
    // Reveal item in File Explorer
    try {
      shell.showItemInFolder(matched.path);
    } catch (err) {
      console.error('Error revealing item in Explorer:', err);
    }

    // Estimate coordinates on primary display
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    // Approximate desktop grid position based on index or center screen
    const itemIndex = items.findIndex((i) => i.path === matched.path);
    const col = Math.floor(itemIndex / 10);
    const row = itemIndex % 10;
    const targetX = Math.min(Math.max(60 + col * 100, 100), width - 200);
    const targetY = Math.min(Math.max(60 + row * 90, 100), height - 200);

    return {
      found: true,
      item: matched,
      targetX,
      targetY,
      message: `Found "${matched.name}" on your Desktop.`
    };
  }

  return {
    found: false,
    query: cleanQuery,
    message: `Could not find "${cleanQuery}" on your Desktop. Available desktop files: ${items.map((i) => i.name).slice(0, 5).join(', ')}`
  };
}

/**
 * Capture full desktop screen image as data URL.
 */
async function captureDesktopScreen() {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1280, height: 720 }
    });

    if (sources.length > 0) {
      const thumbnail = sources[0].thumbnail;
      return {
        dataUrl: thumbnail.toDataURL(),
        buffer: thumbnail.toPNG(),
        width: thumbnail.getSize().width,
        height: thumbnail.getSize().height
      };
    }
  } catch (err) {
    console.error('Desktop screen capture error:', err);
  }
  return null;
}

module.exports = {
  getDesktopPaths,
  listDesktopItems,
  findDesktopItem,
  captureDesktopScreen
};
