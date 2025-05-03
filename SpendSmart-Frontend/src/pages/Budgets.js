import React, { useEffect, useState } from 'react';
import { Typography, Box, Button, TextField, List, ListItem, ListItemText, CircularProgress, MenuItem, Alert } from '@mui/material';
import { exportBudgetsToPDF } from '../utils/pdfExport';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchBudgets, createBudget } from '../api';
import SectionCard from '../components/SectionCard';

function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newBudget, setNewBudget] = useState({
    name: '',
    category: '',
    limit: '',
    period: 'monthly' // default to monthly
  });

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
              startAdornment: '$'
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
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={budgets} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="limit" fill="#1976d2" />
          </BarChart>
        </ResponsiveContainer>
        <List>
          {budgets.map((budget) => (
            <ListItem key={budget._id} sx={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
              <ListItemText
                primary={`${budget.name} - ${budget.category} - $${budget.limit}`}
                secondary={`Period: ${budget.period}`}
              />
            </ListItem>
          ))}
        </List>
      </SectionCard>
    </Box>
  );
}

export default Budgets;
