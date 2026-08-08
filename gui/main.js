const { app, BrowserWindow, ipcMain, dialog, shell, net } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { spawn } = require('child_process');

let mainWindow;
let mcProcess = null;

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Configuration paths
const userDataPath = app.getPath('userData');
const configPath = path.join(userDataPath, 'config.json');
const logsPath = path.join(userDataPath, 'logs');
const modsDataPath = path.join(userDataPath, 'mods-data.json');

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
  launchHistory: [],
  curseForgeApiKey: ''
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

// Load mods data (installed mods with metadata)
function loadModsData() {
  try {
    if (fs.existsSync(modsDataPath)) {
      return JSON.parse(fs.readFileSync(modsDataPath, 'utf-8'));
    }
  } catch (error) {
    console.error('Failed to load mods data:', error);
  }
  return { installedMods: [], profiles: [] };
}

function saveModsData(data) {
  try {
    fs.writeFileSync(modsDataPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to save mods data:', error);
    return false;
  }
}

let currentConfig = loadConfig();
let modsData = loadModsData();

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

ipcMain.handle('install-mod', async (event, installData) => {
  // Unified handler for both local file installation and CurseForge download
  // Check if this is a local file installation (string path) or CurseForge download (object with modId)
  if (typeof installData === 'string' && (installData.endsWith('.jar') || installData.endsWith('.zip'))) {
    // Local file installation
    const modFile = installData;
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
  }
  
  // CurseForge download installation
  const { modId, modName, downloadUrl, fileName, gameId, mcVersion } = installData;
  
  try {
    const modsDir = path.join(currentConfig.gameDir, 'mods');
    if (!fs.existsSync(modsDir)) {
      fs.mkdirSync(modsDir, { recursive: true });
    }
    
    const destPath = path.join(modsDir, fileName);
    
    // Download the file
    await downloadFile(downloadUrl, destPath, (progress) => {
      mainWindow.webContents.send('mod-install-progress', { modId, progress });
    });
    
    // Add to installed mods
    const modEntry = {
      id: modId,
      name: modName,
      fileName,
      path: destPath,
      installedAt: Date.now(),
      version: mcVersion
    };
    
    const existingIndex = modsData.installedMods.findIndex(m => m.id === modId);
    if (existingIndex >= 0) {
      modsData.installedMods[existingIndex] = modEntry;
    } else {
      modsData.installedMods.push(modEntry);
    }
    saveModsData(modsData);
    
    return { success: true, path: destPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Resource pack installation handler
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

// Open folder handler
ipcMain.handle('open-folder', async (event, folderPath) => {
  try {
    await shell.openPath(folderPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get statistics handler
ipcMain.handle('get-stats', () => {
  const stats = {
    totalLaunches: currentConfig.launchHistory.length,
    totalMods: modsData.installedMods?.length || 0,
    totalProfiles: modsData.profiles?.length || 0,
    totalAccounts: currentConfig.accounts?.length || 0
  };
  
  // Calculate version statistics
  if (currentConfig.launchHistory.length > 0) {
    const versionCounts = {};
    currentConfig.launchHistory.forEach(launch => {
      const version = launch.version || 'unknown';
      versionCounts[version] = (versionCounts[version] || 0) + 1;
    });
    
    stats.favoriteVersion = Object.entries(versionCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    
    stats.lastPlayed = currentConfig.launchHistory[
      currentConfig.launchHistory.length - 1
    ];
  }
  
  return stats;
});

// CurseForge API handlers
ipcMain.handle('curseforge-request', async (event, url, options) => {
  try {
    const request = net.request({
      url,
      method: options.method || 'GET',
      headers: options.headers
    });

    return new Promise((resolve, reject) => {
      let responseData = '';

      request.on('response', (response) => {
        response.on('data', (chunk) => {
          responseData += chunk.toString();
        });

        response.on('end', () => {
          try {
            const data = JSON.parse(responseData);
            if (response.statusCode >= 200 && response.statusCode < 300) {
              resolve({ success: true, data });
            } else {
              resolve({ 
                success: false, 
                error: data.message || `HTTP ${response.statusCode}` 
              });
            }
          } catch (e) {
            resolve({ success: false, error: 'Failed to parse response' });
          }
        });
      });

      request.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      if (options.body) {
        request.write(options.body);
      }

      request.end();
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Mod management handlers
ipcMain.handle('get-installed-mods', () => {
  return modsData.installedMods || [];
});

ipcMain.handle('add-installed-mod', (event, mod) => {
  const existingIndex = modsData.installedMods.findIndex(m => m.id === mod.id);
  if (existingIndex >= 0) {
    modsData.installedMods[existingIndex] = mod;
  } else {
    modsData.installedMods.push(mod);
  }
  saveModsData(modsData);
  return true;
});

ipcMain.handle('remove-installed-mod', async (event, modId) => {
  const mod = modsData.installedMods.find(m => m.id === modId);
  if (mod) {
    // Remove from file system
    const modsDir = path.join(currentConfig.gameDir, 'mods');
    const modFile = path.join(modsDir, mod.fileName);
    if (fs.existsSync(modFile)) {
      fs.unlinkSync(modFile);
    }
    
    // Remove from data
    modsData.installedMods = modsData.installedMods.filter(m => m.id !== modId);
    saveModsData(modsData);
  }
  return true;
});


// Helper function to download files with progress
function downloadFile(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    let downloadedBytes = 0;
    let totalBytes = 0;
    
    const request = https.get(url, (response) => {
      totalBytes = parseInt(response.headers['content-length'], 10);
      
      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        if (totalBytes > 0 && onProgress) {
          onProgress(Math.round((downloadedBytes / totalBytes) * 100));
        }
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });
    
    request.on('error', (err) => {
      fs.unlink(destPath, () => {}); // Delete partially downloaded file
      reject(err);
    });
    
    file.on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// Profile management handlers
ipcMain.handle('get-mod-profiles', () => {
  return modsData.profiles || [];
});

ipcMain.handle('save-mod-profile', (event, profile) => {
  const newProfile = {
    ...profile,
    id: profile.id || `profile_${Date.now()}`,
    createdAt: Date.now()
  };
  
  modsData.profiles.push(newProfile);
  saveModsData(modsData);
  return newProfile;
});

ipcMain.handle('delete-mod-profile', (event, profileId) => {
  modsData.profiles = modsData.profiles.filter(p => p.id !== profileId);
  saveModsData(modsData);
  return true;
});

ipcMain.handle('export-profile', (event, profileId) => {
  const profile = modsData.profiles.find(p => p.id === profileId);
  if (!profile) {
    return { success: false, error: 'Profile not found' };
  }
  
  const exportData = {
    profile,
    version: '1.0',
    exportedAt: Date.now()
  };
  
  return { success: true, data: JSON.stringify(exportData, null, 2) };
});

ipcMain.handle('import-profile', (event, jsonData) => {
  try {
    const imported = JSON.parse(jsonData);
    if (imported.profile) {
      imported.profile.id = `profile_${Date.now()}`;
      imported.profile.imported = true;
      modsData.profiles.push(imported.profile);
      saveModsData(modsData);
      return { success: true, profile: imported.profile };
    }
    return { success: false, error: 'Invalid profile format' };
  } catch (error) {
      return { success: false, error: error.message };
    }
  }
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
