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
  IconButton,
} from '@mui/material';
import {
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import { fetchProfile, updateProfile } from '../api';
import { ThemeContext } from '../contexts/ThemeContext';

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
    avatar: null,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
            avatar: user.avatar || null,
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

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({
          ...prev,
          avatar: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveError('');
    setSuccessMessage('');
    try {
      const fullName = `${profile.firstName} ${profile.lastName}`.trim();
      await updateProfile({ 
        name: fullName, 
        email: profile.email,
        avatar: profile.avatar 
      });
      setSuccessMessage('Profile updated successfully');
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Settings
      </Typography>
      {error ? (
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
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="avatar-upload"
                    type="file"
                    onChange={handleAvatarChange}
                  />
                  <label htmlFor="avatar-upload">
                    <Box sx={{ position: 'relative', cursor: 'pointer' }}>
                      <Avatar
                        src={profile.avatar}
                        sx={{
                          width: 80,
                          height: 80,
                          mr: 2,
                          backgroundColor: 'primary.main',
                        }}
                      >
                        {profile.firstName ? profile.firstName[0].toUpperCase() : 'U'}
                      </Avatar>
                      <IconButton
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          backgroundColor: 'background.paper',
                          '&:hover': { backgroundColor: 'background.paper' },
                        }}
                        size="small"
                      >
                        <PersonIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </label>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                    Click to change avatar
                  </Typography>
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
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notification Settings
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
                    <Switch
                      edge="end"
                      checked={notifications.email}
                      onChange={() => handleNotificationChange('email')}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <NotificationsIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Push Notifications"
                      secondary="Receive push notifications"
                    />
                    <Switch
                      edge="end"
                      checked={notifications.push}
                      onChange={() => handleNotificationChange('push')}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <NotificationsIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Weekly Reports"
                      secondary="Receive weekly spending reports"
                    />
                    <Switch
                      edge="end"
                      checked={notifications.weeklyReport}
                      onChange={() => handleNotificationChange('weeklyReport')}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Appearance
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <PaletteIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Dark Mode"
                      secondary="Switch between light and dark theme"
                    />
                    <Switch
                      edge="end"
                      checked={mode === 'dark'}
                      onChange={toggleTheme}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Settings;
