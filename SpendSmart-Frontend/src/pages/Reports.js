import React from 'react';
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
} from 'recharts';

const spendingData = [
  { name: 'Housing', value: 1200 },
  { name: 'Food', value: 800 },
  { name: 'Transportation', value: 400 },
  { name: 'Entertainment', value: 300 },
  { name: 'Utilities', value: 200 },
  { name: 'Other', value: 100 },
];

const monthlyData = [
  { name: 'Jan', income: 4000, expenses: 2400 },
  { name: 'Feb', income: 3000, expenses: 1398 },
  { name: 'Mar', income: 2000, expenses: 9800 },
  { name: 'Apr', income: 2780, expenses: 3908 },
  { name: 'May', income: 1890, expenses: 4800 },
  { name: 'Jun', income: 2390, expenses: 3800 },
];

const COLORS = ['#2196F3', '#4CAF50', '#F44336', '#FFC107', '#9C27B0', '#00BCD4'];

const Reports = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Financial Reports
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            title="Monthly Income"
            value="$4,500.00"
            icon={<TrendingUpIcon />}
            color="#4CAF50"
            trend={{ value: 8.2, label: 'vs last month' }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            title="Monthly Expenses"
            value="$3,200.00"
            icon={<TrendingDownIcon />}
            color="#F44336"
            trend={{ value: -5.3, label: 'vs last month' }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            title="Savings Rate"
            value="28.9%"
            icon={<SavingsIcon />}
            color="#00BCD4"
            trend={{ value: 3.1, label: 'vs last month' }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            title="Net Worth"
            value="$45,678.90"
            icon={<AccountBalanceIcon />}
            color="#2196F3"
            trend={{ value: 12.5, label: 'vs last month' }}
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
                  <Tooltip />
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
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {spendingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card
            title="Detailed Spending Analysis"
            subtitle="Monthly breakdown"
          >
            <Box sx={{ mt: 2 }}>
              {spendingData.map((category, index) => (
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
                      backgroundColor: COLORS[index % COLORS.length],
                      mr: 2,
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1">{category.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      ${category.value.toFixed(2)}
                    </Typography>
                  </Box>
                  <Typography variant="subtitle1" color="text.secondary">
                    {((category.value / spendingData.reduce((acc, curr) => acc + curr.value, 0)) * 100).toFixed(1)}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports; 