import React, { useState } from 'react';
import { Typography, Box, TextField, Button, Alert, Link } from '@mui/material';
import { login } from '../api';
import { useNavigate } from 'react-router-dom';
import SectionCard from '../components/SectionCard';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    setErrors({});
    try {
      const response = await login(email, password);
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to login. Please try again.');
      }
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#4a90e2' }}>
        Login
      </Typography>
      <SectionCard sx={{ maxWidth: 400, mx: 'auto', p: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
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
        <Button variant="contained" onClick={handleLogin} fullWidth sx={{ mt: 2 }}>
          Login
        </Button>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Don't have an account?{' '}
            <Link 
              component="button" 
              variant="body2" 
              onClick={() => navigate('/register')}
              sx={{ 
                color: 'primary.main',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              Register here
            </Link>
          </Typography>
        </Box>
      </SectionCard>
    </Box>
  );
}

export default Login;
