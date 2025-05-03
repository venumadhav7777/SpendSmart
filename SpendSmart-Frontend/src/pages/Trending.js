import React from 'react';
import { Typography, Grid, Paper } from '@mui/material';

const Trending = () => {
  // Placeholder trending items data
  const trendingItems = [
    { id: 1, title: 'Budget Tips', description: 'Learn how to save more effectively.' },
    { id: 2, title: 'Investment Ideas', description: 'Explore new investment opportunities.' },
    { id: 3, title: 'Expense Tracking', description: 'Best apps to track your expenses.' },
  ];

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Trending
      </Typography>
      <Grid container spacing={3}>
        {trendingItems.map((item) => (
          <Grid item xs={12} md={4} key={item.id}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6">{item.title}</Typography>
              <Typography variant="body1">{item.description}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default Trending;
