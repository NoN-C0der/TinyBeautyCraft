import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import launcherReducer from './launcherSlice';
import uiReducer from './uiSlice';
import statsReducer from './statsSlice';

const launcherPersistConfig = {
  key: 'launcher',
  storage,
  whitelist: ['config', 'selectedVersion', 'selectedAccount']
};

const uiPersistConfig = {
  key: 'ui',
  storage,
  whitelist: ['theme', 'sidebarOpen', 'activeTab']
};

const persistedLauncherReducer = persistReducer(launcherPersistConfig, launcherReducer);
const persistedUiReducer = persistReducer(uiPersistConfig, uiReducer);

export const store = configureStore({
  reducer: {
    launcher: persistedLauncherReducer,
    ui: persistedUiReducer,
    stats: statsReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export const persistor = persistStore(store);
