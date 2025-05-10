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
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    limit: '',
    period: 'monthly'
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
    if (percentage >= 100) return { color: 'error', icon: <WarningIcon color="error" /> };
    if (percentage >= 80) return { color: 'warning', icon: <WarningIcon color="warning" /> };
    return { color: 'success', icon: <CheckCircleIcon color="success" /> };
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

  const handleOpen = () => {
    setOpen(true);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      name: '',
      category: '',
      limit: '',
      period: 'monthly'
    });
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateBudget = async () => {
    if (!formData.name || !formData.category || !formData.limit || !formData.period) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      setError('');
      const response = await createBudget({
        ...formData,
        limit: parseFloat(formData.limit)
      });
      if (response.status === 201 || response.status === 200) {
        handleClose();
        loadBudgets();
      } else {
        setError('Failed to create budget');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create budget');
    } finally {
      setLoading(false);
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
    setEditingBudgetId(budget._id || budget.budgetId);
    setEditBudget({
      name: budget.name,
      category: budget.category,
      limit: budget.limit.toString(),
      period: budget.period || 'monthly'
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
    if (!editBudget.name || !editBudget.category || !editBudget.limit || !editBudget.period) {
      setError('Please fill in all fields');
      return;
    }
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
            onClick={handleOpen}
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
          const isEditing = editingBudgetId === (budget._id || budget.budgetId);

          return (
            <Grid item xs={12} sm={6} md={4} key={budget._id || budget.budgetId}>
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
                      <Box sx={{ width: '100%' }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Name"
                          value={editBudget.name}
                          onChange={(e) => handleEditChange('name', e.target.value)}
                          sx={{ mb: 1 }}
                        />
                        <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                          <InputLabel>Category</InputLabel>
                          <Select
                            value={editBudget.category}
                            onChange={(e) => handleEditChange('category', e.target.value)}
                            label="Category"
                          >
                            {categories.map((category) => (
                              <MenuItem key={category} value={category}>
                                {category}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          fullWidth
                          size="small"
                          label="Limit"
                          type="number"
                          value={editBudget.limit}
                          onChange={(e) => handleEditChange('limit', e.target.value)}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                          sx={{ mb: 1 }}
                        />
                        <FormControl fullWidth size="small">
                          <InputLabel>Period</InputLabel>
                          <Select
                            value={editBudget.period}
                            onChange={(e) => handleEditChange('period', e.target.value)}
                            label="Period"
                          >
                            {periods.map((period) => (
                              <MenuItem key={period.value} value={period.value}>
                                {period.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                          <Button size="small" onClick={cancelEditing}>Cancel</Button>
                          <Button size="small" variant="contained" onClick={handleSave}>Save</Button>
                        </Box>
                      </Box>
                    ) : (
                      <>
                        <Typography variant="h6" component="div">
                          {budget.name}
                        </Typography>
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
                      </>
                    )}
                  </Box>
                  {!isEditing && (
                    <>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Category: {budget.category}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Limit: {formatCurrency(budget.limit)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Period: {budget.period === 'monthly' ? 'Monthly' : 'Weekly'}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(budget.spent / budget.limit) * 100}
                          color={status.color}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'action.hover',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                            }
                          }}
                        />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1, textAlign: 'right' }}
                        >
                          {((budget.spent / budget.limit) * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
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
        <DialogTitle>Add New Budget</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Budget Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={!!error}
                  helperText={error}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    label="Category"
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Limit"
                  name="limit"
                  type="number"
                  value={formData.limit}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Period</InputLabel>
                  <Select
                    name="period"
                    value={formData.period}
                    onChange={handleChange}
                    label="Period"
                  >
                    {periods.map((period) => (
                      <MenuItem key={period.value} value={period.value}>
                        {period.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleCreateBudget}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

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
