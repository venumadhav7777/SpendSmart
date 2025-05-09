import React, { useEffect, useState, useMemo } from 'react';
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
import { fetchBudgets, fetchSavings, fetchTransactions, fetchBudgetSummary, fetchAccounts } from '../api';
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

const COLORS = ['#2196F3', '#4CAF50', '#F44336', '#FFC107', '#9C27B0', '#00BCD4', '#10B981', '#3B82F6', '#14B8A6', '#34D399'];
const EMPTY_PIE_DATA = [{ name: 'No Data', value: 1 }];

// Helper: backend categories
const BACKEND_CATEGORIES = [
  'Income', 'Food', 'Transport', 'Shopping', 'Debt', 'Fees', 'Housing', 'Entertainment', 'Health', 'Travel', 'Personal', 'Subscriptions', 'Investments', 'Other'
];

// Helper functions
const simplifyCategory = (category) => {
  if (!category) return 'Other';
  const map = {};
  BACKEND_CATEGORIES.forEach(cat => { map[cat.toLowerCase()] = cat; });
  return map[category.toLowerCase()] || 'Other';
};

const isIncomeTransaction = (tx) => tx.category && tx.category.toLowerCase() === 'income';

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
      if (isIncomeTransaction(tx)) {
        data[idx].income += Math.abs(tx.amount);
      } else {
        data[idx].expenses += Math.abs(tx.amount);
      }
    }
  });
  return data;
};

