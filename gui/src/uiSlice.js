import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: 'dark',
  sidebarOpen: true,
  activeTab: 'home',
  accountDialogOpen: false,
  settingsDialogOpen: false,
  modsDialogOpen: false,
  notifications: []
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
    setTheme(state, action) {
      state.theme = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setActiveTab(state, action) {
      state.activeTab = action.payload;
    },
    openAccountDialog(state) {
      state.accountDialogOpen = true;
    },
    closeAccountDialog(state) {
      state.accountDialogOpen = false;
    },
    openSettingsDialog(state) {
      state.settingsDialogOpen = true;
    },
    closeSettingsDialog(state) {
      state.settingsDialogOpen = false;
    },
    openModsDialog(state) {
      state.modsDialogOpen = true;
    },
    closeModsDialog(state) {
      state.modsDialogOpen = false;
    },
    addNotification(state, action) {
      state.notifications.push({
        id: Date.now(),
        ...action.payload
      });
    },
    removeNotification(state, action) {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications(state) {
      state.notifications = [];
    }
  }
});

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setActiveTab,
  openAccountDialog,
  closeAccountDialog,
  openSettingsDialog,
  closeSettingsDialog,
  openModsDialog,
  closeModsDialog,
  addNotification,
  removeNotification,
  clearNotifications
} = uiSlice.actions;

export default uiSlice.reducer;
