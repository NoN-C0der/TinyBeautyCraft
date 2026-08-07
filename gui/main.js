const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;
let mcProcess = null;

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Configuration paths
const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, 'config.json');
const logsPath = path.join(userDataPath, 'logs');

// Ensure logs directory exists
if (!fs.existsSync(logsPath)) {
  fs.mkdirSync(logsPath, { recursive: true });
}

// Default configuration
const defaultConfig = {
  accounts: [],
  selectedAccount: null,
  javaPath: '',
  javaArgs: '-Xmx2G -Xms1G',
  gameDir: path.join(userDataPath, 'minecraft'),
  selectedVersion: 'latest',
  theme: 'dark',
  mods: [],
  resourcePacks: [],
  launchHistory: []
};

// Load or create configuration
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }
  return defaultConfig;
}

function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to save config:', error);
    return false;
  }
}

let currentConfig = loadConfig();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: true,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: true
    },
    icon: path.join(__dirname, 'public', 'icon.ico'),
    titleBarStyle: 'default',
    show: false
  });

  // Load the React app - Vite integration
  if (isDev) {
    // In development mode, load from Vite dev server
    // Point to renderer/index.html specifically
    mainWindow.loadURL('http://localhost:5173/renderer/index.html');
    mainWindow.webContents.openDevTools();
  } else {
    // In production mode, load from built dist/renderer/index.html
    // Vite builds renderer/index.html to dist/renderer/index.html
    mainWindow.loadFile(path.join(__dirname, 'dist', 'renderer', 'index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// IPC Handlers
ipcMain.handle('get-config', () => {
  return currentConfig;
});

ipcMain.handle('save-config', (event, config) => {
  currentConfig = { ...currentConfig, ...config };
  return saveConfig(currentConfig);
});

ipcMain.handle('add-account', (event, account) => {
  if (!currentConfig.accounts.find(a => a.username === account.username)) {
    currentConfig.accounts.push(account);
    saveConfig(currentConfig);
    return true;
  }
  return false;
});

ipcMain.handle('remove-account', (event, username) => {
  currentConfig.accounts = currentConfig.accounts.filter(a => a.username !== username);
  if (currentConfig.selectedAccount === username) {
    currentConfig.selectedAccount = null;
  }
  saveConfig(currentConfig);
  return true;
});

ipcMain.handle('select-account', (event, username) => {
  currentConfig.selectedAccount = username;
  saveConfig(currentConfig);
  return true;
});

ipcMain.handle('select-java', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Java Executable', extensions: ['exe', ''] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    currentConfig.javaPath = result.filePaths[0];
    saveConfig(currentConfig);
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('select-game-dir', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (!result.canceled && result.filePaths.length > 0) {
    currentConfig.gameDir = result.filePaths[0];
    saveConfig(currentConfig);
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('launch-game', async (event, launchConfig) => {
  const { javaPath, javaArgs, gameDir, classpath, mainClass, assetsDir, version } = launchConfig;
  
  const logFile = path.join(logsPath, `minecraft-${Date.now()}.log`);
  const logStream = fs.createWriteStream(logFile);
  
  const args = [
    ...javaArgs.split(' '),
    '-cp',
    classpath,
    mainClass,
    '--assetsDir',
    assetsDir,
    '--assetIndex',
    version
  ];

  try {
    mcProcess = spawn(javaPath || 'java', args, {
      cwd: gameDir,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    mcProcess.stdout.on('data', (data) => {
      const log = data.toString();
      logStream.write(log);
      mainWindow.webContents.send('game-log', { type: 'info', message: log });
    });

    mcProcess.stderr.on('data', (data) => {
      const log = data.toString();
      logStream.write(log);
      mainWindow.webContents.send('game-log', { type: 'error', message: log });
    });

    mcProcess.on('close', (code) => {
      logStream.end();
      mainWindow.webContents.send('game-closed', { code });
      mcProcess = null;
      
      // Add to launch history
      currentConfig.launchHistory.push({
        version,
        timestamp: Date.now(),
        duration: Date.now()
      });
      saveConfig(currentConfig);
    });

    return { success: true, pid: mcProcess.pid };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-game', () => {
  if (mcProcess) {
    mcProcess.kill('SIGTERM');
    return true;
  }
  return false;
});

ipcMain.handle('get-versions', async () => {
  // Simulate version list - in real app, fetch from Mojang API
  return [
    { id: '1.20.4', type: 'release', releaseTime: '2023-12-07' },
    { id: '1.20.3', type: 'release', releaseTime: '2023-12-05' },
    { id: '1.20.2', type: 'release', releaseTime: '2023-09-21' },
    { id: '1.20.1', type: 'release', releaseTime: '2023-06-12' },
    { id: '1.20', type: 'release', releaseTime: '2023-06-07' },
    { id: '1.19.4', type: 'release', releaseTime: '2023-03-14' },
    { id: '1.19.3', type: 'release', releaseTime: '2022-12-07' },
    { id: '1.19.2', type: 'release', releaseTime: '2022-08-05' },
    { id: '1.18.2', type: 'release', releaseTime: '2022-02-28' },
    { id: '1.17.1', type: 'release', releaseTime: '2021-07-06' },
    { id: '1.16.5', type: 'release', releaseTime: '2021-01-15' },
    { id: '1.12.2', type: 'release', releaseTime: '2017-09-18' },
    { id: '24w09a', type: 'snapshot', releaseTime: '2024-03-01' },
    { id: '24w08a', type: 'snapshot', releaseTime: '2024-02-22' }
  ];
});

ipcMain.handle('download-version', async (event, versionId) => {
  // Simulate download progress
  for (let i = 0; i <= 100; i += 5) {
    await new Promise(resolve => setTimeout(resolve, 100));
    mainWindow.webContents.send('download-progress', { version: versionId, progress: i });
  }
  return { success: true };
});

ipcMain.handle('install-mod', async (event, modFile) => {
  const modsDir = path.join(currentConfig.gameDir, 'mods');
  if (!fs.existsSync(modsDir)) {
    fs.mkdirSync(modsDir, { recursive: true });
  }
  
  const destPath = path.join(modsDir, path.basename(modFile));
  fs.copyFileSync(modFile, destPath);
  
  currentConfig.mods.push({
    name: path.basename(modFile),
    path: destPath,
    installedAt: Date.now()
  });
  saveConfig(currentConfig);
  
  return { success: true, path: destPath };
});

ipcMain.handle('install-resource-pack', async (event, packFile) => {
  const resourcePacksDir = path.join(currentConfig.gameDir, 'resourcepacks');
  if (!fs.existsSync(resourcePacksDir)) {
    fs.mkdirSync(resourcePacksDir, { recursive: true });
  }
  
  const destPath = path.join(resourcePacksDir, path.basename(packFile));
  fs.copyFileSync(packFile, destPath);
  
  currentConfig.resourcePacks.push({
    name: path.basename(packFile),
    path: destPath,
    installedAt: Date.now()
  });
  saveConfig(currentConfig);
  
  return { success: true, path: destPath };
});

ipcMain.handle('open-folder', (event, folderPath) => {
  shell.openPath(folderPath);
  return true;
});

ipcMain.handle('get-stats', () => {
  const stats = {
    totalLaunches: currentConfig.launchHistory.length,
    totalPlayTime: 0,
    favoriteVersion: null,
    lastPlayed: null
  };
  
  if (currentConfig.launchHistory.length > 0) {
    const versionCounts = {};
    currentConfig.launchHistory.forEach(launch => {
      versionCounts[launch.version] = (versionCounts[launch.version] || 0) + 1;
    });
    
    stats.favoriteVersion = Object.entries(versionCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    
    stats.lastPlayed = currentConfig.launchHistory[
      currentConfig.launchHistory.length - 1
    ];
  }
  
  return stats;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (mcProcess) {
    mcProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
