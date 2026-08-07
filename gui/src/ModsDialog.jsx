import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Paper,
  Stack,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  Button,
  Divider,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Extension as ExtensionIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  FolderOpen as FolderOpenIcon,
  CloudDownload as CloudDownloadIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { addMod, removeMod, addResourcePack, removeResourcePack } from './launcherSlice';
import { closeModsDialog } from './uiSlice';

// Drop zone component for drag and drop
function DropZone({ onDrop, acceptedFiles, children, title }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => 
      acceptedFiles.some(ext => file.name.endsWith(ext))
    );
    
    if (validFiles.length > 0) {
      onDrop(validFiles);
    }
  };

  return (
    <Paper
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        p: 3,
        mt: 2,
        border: isDragging ? '2px dashed #4CAF50' : '2px dashed rgba(128,128,128,0.3)',
        background: isDragging
          ? 'rgba(76, 175, 80, 0.1)'
          : 'transparent',
        borderRadius: 2,
        textAlign: 'center',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}
    >
      <ExtensionIcon
        sx={{
          fontSize: 48,
          opacity: 0.5,
          mb: 1,
          color: isDragging ? '#4CAF50' : 'text.secondary'
        }}
      />
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Drag and drop files here or click to browse
      </Typography>
      {children}
    </Paper>
  );
}

