import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Divider,
  Stack,
  Tooltip,
  Fab
} from '@mui/material';
import {
  Home as HomeIcon,
  Extension as ExtensionIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  Menu as MenuIcon,
  Assessment as AssessmentIcon,
  BugReport as BugReportIcon,
  Info as InfoIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme, toggleSidebar, setActiveTab, addNotification } from './uiSlice';
import Home from './Home';
import AccountsDialog from './AccountsDialog';
import SettingsDialog from './SettingsDialog';
import ModsDialog from './ModsDialog';

// Stats Component with Charts
function StatsPanel() {
  const stats = useSelector(state => state.stats);
  const ui = useSelector(state => state.ui);
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Statistics & Analytics</Typography>
      <Stack spacing={3}>
        {/* Total Launches Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Box
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 3,
              color: 'white',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)'
            }}
          >
            <Typography variant="h3">{stats.totalLaunches}</Typography>
            <Typography variant="h6">Total Launches</Typography>
          </Box>
        </motion.div>

        {/* Version Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Box
            sx={{
              p: 3,
              background: ui.theme === 'dark'
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(0,0,0,0.05)',
              borderRadius: 3,
              backdropFilter: 'blur(10px)'
            }}
          >
            <Typography variant="h6" gutterBottom>Favorite Version</Typography>
            <Typography variant="h4" color="primary">
              {stats.favoriteVersion || 'N/A'}
            </Typography>
          </Box>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Box
            sx={{
              p: 3,
              background: ui.theme === 'dark'
                ? 'rgba(255,255,255,0.05)'
                : 'rgba(0,0,0,0.05)',
              borderRadius: 3,
              backdropFilter: 'blur(10px)'
            }}
          >
            <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
            <Stack direction="row" spacing={3}>
              <Box>
                <Typography variant="body2" color="text.secondary">Avg FPS</Typography>
                <Typography variant="h5">{stats.performanceMetrics.avgFPS}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Memory Usage</Typography>
                <Typography variant="h5">
                  {stats.performanceMetrics.memoryUsage.length > 0
                    ? `${Math.round(stats.performanceMetrics.memoryUsage[stats.performanceMetrics.memoryUsage.length - 1].value)} MB`
                    : 'N/A'}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </motion.div>
      </Stack>
    </Box>
  );
}

// Notifications Panel
function NotificationsPanel() {
  const ui = useSelector(state => state.ui);
  const dispatch = useDispatch();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Notifications</Typography>
      {ui.notifications.length === 0 ? (
        <Typography color="text.secondary" align="center">No notifications</Typography>
      ) : (
        <List>
          {ui.notifications.map((notification) => (
            <ListItem key={notification.id}>
              <ListItemText
                primary={notification.title}
                secondary={notification.message}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}

export default function App() {
  const dispatch = useDispatch();
  const ui = useSelector(state => state.ui);
  const launcher = useSelector(state => state.launcher);
  
  const [mobileOpen, setMobileOpen] = useState(false);

  // Listen for game logs
  useEffect(() => {
    const handleGameLog = (data) => {
      console.log('Game Log:', data);
    };

    const handleGameClosed = (data) => {
      console.log('Game Closed:', data);
    };

    window.electronAPI.onGameLog(handleGameLog);
    window.electronAPI.onGameClosed(handleGameClosed);

    return () => {
      window.electronAPI.removeGameLogListener();
      window.electronAPI.removeGameClosedListener();
    };
  }, []);

  // Load initial config
  useEffect(() => {
    const loadConfig = async () => {
      const config = await window.electronAPI.getConfig();
      dispatch(setConfig(config));
      
      const versions = await window.electronAPI.getVersions();
      dispatch(setVersions(versions));
      
      const stats = await window.electronAPI.getStats();
      // dispatch(setStats(stats));
    };
    
    loadConfig();
  }, [dispatch]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, tab: 'home' },
    { text: 'Mods', icon: <ExtensionIcon />, tab: 'mods' },
    { text: 'Statistics', icon: <AssessmentIcon />, tab: 'stats' },
    { text: 'Accounts', icon: <AccountIcon />, tab: 'accounts' },
    { text: 'Settings', icon: <SettingsIcon />, tab: 'settings' }
  ];

  const drawer = (
    <Box>
      <Toolbar />
      <Box
        sx={{
          background: ui.theme === 'dark'
            ? 'linear-gradient(180deg, rgba(30, 30, 50, 0.95), rgba(50, 50, 80, 0.95))'
            : 'linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(240, 240, 255, 0.95))',
          minHeight: '100vh'
        }}
      >
        <List>
          {menuItems.map((item) => (
            <motion.div
              key={item.text}
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <ListItem
                button
                selected={ui.activeTab === item.tab}
                onClick={() => {
                  dispatch(setActiveTab(item.tab));
                  setMobileOpen(false);
                }}
                sx={{
                  mx: 1,
                  my: 0.5,
                  borderRadius: 2,
                  background: ui.activeTab === item.tab
                    ? ui.theme === 'dark'
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(0,0,0,0.1)'
                    : 'transparent',
                  '&:hover': {
                    background: ui.theme === 'dark'
                      ? 'rgba(255,255,255,0.15)'
                      : 'rgba(0,0,0,0.08)',
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    color: ui.activeTab === item.tab ? '#4CAF50' : 'inherit',
                    minWidth: 40
                  }}
                >
                  <Badge badgeContent={item.tab === 'notifications' ? ui.notifications.length : 0} color="error">
                    {item.icon}
                  </Badge>
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontWeight: ui.activeTab === item.tab ? 'bold' : 'normal'
                    }
                  }}
                />
              </ListItem>
            </motion.div>
          ))}
        </List>
        
        <Divider sx={{ my: 2 }} />
        
        <List>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <ListItem
              button
              onClick={() => dispatch(toggleTheme())}
              sx={{ mx: 1, borderRadius: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {ui.theme === 'dark' ? <LightIcon /> : <DarkIcon />}
              </ListItemIcon>
              <ListItemText primary={ui.theme === 'dark' ? 'Light Mode' : 'Dark Mode'} />
            </ListItem>
          </motion.div>
        </List>
      </Box>
    </Box>
  );

  const renderContent = () => {
    switch (ui.activeTab) {
      case 'home':
        return <Home />;
      case 'stats':
        return <StatsPanel />;
      case 'notifications':
        return <NotificationsPanel />;
      default:
        return <Home />;
    }
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: ui.theme === 'dark' ? '#0a0a0f' : '#f5f5f5' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${240}px)` },
          ml: { sm: '240px' },
          background: ui.theme === 'dark'
            ? 'linear-gradient(90deg, rgba(30, 30, 50, 0.95), rgba(50, 50, 80, 0.95))'
            : 'linear-gradient(90deg, rgba(255, 255, 255, 0.95), rgba(240, 240, 255, 0.95))',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Tiny MC Launcher
          </Typography>
          
          <Stack direction="row" spacing={1}>
            <Tooltip title="Toggle Theme">
              <IconButton onClick={() => dispatch(toggleTheme())} color="inherit">
                {ui.theme === 'dark' ? <LightIcon /> : <DarkIcon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Notifications">
              <IconButton color="inherit">
                <Badge badgeContent={ui.notifications.length} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="About">
              <IconButton color="inherit">
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: 240 }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 }
          }}
        >
          {drawer}
        </Drawer>
        
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          width: { sm: `calc(100% - ${240}px)` },
          mt: 8
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={ui.activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Dialogs */}
      <AccountsDialog />
      <SettingsDialog />
      <ModsDialog />

      {/* Floating Action Button for Quick Launch */}
      {!launcher.isGameRunning && (
        <Fab
          color="success"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            background: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
            boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
            '&:hover': {
              background: 'linear-gradient(45deg, #8BC34A, #4CAF50)',
              boxShadow: '0 8px 25px rgba(76, 175, 80, 0.6)',
            }
          }}
        >
          <PlayArrowIcon />
        </Fab>
      )}
    </Box>
  );
}

// Import missing icons and actions
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { setConfig, setVersions } from './launcherSlice';
