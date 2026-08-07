import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  config: {
    accounts: [],
    selectedAccount: null,
    javaPath: '',
    javaArgs: '-Xmx2G -Xms1G',
    gameDir: '',
    mods: [],
    resourcePacks: []
  },
  selectedVersion: 'latest',
  versions: [],
  isDownloading: false,
  downloadProgress: 0,
  isGameRunning: false,
  logs: [],
  launchStatus: 'idle' // idle, launching, running, stopped, error
};

const launcherSlice = createSlice({
  name: 'launcher',
  initialState,
  reducers: {
    setConfig(state, action) {
      state.config = { ...state.config, ...action.payload };
    },
    addAccount(state, action) {
      if (!state.config.accounts.find(a => a.username === action.payload.username)) {
        state.config.accounts.push(action.payload);
      }
    },
    removeAccount(state, action) {
      state.config.accounts = state.config.accounts.filter(a => a.username !== action.payload);
      if (state.config.selectedAccount === action.payload) {
        state.config.selectedAccount = null;
      }
    },
    selectAccount(state, action) {
      state.config.selectedAccount = action.payload;
    },
    setVersions(state, action) {
      state.versions = action.payload;
    },
    setSelectedVersion(state, action) {
      state.selectedVersion = action.payload;
    },
    setDownloadProgress(state, action) {
      state.downloadProgress = action.payload.progress;
      state.isDownloading = action.payload.progress < 100;
    },
    addLog(state, action) {
      state.logs.push({
        timestamp: Date.now(),
        ...action.payload
      });
      // Keep only last 500 logs
      if (state.logs.length > 500) {
        state.logs = state.logs.slice(-500);
      }
    },
    clearLogs(state) {
      state.logs = [];
    },
    setLaunchStatus(state, action) {
      state.launchStatus = action.payload;
      if (action.payload === 'running') {
        state.isGameRunning = true;
      } else if (['stopped', 'error'].includes(action.payload)) {
        state.isGameRunning = false;
      }
    },
    updateJavaPath(state, action) {
      state.config.javaPath = action.payload;
    },
    updateJavaArgs(state, action) {
      state.config.javaArgs = action.payload;
    },
    updateGameDir(state, action) {
      state.config.gameDir = action.payload;
    },
    addMod(state, action) {
      state.config.mods.push(action.payload);
    },
    removeMod(state, action) {
      state.config.mods = state.config.mods.filter(m => m.name !== action.payload);
    },
    addResourcePack(state, action) {
      state.config.resourcePacks.push(action.payload);
    },
    removeResourcePack(state, action) {
      state.config.resourcePacks = state.config.resourcePacks.filter(r => r.name !== action.payload);
    }
  }
});

export const {
  setConfig,
  addAccount,
  removeAccount,
  selectAccount,
  setVersions,
  setSelectedVersion,
  setDownloadProgress,
  addLog,
  clearLogs,
  setLaunchStatus,
  updateJavaPath,
  updateJavaArgs,
  updateGameDir,
  addMod,
  removeMod,
  addResourcePack,
  removeResourcePack
} = launcherSlice.actions;

export default launcherSlice.reducer;
