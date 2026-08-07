import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
  Avatar,
  Stack,
  Grid,
  Paper,
  alpha
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Memory as MemoryIcon,
  AccountCircle as AccountIcon,
  Settings as SettingsIcon,
  Extension as ExtensionIcon,
  Palette as PaletteIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  setLaunchStatus,
  addLog,
  setDownloadProgress,
  setSelectedVersion
} from './launcherSlice';
import { openSettingsDialog, openAccountDialog, openModsDialog } from './uiSlice';

const glowingVariants = {
  idle: {
    boxShadow: '0 0 20px rgba(76, 175, 80, 0.3)',
  },
  pulse: {
    boxShadow: [
      '0 0 20px rgba(76, 175, 80, 0.3)',
      '0 0 40px rgba(76, 175, 80, 0.6)',
      '0 0 60px rgba(76, 175, 80, 0.8)',
      '0 0 40px rgba(76, 175, 80, 0.6)',
      '0 0 20px rgba(76, 175, 80, 0.3)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

const particleVariants = {
  float: {
    y: [-10, 10, -10],
    opacity: [0.3, 0.6, 0.3],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

export default function Home() {
  const dispatch = useDispatch();
  const launcher = useSelector(state => state.launcher);
  const ui = useSelector(state => state.ui);
  const stats = useSelector(state => state.stats);
  
  const [launchAnimation, setLaunchAnimation] = useState('idle');
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate floating particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 2
    }));
    setParticles(newParticles);
  }, []);

  const handleLaunch = async () => {
    if (launcher.isGameRunning) {
      await window.electronAPI.stopGame();
      return;
    }

    setLaunchAnimation('pulse');
    dispatch(setLaunchStatus('launching'));
    dispatch(addLog({ type: 'info', message: 'Starting Minecraft...' }));

    try {
      const result = await window.electronAPI.launchGame({
        javaPath: launcher.config.javaPath || 'java',
        javaArgs: launcher.config.javaArgs,
        gameDir: launcher.config.gameDir,
        classpath: '%classpath%',
        mainClass: 'net.minecraft.client.main.Main',
        assetsDir: 'assets',
        version: launcher.selectedVersion
      });

      if (result.success) {
        dispatch(setLaunchStatus('running'));
        dispatch(addLog({ type: 'success', message: 'Game launched successfully!' }));
      } else {
        dispatch(setLaunchStatus('error'));
        dispatch(addLog({ type: 'error', message: `Failed to launch: ${result.error}` }));
        setLaunchAnimation('idle');
      }
    } catch (error) {
      dispatch(setLaunchStatus('error'));
      dispatch(addLog({ type: 'error', message: error.message }));
      setLaunchAnimation('idle');
    }
  };

  const handleStop = async () => {
    await window.electronAPI.stopGame();
    dispatch(setLaunchStatus('stopped'));
    dispatch(addLog({ type: 'warning', message: 'Game stopped by user' }));
    setLaunchAnimation('idle');
  };

  const isLaunching = launcher.launchStatus === 'launching';
  const isRunning = launcher.launchStatus === 'running';

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      {/* Animated Background Particles */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            style={{
              position: 'absolute',
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
            }}
            variants={particleVariants}
            animate="float"
            transition={{ delay: particle.delay }}
          />
        ))}
      </Box>

      {/* Hero Section with Launch Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          sx={{
            mb: 3,
            background: ui.theme === 'dark'
              ? 'linear-gradient(135deg, rgba(30, 30, 50, 0.9), rgba(50, 50, 80, 0.9))'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 240, 255, 0.9))',
            backdropFilter: 'blur(20px)',
            border: ui.theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            position: 'relative',
            overflow: 'visible'
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <motion.div
              variants={glowingVariants}
              animate={isLaunching ? 'pulse' : 'idle'}
            >
              <Typography variant="h3" gutterBottom fontWeight="bold">
                Tiny MC Launcher
              </Typography>
              <Typography variant="subtitle1" color="text.secondary" paragraph>
                Cross-platform Minecraft Launcher with Advanced Features
              </Typography>
            </motion.div>

            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="contained"
                  size="large"
                  startIcon={isRunning ? <StopIcon /> : <PlayIcon />}
                  onClick={isRunning ? handleStop : handleLaunch}
                  disabled={isLaunching || launcher.isDownloading}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    background: isRunning
                      ? 'linear-gradient(45deg, #f44336, #d32f2f)'
                      : 'linear-gradient(45deg, #4CAF50, #8BC34A)',
                    boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                    '&:hover': {
                      boxShadow: '0 6px 10px 4px rgba(76, 175, 80, .5)',
                    }
                  }}
                >
                  {isRunning ? 'Stop Game' : isLaunching ? 'Launching...' : 'Launch'}
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <IconButton
                  onClick={() => dispatch(openSettingsDialog())}
                  sx={{
                    background: 'linear-gradient(45deg, #2196F3, #1976D2)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1976D2, #1565C0)',
                    }
                  }}
                >
                  <SettingsIcon />
                </IconButton>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <IconButton
                  onClick={() => dispatch(openAccountDialog())}
                  sx={{
                    background: 'linear-gradient(45deg, #FF9800, #F57C00)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #F57C00, #E65100)',
                    }
                  }}
                >
                  <AccountIcon />
                </IconButton>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <IconButton
                  onClick={() => dispatch(openModsDialog())}
                  sx={{
                    background: 'linear-gradient(45deg, #9C27B0, #7B1FA2)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #7B1FA2, #6A1B9A)',
                    }
                  }}
                >
                  <ExtensionIcon />
                </IconButton>
              </motion.div>
            </Stack>

            {/* Progress Bar */}
            <AnimatePresence>
              {(launcher.isDownloading || isLaunching) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Box sx={{ mt: 3, maxWidth: 600, mx: 'auto' }}>
                    <LinearProgress
                      variant="determinate"
                      value={launcher.isDownloading ? launcher.downloadProgress : (isLaunching ? 75 : 0)}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        background: ui.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(90deg, #4CAF50, #8BC34A, #CDDC39)',
                          borderRadius: 5
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {launcher.isDownloading
                        ? `Downloading: ${launcher.downloadProgress}%`
                        : isLaunching
                        ? 'Launching game...'
                        : ''}
                    </Typography>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                  <Box>
                    <Typography variant="h4">{stats.totalLaunches}</Typography>
                    <Typography variant="body2" opacity={0.8}>Total Launches</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <SpeedIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                  <Box>
                    <Typography variant="h4">{launcher.selectedVersion}</Typography>
                    <Typography variant="body2" opacity={0.8}>Selected Version</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <MemoryIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                  <Box>
                    <Typography variant="h4">{launcher.config.mods.length}</Typography>
                    <Typography variant="body2" opacity={0.8}>Mods Installed</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <PsychologyIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                  <Box>
                    <Typography variant="h4">{launcher.config.accounts.length}</Typography>
                    <Typography variant="body2" opacity={0.8}>Accounts</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Quick Info Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Paper
              sx={{
                p: 3,
                background: ui.theme === 'dark'
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(0,0,0,0.05)',
                backdropFilter: 'blur(10px)',
                height: '100%'
              }}
            >
              <Typography variant="h6" gutterBottom>
                <PaletteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                System Status
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Java Path</Typography>
                  <Typography variant="body1" fontFamily="monospace">
                    {launcher.config.javaPath || 'Not configured'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Game Directory</Typography>
                  <Typography variant="body1" fontFamily="monospace" noWrap>
                    {launcher.config.gameDir || 'Not configured'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">JVM Arguments</Typography>
                  <Typography variant="body1" fontFamily="monospace">
                    {launcher.config.javaArgs}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Paper
              sx={{
                p: 3,
                background: ui.theme === 'dark'
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(0,0,0,0.05)',
                backdropFilter: 'blur(10px)',
                height: '100%'
              }}
            >
              <Typography variant="h6" gutterBottom>
                <ExtensionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Recent Activity
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                {launcher.logs.slice(-5).reverse().map((log, index) => (
                  <motion.div
                    key={log.timestamp}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Chip
                      label={`${log.type.toUpperCase()}: ${log.message.substring(0, 50)}${log.message.length > 50 ? '...' : ''}`}
                      size="small"
                      color={
                        log.type === 'error' ? 'error' :
                        log.type === 'success' ? 'success' :
                        log.type === 'warning' ? 'warning' : 'default'
                      }
                      sx={{ width: '100%', justifyContent: 'flex-start' }}
                    />
                  </motion.div>
                ))}
                {launcher.logs.length === 0 && (
                  <Typography color="text.secondary" align="center">
                    No recent activity
                  </Typography>
                )}
              </Stack>
            </Paper>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}
