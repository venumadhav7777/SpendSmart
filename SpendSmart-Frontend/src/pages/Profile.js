import React, { useEffect, useState } from 'react';
import { Typography, Box, TextField, CircularProgress } from '@mui/material';
import { fetchProfile } from '../api';
import SectionCard from '../components/SectionCard';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchProfile();
      setProfile(response.data);
    } catch (err) {
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#4a90e2' }}>
        Profile
      </Typography>
      <SectionCard sx={{ backgroundColor: '#357ABD' }}>
        {loading && <CircularProgress />}
        {error && <Typography color="error">{error}</Typography>}
        {profile && (
          <>
            <TextField
              label="Name"
              value={profile.user.name || ''}
              fullWidth
              margin="normal"
              InputProps={{ readOnly: true }}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Email"
              value={profile.user.email || ''}
              fullWidth
              margin="normal"
              InputProps={{ readOnly: true }}
            />
          </>
        )}
      </SectionCard>
    </Box>
  );
}

export default Profile;
