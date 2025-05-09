import React, { useEffect, useState, useMemo } from 'react';
import { Typography, Box, Button, TextField, CircularProgress, MenuItem, Alert, LinearProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, IconButton, Tooltip, Card, CardContent, Grid, InputAdornment, FormControl, InputLabel, Select } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { fetchBudgets, createBudget, updateBudget, deleteBudget, fetchBudgetSummary } from '../api';
import SectionCard from '../components/SectionCard';
import { CheckCircle as CheckCircleIcon, Warning as WarningIcon, Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';

// Import export function for PDF
import { exportBudgetsToPDF } from '../utils/pdfExport';

function Budgets() {
  const theme = useTheme();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
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
      const response = await fetchBudgetSummary();
      setBudgets(response.data || []);
    } catch (err) {
      setError('Failed to fetch budgets summary.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = async () => {
    if (!newBudget.name || !newBudget.category || !newBudget.limit || !newBudget.period) {
      setError('Please fill in all fields');
      return;
    }
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
    const handleTransactionsUpdated = () => {
      loadBudgets();
    };
    window.addEventListener('transactionsUpdated', handleTransactionsUpdated);
    return () => {
      window.removeEventListener('transactionsUpdated', handleTransactionsUpdated);
    };
  }, []);

  const startEditing = (budget) => {
    setEditingBudgetId(budget.budgetId);
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
      await deleteBudget(budgetToDelete.budgetId || budgetToDelete._id);
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

  const handleExportPDF = () => {
    exportBudgetsToPDF(budgets);
  };

  // Filter budgets based on search term and category
  const filteredBudgets = useMemo(() => {
    return budgets.filter(budget => {
      // Search term filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        budget.name.toLowerCase().includes(searchLower) ||
        budget.category.toLowerCase().includes(searchLower);
      
      // Category filter - show all if no category selected
      const matchesCategory = !selectedCategory || budget.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [budgets, searchTerm, selectedCategory]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Budgets</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleExportPDF}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              py: 1,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              },
              transition: 'all 0.3s ease'
            }}
          >
            Export to PDF
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateBudget}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              py: 1,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3
              },
              transition: 'all 0.3s ease'
            }}
          >
            Add Budget
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 4, bgcolor: 'background.paper', transition: 'background-color 0.3s ease' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Search Budgets"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                placeholder="Search by name or category"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover': {
                      '& > fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Category"
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      '&:hover': {
                        borderColor: 'primary.main',
                      },
                    },
                  }}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LinearProgress sx={{ flexGrow: 1, height: 10, borderRadius: 5, backgroundColor: theme.palette.grey[300] }} />
          <Typography variant="body2" color="textSecondary" sx={{ minWidth: 100 }}>
            Loading budgets...
          </Typography>
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {filteredBudgets.map((budget) => {
          const status = getBudgetStatus(budget);
          const isEditing = editingBudgetId === budget.budgetId;

          return (
            <Grid item xs={12} sm={6} md={4} key={budget.budgetId}>
              <Card sx={{ 
                height: '100%', 
                bgcolor: 'background.paper',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    {isEditing ? (
                      <TextField
                        size="small"
                        value={editBudget.name}
                        onChange={(e) => handleEditChange('name', e.target.value)}
                        sx={{ mr: 1 }}
                      />
                    ) : (
                      <Typography variant="h6" component="div">
                        {budget.name}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {status.icon}
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => startEditing(budget)} sx={{ ml: 1 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => openDeleteDialog(budget)} sx={{ ml: 1 }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {budget.category}
                  </Typography>

                  <Box sx={{ mt: 2, mb: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((budget.spent / budget.limit) * 100, 100)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: status.color,
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Spent: {formatCurrency(budget.spent)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Limit: {formatCurrency(budget.limit)}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Period: {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            transition: 'background-color 0.3s ease'
          }
        }}
      >
        <DialogTitle>Delete Budget</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this budget? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Budgets;
