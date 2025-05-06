import React, { useState, useEffect } from 'react';
import { Typography, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, IconButton, CircularProgress, LinearProgress } from '@mui/material';
import { fetchSavings, createSavings, deleteSavings, updateSavings } from '../api';
import SectionCard from '../components/SectionCard';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';

function Savings() {
  const [savings, setSavings] = useState([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    target: '',
    deadline: '',
    description: ''
  });
  const [editData, setEditData] = useState({
    goalId: '',
    saved: ''
  });

  useEffect(() => {
    loadSavings();
  }, []);

  const loadSavings = async () => {
    setLoading(true);
    try {
      const response = await fetchSavings();
      if (Array.isArray(response.data)) {
        setSavings(response.data);
        setError('');
      } else {
        setError('Failed to load savings goals');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load savings goals');
    } finally {
      setLoading(false);
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

  const handleEditOpen = (saving) => {
    setEditData({
      goalId: saving._id,
      saved: saving.saved || 0
    });
    setEditOpen(true);
    setError('');
    setErrors({});
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditData({
      goalId: '',
      saved: ''
    });
    setError('');
    setErrors({});
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: undefined
      });
    }
  };

  const handleEditChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: undefined
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Goal name is required';
    if (!formData.target || isNaN(parseFloat(formData.target))) newErrors.target = 'Valid target amount is required';
    if (!formData.deadline) newErrors.deadline = 'Deadline is required';
    return newErrors;
  };

  const validateEditForm = () => {
    const newErrors = {};
    if (editData.saved === '' || isNaN(parseFloat(editData.saved))) newErrors.saved = 'Valid saved amount is required';
    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      setError('');
      setErrors({});
      const response = await createSavings({
        ...formData,
        target: parseFloat(formData.target),
        deadline: new Date(formData.deadline)
      });
      if (response.status === 201 || response.status === 200) {
        handleClose();
        loadSavings();
      } else {
        setError('Failed to create savings goal');
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to create savings goal');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (goalId) => {
    setLoading(true);
    try {
      await deleteSavings(goalId);
      loadSavings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete savings goal');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    const validationErrors = validateEditForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      setError('');
      setErrors({});
      const response = await updateSavings(editData.goalId, {
        saved: parseFloat(editData.saved)
      });
      if (response.status === 200) {
        handleEditClose();
        loadSavings();
      } else {
        setError('Failed to update savings goal');
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to update savings goal');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') {
      amount = parseFloat(amount);
      if (isNaN(amount)) amount = 0;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#4a90e2' }}>
        Savings Goals
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Button variant="contained" onClick={handleOpen} sx={{ mb: 3 }} disabled={loading}>
        Add Savings Goal
      </Button>
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}><CircularProgress /></Box>}
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
            disabled={loading}
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
            InputProps={{
              startAdornment: '₹'
            }}
            disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={handleEditClose}>
        <DialogTitle>Update Savings Goal</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="saved"
            label="Saved Amount"
            type="number"
            fullWidth
            value={editData.saved}
            onChange={handleEditChange}
            error={!!errors.saved}
            helperText={errors.saved}
            InputProps={{
              startAdornment: '₹'
            }}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained" disabled={loading}>Update</Button>
        </DialogActions>
      </Dialog>

      {savings.length === 0 && !error && !loading && (
        <Typography variant="body1" color="text.secondary">
          No savings goals found.
        </Typography>
      )}
      {savings.map((saving) => {
        const progress = saving.target > 0 ? Math.min((saving.saved || 0) / saving.target * 100, 100) : 0;
        return (
          <SectionCard key={saving._id} sx={{ mb: 3, position: 'relative' }}>
            <Typography variant="h6" gutterBottom>{saving.name}</Typography>
            <Typography variant="body1" gutterBottom>Target: {formatCurrency(saving.target)}</Typography>
            <Typography variant="body1" gutterBottom>Current: {formatCurrency(saving.saved || 0)}</Typography>
            <Typography variant="body1" gutterBottom>Deadline: {new Date(saving.deadline).toLocaleDateString()}</Typography>
            {saving.description && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {saving.description}
              </Typography>
            )}
            <Box sx={{ width: '100%', mb: 1 }}>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
            <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
              <IconButton size="small" color="primary" onClick={() => handleEditOpen(saving)} disabled={loading}>
                <EditIcon />
              </IconButton>
              <IconButton size="small" color="error" onClick={() => handleDelete(saving._id)} disabled={loading}>
                <DeleteIcon />
              </IconButton>
            </Box>
          </SectionCard>
        );
      })}
    </Box>
  );
}

export default Savings;
