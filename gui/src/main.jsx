import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import App from './App';
import { store, persistor } from './store';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Create theme with custom styling
const getTheme = (mode) => createTheme({
  palette: {
    mode,
    ...(mode === 'dark' ? {
      primary: {
        main: '#4CAF50',
        light: '#8BC34A',
        dark: '#388E3C',
      },
      secondary: {
        main: '#9C27B0',
        light: '#BA68C8',
        dark: '#7B1FA2',
      },
      background: {
        default: '#0a0a0f',
        paper: '#1a1a2e',
      },
    } : {
      primary: {
        main: '#4CAF50',
        light: '#8BC34A',
        dark: '#388E3C',
      },
      secondary: {
        main: '#9C27B0',
        light: '#BA68C8',
        dark: '#7B1FA2',
      },
      background: {
        default: '#f5f5f5',
        paper: '#ffffff',
      },
    }),
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
        },
        contained: {
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <DndProvider backend={HTML5Backend}>
          <ThemeProvider theme={getTheme('dark')}>
            <CssBaseline />
            <App />
          </ThemeProvider>
        </DndProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
