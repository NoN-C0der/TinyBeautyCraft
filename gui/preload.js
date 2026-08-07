const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Config
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  
  // Accounts
  addAccount: (account) => ipcRenderer.invoke('add-account', account),
  removeAccount: (username) => ipcRenderer.invoke('remove-account', username),
  selectAccount: (username) => ipcRenderer.invoke('select-account', username),
  
  // File dialogs
  selectJava: () => ipcRenderer.invoke('select-java'),
  selectGameDir: () => ipcRenderer.invoke('select-game-dir'),
  
  // Game control
  launchGame: (launchConfig) => ipcRenderer.invoke('launch-game', launchConfig),
  stopGame: () => ipcRenderer.invoke('stop-game'),
  
  // Versions
  getVersions: () => ipcRenderer.invoke('get-versions'),
  downloadVersion: (versionId) => ipcRenderer.invoke('download-version', versionId),
  
  // Mods and resource packs (legacy file-based)
  installModFile: (modFile) => ipcRenderer.invoke('install-mod', modFile),
  installResourcePack: (packFile) => ipcRenderer.invoke('install-resource-pack', packFile),
  
  // CurseForge API
  curseForgeRequest: (url, options) => ipcRenderer.invoke('curseforge-request', url, options),
  
  // Mod management (with metadata)
  getInstalledMods: () => ipcRenderer.invoke('get-installed-mods'),
  addInstalledMod: (mod) => ipcRenderer.invoke('add-installed-mod', mod),
  removeInstalledMod: (modId) => ipcRenderer.invoke('remove-installed-mod', modId),
  installMod: (installData) => ipcRenderer.invoke('install-mod', installData),
  
  // Profile management
  getModProfiles: () => ipcRenderer.invoke('get-mod-profiles'),
  saveModProfile: (profile) => ipcRenderer.invoke('save-mod-profile', profile),
  deleteModProfile: (profileId) => ipcRenderer.invoke('delete-mod-profile', profileId),
  exportProfile: (profileId) => ipcRenderer.invoke('export-profile', profileId),
  importProfile: (jsonData) => ipcRenderer.invoke('import-profile', jsonData),
  
  // System
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
  getStats: () => ipcRenderer.invoke('get-stats'),
  
  // Event listeners
  onGameLog: (callback) => {
    ipcRenderer.on('game-log', (event, data) => callback(data));
  },
  onGameClosed: (callback) => {
    ipcRenderer.on('game-closed', (event, data) => callback(data));
  },
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, data) => callback(data));
  },
  onModInstallProgress: (callback) => {
    ipcRenderer.on('mod-install-progress', (event, data) => callback(data));
  },
  
  removeGameLogListener: () => {
    ipcRenderer.removeAllListeners('game-log');
  },
  removeGameClosedListener: () => {
    ipcRenderer.removeAllListeners('game-closed');
  },
  removeDownloadProgressListener: () => {
    ipcRenderer.removeAllListeners('download-progress');
  },
  removeModInstallProgressListener: () => {
    ipcRenderer.removeAllListeners('mod-install-progress');
  }
});
