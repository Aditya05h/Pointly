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
  youtube: 'https://youtube.com',
  github: 'https://github.com',
  google: 'https://google.com',
  gmail: 'https://mail.google.com',
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
  netflix: 'https://netflix.com'
};

/**
 * Open URL in Google Chrome (with default browser fallback).
 */
function openInChrome(url) {
  return new Promise((resolve) => {
    exec(`start chrome "${url}"`, (err) => {
      if (err) {
        // Fallback to system default browser
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
 */
function isBrowserNavigation(userQuery) {
  const q = (userQuery || '').toLowerCase();
  const hasBrowserWords = /chrome|browser|webpage|website|url|web|tab|page\b/i.test(q);
  const hasActions = /search|look up|open|navigate|go to|scroll|refresh|reload|address bar|omnibox|new tab|close tab/i.test(q);

  if (hasBrowserWords && hasActions) return true;
  if (/^open\s+(youtube|github|google|gmail|wikipedia|reddit|linkedin|twitter|x|devpost|netflix|amazon)\b/i.test(q)) return true;
  if (/^search\s+(for\s+)?/i.test(q)) return true;
  if (/scroll\s+(down|up|page)/i.test(q)) return true;
  if (/where is (the )?(address bar|search bar|new tab|back button)/i.test(q)) return true;

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

  // 4. Quick Direct Website Launching (YouTube, GitHub, Wikipedia, etc.)
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
        message: `Navigated to ${siteKey} in Chrome (${siteUrl}).`,
        spokenText: `Opening ${siteKey} in Chrome for you now.`
      };
    }
  }

  // 5. Open Direct URL (e.g. "navigate to https://example.com" or "open example.com in chrome")
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

  // 6. Guided Web Search & Exploration (e.g. "Search for latest AI news on Chrome")
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
