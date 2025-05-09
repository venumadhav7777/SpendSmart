import React, { useState } from 'react';
import { Typography, Box, TextField, Button, Alert, Link } from '@mui/material';
import { register } from '../api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SectionCard from '../components/SectionCard';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleRegister = async () => {
    setError('');
    setErrors({});
    try {
      const response = await register(name, email, password);
      // Backend returns user data and token directly
      const { _id, name: userName, email: userEmail, role, token } = response.data;

      // Store user data and token in AuthContext
      authLogin({ _id, name: userName, email: userEmail, role }, token);

      // Registration successful, navigate to dashboard

      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.message === 'Email already registered') {
        setError('An account with this email already exists. Please login or use a different email.');
        setErrors({ email: 'Email already registered' });
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to register. Please try again.');
      }
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#4a90e2' }}>
        Register
      </Typography>
      <SectionCard sx={{ maxWidth: 400, mx: 'auto', p: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          margin="normal"
          error={!!errors.name}
          helperText={errors.name}
        />
        <TextField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          margin="normal"
          error={!!errors.email}
          helperText={errors.email}
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          error={!!errors.password}
          helperText={errors.password}
        />
        <Button variant="contained" onClick={handleRegister} fullWidth sx={{ mt: 2 }}>
          Register
        </Button>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Already have an account?{' '}
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/login')}
              sx={{
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              Login here
            </Link>
          </Typography>
        </Box>
      </SectionCard>
    </Box>
  );
}

export default Register;
