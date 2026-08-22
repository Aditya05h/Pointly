const { exec } = require('child_process');
const { screen } = require('electron');

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

function runPowerShell(script) {
  const encoded = Buffer.from(script, 'utf16le').toString('base64');
  return new Promise((resolve) => {
    exec(`powershell -NoProfile -EncodedCommand ${encoded}`, (err, stdout, stderr) => {
      if (err) resolve({ success: false, error: stderr || err.message });
      else resolve({ success: true, output: (stdout || '').trim() });
    });
  });
}

/**
 * Common quick website URLs.
 */
const QUICK_SITES = {
  pointly: 'https://pointlyuvcehack.netlify.app/',
  'pointly website': 'https://pointlyuvcehack.netlify.app/',
  'pointly app': 'https://pointlyuvcehack.netlify.app/',
  'landing page': 'https://pointlyuvcehack.netlify.app/',
  'pointly landing page': 'https://pointlyuvcehack.netlify.app/',
  pointlyuvcehack: 'https://pointlyuvcehack.netlify.app/',
  uvce: 'https://pointlyuvcehack.netlify.app/',
  'uvce hack': 'https://pointlyuvcehack.netlify.app/',
  canva: 'https://canva.com',
  figma: 'https://figma.com',
  notion: 'https://notion.so',
  youtube: 'https://youtube.com',
  github: 'https://github.com',
  google: 'https://google.com',
  gmail: 'https://mail.google.com',
  docs: 'https://docs.google.com',
  sheets: 'https://sheets.google.com',
  drive: 'https://drive.google.com',
  wikipedia: 'https://wikipedia.org',
  reddit: 'https://reddit.com',
  linkedin: 'https://linkedin.com',
  twitter: 'https://x.com',
  x: 'https://x.com',
  stackoverflow: 'https://stackoverflow.com',
  chatgpt: 'https://chatgpt.com',
  claude: 'https://claude.ai',
  devpost: 'https://devpost.com',
  hackathon: 'https://devpost.com',
  amazon: 'https://amazon.com',
  netflix: 'https://netflix.com',
  spotify: 'https://open.spotify.com'
};

/**
 * Open URL in Google Chrome (with default browser fallback).
 */
function openInChrome(url) {
  return new Promise((resolve) => {
    exec(`start chrome "${url}"`, (err) => {
      if (err) {
        exec(`start "" "${url}"`, () => resolve({ success: true, fallback: true }));
      } else {
        resolve({ success: true, fallback: false });
      }
    });
  });
}

/**
 * Send keystroke to active browser window (e.g. scroll down, scroll up, new tab, reload).
 */
async function sendBrowserKey(keys) {
  const script = `
$wshell = New-Object -ComObject WScript.Shell;
$wshell.SendKeys('${keys}');
Write-Host "OK";
`;
  return await runPowerShell(script);
}

/**
 * Detect if query is asking for browser or webpage navigation.
 * Intentionally very loose matching to handle speech-to-text errors.
 */
function isBrowserNavigation(userQuery) {
  const q = (userQuery || '').toLowerCase().trim();

  // Direct Chrome/Browser commands (including common STT misspellings)
  if (/\b(chrome|crome|krome|chrom|google\s*chrome|browser)\b/i.test(q)) return true;

  // Quick site name direct match (e.g., user just says "canva" or "open youtube")
  const siteNames = Object.keys(QUICK_SITES);
  for (const siteName of siteNames) {
    if (q === siteName || q === `open ${siteName}` || q === `launch ${siteName}` || q === `go to ${siteName}`) return true;
  }

  const hasBrowserWords = /chrome|crome|krome|google chrome|browser|webpage|website|url|web|tab|page\b/i.test(q);
  const hasActions = /search|look up|open|navigate|go to|launch|start|scroll|refresh|reload|address bar|omnibox|new tab|close tab/i.test(q);

  if (/^(open|launch|start|run|bring up)\s+(google\s+)?(chrome|crome|krome|browser)\b/i.test(q)) return true;
  if (/^(open|launch|go to|navigate to)\s+/i.test(q) && siteNames.some(s => q.includes(s))) return true;
  if (hasBrowserWords && hasActions) return true;
  if (/pointlyuvcehack|netlify\.app/i.test(q)) return true;
  if (/^search\s+(for\s+)?/i.test(q)) return true;
  if (/scroll\s+(down|up|page)/i.test(q)) return true;
  if (/where is (the )?(address bar|search bar|new tab|back button)/i.test(q)) return true;

  // URL patterns directly in speech
  if (/\b[a-z0-9]+\.(com|org|net|io|ai|app|dev)\b/i.test(q)) return true;

  return false;
}

/**
 * Process Chrome and Webpage Navigation Commands.
 */
