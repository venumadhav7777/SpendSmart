import React, { useEffect, useState } from 'react';
import { Grid, Box, Typography } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Savings as SavingsIcon,
} from '@mui/icons-material';
import Card from '../components/Card';
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
import { fetchTransactionsFromDB, getBalance } from '../api';
import { motion } from 'framer-motion';

const COLORS = ['#2196F3', '#4CAF50', '#F44336', '#FFC107', '#9C27B0', '#00BCD4', '#10B981', '#3B82F6', '#14B8A6', '#34D399'];

const Reports = () => {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const txRes = await fetchTransactionsFromDB();
        setTransactions(txRes.data.transactions || []);
        const balRes = await getBalance();
        setBalance(balRes.data.balance || 0);
      } finally {
        setLoading(false);
      }
    }
    loadData();
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
  const monthlyData = (() => {
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
  })();

  // Compute savings rate for current month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
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

    if (tx.amount > 0) {
      if (isCurrentMonth) currentIncome += tx.amount;
      if (isLastMonth) lastMonthIncome += tx.amount;
    } else {
      const expenseAmount = Math.abs(tx.amount);
      if (isCurrentMonth) currentExpenses += expenseAmount;
      if (isLastMonth) lastMonthExpenses += expenseAmount;
    }
  });

  const savingsRate = currentIncome ? ((currentIncome - currentExpenses) / currentIncome) * 100 : 0;
  const lastMonthSavingsRate = lastMonthIncome ? ((lastMonthIncome - lastMonthExpenses) / lastMonthIncome) * 100 : 0;
  const savingsTrend = lastMonthSavingsRate ? ((savingsRate - lastMonthSavingsRate) / lastMonthSavingsRate) * 100 : 0;

  // Compute trends for cards
  const lastMonthIdx = monthlyData.length - 2;
  const thisMonthIdx = monthlyData.length - 1;
  const incomeTrend = lastMonthIdx >= 0 && monthlyData[lastMonthIdx].income ? 
    ((monthlyData[thisMonthIdx].income - monthlyData[lastMonthIdx].income) / monthlyData[lastMonthIdx].income) * 100 : 0;
  const expensesTrend = lastMonthIdx >= 0 && monthlyData[lastMonthIdx].expenses ? 
    ((monthlyData[thisMonthIdx].expenses - monthlyData[lastMonthIdx].expenses) / monthlyData[lastMonthIdx].expenses) * 100 : 0;

  // Calculate balance trend
  const lastMonthBalance = monthlyData[lastMonthIdx]?.income - monthlyData[lastMonthIdx]?.expenses || 0;
  const currentMonthBalance = monthlyData[thisMonthIdx]?.income - monthlyData[thisMonthIdx]?.expenses || 0;
  const balanceTrend = lastMonthBalance ? ((currentMonthBalance - lastMonthBalance) / lastMonthBalance) * 100 : 0;

  const simplifyCategory = (category) => {
    const categoryMap = {
      'FOOD_AND_DRINK': 'Food & Dining',
      'GENERAL_MERCHANDISE': 'Shopping',
      'TRANSPORTATION': 'Transportation',
      'ENTERTAINMENT': 'Entertainment',
      'BILLS_AND_UTILITIES': 'Bills & Utilities',
      'HEALTHCARE': 'Health & Fitness',
      'TRAVEL': 'Travel',
      'PERSONAL_CARE': 'Personal Care',
      'EDUCATION': 'Education',
      'GIFTS_AND_DONATIONS': 'Gifts & Donations',
      'LOAN_PAYMENTS': 'Debt',
      'BANK_FEES': 'Fees',
      'INVESTMENTS': 'Investments',
      'OTHER': 'Other'
    };
    return categoryMap[category] || 'Other';
  };

  // Compute spending by category for current month
  const categoryTotals = {};
  let totalSpending = 0;
  transactions.forEach(tx => {
    const txDate = new Date(tx.date);
    if (tx.amount > 0 && 
        txDate.getMonth() === currentMonth && 
        txDate.getFullYear() === currentYear &&
        tx.mapped_category?.primary !== 'INCOME' && 
        !tx.mapped_category?.primary?.includes('TRANSFER')) {
      const originalCategory = tx.mapped_category?.primary || 'OTHER';
      const simplifiedCategory = simplifyCategory(originalCategory);
      const amount = tx.amount;
      categoryTotals[simplifiedCategory] = (categoryTotals[simplifiedCategory] || 0) + amount;
      totalSpending += amount;
    }
  });

  const spendingData = Object.entries(categoryTotals).map(([name, value], i) => ({
    name,
    value,
    color: COLORS[i % COLORS.length]
  }));

  // Helper for formatting
  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatPercentage = (value) => `${value.toFixed(1)}%`;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Financial Reports
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
            <Card
              title="Total Balance"
              value={formatCurrency(balance)}
              icon={<AccountBalanceIcon />}
              color="#2196F3"
              trend={{ value: 0, label: '' }}
            />
          </motion.div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
            <Card
              title="Monthly Income"
              value={formatCurrency(monthlyData[thisMonthIdx]?.income || 0)}
              icon={<TrendingUpIcon />}
              color="#4CAF50"
              trend={{ value: Math.round(incomeTrend * 10) / 10, label: 'vs last month' }}
            />
          </motion.div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
            <Card
              title="Monthly Expenses"
              value={formatCurrency(monthlyData[thisMonthIdx]?.expenses || 0)}
              icon={<TrendingDownIcon />}
              color="#F44336"
              trend={{ value: Math.round(expensesTrend * 10) / 10, label: 'vs last month' }}
            />
          </motion.div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
            <Card
              title="Savings Rate"
              value={formatPercentage(savingsRate)}
              icon={<SavingsIcon />}
              color="#00BCD4"
              trend={{ value: Math.round(savingsTrend * 10) / 10, label: 'vs last month' }}
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
                                Income: ${income.toFixed(2)}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#F44336' }}>
                                Expenses: ${expenses.toFixed(2)}
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
          </motion.div>
        </Grid>
        <Grid item xs={12} md={4}>
          <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
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
                          const percent = ((data.value / totalSpending) * 100).toFixed(1);
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
                                Amount: ${data.value.toFixed(2)}
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
          </motion.div>
        </Grid>
        <Grid item xs={12}>
          <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
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
                        {((category.value / totalSpending) * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                  ))}
              </Box>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports; 