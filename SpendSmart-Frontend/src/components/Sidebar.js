import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Typography, Box, Button } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SavingsIcon from '@mui/icons-material/Savings';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PersonIcon from '@mui/icons-material/Person';
import AssistantIcon from '@mui/icons-material/SmartToy';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Transactions', icon: <ReceiptIcon />, path: '/transactions' },
    { text: 'Budgets', icon: <AccountBalanceWalletIcon />, path: '/budgets' },
    { text: 'Savings', icon: <SavingsIcon />, path: '/savings' },
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
    { text: 'AI Assistant', icon: <AssistantIcon />, path: '/ai-assistant' },
    { text: 'Trending', icon: <TrendingUpIcon />, path: '/trending' },
    { text: 'Register', icon: <PersonIcon />, path: '/register' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#f1c40f', // yellow background
          color: '#000', // black text color
          boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
          transition: 'background-color 0.3s ease',
        },
      }}
    >
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <img src="/logo192.png" alt="Logo" style={{ width: 48, height: 48, marginRight: 12 }} />
          <Typography variant="h5" noWrap component="div" sx={{ fontWeight: 'bold', color: '#000' }}>
            SpendSmart
          </Typography>
        </Box>
      </Toolbar>
      <List>
        {menuItems.map(({ text, icon, path }) => (
          <ListItem
            button
            key={text}
            selected={location.pathname === path}
            onClick={() => navigate(path)}
            sx={{
              '&.Mui-selected': {
                backgroundColor: '#f39c12',
                boxShadow: 'inset 5px 0 0 #d4ac0d',
                transition: 'background-color 0.3s ease',
                color: '#000',
              },
              '&:hover': {
                backgroundColor: '#f39c12',
                transition: 'background-color 0.3s ease',
                color: '#000',
              },
              borderRadius: 1,
              marginX: 1,
              marginY: 0.5,
              color: '#000',
            }}
          >
            <ListItemIcon sx={{ color: '#000' }}>{icon}</ListItemIcon>
            <ListItemText primary={text} />
          </ListItem>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ p: 2 }}>
        <Button
          variant="contained"
          startIcon={<ExitToAppIcon sx={{ color: '#000' }} />}
          fullWidth
          onClick={handleLogout}
          sx={{
            backgroundColor: '#f1c40f',
            color: '#000',
            '&:hover': {
              backgroundColor: '#f39c12',
            },
            boxShadow: '0 4px 8px rgba(241, 196, 15, 0.4)',
            transition: 'background-color 0.3s ease',
          }}
        >
          Logout
        </Button>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