async function handleBrowserCommand(userQuery) {
  const query = (userQuery || '').toLowerCase().trim();
  const { width: screenWidth, height: screenHeight } = getScreenBounds();

  // Browser UI Coordinates (relative to top toolbar of Chrome)
  const coords = {
    addressBar: { x: Math.round(screenWidth / 2), y: 82 },
    newTab: { x: 280, y: 42 },
    backBtn: { x: 30, y: 82 },
    forwardBtn: { x: 62, y: 82 },
    refreshBtn: { x: 92, y: 82 },
    contentArea: { x: Math.round(screenWidth / 2), y: 360 }
  };

  // 0. Compound Multi-Site Commands (e.g. "open chrome and open canva", "open canva and youtube")
  if (query.includes(' and ') || query.includes(' & ') || query.includes(' then ') || query.includes(',')) {
    const parts = query.split(/\s+(?:and|then|&)\s+|,\s*/i);
    const openedSites = [];
    let openedChromeDirect = false;

    for (const part of parts) {
      const p = part.trim();
      let matched = false;
      for (const [siteKey, siteUrl] of Object.entries(QUICK_SITES)) {
        if (p.includes(siteKey) || p === siteKey || p === `open ${siteKey}`) {
          await openInChrome(siteUrl);
          openedSites.push(siteKey);
          matched = true;
          break;
        }
      }
      if (!matched && (/^(open\s+)?(google\s+)?(chrome|browser)\b/i.test(p) || p === 'chrome')) {
        openedChromeDirect = true;
      }
    }

    if (openedSites.length > 0 || openedChromeDirect) {
      if (openedChromeDirect && openedSites.length === 0) {
        await openInChrome('https://www.google.com');
      }
      const formattedNames = [
        ...(openedChromeDirect && !openedSites.includes('chrome') ? ['Google Chrome'] : []),
        ...openedSites.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      ];
      const summaryNames = formattedNames.join(' and ');
      return {
        type: 'browser_action',
        action: 'open_multiple',
        found: true,
        targetX: coords.addressBar.x,
        targetY: coords.addressBar.y,
        message: `Opened ${summaryNames} in Google Chrome.`,
        spokenText: `Opening ${summaryNames} for you in Google Chrome.`
      };
    }
  }

  // 1. Direct Open Google Chrome / Browser
  if (/^(open|launch|start|run|bring up)\s+(google\s+)?(chrome|crome|krome|browser)\b/i.test(query) ||
      /\b(chrome|crome|krome)\b/i.test(query) && query.split(/\s+/).length <= 3) {
    await openInChrome('https://www.google.com');
    return {
      type: 'browser_action',
      action: 'open_chrome',
      found: true,
      targetX: coords.addressBar.x,
      targetY: coords.addressBar.y,
      message: 'Opened Google Chrome.',
      spokenText: 'Opening Google Chrome for you now.'
    };
  }

  // 1. Where is Address Bar / Omnibox / Search Bar
  if (query.includes('address bar') || query.includes('omnibox') || query.includes('url bar') || query.includes('where is search bar in chrome')) {
    return {
      type: 'browser_action',
      action: 'point_address_bar',
      found: true,
      targetX: coords.addressBar.x,
      targetY: coords.addressBar.y,
      message: 'The Address & Search Bar (Omnibox) is at the top center of Chrome.',
      spokenText: 'The address and search bar is located at the top center of Chrome.'
    };
  }

  // 2. Where is New Tab / Back / Refresh Button
  if (query.includes('new tab') && (query.includes('where') || query.includes('point'))) {
    return {
      type: 'browser_action',
      action: 'point_new_tab',
      found: true,
      targetX: coords.newTab.x,
      targetY: coords.newTab.y,
      message: 'The New Tab (+) button is located on the top tab bar.',
      spokenText: 'Here is the new tab plus button on the top tab bar.'
    };
  }

  if (query.includes('refresh') || query.includes('reload') || query.includes('back button')) {
    if (query.includes('back')) {
      return {
        type: 'browser_action',
        action: 'point_back_button',
        found: true,
        targetX: coords.backBtn.x,
        targetY: coords.backBtn.y,
        message: 'The Back navigation button is on the top-left toolbar.',
        spokenText: 'Here is the back button on the top-left toolbar.'
      };
    } else {
      await sendBrowserKey('{F5}');
      return {
        type: 'browser_action',
        action: 'reload_page',
        found: true,
        targetX: coords.refreshBtn.x,
        targetY: coords.refreshBtn.y,
        message: 'Refreshed webpage. The reload button is at the top-left toolbar.',
        spokenText: 'I have refreshed the webpage for you.'
      };
    }
  }

  // 3. Scroll Down / Scroll Up on Webpage
  if (query.includes('scroll down') || query.includes('page down')) {
    await sendBrowserKey('{PGDN}');
    return {
      type: 'browser_action',
      action: 'scroll_down',
      found: true,
      targetX: coords.contentArea.x,
      targetY: coords.contentArea.y,
      message: 'Scrolled down on the webpage.',
      spokenText: 'Scrolled down on the webpage for you.'
    };
  }

  if (query.includes('scroll up') || query.includes('page up')) {
    await sendBrowserKey('{PGUP}');
    return {
      type: 'browser_action',
      action: 'scroll_up',
      found: true,
      targetX: coords.contentArea.x,
      targetY: coords.contentArea.y,
      message: 'Scrolled up on the webpage.',
      spokenText: 'Scrolled up on the webpage for you.'
    };
  }

  // 4. Quick Direct Website Launching (Canva, Figma, Notion, YouTube, GitHub, etc.)
  for (const [siteKey, siteUrl] of Object.entries(QUICK_SITES)) {
    const siteRegex = new RegExp(`\\b(open|go to|launch|navigate to)\\s+(${siteKey})\\b`, 'i');
    if (siteRegex.test(query) || query === `open ${siteKey}` || query === siteKey) {
      await openInChrome(siteUrl);
      return {
        type: 'browser_action',
        action: 'open_site',
        found: true,
        targetX: coords.addressBar.x,
        targetY: coords.addressBar.y,
        message: `Navigated to ${siteKey} in Google Chrome (${siteUrl}).`,
        spokenText: `Opening ${siteKey} in Google Chrome for you now.`
      };
    }
  }

  // 5. Open Direct URL (e.g. "navigate to https://example.com" or "open canva.com in chrome")
  const urlMatch = query.match(/(?:navigate to|open|go to)\s+(https?:\/\/[^\s]+|[a-zA-Z0-9_\-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i);
  if (urlMatch && urlMatch[1] && !urlMatch[1].endsWith('.txt') && !urlMatch[1].endsWith('.pdf')) {
    let targetUrl = urlMatch[1];
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }
    await openInChrome(targetUrl);
    return {
      type: 'browser_action',
      action: 'open_url',
      found: true,
      targetX: coords.addressBar.x,
      targetY: coords.addressBar.y,
      message: `Navigating to ${targetUrl} in Chrome.`,
      spokenText: `Navigating to ${targetUrl} in Chrome.`
    };
  }

  // 6. Generic "open [name] in chrome / google chrome" fallback
  const genericOpenMatch = query.match(/(?:open|go to|launch|navigate to)\s+([a-zA-Z0-9_\-\s]+)\s+(?:in|on)\s+(?:chrome|google chrome|browser)/i);
  if (genericOpenMatch && genericOpenMatch[1]) {
    const targetName = genericOpenMatch[1].trim();
    if (targetName && !targetName.includes('antigravity') && !targetName.includes('notepad')) {
      const siteUrl = `https://www.${targetName.replace(/\s+/g, '')}.com`;
      await openInChrome(siteUrl);
      return {
        type: 'browser_action',
        action: 'open_site',
        found: true,
        targetX: coords.addressBar.x,
        targetY: coords.addressBar.y,
        message: `Navigated to ${targetName} in Google Chrome (${siteUrl}).`,
        spokenText: `Opening ${targetName} in Google Chrome for you now.`
      };
    }
  }

  // 7. Guided Web Search & Exploration (e.g. "Search for latest AI news on Chrome")
  const searchMatch = query.match(/(?:search\s+(?:for\s+)?|look\s+up\s+|find\s+on\s+(?:chrome|google|web)\s+)(.+)/i);
  if (searchMatch && searchMatch[1]) {
    const rawTopic = searchMatch[1].replace(/(?:on|in)\s+(?:chrome|google|browser|the web)/gi, '').trim();
    if (rawTopic) {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(rawTopic)}`;
      await openInChrome(searchUrl);

      // Return guided multi-step exploration steps
      const steps = [
        {
          stepNumber: 1,
          totalSteps: 2,
          title: 'Step 1: Search Query',
          targetX: coords.addressBar.x,
          targetY: coords.addressBar.y,
          actionText: `Searching for "${rawTopic}". Address bar is focused.`,
          spokenText: `Step 1: Searching for ${rawTopic} in Chrome.`,
          beaconLabel: '1. Search Bar'
        },
        {
          stepNumber: 2,
          totalSteps: 2,
          title: 'Step 2: Web Results',
          targetX: coords.contentArea.x,
          targetY: coords.contentArea.y,
          actionText: `Here are the top search results for "${rawTopic}". Click any link to explore.`,
          spokenText: `Step 2: Here are your search results on the webpage.`,
          beaconLabel: '2. Search Results Canvas'
        }
      ];

      return {
        type: 'guided_workflow',
        workflow: 'web_search_in_chrome',
        steps,
        currentStepIndex: 0,
        message: `Searching for "${rawTopic}" on Chrome.`,
        spokenText: `Searching for ${rawTopic} on Chrome.`
      };
    }
  }

  return null;
}

module.exports = {
  isBrowserNavigation,
  handleBrowserCommand,
  openInChrome,
  sendBrowserKey
};
