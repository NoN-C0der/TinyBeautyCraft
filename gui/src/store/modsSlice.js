import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // CurseForge API settings
  curseForgeApiKey: '',
  isApiKeyValid: null, // null = not checked, true = valid, false = invalid
  
  // Mods data
  installedMods: [], // List of installed mods with metadata
  modProfiles: [], // Saved mod profiles/builds
  
  // Catalog state
  catalogMods: [], // Mods from CurseForge catalog
  catalogLoading: false,
  catalogError: null,
  selectedMod: null, // Currently selected mod for detailed view
  selectedModFiles: [], // Files/versions for selected mod
  
  // Categories and versions
  categories: [],
  gameVersions: [],
  
  // Filters
  filters: {
    searchQuery: '',
    categoryId: 0,
    gameVersion: '',
    sortField: 2, // 2 = popularity
    sortOrder: 'desc'
  },
  
  // Installation state
  installingMods: [], // Mods currently being installed
  installationProgress: {}, // Progress for each mod installation
  
  // Dependencies
  pendingDependencies: [], // Dependencies waiting to be installed
  autoInstallDependencies: true
};

const modsSlice = createSlice({
  name: 'mods',
  initialState,
  reducers: {
    // API Key management
    setCurseForgeApiKey(state, action) {
      state.curseForgeApiKey = action.payload;
      state.isApiKeyValid = null; // Reset validation status
    },
    
    setApiKeyValidation(state, action) {
      state.isApiKeyValid = action.payload;
    },
    
    // Installed mods
    addInstalledMod(state, action) {
      const existingIndex = state.installedMods.findIndex(m => m.id === action.payload.id);
      if (existingIndex >= 0) {
        state.installedMods[existingIndex] = action.payload;
      } else {
        state.installedMods.push(action.payload);
      }
    },
    
    removeInstalledMod(state, action) {
      state.installedMods = state.installedMods.filter(m => m.id !== action.payload);
    },
    
    updateInstalledMods(state, action) {
      state.installedMods = action.payload;
    },
    
    // Mod profiles
    addProfile(state, action) {
      state.modProfiles.push(action.payload);
    },
    
    removeProfile(state, action) {
      state.modProfiles = state.modProfiles.filter(p => p.id !== action.payload);
    },
    
    updateProfile(state, action) {
      const index = state.modProfiles.findIndex(p => p.id === action.payload.id);
      if (index >= 0) {
        state.modProfiles[index] = action.payload;
      }
    },
    
    setActiveProfile(state, action) {
      state.activeProfileId = action.payload;
    },
    
    // Catalog state
    setCatalogMods(state, action) {
      state.catalogMods = action.payload;
    },
    
    appendCatalogMods(state, action) {
      state.catalogMods = [...state.catalogMods, ...action.payload];
    },
    
    setCatalogLoading(state, action) {
      state.catalogLoading = action.payload;
    },
    
    setCatalogError(state, action) {
      state.catalogError = action.payload;
    },
    
    clearCatalog(state) {
      state.catalogMods = [];
      state.catalogError = null;
    },
    
    // Selected mod
    setSelectedMod(state, action) {
      state.selectedMod = action.payload;
    },
    
    setSelectedModFiles(state, action) {
      state.selectedModFiles = action.payload;
    },
    
    clearSelectedMod(state) {
      state.selectedMod = null;
      state.selectedModFiles = [];
    },
    
    // Categories and versions
    setCategories(state, action) {
      state.categories = action.payload;
    },
    
    setGameVersions(state, action) {
      state.gameVersions = action.payload;
    },
    
    // Filters
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    resetFilters(state) {
      state.filters = initialState.filters;
    },
    
    // Installation state
    addInstallingMod(state, action) {
      state.installingMods.push(action.payload);
    },
    
    removeInstallingMod(state, action) {
      state.installingMods = state.installingMods.filter(m => m.id !== action.payload);
    },
    
    updateInstallationProgress(state, action) {
      const { modId, progress, status } = action.payload;
      state.installationProgress[modId] = { progress, status };
    },
    
    clearInstallationState(state) {
      state.installingMods = [];
      state.installationProgress = {};
    },
    
    // Dependencies
    setPendingDependencies(state, action) {
      state.pendingDependencies = action.payload;
    },
    
    clearPendingDependencies(state) {
      state.pendingDependencies = [];
    },
    
    setAutoInstallDependencies(state, action) {
      state.autoInstallDependencies = action.payload;
    },
    
    // Export/Import profiles
    exportProfile(state, action) {
      return JSON.stringify({
        profile: state.modProfiles.find(p => p.id === action.payload),
        version: '1.0',
        exportedAt: Date.now()
      });
    },
    
    importProfile(state, action) {
      try {
        const imported = JSON.parse(action.payload);
        if (imported.profile) {
          imported.profile.id = `profile_${Date.now()}`;
          imported.profile.imported = true;
          state.modProfiles.push(imported.profile);
        }
      } catch (e) {
        console.error('Failed to import profile:', e);
      }
    }
  }
});

export const {
  setCurseForgeApiKey,
  setApiKeyValidation,
  addInstalledMod,
  removeInstalledMod,
  updateInstalledMods,
  addProfile,
  removeProfile,
  updateProfile,
  setActiveProfile,
  setCatalogMods,
  appendCatalogMods,
  setCatalogLoading,
  setCatalogError,
  clearCatalog,
  setSelectedMod,
  setSelectedModFiles,
  clearSelectedMod,
  setCategories,
  setGameVersions,
  setFilters,
  resetFilters,
  addInstallingMod,
  removeInstallingMod,
  updateInstallationProgress,
  clearInstallationState,
  setPendingDependencies,
  clearPendingDependencies,
  setAutoInstallDependencies,
  exportProfile,
  importProfile
} = modsSlice.actions;

export default modsSlice.reducer;