export default function ModsDialog() {
  const dispatch = useDispatch();
  const launcher = useSelector(state => state.launcher);
  const ui = useSelector(state => state.ui);
  
  const [installingMods, setInstallingMods] = useState([]);
  const [installStatus, setInstallStatus] = useState(null);

  const handleInstallMods = async (files) => {
    const newInstalling = [];
    
    for (const file of files) {
      // In a real app, you'd need to get the file path from electron
      // This is a simplified version
      newInstalling.push({
        name: file.name,
        progress: 0
      });
    }
    
    setInstallingMods(newInstalling);
    
    // Simulate installation
    for (let i = 0; i < newInstalling.length; i++) {
      try {
        // Note: In real implementation, you'd use a file picker
        // and pass the actual file path to electron
        dispatch(addMod({
          name: newInstalling[i].name,
          path: 'mods/' + newInstalling[i].name,
          installedAt: Date.now()
        }));
        
        setInstallStatus({
          type: 'success',
          message: `Successfully installed ${newInstalling[i].name}`
        });
      } catch (error) {
        setInstallStatus({
          type: 'error',
          message: `Failed to install ${newInstalling[i].name}: ${error.message}`
        });
      }
    }
    
    setTimeout(() => setInstallStatus(null), 3000);
    setInstallingMods([]);
  };

  const handleInstallResourcePacks = async (files) => {
    for (const file of files) {
      dispatch(addResourcePack({
        name: file.name,
        path: 'resourcepacks/' + file.name,
        installedAt: Date.now()
      }));
    }
    
    setInstallStatus({
      type: 'success',
      message: `Successfully installed ${files.length} resource pack(s)`
    });
    
    setTimeout(() => setInstallStatus(null), 3000);
  };

  const handleOpenModsFolder = () => {
    window.electronAPI.openFolder(`${launcher.config.gameDir}/mods`);
  };

  const handleOpenResourcePacksFolder = () => {
    window.electronAPI.openFolder(`${launcher.config.gameDir}/resourcepacks`);
  };

  const handleClose = () => {
    dispatch(closeModsDialog());
  };

  // Return null if dialog is not open - MUST be after all hooks
  if (!ui.modsDialogOpen) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300
      }}
      onClick={handleClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: 1000,
          maxHeight: '90vh',
          overflow: 'auto'
        }}
      >
        <Paper
          sx={{
            p: 3,
            background: ui.theme === 'dark'
              ? 'linear-gradient(135deg, rgba(30, 30, 50, 0.98), rgba(50, 50, 80, 0.98))'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(240, 240, 255, 0.98))',
            borderRadius: 3,
            border: ui.theme === 'dark'
              ? '1px solid rgba(255,255,255,0.1)'
              : '1px solid rgba(0,0,0,0.1)',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <ExtensionIcon sx={{ fontSize: 32, color: '#9C27B0' }} />
            <Typography variant="h5">Mods & Resource Packs</Typography>
          </Stack>

          {installStatus && (
            <Alert
              severity={installStatus.type}
              sx={{ mb: 2 }}
              onClose={() => setInstallStatus(null)}
            >
              {installStatus.message}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Mods Section */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  background: ui.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  borderRadius: 2
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <ExtensionIcon color="primary" />
                  <Typography variant="h6">Mods ({launcher.config.mods.length})</Typography>
                </Stack>

                <DropZone
                  onDrop={handleInstallMods}
                  acceptedFiles={['.jar']}
                  title="Drop .jar files to install mods"
                >
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenModsFolder}
                    sx={{ mt: 2 }}
                  >
                    Open Mods Folder
                  </Button>
                </DropZone>

                {installingMods.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    {installingMods.map((mod, index) => (
                      <Box key={index} sx={{ mb: 1 }}>
                        <Typography variant="caption">{mod.name}</Typography>
                        <LinearProgress variant="indeterminate" />
                      </Box>
                    ))}
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {launcher.config.mods.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <ExtensionIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                      <Typography color="text.secondary">No mods installed</Typography>
                    </Box>
                  ) : (
                    launcher.config.mods.map((mod, index) => (
                      <motion.div
                        key={mod.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <ListItem
                          secondaryAction={
                            <IconButton
                              edge="end"
                              onClick={() => dispatch(removeMod(mod.name))}
                              size="small"
                              sx={{ color: '#f44336' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                background: 'linear-gradient(135deg, #9C27B0, #7B1FA2)'
                              }}
                            >
                              <ExtensionIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={mod.name}
                            secondary={new Date(mod.installedAt).toLocaleDateString()}
                          />
                        </ListItem>
                      </motion.div>
                    ))
                  )}
                </List>
              </Paper>
            </Grid>

            {/* Resource Packs Section */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  background: ui.theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  borderRadius: 2
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <ExtensionIcon color="secondary" />
                  <Typography variant="h6">Resource Packs ({launcher.config.resourcePacks.length})</Typography>
                </Stack>

                <DropZone
                  onDrop={handleInstallResourcePacks}
                  acceptedFiles={['.zip', '.mcpack']}
                  title="Drop .zip or .mcpack files"
                >
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenResourcePacksFolder}
                    sx={{ mt: 2 }}
                    color="secondary"
                  >
                    Open Resource Packs Folder
                  </Button>
                </DropZone>

                <Divider sx={{ my: 2 }} />

                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {launcher.config.resourcePacks.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <ExtensionIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                      <Typography color="text.secondary">No resource packs installed</Typography>
                    </Box>
                  ) : (
                    launcher.config.resourcePacks.map((pack, index) => (
                      <motion.div
                        key={pack.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <ListItem
                          secondaryAction={
                            <IconButton
                              edge="end"
                              onClick={() => dispatch(removeResourcePack(pack.name))}
                              size="small"
                              sx={{ color: '#f44336' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                background: 'linear-gradient(135deg, #2196F3, #1976D2)'
                              }}
                            >
                              <ExtensionIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={pack.name}
                            secondary={new Date(pack.installedAt).toLocaleDateString()}
                          />
                        </ListItem>
                      </motion.div>
                    ))
                  )}
                </List>
              </Paper>
            </Grid>
          </Grid>

          <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
            <Button onClick={handleClose} color="inherit">
              Close
            </Button>
          </Stack>
        </Paper>
      </motion.div>
    </Box>
  );
}

// Simple Grid component since we didn't import it
function Grid({ container, item, children, xs, md, spacing = 0, sx = {} }) {
  const spacingValues = [0, 8, 16, 24, 32, 40];
  const spacingValue = spacingValues[spacing] || 0;

  if (container) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          margin: spacingValue > 0 ? `-${spacingValue / 2}px` : 0,
          ...sx
        }}
      >
        {children}
      </Box>
    );
  }

  const widthMap = {
    12: '100%',
    6: '50%',
    4: '33.333%',
    3: '25%',
    2: '16.666%',
    1: '8.333%'
  };

  return (
    <Box
      sx={{
        width: xs ? widthMap[xs] || '100%' : 'auto',
        padding: spacingValue > 0 ? `${spacingValue / 2}px` : 0,
        ...sx,
        '@media (min-width: 900px)': {
          width: md ? widthMap[md] || widthMap[xs] || '100%' : widthMap[xs] || 'auto'
        }
      }}
    >
      {children}
    </Box>
  );
}
