import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';

const TopBar = () => {
  return (
    <AppBar position="fixed" color="default" elevation={1} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Box component="img" src="/logo192.png" alt="Logo" sx={{ width: 40, height: 40, mr: 2 }} />
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', color: '#000' }}>
          SpendSmart
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
