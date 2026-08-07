import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Paper,
  Stack,
  TextField,
  Button,
  IconButton,
  Chip,
  Avatar,
  Card,
  CardContent,
  CardActions,
  Grid,
  CircularProgress,
  Alert,
  LinearProgress,
  Tooltip,
  Badge,
  Rating,
  Divider,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Autocomplete
} from '@mui/material';
import {
  Extension as ExtensionIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CloudDownload as DownloadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Star as StarIcon,
  Category as CategoryIcon,
  Version as VersionIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  FileUpload as FileUploadIcon,
  FileDownload as FileDownloadIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  VerifiedUser as VerifiedUserIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  setCurseForgeApiKey,
  setApiKeyValidation,
  addInstalledMod,
  removeInstalledMod,
  setCatalogMods,
  setCatalogLoading,
  setCatalogError,
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
  setPendingDependencies,
  setAutoInstallDependencies,
  addProfile,
  removeProfile,
  setActiveProfile
} from '../store/modsSlice';
import * as curseforgeApi from '../services/curseforgeApi';

// Mod Card Component for catalog display
function ModCard({ mod, onClick, onInstall, isInstalled }) {
  const formattedMod = curseforgeApi.formatModData(mod);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 3,
          overflow: 'hidden',
          cursor: 'pointer',
          position: 'relative'
        }}
        onClick={onClick}
      >
        {/* Mod Icon */}
        <Box
          sx={{
            height: 140,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          {formattedMod.logoUrl ? (
            <img
              src={formattedMod.logoUrl}
              alt={formattedMod.name}
              style={{
                width: 80,
                height: 80,
                objectFit: 'contain',
                borderRadius: 12
              }}
            />
          ) : (
            <ExtensionIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.5)' }} />
          )}
          
          {isInstalled && (
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={<CheckCircleIcon color="success" />}
              sx={{ position: 'absolute', bottom: 8, right: 8 }}
            />
          )}
        </Box>
        
        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          <Typography variant="h6" noWrap gutterBottom>
            {formattedMod.name}
          </Typography>
          
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {formattedMod.author}
            </Typography>
          </Stack>
          
          <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 1 }}>
            {formattedMod.summary}
          </Typography>
          
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <StarIcon sx={{ fontSize: 16, color: '#FFD700' }} />
            <Typography variant="body2">
              {formattedMod.likeCount.toLocaleString()}
            </Typography>
            <DownloadIcon sx={{ fontSize: 16, color: 'text.secondary', ml: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {formattedMod.downloadCount.toLocaleString()}
            </Typography>
          </Stack>
          
          <Stack direction="row" flexWrap="wrap" spacing={0.5} mt={1}>
            {formattedMod.gameVersions.slice(0, 3).map((version) => (
              <Chip
                key={version}
                label={version}
                size="small"
                sx={{ height: 20, fontSize: 10 }}
              />
            ))}
            {formattedMod.gameVersions.length > 3 && (
              <Chip
                label={`+${formattedMod.gameVersions.length - 3}`}
                size="small"
                sx={{ height: 20, fontSize: 10 }}
              />
            )}
          </Stack>
        </CardContent>
        
        <CardActions sx={{ p: 2, pt: 0 }}>
          <Button
            fullWidth
            variant={isInstalled ? "outlined" : "contained"}
            size="small"
            startIcon={isInstalled ? <CheckCircleIcon /> : <DownloadIcon />}
            onClick={(e) => {
              e.stopPropagation();
              onInstall(mod);
            }}
            disabled={isInstalled}
          >
            {isInstalled ? 'Installed' : 'Install'}
          </Button>
        </CardActions>
      </Card>
    </motion.div>
  );
}

