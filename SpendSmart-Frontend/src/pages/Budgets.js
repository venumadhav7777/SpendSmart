import React, { useEffect, useState } from 'react';
import { Typography, Box, Button, TextField, CircularProgress, MenuItem, Alert, LinearProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, IconButton, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { exportBudgetsToPDF } from '../utils/pdfExport';
import { fetchBudgets, createBudget, updateBudget, deleteBudget } from '../api';
import SectionCard from '../components/SectionCard';
import { CheckCircle as CheckCircleIcon, Warning as WarningIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

function Budgets() {
  const theme = useTheme();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newBudget, setNewBudget] = useState({
    name: '',
    category: '',
    limit: '',
    period: 'monthly' // default to monthly
  });

  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [editBudget, setEditBudget] = useState({
    name: '',
    category: '',
    limit: '',
    period: 'monthly'
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);

  const categories = [
    'Income',
    'Food',
    'Transport',
    'Shopping',
    'Debt',
    'Fees',
    'Housing',
    'Entertainment',
    'Health',
    'Travel',
    'Personal',
    'Subscriptions',
    'Investments',
    'Other'
  ];

  const periods = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'weekly', label: 'Weekly' }
  ];

  const getBudgetStatus = (budget) => {
    const percentage = (budget.spent / budget.limit) * 100;
    if (percentage >= 100) return { color: theme.palette.error.main, icon: <WarningIcon color="error" /> };
    if (percentage >= 80) return { color: theme.palette.warning.main, icon: <WarningIcon color="warning" /> };
    return { color: theme.palette.success.main, icon: <CheckCircleIcon color="success" /> };
  };

  const loadBudgets = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchBudgets();
      setBudgets(response.data || []);
    } catch (err) {
      setError('Failed to fetch budgets.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = async () => {
    // Validate inputs
    if (!newBudget.name || !newBudget.category || !newBudget.limit || !newBudget.period) {
      setError('Please fill in all fields');
      return;
    }

    // Convert limit to number
    const budgetData = {
      ...newBudget,
      limit: parseFloat(newBudget.limit)
    };

    setError('');
    try {
      await createBudget(budgetData);
      setNewBudget({ name: '', category: '', limit: '', period: 'monthly' });
      loadBudgets();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create budget.');
    }
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const startEditing = (budget) => {
    setEditingBudgetId(budget._id);
    setEditBudget({
      name: budget.name,
      category: budget.category,
      limit: budget.limit,
      period: budget.period
    });
  };

  const cancelEditing = () => {
    setEditingBudgetId(null);
    setEditBudget({
      name: '',
      category: '',
      limit: '',
      period: 'monthly'
    });
  };

  const handleEditChange = (field, value) => {
    setEditBudget((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateBudget(editingBudgetId, {
        ...editBudget,
        limit: parseFloat(editBudget.limit)
      });
      cancelEditing();
      loadBudgets();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update budget.');
    }
  };

  const openDeleteDialog = (budget) => {
    setBudgetToDelete(budget);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setBudgetToDelete(null);
    setDeleteDialogOpen(false);
  };

  const confirmDelete = async () => {
    if (!budgetToDelete) return;
    try {
      await deleteBudget(budgetToDelete._id);
      closeDeleteDialog();
      loadBudgets();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete budget.');
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
        Budgets
      </Typography>
      <SectionCard sx={{ mb: 3 }}>
        <Button variant="contained" onClick={() => exportBudgetsToPDF(budgets)} sx={{ mb: 2 }}>
          Export to PDF
        </Button>
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            label="Name"
            value={newBudget.name}
            onChange={(e) => setNewBudget({ ...newBudget, name: e.target.value })}
            sx={{ flex: '1 1 200px' }}
            required
          />
          <TextField
            select
            label="Category"
            value={newBudget.category}
            onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
            sx={{ flex: '1 1 200px' }}
            required
          >
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Limit"
            type="number"
            value={newBudget.limit}
            onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })}
            sx={{ flex: '1 1 150px' }}
            required
            InputProps={{
              startAdornment: '₹'
            }}
          />
          <TextField
            select
            label="Period"
            value={newBudget.period}
            onChange={(e) => setNewBudget({ ...newBudget, period: e.target.value })}
            sx={{ flex: '1 1 150px' }}
            required
          >
            {periods.map((period) => (
              <MenuItem key={period.value} value={period.value}>
                {period.label}
              </MenuItem>
            ))}
          </TextField>
          <Button 
            variant="contained" 
            onClick={handleCreateBudget} 
            sx={{ alignSelf: 'center' }}
            disabled={loading}
          >
            Create Budget
          </Button>
        </Box>
        {loading && <CircularProgress />}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box>
          {budgets.map((budget) => {
            const status = getBudgetStatus(budget);
            const isEditing = editingBudgetId === budget._id;

            return (
              <Box key={budget._id} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                  {isEditing ? (
                    <>
                      <TextField
                        size="small"
                        value={editBudget.name}
                        onChange={(e) => handleEditChange('name', e.target.value)}
                        sx={{ mr: 1, width: 150 }}
                      />
                      <TextField
                        size="small"
                        select
                        value={editBudget.category}
                        onChange={(e) => handleEditChange('category', e.target.value)}
                        sx={{ mr: 1, width: 150 }}
                      >
                        {categories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        size="small"
                        type="number"
                        value={editBudget.limit}
                        onChange={(e) => handleEditChange('limit', e.target.value)}
                        sx={{ mr: 1, width: 100 }}
                        InputProps={{
                          startAdornment: '₹'
                        }}
                      />
                      <TextField
                        size="small"
                        select
                        value={editBudget.period}
                        onChange={(e) => handleEditChange('period', e.target.value)}
                        sx={{ mr: 1, width: 120 }}
                      >
                        {periods.map((period) => (
                          <MenuItem key={period.value} value={period.value}>
                            {period.label}
                          </MenuItem>
                        ))}
                      </TextField>
                      <Button variant="contained" size="small" onClick={handleSave} sx={{ mr: 1 }}>
                        Save
                      </Button>
                      <Button variant="outlined" size="small" onClick={cancelEditing}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Typography variant="body1">{budget.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                      </Typography>
                      {status.icon}
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => startEditing(budget)} sx={{ ml: 2 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => openDeleteDialog(budget)} sx={{ ml: 1 }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </>
                )}
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min((budget.spent / budget.limit) * 100, 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.palette.background.paper,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: status.color,
                    borderRadius: 4
                  }
                }}
              />
            </Box>
          );
        })}
      </Box>
      </SectionCard>

      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this budget?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Budgets;
