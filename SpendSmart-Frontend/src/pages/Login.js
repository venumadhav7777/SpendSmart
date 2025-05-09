import React, { useState } from 'react';
import { Typography, Box, TextField, Button, Alert, Link } from '@mui/material';
import { login } from '../api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SectionCard from '../components/SectionCard';


function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const { login: authLogin } = useAuth();

  // Get the redirect path from location state, or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async () => {
    setError('');
    setErrors({});
    try {
      const response = await login(email, password);
      // Backend returns user data and token directly
      const { _id, name, email: userEmail, role, token } = response.data;
      
      // Store user data and token in AuthContext
      authLogin({ _id, name, email: userEmail, role }, token);
      
      // Login successful
      
      // Navigate to the page they were trying to access, or dashboard
      navigate(from, { replace: true });
    } catch (err) {
      if (err.response?.data?.message) {
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