// Mod Detail Dialog
function ModDetailDialog({ mod, onClose, onInstall }) {
  const dispatch = useDispatch();
  const mods = useSelector(state => state.mods);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dependencies, setDependencies] = useState([]);
  const ui = useSelector(state => state.ui);
  
  useEffect(() => {
    if (mod) {
      loadModDetails();
    }
  }, [mod]);
  
  const loadModDetails = async () => {
    try {
      setLoading(true);
      const apiKey = mods.curseForgeApiKey;
      
      // Get mod files
      const modFiles = await curseforgeApi.getModFiles(apiKey, mod.id);
      setFiles(modFiles || []);
      
      if (modFiles && modFiles.length > 0) {
        setSelectedFile(modFiles[0]);
        
        // Get dependencies
        const deps = await curseforgeApi.getModDependencies(apiKey, mod.id, modFiles[0].id);
        setDependencies(deps || []);
      }
    } catch (error) {
      console.error('Failed to load mod details:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (!mod) return null;
  
  const formattedMod = curseforgeApi.formatModData(mod);
  
  return (
    <Dialog
      open={!!mod}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: ui.theme === 'dark'
            ? 'linear-gradient(135deg, rgba(30, 30, 50, 0.98), rgba(50, 50, 80, 0.98))'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(240, 240, 255, 0.98))',
          borderRadius: 3
        }
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            src={formattedMod.logoUrl}
            variant="rounded"
            sx={{ width: 56, height: 56 }}
          >
            <ExtensionIcon />
          </Avatar>
          <Box>
            <Typography variant="h5">{formattedMod.name}</Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <PersonIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2" color="text.secondary">
                {formattedMod.author}
              </Typography>
            </Stack>
          </Box>
          <IconButton onClick={onClose} sx={{ ml: 'auto' }}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            {/* Stats */}
            <Paper
              sx={{
                p: 2,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 2
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Stack alignItems="center">
                    <DownloadIcon sx={{ color: 'primary.main', mb: 0.5 }} />
                    <Typography variant="h6">
                      {formattedMod.downloadCount.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Downloads
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={3}>
                  <Stack alignItems="center">
                    <StarIcon sx={{ color: '#FFD700', mb: 0.5 }} />
                    <Typography variant="h6">
                      {formattedMod.likeCount.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Likes
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={3}>
                  <Stack alignItems="center">
                    <VersionIcon sx={{ color: 'secondary.main', mb: 0.5 }} />
                    <Typography variant="h6">
                      {formattedMod.gameVersions.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Versions
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={3}>
                  <Stack alignItems="center">
                    <InfoIcon sx={{ color: 'info.main', mb: 0.5 }} />
                    <Typography variant="h6">
                      {dependencies.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Dependencies
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
            
            {/* Description */}
            <Box>
              <Typography variant="h6" gutterBottom>
                <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Description
              </Typography>
              <Typography
                variant="body1"
                sx={{ whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}
                dangerouslySetInnerHTML={{ __html: formattedMod.description || 'No description available' }}
              />
            </Box>
            
            {/* Screenshots */}
            {formattedMod.screenshotUrls.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  <ImageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Screenshots
                </Typography>
                <Stack direction="row" spacing={1} sx={{ overflow: 'auto' }}>
                  {formattedMod.screenshotUrls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Screenshot ${index + 1}`}
                      style={{
                        height: 100,
                        borderRadius: 8,
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
            
            {/* Version Selection */}
            <Box>
              <Typography variant="h6" gutterBottom>
                <VersionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Select Version
              </Typography>
              <Stack spacing={1} sx={{ maxHeight: 200, overflow: 'auto' }}>
                {files.map((file) => (
                  <Paper
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      background: selectedFile?.id === file.id
                        ? 'rgba(76, 175, 80, 0.2)'
                        : 'rgba(255,255,255,0.05)',
                      border: selectedFile?.id === file.id
                        ? '1px solid #4CAF50'
                        : '1px solid transparent',
                      borderRadius: 2,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedFile?.id !== file.id) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedFile?.id !== file.id) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      }
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle2">{file.displayName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(file.fileDate).toLocaleDateString()} • {file.gameVersions.join(', ')}
                        </Typography>
                      </Box>
                      <Chip
                        label={file.releaseType === 1 ? 'Release' : file.releaseType === 2 ? 'Beta' : 'Alpha'}
                        size="small"
                        color={file.releaseType === 1 ? 'success' : file.releaseType === 2 ? 'warning' : 'error'}
                      />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
            
            {/* Dependencies */}
            {dependencies.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  <ExtensionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Dependencies
                </Typography>
                <Stack spacing={1}>
                  {dependencies.map((dep) => (
                    <Paper
                      key={dep.modId}
                      sx={{
                        p: 2,
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: 2
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Chip
                          label={
                            dep.dependencyType === 3 ? 'Required' :
                            dep.dependencyType === 2 ? 'Optional' :
                            dep.dependencyType === 5 ? 'Incompatible' : 'Other'
                          }
                          size="small"
                          color={
                            dep.dependencyType === 3 ? 'error' :
                            dep.dependencyType === 2 ? 'warning' :
                            dep.dependencyType === 5 ? 'error' : 'info'
                          }
                        />
                        <Typography variant="body2">
                          Mod ID: {dep.modId}
                        </Typography>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={() => onInstall(mod, selectedFile)}
          disabled={!selectedFile || loading}
          size="large"
        >
          Install {selectedFile ? `(${selectedFile.displayName})` : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Main Mods Component with tabs for Installed and Catalog
export default function Mods() {
  const dispatch = useDispatch();
  const mods = useSelector(state => state.mods);
  const launcher = useSelector(state => state.launcher);
  const ui = useSelector(state => state.ui);
  
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [selectedModForDetail, setSelectedModForDetail] = useState(null);
  const [apiTestStatus, setApiTestStatus] = useState(null);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  
  // Load categories and versions on mount
  useEffect(() => {
    if (mods.curseForgeApiKey && mods.isApiKeyValid) {
      loadCatalogData();
    }
  }, [mods.curseForgeApiKey, mods.isApiKeyValid]);
  
  const loadCatalogData = async () => {
    try {
      const apiKey = mods.curseForgeApiKey;
      
      // Load categories
      const categories = await curseforgeApi.getCategories(apiKey);
      dispatch(setCategories(categories));
      
      // Load game versions
      const versions = await curseforgeApi.getGameVersions(apiKey);
      dispatch(setGameVersions(versions.slice(0, 20))); // Limit to 20 recent versions
      
      // Load featured mods
      dispatch(setCatalogLoading(true));
      const featuredMods = await curseforgeApi.getFeaturedMods(apiKey);
      dispatch(setCatalogMods(featuredMods));
    } catch (error) {
      dispatch(setCatalogError(error.message));
    } finally {
      dispatch(setCatalogLoading(false));
    }
  };
  
  // Search mods
  const handleSearch = async () => {
    if (!mods.curseForgeApiKey || !mods.isApiKeyValid) return;
    
    try {
      dispatch(setCatalogLoading(true));
      
      const searchResults = await curseforgeApi.searchMods(mods.curseForgeApiKey, {
        searchFilter: mods.filters.searchQuery,
        categoryId: mods.filters.categoryId,
        gameVersion: mods.filters.gameVersion,
        sortField: mods.filters.sortField,
        sortOrder: mods.filters.sortOrder
      });
      
      dispatch(setCatalogMods(searchResults));
    } catch (error) {
      dispatch(setCatalogError(error.message));
    } finally {
      dispatch(setCatalogLoading(false));
    }
  };
  
  // Test API key
  const testApiKey = async () => {
    if (!mods.curseForgeApiKey) return;
    
    setApiTestStatus({ type: 'loading', message: 'Testing...' });
    
    const result = await curseforgeApi.validateApiKey(mods.curseForgeApiKey);
    
    dispatch(setApiKeyValidation(result.valid));
    setApiTestStatus({
      type: result.valid ? 'success' : 'error',
      message: result.valid ? 'API key is valid!' : result.error
    });
    
    setTimeout(() => setApiTestStatus(null), 3000);
  };
  
  // Install mod
  const handleInstallMod = async (mod, file) => {
    try {
      dispatch(addInstallingMod({ id: mod.id, name: mod.name }));
      
      // Get download URL
      const downloadUrl = await curseforgeApi.getDownloadUrl(
        mods.curseForgeApiKey,
        mod.id,
        file.id
      );
      
      if (!downloadUrl) {
        throw new Error('No download URL available');
      }
      
      // Download and install via Electron main process
      const result = await window.electronAPI.installMod({
        modId: mod.id,
        modName: mod.name,
        downloadUrl,
        fileName: file.fileName,
        gameId: launcher.config.selectedVersion?.gameId || 432,
        mcVersion: file.gameVersions?.[0]
      });
      
      if (result.success) {
        dispatch(addInstalledMod({
          id: mod.id,
          name: mod.name,
          fileName: file.fileName,
          installedAt: Date.now(),
          version: file.displayName,
          iconUrl: mod.logo?.thumbnailUrl
        }));
        
        dispatch(updateInstallationProgress({
          modId: mod.id,
          progress: 100,
          status: 'completed'
        }));
        
        dispatch(removeInstallingMod(mod.id));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to install mod:', error);
      dispatch(updateInstallationProgress({
        modId: mod.id,
        progress: 0,
        status: 'error'
      }));
      dispatch(removeInstallingMod(mod.id));
    }
  };
  
  // Remove installed mod
  const handleRemoveMod = async (modId) => {
    try {
      await window.electronAPI.removeMod(modId);
      dispatch(removeInstalledMod(modId));
    } catch (error) {
      console.error('Failed to remove mod:', error);
    }
  };
  
  // Create profile
  const handleCreateProfile = () => {
    if (!newProfileName.trim()) return;
    
    dispatch(addProfile({
      id: `profile_${Date.now()}`,
      name: newProfileName,
      mods: [...mods.installedMods],
      gameVersion: launcher.config.selectedVersion?.id || '',
      createdAt: Date.now()
    }));
    
    setNewProfileName('');
    setShowCreateProfile(false);
  };
  
  // Load profile
  const handleLoadProfile = (profile) => {
    dispatch(setActiveProfile(profile.id));
    // In a real implementation, this would install/uninstall mods to match the profile
  };
  
  const isModInstalled = (modId) => {
    return mods.installedMods.some(m => m.id === modId);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      {/* API Key Configuration */}
      {!mods.isApiKeyValid && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={testApiKey}
              disabled={!mods.curseForgeApiKey}
            >
              Test Key
            </Button>
          }
        >
          <Typography variant="body2">
            Please configure your CurseForge API key in Settings to browse and install mods.
          </Typography>
        </Alert>
      )}
      
      {apiTestStatus && (
        <Alert
          severity={apiTestStatus.type}
          sx={{ mb: 3 }}
          onClose={() => setApiTestStatus(null)}
        >
          {apiTestStatus.message}
        </Alert>
      )}
      
      {/* Tabs */}
      <Paper
        sx={{
          mb: 3,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 3
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600
            }
          }}
        >
          <Tab
            icon={<ExtensionIcon />}
            label={`Installed (${mods.installedMods.length})`}
            iconPosition="start"
          />
          <Tab
            icon={<SearchIcon />}
            label="Browse Catalog"
            iconPosition="start"
          />
          <Tab
            icon={<SaveIcon />}
            label="Profiles"
            iconPosition="start"
          />
        </Tabs>
      </Paper>
      
      {/* Installed Mods Tab */}
      {tabValue === 0 && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5">Installed Mods</Typography>
            <Button
              variant="outlined"
              startIcon={<FileUploadIcon />}
              onClick={() => window.electronAPI.openFolder(`${launcher.config.gameDir}/mods`)}
            >
              Open Mods Folder
            </Button>
          </Stack>
          
          {mods.installedMods.length === 0 ? (
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 3
              }}
            >
              <ExtensionIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No mods installed yet
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Browse the catalog to find and install mods
              </Typography>
              <Button
                variant="contained"
                onClick={() => setTabValue(1)}
                startIcon={<SearchIcon />}
              >
                Browse Catalog
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {mods.installedMods.map((mod) => (
                <Grid item xs={12} sm={6} md={4} key={mod.id}>
                  <Paper
                    sx={{
                      p: 2,
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <Avatar
                      src={mod.iconUrl}
                      variant="rounded"
                      sx={{ width: 56, height: 56 }}
                    >
                      <ExtensionIcon />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" noWrap>
                        {mod.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {mod.version}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveMod(mod.id)}
                      sx={{ color: '#f44336' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
      
      {/* Catalog Tab */}
      {tabValue === 1 && (
        <Box>
          {/* Search and Filters */}
          <Paper
            sx={{
              p: 2,
              mb: 3,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 3
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search mods..."
                  value={mods.filters.searchQuery}
                  onChange={(e) => dispatch(setFilters({ searchQuery: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <Autocomplete
                  options={mods.categories}
                  getOptionLabel={(cat) => cat.name}
                  value={mods.categories.find(c => c.id === mods.filters.categoryId) || null}
                  onChange={(e, v) => dispatch(setFilters({ categoryId: v?.id || 0 }))}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Category"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <CategoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            {params.InputProps.startAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <Autocomplete
                  options={mods.gameVersions}
                  value={mods.filters.gameVersion || null}
                  onChange={(e, v) => dispatch(setFilters({ gameVersion: v || '' }))}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Version"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <VersionIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            {params.InputProps.startAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={1}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSearch}
                  disabled={mods.catalogLoading || !mods.isApiKeyValid}
                  sx={{ height: '100%' }}
                >
                  {mods.catalogLoading ? <CircularProgress size={24} /> : <SearchIcon />}
                </Button>
              </Grid>
            </Grid>
            
            <Stack direction="row" spacing={1} mt={2}>
              <Chip
                label="Reset Filters"
                onClick={() => {
                  dispatch(resetFilters());
                  setSearchQuery('');
                  setSelectedCategory(0);
                  setSelectedVersion('');
                }}
                onDelete={() => dispatch(resetFilters())}
                deleteIcon={<CloseIcon />}
              />
            </Stack>
          </Paper>
          
          {/* Loading State */}
          {mods.catalogLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          )}
          
          {/* Error State */}
          {mods.catalogError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {mods.catalogError}
            </Alert>
          )}
          
          {/* Mods Grid */}
          {!mods.catalogLoading && !mods.catalogError && (
            <Grid container spacing={3}>
              {mods.catalogMods.length === 0 ? (
                <Grid item xs={12}>
                  <Paper
                    sx={{
                      p: 6,
                      textAlign: 'center',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: 3
                    }}
                  >
                    <SearchIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No mods found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try adjusting your search or filters
                    </Typography>
                  </Paper>
                </Grid>
              ) : (
                mods.catalogMods.map((mod) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={mod.id}>
                    <ModCard
                      mod={mod}
                      onClick={() => setSelectedModForDetail(mod)}
                      onInstall={(m) => setSelectedModForDetail(m)}
                      isInstalled={isModInstalled(mod.id)}
                    />
                  </Grid>
                ))
              )}
            </Grid>
          )}
        </Box>
      )}
      
      {/* Profiles Tab */}
      {tabValue === 2 && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5">Mod Profiles</Typography>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => setShowCreateProfile(true)}
            >
              Create Profile
            </Button>
          </Stack>
          
          {mods.modProfiles.length === 0 ? (
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 3
              }}
            >
              <SaveIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No profiles created
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Create a profile to save your current mod configuration
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {mods.modProfiles.map((profile) => (
                <Grid item xs={12} md={6} key={profile.id}>
                  <Paper
                    sx={{
                      p: 3,
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: 3
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6">{profile.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {profile.mods?.length || 0} mods • {profile.gameVersion || 'Any version'}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Load Profile">
                          <IconButton
                            onClick={() => handleLoadProfile(profile)}
                            color="primary"
                          >
                            <RefreshIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Export Profile">
                          <IconButton color="info">
                            <FileDownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Profile">
                          <IconButton
                            onClick={() => dispatch(removeProfile(profile.id))}
                            sx={{ color: '#f44336' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                    
                    {profile.mods && profile.mods.length > 0 && (
                      <Box mt={2}>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="caption" color="text.secondary">
                          Mods included:
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" spacing={0.5} mt={1}>
                          {profile.mods.slice(0, 5).map((mod) => (
                            <Chip key={mod.id} label={mod.name} size="small" />
                          ))}
                          {profile.mods.length > 5 && (
                            <Chip label={`+${profile.mods.length - 5}`} size="small" />
                          )}
                        </Stack>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
      
      {/* Mod Detail Dialog */}
      {selectedModForDetail && (
        <ModDetailDialog
          mod={selectedModForDetail}
          onClose={() => setSelectedModForDetail(null)}
          onInstall={handleInstallMod}
        />
      )}
      
      {/* Create Profile Dialog */}
      <Dialog
        open={showCreateProfile}
        onClose={() => setShowCreateProfile(false)}
        PaperProps={{
          sx: {
            background: ui.theme === 'dark'
              ? 'rgba(30, 30, 50, 0.98)'
              : 'rgba(255, 255, 255, 0.98)',
            borderRadius: 3
          }
        }}
      >
        <DialogTitle>Create New Profile</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Profile Name"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            sx={{ mt: 1 }}
          />
          <Typography variant="body2" color="text.secondary" mt={2}>
            This will save your currently installed mods ({mods.installedMods.length} mods)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateProfile(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateProfile}
            disabled={!newProfileName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
