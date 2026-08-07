import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  totalLaunches: 0,
  totalPlayTime: 0,
  favoriteVersion: null,
  lastPlayed: null,
  versionStats: [],
  launchHistory: [],
  performanceMetrics: {
    avgLaunchTime: 0,
    avgFPS: 60,
    memoryUsage: []
  }
};

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    setStats(state, action) {
      return { ...state, ...action.payload };
    },
    addLaunch(state, action) {
      state.totalLaunches += 1;
      state.launchHistory.unshift({
        timestamp: Date.now(),
        version: action.payload.version,
        duration: 0
      });
      
      // Update version stats
      const existingVersion = state.versionStats.find(v => v.id === action.payload.version);
      if (existingVersion) {
        existingVersion.launches += 1;
      } else {
        state.versionStats.push({
          id: action.payload.version,
          launches: 1,
          lastPlayed: Date.now()
        });
      }
    },
    updatePlayTime(state, action) {
      state.totalPlayTime += action.payload;
      if (state.launchHistory.length > 0) {
        state.launchHistory[0].duration = action.payload;
      }
    },
    setPerformanceMetrics(state, action) {
      state.performanceMetrics = { ...state.performanceMetrics, ...action.payload };
    },
    addMemoryUsage(state, action) {
      state.performanceMetrics.memoryUsage.push({
        timestamp: Date.now(),
        value: action.payload
      });
      // Keep only last 100 data points
      if (state.performanceMetrics.memoryUsage.length > 100) {
        state.performanceMetrics.memoryUsage.shift();
      }
    }
  }
});

export const {
  setStats,
  addLaunch,
  updatePlayTime,
  setPerformanceMetrics,
  addMemoryUsage
} = statsSlice.actions;

export default statsSlice.reducer;
