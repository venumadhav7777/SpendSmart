import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  Palette as PaletteIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { fetchProfile, updateProfile } from '../api';
import ThemeContext from '../contexts/ThemeContext';

const Settings = () => {
  const { toggleTheme, mode } = useContext(ThemeContext);

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    weeklyReport: true,
  });

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);

  useEffect(() => {
    // Load notification preferences from localStorage
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
    // Load profile
    const loadProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetchProfile();
        const user = response.data.user;
        if (user) {
          const names = user.name ? user.name.split(' ') : ['', ''];
          setProfile({
            firstName: names[0] || '',
            lastName: names.slice(1).join(' ') || '',
            email: user.email || '',
          });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleNotificationChange = (type) => {
    setNotifications((prev) => {
      const newPrefs = { ...prev, [type]: !prev[type] };
      localStorage.setItem('notifications', JSON.stringify(newPrefs));
      return newPrefs;
    });
  };

  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveError('');
    setSuccessMessage('');
    try {
      const fullName = `${profile.firstName} ${profile.lastName}`.trim();
      await updateProfile({ name: fullName, email: profile.email });
      setSuccessMessage('Profile updated successfully');
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSecurityAction = (action) => {
    setAlertMessage(`The "${action}" feature is not implemented yet.`);
    setAlertOpen(true);
  };

  const handlePreferencesAction = (action) => {
    setAlertMessage(`The "${action}" feature is not implemented yet.`);
    setAlertOpen(true);
  };

  const handleDeleteAccount = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAccount = () => {
    setDeleteDialogOpen(false);
    setAlertMessage('Account deletion feature is not implemented yet.');
    setAlertOpen(true);
  };

  const cancelDeleteAccount = () => {
    setDeleteDialogOpen(false);
  };

  const closeAlert = () => {
    setAlertOpen(false);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Settings
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Profile Settings
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mr: 2,
                      backgroundColor: 'primary.main',
                    }}
                  >
                    {profile.firstName ? profile.firstName[0].toUpperCase() : 'U'}
                  </Avatar>
                  <Button variant="outlined" color="primary" disabled>
                    Change Avatar
                  </Button>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={profile.firstName}
                      variant="outlined"
                      onChange={(e) => handleProfileChange('firstName', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={profile.lastName}
                      variant="outlined"
                      onChange={(e) => handleProfileChange('lastName', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={profile.email}
                      variant="outlined"
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    {saveError && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {saveError}
                      </Alert>
                    )}
                    {successMessage && (
                      <Alert severity="success" sx={{ mt: 2 }}>
                        {successMessage}
                      </Alert>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notification Preferences
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <NotificationsIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Email Notifications"
                      secondary="Receive updates via email"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.email}
                          onChange={() => handleNotificationChange('email')}
                        />
                      }
                      label=""
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <NotificationsIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Push Notifications"
                      secondary="Receive real-time updates"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.push}
                          onChange={() => handleNotificationChange('push')}
                        />
                      }
                      label=""
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <NotificationsIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Weekly Reports"
                      secondary="Get weekly financial summaries"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.weeklyReport}
                          onChange={() => handleNotificationChange('weeklyReport')}
                        />
                      }
                      label=""
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Security Settings
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <SecurityIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Two-Factor Authentication"
                      secondary="Add an extra layer of security"
                    />
                    <Button variant="outlined" color="primary" onClick={() => handleSecurityAction('Two-Factor Authentication')}>
                      Enable
                    </Button>
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <SecurityIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Change Password"
                      secondary="Update your account password"
                    />
                    <Button variant="outlined" color="primary" onClick={() => handleSecurityAction('Change Password')}>
                      Change
                    </Button>
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Preferences
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <LanguageIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Language"
                      secondary="English"
                    />
                    <Button variant="outlined" color="primary" onClick={() => handlePreferencesAction('Language')}>
                      Change
                    </Button>
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <PaletteIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Theme"
                      secondary={mode.charAt(0).toUpperCase() + mode.slice(1)}
                    />
                    <Button variant="outlined" color="primary" onClick={toggleTheme}>
                      Toggle Theme
                    </Button>
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="error">
                  Danger Zone
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <DeleteIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Delete Account"
                      secondary="Permanently delete your account and all data"
                    />
                    <Button variant="outlined" color="error" onClick={handleDeleteAccount}>
                      Delete
                    </Button>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDeleteAccount}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Confirm Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to permanently delete your account? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteAccount}>Cancel</Button>
          <Button onClick={confirmDeleteAccount} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={alertOpen}
        onClose={closeAlert}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Feature Not Implemented</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {alertMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAlert} autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
