const { exec } = require('child_process');
const { screen } = require('electron');

function runPowerShell(script) {
  const encoded = Buffer.from(script, 'utf16le').toString('base64');
  return new Promise((resolve) => {
    exec(`powershell -NoProfile -EncodedCommand ${encoded}`, (err, stdout, stderr) => {
      if (err) resolve({ success: false, error: stderr || err.message });
      else resolve({ success: true, output: (stdout || '').trim() });
    });
  });
}

function getScreenSize() {
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
 * Common application name to executable mapping on Windows.
 */
const APP_COMMANDS = {
  notepad: 'start notepad',
  calc: 'start calc',
  calculator: 'start calc',
  chrome: 'start chrome',
  edge: 'start msedge',
  browser: 'start msedge',
  explorer: 'start explorer',
  'file explorer': 'start explorer',
  files: 'start explorer',
  settings: 'start ms-settings:',
  terminal: 'start wt || start powershell',
  powershell: 'start powershell',
  cmd: 'start cmd',
  code: 'start code',
  vscode: 'start code',
  paint: 'start mspaint',
  spotify: 'start spotify',
  taskmgr: 'start taskmgr',
  'task manager': 'start taskmgr'
};

/**
 * Minimize an application by title/process or active window.
 */
async function minimizeApp(appName = '') {
  const clean = (appName || '').trim();
  const filter = clean
    ? `$_.MainWindowTitle -like '*${clean}*' -or $_.ProcessName -like '*${clean}*'`
    : `$_.MainWindowHandle -ne 0`;

  const script = `
Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);' -Name Win32 -Namespace Win32;
$targets = Get-Process | Where-Object { ${filter} };
$found = $false;
foreach ($t in $targets) {
  if ($t.MainWindowHandle -ne 0) {
    [Win32.Win32]::ShowWindow($t.MainWindowHandle, 6);
    $found = $true;
  }
}
if ($found) { Write-Host "OK"; } else { Write-Host "NOT_FOUND"; }
`;
  return await runPowerShell(script);
}

/**
 * Maximize an application by title/process or active window.
 */
async function maximizeApp(appName = '') {
  const clean = (appName || '').trim();
  const filter = clean
    ? `$_.MainWindowTitle -like '*${clean}*' -or $_.ProcessName -like '*${clean}*'`
    : `$_.MainWindowHandle -ne 0`;

  const script = `
Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);' -Name Win32 -Namespace Win32;
$targets = Get-Process | Where-Object { ${filter} };
$found = $false;
foreach ($t in $targets) {
  if ($t.MainWindowHandle -ne 0) {
    [Win32.Win32]::ShowWindow($t.MainWindowHandle, 3);
    $found = $true;
  }
}
if ($found) { Write-Host "OK"; } else { Write-Host "NOT_FOUND"; }
`;
  return await runPowerShell(script);
}

/**
 * Minimize all windows to show desktop.
 */
async function showDesktop() {
  const script = `
$shell = New-Object -ComObject Shell.Application;
$shell.MinimizeAll();
Write-Host "OK";
`;
  return await runPowerShell(script);
}

/**
 * Launch an application.
 */
async function launchApp(appName) {
  const clean = (appName || '').toLowerCase().trim();
  const command = APP_COMMANDS[clean] || `start "" "${clean}"`;

  return new Promise((resolve) => {
    exec(command, (err) => {
      if (err) resolve({ success: false, error: err.message });
      else resolve({ success: true, app: clean });
    });
  });
}

/**
 * Handle OS level window control command (minimize, maximize, close, open, locate buttons).
 */
async function handleOsCommand(userQuery) {
  const query = (userQuery || '').toLowerCase().trim();
  const { width: screenWidth, height: screenHeight } = getScreenSize();

  // 1. Locate Minimize Button / Minimize Window
  if (query.includes('minimize') || query.includes('minimise') || query.includes('hide window')) {
    const targetX = screenWidth - 140;
    const targetY = 18;

    const appMatch = query.replace(/(where to|how to|please|can you|help me|point to|locate|minimize|minimise|the|window|button|app|application)/gi, '').trim();

    if (appMatch) {
      await minimizeApp(appMatch);
      return {
        type: 'os_action',
        action: 'minimize',
        found: true,
        targetX,
        targetY,
        message: `Located minimize button for ${appMatch} at top-right. Window minimized.`,
        spokenText: `Here is the minimize button in the top-right corner. I've minimized ${appMatch} for you.`
      };
    } else {
      await minimizeApp();
      return {
        type: 'os_action',
        action: 'minimize',
        found: true,
        targetX,
        targetY,
        message: `The minimize button is located in the top-right corner of the window titlebar.`,
        spokenText: `The minimize button is located in the top-right corner of the title bar.`
      };
    }
  }

  // 2. Locate Maximize Button / Maximize Window
  if (query.includes('maximize') || query.includes('maximise') || query.includes('expand window') || query.includes('fullscreen')) {
    const targetX = screenWidth - 95;
    const targetY = 18;

    const appMatch = query.replace(/(where to|how to|please|can you|help me|point to|locate|maximize|maximise|the|window|button|app|application)/gi, '').trim();
    if (appMatch) {
      await maximizeApp(appMatch);
      return {
        type: 'os_action',
        action: 'maximize',
        found: true,
        targetX,
        targetY,
        message: `Located maximize button for ${appMatch} at top-right. Window maximized.`,
        spokenText: `Here is the maximize button in the top-right corner. I've maximized ${appMatch} for you.`
      };
    } else {
      await maximizeApp();
      return {
        type: 'os_action',
        action: 'maximize',
        found: true,
        targetX,
        targetY,
        message: `The maximize button is located in the top-right corner of the window.`,
        spokenText: `The maximize button is located in the top-right corner of the window.`
      };
    }
  }

  // 3. Close Button
  if (query.includes('close window') || query.includes('where is close') || query.includes('exit window')) {
    const targetX = screenWidth - 45;
    const targetY = 18;
    return {
      type: 'os_action',
      action: 'close',
      found: true,
      targetX,
      targetY,
      message: `The close button (X) is located at the top-right corner of the window.`,
      spokenText: `The close button is located at the very top-right corner of the window.`
    };
  }

  // 4. Show Desktop
  if (query.includes('show desktop') || query.includes('go to desktop') || query.includes('minimize all')) {
    await showDesktop();
    return {
      type: 'os_action',
      action: 'show_desktop',
      found: true,
      targetX: screenWidth / 2,
      targetY: screenHeight / 2,
      message: `Minimized all windows to show your Desktop.`,
      spokenText: `I have minimized your open windows to show your Desktop.`
    };
  }

  // 5. Open / Launch Application
  const openMatch = query.match(/(?:open|launch|start|run)\s+([a-zA-Z0-9_\-\s]+)/i);
  if (openMatch && openMatch[1]) {
    const appToOpen = openMatch[1].replace(/application|app|window|please/gi, '').trim();
    if (appToOpen && !appToOpen.includes('desktop') && !appToOpen.includes('.txt') && !appToOpen.includes('.pdf')) {
      const res = await launchApp(appToOpen);
      if (res.success) {
        return {
          type: 'os_action',
          action: 'open_app',
          found: true,
          targetX: screenWidth / 2,
          targetY: screenHeight / 2,
          message: `Opened ${appToOpen}.`,
          spokenText: `Opening ${appToOpen} for you now.`
        };
      }
    }
  }

  return null;
}

module.exports = {
  minimizeApp,
  maximizeApp,
  showDesktop,
  launchApp,
  handleOsCommand
};
