import React, { useEffect, useState } from 'react';
import { Grid, Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Savings as SavingsIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { fetchTransactions, fetchAccounts } from '../api';
import { motion } from 'framer-motion';
import { exportReportsToPDF } from '../utils/pdfExport';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Card';

const COLORS = ['#2196F3', '#4CAF50', '#F44336', '#FFC107', '#9C27B0', '#00BCD4', '#10B981', '#3B82F6', '#14B8A6', '#34D399'];

// Backend categories
const BACKEND_CATEGORIES = [
  'Income', 'Food', 'Transport', 'Shopping', 'Debt', 'Fees', 'Housing', 'Entertainment', 'Health', 'Travel', 'Personal', 'Subscriptions', 'Investments', 'Other'
];

const simplifyCategory = (category) => {
  if (!category) return 'Other';
  const map = {};
  BACKEND_CATEGORIES.forEach(cat => { map[cat.toLowerCase()] = cat; });
  return map[category.toLowerCase()] || 'Other';
};

const Reports = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [txRes, accountsRes] = await Promise.all([
          fetchTransactions(),
          fetchAccounts()
        ]);
        const transactionsList = txRes.data || [];
        const accountsList = accountsRes.data || [];
        
        // Only non-hidden accounts
        const visibleAccounts = accountsList.filter(acc => !acc.isHidden);
        const visibleAccountIds = new Set(visibleAccounts.map(acc => acc._id));
        const visibleTransactions = transactionsList.filter(tx => visibleAccountIds.has(tx.accountId));
        const totalBalance = visibleAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
        
        setTransactions(visibleTransactions);
        setBalance(totalBalance);
        setAccounts(visibleAccounts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Add event listeners for data updates
    const handleDataUpdate = () => {
      loadData();
    };

    window.addEventListener('accountsUpdated', handleDataUpdate);
    window.addEventListener('transactionsUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('accountsUpdated', handleDataUpdate);
      window.removeEventListener('transactionsUpdated', handleDataUpdate);
    };
  }, []);

  // Helper: get last 6 months
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

  // Compute monthly income/expenses for last 6 months
  const getMonthlyTrendData = (transactions) => {
    const months = getLast6Months();
    const data = months.map(m => ({ name: m.label, income: 0, expenses: 0 }));
    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      const txYear = txDate.getFullYear();
      const txMonth = txDate.getMonth();
      const idx = months.findIndex(m => m.year === txYear && m.month === txMonth);
      if (idx !== -1) {
        if (tx.category && tx.category.toLowerCase() === 'income') {
          data[idx].income += Math.abs(tx.amount);
        } else {
          data[idx].expenses += Math.abs(tx.amount);
        }
      }
    });
    return data;
  };

  // Monthly trend data
  const monthlyData = getMonthlyTrendData(transactions);

  // Compute savings rate for current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  let currentIncome = 0, currentExpenses = 0;
  let lastMonthIncome = 0, lastMonthExpenses = 0;
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  transactions.forEach(tx => {
    const txDate = new Date(tx.date);
    const txMonth = txDate.getMonth();
    const txYear = txDate.getFullYear();
    const isCurrentMonth = txMonth === currentMonth && txYear === currentYear;
    const isLastMonth = txMonth === lastMonth && txYear === lastMonthYear;
    if (tx.category && tx.category.toLowerCase() === 'income') {
      if (isCurrentMonth) currentIncome += Math.abs(tx.amount);
      if (isLastMonth) lastMonthIncome += Math.abs(tx.amount);
    } else {
      const expenseAmount = Math.abs(tx.amount);
      if (isCurrentMonth) currentExpenses += expenseAmount;
      if (isLastMonth) lastMonthExpenses += expenseAmount;
    }
  });

  // Calculate savings rate from monthlyData for consistency
  const thisMonthIdx = monthlyData.length - 1;
  const lastMonthIdx = monthlyData.length - 2;
  const currentMonthData = monthlyData[thisMonthIdx] || { income: 0, expenses: 0 };
  const lastMonthData = monthlyData[lastMonthIdx] || { income: 0, expenses: 0 };
  const savingsRate = currentMonthData.income ? Number((((currentMonthData.income - currentMonthData.expenses) / currentMonthData.income) * 100).toFixed(1)) : 0;
  const lastMonthSavingsRate = lastMonthData.income ? Number((((lastMonthData.income - lastMonthData.expenses) / lastMonthData.income) * 100).toFixed(1)) : 0;
  const savingsTrend = lastMonthSavingsRate ? Number((((savingsRate - lastMonthSavingsRate) / lastMonthSavingsRate) * 100).toFixed(1)) : 0;

  // Compute trends for cards
  const incomeTrend = lastMonthIdx >= 0 && lastMonthData.income ? 
    Number((((currentMonthData.income - lastMonthData.income) / lastMonthData.income) * 100).toFixed(1)) : 0;
  const expensesTrend = lastMonthIdx >= 0 && lastMonthData.expenses ? 
    Number((((currentMonthData.expenses - lastMonthData.expenses) / lastMonthData.expenses) * 100).toFixed(1)) : 0;

  // Calculate balance trend by comparing current month's balance with last month's balance
  const getMonthlyBalance = (transactions, month, year) => {
    let balance = 0;
    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      if (txDate.getMonth() === month && txDate.getFullYear() === year) {
        balance += tx.amount;
      }
    });
    return balance;
  };

  const currentMonthBalance = getMonthlyBalance(transactions, currentMonth, currentYear);
  const lastMonthBalance = getMonthlyBalance(transactions, lastMonth, lastMonthYear);
  const balanceTrend = lastMonthBalance ? Number((((currentMonthBalance - lastMonthBalance) / Math.abs(lastMonthBalance)) * 100).toFixed(1)) : 0;

  // Compute spending by category for current month
  const getSpendingByCategory = (transactions) => {
    const categoryTotals = {};
    let totalSpending = 0;
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
        totalSpending += amount;
      }
    });
    return { categoryTotals, totalSpending };
  };

  // Spending by category
  const { categoryTotals, totalSpending } = getSpendingByCategory(transactions);
  const spendingData = Object.entries(categoryTotals).map(([name, value], i) => ({
    name,
    value,
    color: COLORS[i % COLORS.length]
  }));

  // Helper for formatting
  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  const formatPercentage = (value) => `${value.toFixed(1)}%`;

  const handleExportPDF = () => {
    exportReportsToPDF({
      balance,
      monthlyData,
      savingsRate,
      spendingData,
      detailedSpendingData: spendingData.map(s => ({
        name: s.name,
        value: s.value,
        percentage: (s.value / spendingData.reduce((acc, cur) => acc + cur.value, 0)) * 100
      }))
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Reports</Typography>
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
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              title="Total Balance"
              value={formatCurrency(balance)}
              icon={<AccountBalanceIcon sx={{ fontSize: 32 }} />}
              color="#2196F3"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              title="Monthly Income"
              value={formatCurrency(monthlyData[thisMonthIdx]?.income || 0)}
              icon={<TrendingUpIcon sx={{ fontSize: 32 }} />}
              color="#4CAF50"
              trend={{ value: incomeTrend, label: 'vs last month' }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              title="Monthly Expenses"
              value={formatCurrency(monthlyData[thisMonthIdx]?.expenses || 0)}
              icon={<TrendingDownIcon sx={{ fontSize: 32 }} />}
              color="#F44336"
              trend={{ value: expensesTrend, label: 'vs last month' }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              title="Savings Rate"
              value={formatPercentage(savingsRate)}
              icon={<SavingsIcon sx={{ fontSize: 32 }} />}
              color="#00BCD4"
              trend={{ value: savingsTrend, label: 'vs last month' }}
            />
          </Grid>

          <Grid item xs={12} md={8}>
            <Card
              title="Income vs Expenses"
              subtitle="Last 6 months"
            >
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const income = payload.find(p => p.dataKey === 'income')?.value || 0;
                          const expenses = payload.find(p => p.dataKey === 'expenses')?.value || 0;
                          return (
                            <Box sx={{ 
                              bgcolor: 'background.paper', 
                              p: 2, 
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1,
                              boxShadow: 3
                            }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {label}
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.5, color: '#4CAF50' }}>
                                Income: ₹{income.toFixed(2)}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#F44336' }}>
                                Expenses: ₹{expenses.toFixed(2)}
                              </Typography>
                            </Box>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="income" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#F44336" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              title="Spending by Category"
              subtitle="Current month"
            >
              <Box sx={{ height: 300, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      dataKey="value"
                      nameKey="name"
                    >
                      {spendingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const percent = Number(((data.value / totalSpending) * 100).toFixed(1));
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
                                {data.name}
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                Amount: ₹{data.value.toFixed(2)}
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
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card
              title="Detailed Spending Analysis"
              subtitle="Current month breakdown"
            >
              <Box sx={{ mt: 2 }}>
                {spendingData
                  .sort((a, b) => {
                    const percentA = (a.value / totalSpending) * 100;
                    const percentB = (b.value / totalSpending) * 100;
                    return percentB - percentA;
                  })
                  .map((category, index) => (
                    <Box
                      key={category.name}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 2,
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: 'background.default',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 1
                        }
                      }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: category.color,
                          mr: 2,
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1">{category.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatCurrency(category.value)}
                        </Typography>
                      </Box>
                      <Typography variant="subtitle1" color="text.secondary">
                        {Number(((category.value / totalSpending) * 100).toFixed(1))}%
                      </Typography>
                    </Box>
                  ))}
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Reports;