const processTransactions = (transactions) => {
  const categoryTotals = {};
  const categoryCounts = {};
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Define category groups
  const categoryGroups = {
    'Essentials': ['Food', 'Transport', 'Housing', 'Health'],
    'Lifestyle': ['Entertainment', 'Shopping', 'Personal', 'Travel'],
    'Financial': ['Debt', 'Fees', 'Investments'],
    'Subscriptions': ['Subscriptions'],
    'Other': ['Other']
  };

  transactions.forEach(tx => {
    const txDate = new Date(tx.date);
    if (
      tx.category &&
      tx.category.toLowerCase() !== 'income' &&
      txDate.getMonth() === currentMonth &&
      txDate.getFullYear() === currentYear
    ) {
      // Find which group this category belongs to
      let groupName = 'Other';
      for (const [group, categories] of Object.entries(categoryGroups)) {
        if (categories.includes(tx.category)) {
          groupName = group;
          break;
        }
      }

      const amount = Math.abs(tx.amount);
      categoryTotals[groupName] = (categoryTotals[groupName] || 0) + amount;
      categoryCounts[groupName] = (categoryCounts[groupName] || 0) + 1;
    }
  });

  // Convert to array and sort by amount
  let sortedCategories = Object.entries(categoryTotals)
    .map(([category, total], index) => ({
      category,
      total,
      count: categoryCounts[category],
      color: COLORS[index % COLORS.length]
    }))
    .sort((a, b) => b.total - a.total);

  return sortedCategories;
};

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

  const now = new Date();

  // Memoize expensive calculations
  const processedData = useMemo(() => {
    if (!transactions.length) return {
      monthlyTrendData: [],
      categoryData: [],
      processedTransactions: []
    };

    return {
      monthlyTrendData: getMonthlyTrendData(transactions),
      categoryData: processTransactions(transactions),
      processedTransactions: [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date))
    };
  }, [transactions]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [budgetsData, savingsData, txRes, balanceData, accountsRes] = await Promise.all([
        fetchBudgets(),
        fetchSavings(),
        fetchTransactions(),
        fetchBudgetSummary(),
        fetchAccounts()
      ]);
      const budgetsList = budgetsData.data || [];
      const savingsList = savingsData.data || [];
      const transactionsList = txRes.data || [];
      const accountsList = accountsRes.data || [];
      
      // Only non-hidden accounts
      const visibleAccounts = accountsList.filter(acc => !acc.isHidden);
      const visibleAccountIds = new Set(visibleAccounts.map(acc => acc._id));
      const visibleTransactions = transactionsList.filter(tx => visibleAccountIds.has(tx.accountId));
      const totalBalance = visibleAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
      
      // Monthly calculations
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      
      let currentMonthIncome = 0, currentMonthExpenses = 0, lastMonthIncome = 0, lastMonthExpenses = 0;
      
      visibleTransactions.forEach(tx => {
        const txDate = new Date(tx.date);
        const txMonth = txDate.getMonth();
        const txYear = txDate.getFullYear();
        const isCurrentMonth = txMonth === currentMonth && txYear === currentYear;
        const isLastMonth = txMonth === lastMonth && txYear === lastMonthYear;
        
        if (isIncomeTransaction(tx)) {
          if (isCurrentMonth) currentMonthIncome += Math.abs(tx.amount);
          if (isLastMonth) lastMonthIncome += Math.abs(tx.amount);
        } else {
          const expenseAmount = Math.abs(tx.amount);
          if (isCurrentMonth) currentMonthExpenses += expenseAmount;
          if (isLastMonth) lastMonthExpenses += expenseAmount;
        }
      });

      // Calculate trends
      const incomeTrend = lastMonthIncome ? ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
      const expensesTrend = lastMonthExpenses ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;
      const savingsRate = currentMonthIncome ? ((currentMonthIncome - currentMonthExpenses) / currentMonthIncome) * 100 : 0;
      const lastMonthSavingsRate = lastMonthIncome ? ((lastMonthIncome - lastMonthExpenses) / lastMonthIncome) * 100 : 0;
      const savingsTrend = lastMonthSavingsRate ? ((savingsRate - lastMonthSavingsRate) / lastMonthSavingsRate) * 100 : 0;

      setSummaryData({
        totalBalance,
        monthlyIncome: currentMonthIncome,
        monthlyExpenses: currentMonthExpenses,
        savingsRate,
        incomeTrend,
        expensesTrend,
        savingsTrend
      });

      setBudgets(budgetsList);
      setSavings(savingsList);
      setTransactions(visibleTransactions);
      setBalance(totalBalance);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Add event listeners for data updates
    const handleDataUpdate = () => {
      console.log('Dashboard: Data update event received');
      loadData();
    };
    
    window.addEventListener('transactionsUpdated', handleDataUpdate);
    window.addEventListener('accountsUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('transactionsUpdated', handleDataUpdate);
      window.removeEventListener('accountsUpdated', handleDataUpdate);
    };
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)' }}>
          <Typography variant="subtitle2">{label}</Typography>
          <Typography variant="body2" color="primary">
            ₹{payload[0].value.toFixed(2)}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
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

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const income = payload.find(p => p.dataKey === 'income')?.value || 0;
      const expenses = payload.find(p => p.dataKey === 'expenses')?.value || 0;
      return (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2">{label}</Typography>
          <Typography variant="body2" color="success.main">
            Income: ₹{income.toFixed(2)}
          </Typography>
          <Typography variant="body2" color="error.main">
            Expenses: ₹{expenses.toFixed(2)}
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
              icon={<AccountBalance />}
              color="#2196F3"
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
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={processedData.monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar dataKey="income" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" fill="#F44336" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
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
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : transactions.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={processedData.categoryData}
                        dataKey="total"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        labelLine={false}
                        label={false}
                      >
                        {processedData.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" height={36} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const total = processedData.categoryData.reduce((sum, item) => sum + item.total, 0);
                            const percent = ((data.total / total) * 100).toFixed(1);
                            return (
                              <Box sx={{ 
                                bgcolor: 'background.paper', 
                                p: 2, 
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                boxShadow: 3
                              }}>
                                <Typography variant="subtitle2" sx={{ color: data.color, fontWeight: 'bold' }}>
                                  {data.category}
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                  Amount: ₹{data.total.toFixed(2)}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                  {percent}% of total spending
                                </Typography>
                              </Box>
                            );
                          }
                          return null;
                        }}
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
