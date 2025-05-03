import React, { useEffect, useState } from 'react';
import { Typography, Paper, Grid, List, ListItem, ListItemText, CircularProgress, Box, Card, CardContent } from '@mui/material';
import { fetchBudgets, fetchSavings, fetchTransactions } from '../api';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts';
import { TrendingUp, TrendingDown, AccountBalance, Savings } from '@mui/icons-material';

const COLORS = ['#2563EB', '#0D9488', '#10B981', '#3B82F6', '#14B8A6', '#34D399'];
const EMPTY_PIE_DATA = [{ name: 'No Data', value: 1 }];

const data = [
  { name: 'Jan', income: 4000, expenses: 2400 },
  { name: 'Feb', income: 3000, expenses: 1398 },
  { name: 'Mar', income: 2000, expenses: 9800 },
  { name: 'Apr', income: 2780, expenses: 3908 },
  { name: 'May', income: 1890, expenses: 4800 },
  { name: 'Jun', income: 2390, expenses: 3800 },
];

function Dashboard() {
  const [budgets, setBudgets] = useState([]);
  const [savings, setSavings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [monthlySpending, setMonthlySpending] = useState(EMPTY_PIE_DATA);
  const [balance, setBalance] = useState(0);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [categorySpending, setCategorySpending] = useState([]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [budgetsData, savingsData, transactionsData] = await Promise.all([
        fetchBudgets(),
        fetchSavings(),
        fetchTransactions('2023-01-01', '2025-12-31'),
      ]);
      const budgetsList = budgetsData.data || [];
      const savingsList = savingsData.data || [];
      const transactionsList = transactionsData.data.transactions || [];

      setBudgets(budgetsList);
      setSavings(savingsList);
      setTransactions(transactionsList);

      // Calculate monthly spending by category
      const spendingByCategory = {};
      const monthlyData = {};
      transactionsList.forEach(tx => {
        if (tx.amount < 0) {
          const category = tx.category || 'Other';
          spendingByCategory[category] = (spendingByCategory[category] || 0) + Math.abs(tx.amount);
          
          // Group by month
          const month = new Date(tx.date).toLocaleString('default', { month: 'short' });
          monthlyData[month] = (monthlyData[month] || 0) + Math.abs(tx.amount);
        }
      });

      // Prepare pie chart data
      const pieData = Object.entries(spendingByCategory).map(([name, value]) => ({ name, value }));
      setMonthlySpending(pieData.length > 0 ? pieData : EMPTY_PIE_DATA);

      // Prepare monthly trend data
      const trendData = Object.entries(monthlyData).map(([name, value]) => ({ name, value }));
      setMonthlyTrend(trendData);

      // Prepare category spending data for bar chart
      const categoryData = Object.entries(spendingByCategory).map(([name, value]) => ({ name, value }));
      setCategorySpending(categoryData);

      // Calculate balance
      const totalBalance = transactionsList.reduce((acc, tx) => acc + tx.amount, 0);
      setBalance(totalBalance);

    } catch (err) {
      setError('Failed to load dashboard data.');
      setMonthlySpending(EMPTY_PIE_DATA);
      setBalance(0);
      setBudgets([]);
      setSavings([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
          <Typography variant="subtitle2">{label}</Typography>
          <Typography variant="body2" color="primary">
            ${payload[0].value.toFixed(2)}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            title="Total Balance"
            value="$12,345.67"
            icon={<AccountBalance />}
            color="#2196F3"
            trend={{ value: 12.5, label: 'vs last month' }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            title="Monthly Income"
            value="$4,500.00"
            icon={<TrendingUp />}
            color="#4CAF50"
            trend={{ value: 8.2, label: 'vs last month' }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            title="Monthly Expenses"
            value="$3,200.00"
            icon={<TrendingDown />}
            color="#F44336"
            trend={{ value: -5.3, label: 'vs last month' }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            title="Savings Rate"
            value="28.9%"
            icon={<Savings />}
            color="#00BCD4"
            trend={{ value: 3.1, label: 'vs last month' }}
          />
        </Grid>

        <Grid item xs={12}>
          <Card
            title="Income vs Expenses"
            subtitle="Last 6 months"
          >
            <Box sx={{ height: 300, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="income" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#F44336" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            title="Recent Transactions"
            subtitle="Last 5 transactions"
          >
            {/* Add transaction list here */}
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            title="Budget Overview"
            subtitle="Current month"
          >
            {/* Add budget progress bars here */}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
