import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Slider,
  FormControlLabel,
  Switch,
  Grid,
  Alert,
  InputAdornment
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Memory as MemoryIcon,
  Folder as FolderIcon,
  Terminal as TerminalIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Computer as ComputerIcon,
  Speed as SpeedIcon,
  Tune as TuneIcon,
  Key as KeyIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Extension as ExtensionIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { updateJavaPath, updateJavaArgs, updateGameDir, addMod, removeMod, addResourcePack, removeResourcePack } from './launcherSlice';
import { closeSettingsDialog } from './uiSlice';
import { setCurseForgeApiKey, setApiKeyValidation } from './store/modsSlice';
import * as curseforgeApi from './services/curseforgeApi';

export default function SettingsDialog() {
  const dispatch = useDispatch();
  const launcher = useSelector(state => state.launcher);
  const ui = useSelector(state => state.ui);
  const mods = useSelector(state => state.mods);
  
  const [localJavaArgs, setLocalJavaArgs] = React.useState(launcher.config.javaArgs);
  const [memorySlider, setMemorySlider] = React.useState(2);
  const [apiKeyInput, setApiKeyInput] = useState(mods.curseForgeApiKey || '');
  const [apiKeyStatus, setApiKeyStatus] = useState(null); // { type: 'success'|'error', message: string }
  const [testingKey, setTestingKey] = useState(false);

  React.useEffect(() => {
    setLocalJavaArgs(launcher.config.javaArgs);
    const match = launcher.config.javaArgs.match(/-Xmx(\d+)([GM])/);
    if (match) {
      const value = match[1];
      const unit = match[2];
      setMemorySlider(unit === 'G' ? parseInt(value) : parseInt(value) / 1024);
    }
  }, [launcher.config.javaArgs]);

  const handleSelectJava = async () => {
    const path = await window.electronAPI.selectJava();
    if (path) {
      dispatch(updateJavaPath(path));
    }
  };

  const handleSelectGameDir = async () => {
    const path = await window.electronAPI.selectGameDir();
    if (path) {
      dispatch(updateGameDir(path));
    }
  };

  const handleSaveJavaArgs = () => {
    dispatch(updateJavaArgs(localJavaArgs));
  };

  const handleMemoryChange = (event, newValue) => {
    setMemorySlider(newValue);
    const newArgs = launcher.config.javaArgs.replace(
      /-Xmx\d+[GM]/,
      `-Xmx${newValue}G`
    );
    dispatch(updateJavaArgs(newArgs));
  };

  const handleOpenModsFolder = () => {
    const modsDir = `${launcher.config.gameDir}/mods`;
    window.electronAPI.openFolder(modsDir);
  };

  const handleOpenResourcePacksFolder = () => {
    const resourcePacksDir = `${launcher.config.gameDir}/resourcepacks`;
    window.electronAPI.openFolder(resourcePacksDir);
  };

  const handleClose = () => {
    dispatch(closeSettingsDialog());
  };

  // Handle CurseForge API key
  const handleApiKeyChange = (e) => {
    const newKey = e.target.value;
    setApiKeyInput(newKey);
    dispatch(setCurseForgeApiKey(newKey));
    setApiKeyStatus(null);
  };

  const testApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    
    setTestingKey(true);
    setApiKeyStatus({ type: 'info', message: 'Testing API key...' });
    
    try {
      const result = await curseforgeApi.validateApiKey(apiKeyInput.trim());
      
      dispatch(setApiKeyValidation(result.valid));
      
      if (result.valid) {
        setApiKeyStatus({ type: 'success', message: 'API key is valid! You can now browse and install mods from CurseForge.' });
      } else {
        setApiKeyStatus({ type: 'error', message: `Invalid API key: ${result.error}` });
      }
    } catch (error) {
      setApiKeyStatus({ type: 'error', message: `Failed to validate: ${error.message}` });
    } finally {
      setTestingKey(false);
    }
  };

  const clearApiKey = () => {
    setApiKeyInput('');
    dispatch(setCurseForgeApiKey(''));
    dispatch(setApiKeyValidation(null));
    setApiKeyStatus(null);
  };

  // Return null if dialog is not open - MUST be after all hooks
  if (!ui.settingsDialogOpen) {
    return null;
  }

  return (
    <Dialog
      open={ui.settingsDialogOpen}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          background: ui.theme === 'dark'
            ? 'linear-gradient(135deg, rgba(30, 30, 50, 0.98), rgba(50, 50, 80, 0.98))'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(240, 240, 255, 0.98))',
          backdropFilter: 'blur(20px)',
          border: ui.theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
        }
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <SettingsIcon sx={{ fontSize: 32, color: '#2196F3' }} />
          <Typography variant="h5">Settings</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* CurseForge API Key Configuration */}
          <Grid item xs={12}>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  mb: 3,
                  background: ui.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  borderRadius: 2,
                  border: mods.isApiKeyValid === true ? '1px solid #4CAF50' : 
                            mods.isApiKeyValid === false ? '1px solid #f44336' : 'none'
                }}
              >
                <Typography variant="h6" gutterBottom>
                  <KeyIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#9C27B0' }} />
                  CurseForge API Key
                </Typography>
                
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <Alert severity="info" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      Get your free API key from{' '}
                      <a href="https://www.curseforge.com/account/api-tokens" target="_blank" rel="noopener noreferrer">
                        CurseForge Account Settings
                      </a> to browse and install mods directly from the catalog.
                    </Typography>
                  </Alert>
                  
                  <TextField
                    fullWidth
                    label="API Key"
                    value={apiKeyInput}
                    onChange={handleApiKeyChange}
                    placeholder="Enter your CurseForge API key"
                    type="password"
                    variant="outlined"
                    disabled={testingKey}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <KeyIcon />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <Stack direction="row" spacing={1}>
                            {mods.isApiKeyValid === true && (
                              <CheckCircleIcon color="success" />
                            )}
                            {mods.isApiKeyValid === false && (
                              <ErrorIcon color="error" />
                            )}
                            {apiKeyInput.trim() && (
                              <IconButton
                                onClick={testApiKey}
                                size="small"
                                disabled={testingKey}
                              >
                                {testingKey ? <RefreshIcon className="spin" /> : <RefreshIcon />}
                              </IconButton>
                            )}
                            {apiKeyInput.trim() && (
                              <IconButton onClick={clearApiKey} size="small">
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </Stack>
                        </InputAdornment>
                      )
                    }}
                  />
                  
                  {apiKeyStatus && (
                    <Alert 
                      severity={apiKeyStatus.type}
                      onClose={() => setApiKeyStatus(null)}
                    >
                      {apiKeyStatus.message}
                    </Alert>
                  )}
                  
                  <Typography variant="caption" color="text.secondary">
                    Your API key is stored locally and never sent to any server except CurseForge's official API.
                  </Typography>
                </Stack>
              </Paper>
            </motion.div>
          </Grid>
          
          {/* Java Configuration */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  mb: 3,
                  background: ui.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  borderRadius: 2
                }}
              >
                <Typography variant="h6" gutterBottom>
                  <ComputerIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#FF9800' }} />
                  Java Configuration
                </Typography>
                
                <Stack spacing={3} sx={{ mt: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Java Executable Path
                    </Typography>
                    <TextField
                      fullWidth
                      value={launcher.config.javaPath}
                      placeholder="Not configured"
                      variant="outlined"
                      size="small"
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <IconButton onClick={handleSelectJava} size="small">
                            <FolderIcon />
                          </IconButton>
                        )
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Memory Allocation ({memorySlider}GB)
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <MemoryIcon color="primary" />
                      <Slider
                        value={memorySlider}
                        onChange={handleMemoryChange}
                        min={1}
                        max={16}
                        step={1}
                        valueLabelDisplay="auto"
                        sx={{
                          color: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
                          '& .MuiSlider-valueLabel': {
                            background: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
                          }
                        }}
                      />
                      <SpeedIcon color="secondary" />
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            </motion.div>
          </Grid>

          {/* JVM Arguments */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  mb: 3,
                  background: ui.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  borderRadius: 2
                }}
              >
                <Typography variant="h6" gutterBottom>
                  <TerminalIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#4CAF50' }} />
                  JVM Arguments
                </Typography>
                
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={localJavaArgs}
                    onChange={(e) => setLocalJavaArgs(e.target.value)}
                    variant="outlined"
                    placeholder="-Xmx2G -Xms1G"
                    InputProps={{
                      sx: { fontFamily: 'monospace' }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSaveJavaArgs}
                    startIcon={<SaveIcon />}
                    sx={{
                      background: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #8BC34A, #4CAF50)',
                      }
                    }}
                  >
                    Save Arguments
                  </Button>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Common Arguments:
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" spacing={1}>
                      {['-Xmx4G', '-Xms2G', '-XX:+UseG1GC', '-Dfml.ignoreInvalidMinecraftCertificates=true'].map((arg) => (
                        <Chip
                          key={arg}
                          label={arg}
                          size="small"
                          clickable
                          onClick={() => setLocalJavaArgs(prev => prev + ' ' + arg)}
                          sx={{
                            background: ui.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            </motion.div>
          </Grid>

          {/* Game Directory */}
          <Grid item xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  background: ui.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  borderRadius: 2
                }}
              >
                <Typography variant="h6" gutterBottom>
                  <FolderIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#9C27B0' }} />
                  Game Directory
                </Typography>
                
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    value={launcher.config.gameDir}
                    placeholder="Not configured"
                    variant="outlined"
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <IconButton onClick={handleSelectGameDir}>
                          <FolderIcon />
                        </IconButton>
                      )
                    }}
                  />
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      onClick={handleOpenModsFolder}
                      startIcon={<TuneIcon />}
                    >
                      Open Mods Folder
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleOpenResourcePacksFolder}
                      startIcon={<TuneIcon />}
                    >
                      Open Resource Packs Folder
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            </motion.div>
          </Grid>

          {/* Mods List */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  background: ui.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  borderRadius: 2
                }}
              >
                <Typography variant="h6" gutterBottom>
                  <TuneIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#F44336' }} />
                  Installed Mods ({launcher.config.mods.length})
                </Typography>
                
                {launcher.config.mods.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <TuneIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                    <Typography color="text.secondary">No mods installed</Typography>
                  </Box>
                ) : (
                  <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {launcher.config.mods.map((mod, index) => (
                      <ListItem
                        key={mod.name}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={() => dispatch(removeMod(mod.name))}
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        }
                        sx={{ py: 0.5 }}
                      >
                        <ListItemText
                          primary={mod.name}
                          secondary={new Date(mod.installedAt).toLocaleDateString()}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>
            </motion.div>
          </Grid>

          {/* Resource Packs List */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  background: ui.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  borderRadius: 2
                }}
              >
                <Typography variant="h6" gutterBottom>
                  <TuneIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#2196F3' }} />
                  Resource Packs ({launcher.config.resourcePacks.length})
                </Typography>
                
                {launcher.config.resourcePacks.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <TuneIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                    <Typography color="text.secondary">No resource packs installed</Typography>
                  </Box>
                ) : (
                  <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {launcher.config.resourcePacks.map((pack, index) => (
                      <ListItem
                        key={pack.name}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={() => dispatch(removeResourcePack(pack.name))}
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        }
                        sx={{ py: 0.5 }}
                      >
                        <ListItemText
                          primary={pack.name}
                          secondary={new Date(pack.installedAt).toLocaleDateString()}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
