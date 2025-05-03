import React, { useEffect, useState } from 'react';
import { 
  Typography, 
  Paper, 
  Grid, 
  List, 
  ListItem, 
  ListItemText, 
  CircularProgress, 
  Box, 
  Card, 
  CardContent,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { fetchBudgets, fetchSavings, fetchTransactions } from '../api';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AccountBalance, 
  Savings,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import SectionCard from '../components/SectionCard';

const COLORS = ['#2563EB', '#0D9488', '#10B981', '#3B82F6', '#14B8A6', '#34D399'];
const EMPTY_PIE_DATA = [{ name: 'No Data', value: 1 }];

function Dashboard() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [savings, setSavings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [monthlySpending, setMonthlySpending] = useState(EMPTY_PIE_DATA);
  const [balance, setBalance] = useState(0);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [categorySpending, setCategorySpending] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savingsRate: 0,
    incomeTrend: 0,
    expensesTrend: 0,
    savingsTrend: 0
  });

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
      const currentMonth = new Date().getMonth();
      const lastMonth = currentMonth - 1;
      let currentMonthIncome = 0;
      let currentMonthExpenses = 0;
      let lastMonthIncome = 0;
      let lastMonthExpenses = 0;

      transactionsList.forEach(tx => {
        const txDate = new Date(tx.date);
        const txMonth = txDate.getMonth();
        const txYear = txDate.getFullYear();
        const isCurrentMonth = txMonth === currentMonth && txYear === new Date().getFullYear();
        const isLastMonth = txMonth === lastMonth && txYear === new Date().getFullYear();

        if (tx.amount > 0) {
          if (isCurrentMonth) currentMonthIncome += tx.amount;
          if (isLastMonth) lastMonthIncome += tx.amount;
        } else {
          if (isCurrentMonth) currentMonthExpenses += Math.abs(tx.amount);
          if (isLastMonth) lastMonthExpenses += Math.abs(tx.amount);
          
          const category = tx.category || 'Other';
          spendingByCategory[category] = (spendingByCategory[category] || 0) + Math.abs(tx.amount);
          
          // Group by month
          const month = txDate.toLocaleString('default', { month: 'short' });
          monthlyData[month] = (monthlyData[month] || 0) + Math.abs(tx.amount);
        }
      });

      // Calculate trends
      const incomeTrend = lastMonthIncome ? ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
      const expensesTrend = lastMonthExpenses ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;
      const savingsRate = currentMonthIncome ? ((currentMonthIncome - currentMonthExpenses) / currentMonthIncome) * 100 : 0;
      const lastMonthSavingsRate = lastMonthIncome ? ((lastMonthIncome - lastMonthExpenses) / lastMonthIncome) * 100 : 0;
      const savingsTrend = lastMonthSavingsRate ? ((savingsRate - lastMonthSavingsRate) / lastMonthSavingsRate) * 100 : 0;

      // Update summary data
      setSummaryData({
        totalBalance: balance,
        monthlyIncome: currentMonthIncome,
        monthlyExpenses: currentMonthExpenses,
        savingsRate,
        incomeTrend,
        expensesTrend,
        savingsTrend
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendColor = (value) => {
    return value >= 0 ? '#4CAF50' : '#F44336';
  };

  const getBudgetStatus = (budget) => {
    const percentage = (budget.spent / budget.limit) * 100;
    if (percentage >= 100) return { color: '#F44336', icon: <WarningIcon /> };
    if (percentage >= 80) return { color: '#FFA726', icon: <WarningIcon /> };
    return { color: '#4CAF50', icon: <CheckCircleIcon /> };
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <SectionCard>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccountBalance sx={{ color: '#2196F3', mr: 1 }} />
              <Typography variant="h6">Total Balance</Typography>
            </Box>
            <Typography variant="h4" sx={{ mb: 1 }}>
              {formatCurrency(summaryData.totalBalance)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUp sx={{ color: getTrendColor(summaryData.incomeTrend), mr: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                {formatPercentage(summaryData.incomeTrend)} vs last month
              </Typography>
            </Box>
          </SectionCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SectionCard>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUp sx={{ color: '#4CAF50', mr: 1 }} />
              <Typography variant="h6">Monthly Income</Typography>
            </Box>
            <Typography variant="h4" sx={{ mb: 1 }}>
              {formatCurrency(summaryData.monthlyIncome)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUp sx={{ color: getTrendColor(summaryData.incomeTrend), mr: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                {formatPercentage(summaryData.incomeTrend)} vs last month
              </Typography>
            </Box>
          </SectionCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SectionCard>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingDown sx={{ color: '#F44336', mr: 1 }} />
              <Typography variant="h6">Monthly Expenses</Typography>
            </Box>
            <Typography variant="h4" sx={{ mb: 1 }}>
              {formatCurrency(summaryData.monthlyExpenses)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingDown sx={{ color: getTrendColor(summaryData.expensesTrend), mr: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                {formatPercentage(summaryData.expensesTrend)} vs last month
              </Typography>
            </Box>
          </SectionCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SectionCard>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Savings sx={{ color: '#00BCD4', mr: 1 }} />
              <Typography variant="h6">Savings Rate</Typography>
            </Box>
            <Typography variant="h4" sx={{ mb: 1 }}>
              {formatPercentage(summaryData.savingsRate)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUp sx={{ color: getTrendColor(summaryData.savingsTrend), mr: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                {formatPercentage(summaryData.savingsTrend)} vs last month
              </Typography>
            </Box>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={8}>
          <SectionCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6">Income vs Expenses</Typography>
                <Typography variant="body2" color="text.secondary">Last 6 months</Typography>
              </Box>
              <IconButton onClick={() => navigate('/reports')} size="small">
                <ArrowForwardIcon />
              </IconButton>
            </Box>
            <Box sx={{ height: 300, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <SectionCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6">Recent Transactions</Typography>
                <Typography variant="body2" color="text.secondary">Last 5 transactions</Typography>
              </Box>
              <IconButton onClick={() => navigate('/transactions')} size="small">
                <ArrowForwardIcon />
              </IconButton>
            </Box>
            <List>
              {transactions.slice(0, 5).map((tx, index) => (
                <React.Fragment key={tx._id}>
                  <ListItem>
                    <ListItemText
                      primary={tx.description}
                      secondary={new Date(tx.date).toLocaleDateString()}
                    />
                    <Typography
                      variant="body1"
                      color={tx.amount > 0 ? 'success.main' : 'error.main'}
                    >
                      {formatCurrency(tx.amount)}
                    </Typography>
                  </ListItem>
                  {index < 4 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </SectionCard>
        </Grid>

        <Grid item xs={12}>
          <SectionCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6">Budget Overview</Typography>
                <Typography variant="body2" color="text.secondary">Current month</Typography>
              </Box>
              <IconButton onClick={() => navigate('/budgets')} size="small">
                <ArrowForwardIcon />
              </IconButton>
            </Box>
            <Box sx={{ mt: 2 }}>
              {budgets.map((budget) => {
                const percentage = (budget.spent / budget.limit) * 100;
                const status = getBudgetStatus(budget);
                return (
                  <Box key={budget._id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1">{budget.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                          {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                        </Typography>
                        {status.icon}
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(percentage, 100)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'grey.200',
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
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
