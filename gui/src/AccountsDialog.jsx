import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Avatar,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Chip,
  Paper
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { addAccount, removeAccount, selectAccount } from './launcherSlice';
import { closeAccountDialog } from './uiSlice';

export default function AccountsDialog() {
  const dispatch = useDispatch();
  const launcher = useSelector(state => state.launcher);
  const ui = useSelector(state => state.ui);
  
  const [newUsername, setNewUsername] = React.useState('');
  const [newToken, setNewToken] = React.useState('');

  const handleAddAccount = () => {
    if (newUsername.trim()) {
      dispatch(addAccount({
        username: newUsername.trim(),
        token: newToken || 'offline',
        type: newToken ? 'microsoft' : 'offline'
      }));
      setNewUsername('');
      setNewToken('');
    }
  };

  const handleSelectAccount = (username) => {
    dispatch(selectAccount(username));
  };

  const handleRemoveAccount = (username) => {
    dispatch(removeAccount(username));
  };

  const handleClose = () => {
    dispatch(closeAccountDialog());
  };

  return (
    <Dialog
      open={ui.accountDialogOpen}
      onClose={handleClose}
      maxWidth="md"
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
          <AccountIcon sx={{ fontSize: 32, color: '#FF9800' }} />
          <Typography variant="h5">Manage Accounts</Typography>
        </Stack>
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Add New Account Form */}
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
            <PersonAddIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Add New Account
          </Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter username for offline mode"
              variant="outlined"
              InputProps={{
                startAdornment: <AccountIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            <TextField
              fullWidth
              label="Microsoft Token (Optional)"
              value={newToken}
              onChange={(e) => setNewToken(e.target.value)}
              placeholder="Leave empty for offline mode"
              variant="outlined"
              type="password"
              InputProps={{
                startAdornment: <SecurityIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            <Button
              variant="contained"
              onClick={handleAddAccount}
              disabled={!newUsername.trim()}
              startIcon={<AddIcon />}
              sx={{
                background: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #8BC34A, #4CAF50)',
                }
              }}
            >
              Add Account
            </Button>
          </Stack>
        </Paper>

        <Divider sx={{ my: 2 }} />

        {/* Existing Accounts List */}
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          <CheckCircleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Existing Accounts ({launcher.config.accounts.length})
        </Typography>
        
        {launcher.config.accounts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <AccountIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
            <Typography color="text.secondary">
              No accounts added yet. Add your first account above!
            </Typography>
          </Box>
        ) : (
          <List>
            {launcher.config.accounts.map((account, index) => (
              <motion.div
                key={account.username}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ListItem
                  selected={launcher.config.selectedAccount === account.username}
                  onClick={() => handleSelectAccount(account.username)}
                  sx={{
                    mb: 1,
                    borderRadius: 2,
                    cursor: 'pointer',
                    background: launcher.config.selectedAccount === account.username
                      ? ui.theme === 'dark'
                        ? 'rgba(76, 175, 80, 0.2)'
                        : 'rgba(76, 175, 80, 0.1)'
                      : 'transparent',
                    '&:hover': {
                      background: ui.theme === 'dark'
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.04)',
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        background: `linear-gradient(135deg, ${
                          account.type === 'microsoft' ? '#2196F3' : '#9E9E9E'
                        }, ${
                          account.type === 'microsoft' ? '#1976D2' : '#757575'
                        })`,
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                      }}
                    >
                      {account.username.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {account.username}
                        </Typography>
                        {launcher.config.selectedAccount === account.username && (
                          <Chip
                            label="Selected"
                            size="small"
                            color="success"
                            sx={{ height: 20 }}
                          />
                        )}
                      </Stack>
                    }
                    secondary={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" color="text.secondary">
                          {account.type === 'microsoft' ? 'Microsoft Account' : 'Offline Mode'}
                        </Typography>
                        <Chip
                          label={account.type}
                          size="small"
                          color={account.type === 'microsoft' ? 'primary' : 'default'}
                        />
                      </Stack>
                    }
                  />
                  <IconButton
                    edge="end"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveAccount(account.username);
                    }}
                    sx={{
                      color: '#f44336',
                      '&:hover': {
                        background: 'rgba(244, 67, 54, 0.1)',
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItem>
              </motion.div>
            ))}
          </List>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
