import React, { useState, useEffect } from 'react';
import { Typography, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, IconButton, CircularProgress, LinearProgress, Grid, Card, CardContent, InputAdornment } from '@mui/material';
import { fetchSavings, createSavings, deleteSavings, updateSavings } from '../api';
import SectionCard from '../components/SectionCard';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Savings Goals</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Add Goal
        </Button>
      </Box>

      <Grid container spacing={3}>
        {savings.map((goal) => (
          <Grid item xs={12} sm={6} md={4} key={goal._id}>
            <Card sx={{ 
              height: '100%', 
              bgcolor: 'background.paper',
              transition: 'background-color 0.3s ease'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="div">
                    {goal.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleEditOpen(goal)}
                    sx={{ color: 'text.secondary' }}
                  >
                    <EditIcon />
                  </IconButton>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Target: {formatCurrency(goal.target)}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Current: {formatCurrency(goal.saved || 0)}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={(goal.saved || 0) / goal.target * 100}
                    color="primary"
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'action.hover',
                    }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1, textAlign: 'right' }}
                  >
                    {((goal.saved || 0) / goal.target * 100).toFixed(1)}%
                  </Typography>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Target Date: {new Date(goal.deadline).toLocaleDateString()}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleEditOpen(goal)}
                    sx={{ color: 'primary.main' }}
                  >
                    Edit
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            transition: 'background-color 0.3s ease'
          }
        }}
      >
        <DialogTitle>
          {editOpen ? 'Edit Goal' : 'Add Goal'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Goal Name"
                  value={formData.name}
                  onChange={handleChange}
                  error={!!errors.name}
                  helperText={errors.name}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Target Amount"
                  type="number"
                  value={formData.target}
                  onChange={handleChange}
                  error={!!errors.target}
                  helperText={errors.target}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleChange}
                  error={!!errors.deadline}
                  helperText={errors.deadline}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={handleChange}
                  error={!!errors.description}
                  helperText={errors.description}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editOpen}
        onClose={handleEditClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            transition: 'background-color 0.3s ease'
          }
        }}
      >
        <DialogTitle>
          Edit Goal
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Saved Amount"
                  type="number"
                  value={editData.saved}
                  onChange={handleEditChange}
                  error={!!errors.saved}
                  helperText={errors.saved}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button
            onClick={handleUpdate}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Box>
  );
}

export default Savings;
