import React, { useState, useEffect } from 'react';
import { Typography, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert } from '@mui/material';
import { fetchSavings, createSavings } from '../api';
import SectionCard from '../components/SectionCard';

function Savings() {
  const [savings, setSavings] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    target: '',
    deadline: '',
    description: ''
  });

  useEffect(() => {
    loadSavings();
  }, []);

  const loadSavings = async () => {
    try {
      const response = await fetchSavings();
      if (response.data.success) {
        setSavings(response.data.data);
      } else {
        setError('Failed to load savings goals');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load savings goals');
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setError('');
    setErrors({});
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      name: '',
      target: '',
      deadline: '',
      description: ''
    });
    setError('');
    setErrors({});
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error for this field when user types
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: undefined
      });
    }
  };

  const handleSubmit = async () => {
    try {
      setError('');
      setErrors({});

      const response = await createSavings({
        ...formData,
        target: parseFloat(formData.target),
        deadline: new Date(formData.deadline)
      });

      if (response.data.success) {
        handleClose();
        loadSavings();
      } else {
        setError(response.data.message || 'Failed to create savings goal');
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to create savings goal');
      }
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#4a90e2' }}>
        Savings Goals
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Button variant="contained" onClick={handleOpen} sx={{ mb: 3 }}>
        Add Savings Goal
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add New Savings Goal</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Goal Name"
            type="text"
            fullWidth
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
          />
          <TextField
            margin="dense"
            name="target"
            label="Target Amount"
            type="number"
            fullWidth
            value={formData.target}
            onChange={handleChange}
            error={!!errors.target}
            helperText={errors.target}
          />
          <TextField
            margin="dense"
            name="deadline"
            label="Deadline"
            type="date"
            fullWidth
            value={formData.deadline}
            onChange={handleChange}
            error={!!errors.deadline}
            helperText={errors.deadline}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            value={formData.description}
            onChange={handleChange}
            error={!!errors.description}
            helperText={errors.description}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
      {savings.map((saving) => (
        <SectionCard key={saving._id} sx={{ mb: 2 }}>
          <Typography variant="h6">{saving.name}</Typography>
          <Typography variant="body1">Target: ${saving.target}</Typography>
          <Typography variant="body1">Current: ${saving.currentAmount}</Typography>
          <Typography variant="body1">Deadline: {new Date(saving.deadline).toLocaleDateString()}</Typography>
          {saving.description && (
            <Typography variant="body2" color="text.secondary">
              {saving.description}
            </Typography>
          )}
        </SectionCard>
      ))}
    </Box>
  );
}

export default Savings;
