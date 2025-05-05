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
  CardContent,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip as MuiTooltip
} from '@mui/material';
import { fetchBudgets, fetchSavings, fetchTransactionsFromDB, getBalance } from '../api';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
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
import Card from '../components/Card';
import { motion } from 'framer-motion';

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
      const [budgetsData, savingsData, transactionsData, balanceData] = await Promise.all([
        fetchBudgets(),
        fetchSavings(),
        fetchTransactionsFromDB(),
        getBalance()
      ]);
      console.log("balanceData: ", balanceData);

      const budgetsList = budgetsData.data || [];
      const savingsList = savingsData.data || [];
      const transactionsList = transactionsData.data.transactions || [];
      const currentBalance = balanceData.data.balance || 0;

      console.log("currentBalance: ", currentBalance);

      setBudgets(budgetsList);
      setSavings(savingsList);
      setTransactions(transactionsList);
      setBalance(currentBalance);

      // Calculate monthly spending by category
      const spendingByCategory = {};
      const monthlyData = {};
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      let currentMonthIncome = 0;
      let currentMonthExpenses = 0;
      let lastMonthIncome = 0;
      let lastMonthExpenses = 0;

      transactionsList.forEach(tx => {
        const txDate = new Date(tx.date);
        const txMonth = txDate.getMonth();
        const txYear = txDate.getFullYear();
        const isCurrentMonth = txMonth === currentMonth && txYear === currentYear;
        const isLastMonth = txMonth === lastMonth && txYear === lastMonthYear;

        // Handle income (positive amounts)
        if (tx.amount > 0) {
          if (isCurrentMonth) currentMonthIncome += tx.amount;
          if (isLastMonth) lastMonthIncome += tx.amount;
        } 
        // Handle expenses (negative amounts)
        else {
          const expenseAmount = Math.abs(tx.amount);
          if (isCurrentMonth) currentMonthExpenses += expenseAmount;
          if (isLastMonth) lastMonthExpenses += expenseAmount;
          
          // Categorize spending
          const category = tx.category?.[0] || 'Other';
          spendingByCategory[category] = (spendingByCategory[category] || 0) + expenseAmount;
          
          // Group by month for trend analysis
          const month = txDate.toLocaleString('default', { month: 'short' });
          monthlyData[month] = (monthlyData[month] || 0) + expenseAmount;
        }
      });

      // Calculate trends and rates
      const incomeTrend = lastMonthIncome ? ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
      const expensesTrend = lastMonthExpenses ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;
      const savingsRate = currentMonthIncome ? ((currentMonthIncome - currentMonthExpenses) / currentMonthIncome) * 100 : 0;
      const lastMonthSavingsRate = lastMonthIncome ? ((lastMonthIncome - lastMonthExpenses) / lastMonthIncome) * 100 : 0;
      const savingsTrend = lastMonthSavingsRate ? ((savingsRate - lastMonthSavingsRate) / lastMonthSavingsRate) * 100 : 0;

      // Update summary data
      setSummaryData({
        totalBalance: currentBalance,
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

      // Sort transactions by date for recent transactions display
      const sortedTransactions = [...transactionsList].sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(sortedTransactions);

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

  const processTransactions = (transactions) => {
    const categoryTotals = {};
    const categoryCounts = {};
    const categoryColors = {
      'Food & Dining': '#FF6B6B',
      'Shopping': '#4ECDC4',
      'Transportation': '#45B7D1',
      'Entertainment': '#96CEB4',
      'Bills & Utilities': '#FFEEAD',
      'Health & Fitness': '#D4A5A5',
      'Travel': '#9B59B6',
      'Personal Care': '#3498DB',
      'Education': '#2ECC71',
      'Gifts & Donations': '#E74C3C',
      'Business': '#F1C40F',
      'Other': '#95A5A6'
    };

    transactions.forEach(tx => {
      if (tx.amount < 0) { // Only process expenses
        const category = tx.mapped_category?.primary || 'Other';
        const amount = Math.abs(tx.amount);
        
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });

    return Object.entries(categoryTotals).map(([category, total]) => ({
      category,
      total,
      count: categoryCounts[category],
      color: categoryColors[category] || categoryColors['Other']
    })).sort((a, b) => b.total - a.total);
  };

  // Helper to round trend values
  const roundTrend = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return 0;
    return Math.round(value * 10) / 10;
  };

  // Helper to get last 6 months labels
  const getLast6Months = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth() + 1}`,
        label: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        month: d.getMonth()
      });
    }
    return months;
  };

  // Prepare monthly trend data for last 6 months
  const getMonthlyTrendData = (transactions) => {
    const months = getLast6Months();
    const data = months.map(m => ({ name: m.label, income: 0, expenses: 0 }));
    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      const txYear = txDate.getFullYear();
      const txMonth = txDate.getMonth();
      const idx = months.findIndex(m => m.year === txYear && m.month === txMonth);
      if (idx !== -1) {
        if (tx.amount > 0) {
          data[idx].income += tx.amount;
        } else {
          data[idx].expenses += Math.abs(tx.amount);
        }
      }
    });
    return data;
  };

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const income = payload.find(p => p.dataKey === 'income')?.value || 0;
      const expenses = payload.find(p => p.dataKey === 'expenses')?.value || 0;
      return (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2">{label}</Typography>
          <Typography variant="body2" color="success.main">
            Income: ${income.toFixed(2)}
          </Typography>
          <Typography variant="body2" color="error.main">
            Expenses: ${expenses.toFixed(2)}
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
          <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
            <Card
              title="Total Balance"
              value={formatCurrency(summaryData.totalBalance)}
              icon={<AccountBalance sx={{ fontSize: 32 }} />}
              color="#2196F3"
              trend={{ value: roundTrend(summaryData.incomeTrend), label: 'vs last month' }}
            />
          </motion.div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
            <Card
              title="Monthly Income"
              value={formatCurrency(summaryData.monthlyIncome)}
              icon={<TrendingUp sx={{ fontSize: 32 }} />}
              color="#4CAF50"
              trend={{ value: roundTrend(summaryData.incomeTrend), label: 'vs last month' }}
            />
          </motion.div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
            <Card
              title="Monthly Expenses"
              value={formatCurrency(summaryData.monthlyExpenses)}
              icon={<TrendingDown sx={{ fontSize: 32 }} />}
              color="#F44336"
              trend={{ value: roundTrend(summaryData.expensesTrend), label: 'vs last month' }}
            />
          </motion.div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
            <Card
              title="Savings Rate"
              value={formatPercentage(summaryData.savingsRate)}
              icon={<Savings sx={{ fontSize: 32 }} />}
              color="#00BCD4"
              trend={{ value: roundTrend(summaryData.savingsTrend), label: 'vs last month' }}
            />
          </motion.div>
        </Grid>
        <Grid item xs={12} md={8}>
          <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
            <Card
              title="Income vs Expenses"
              subtitle="Last 6 months"
            >
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getMonthlyTrendData(transactions)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="income" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#F44336" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </motion.div>
        </Grid>
        <Grid item xs={12} md={4}>
          <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
            <Card
              title="Spending by Category"
              subtitle="Current month"
            >
              <Box sx={{ height: 300, mt: 2 }}>
                {transactions.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={processTransactions(transactions)}
                        dataKey="total"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        label={({ category, percent }) =>
                          `${category} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        labelLine={false}
                      >
                        {processTransactions(transactions).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" height={36} />
                      <Tooltip
                        formatter={(value, name, props) =>
                          [`$${value.toFixed(2)}`, props.payload.category]
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography color="text.secondary">No transaction data available</Typography>
                  </Box>
                )}
              </Box>
            </Card>
          </motion.div>
        </Grid>
        <Grid item xs={12}>
          <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
            <Card
              title="Budget Overview"
              subtitle="Current month"
            >
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
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;