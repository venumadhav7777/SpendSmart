import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Badge,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AccountBalance as TransactionsIcon,
  Savings as SavingsIcon,
  Assessment as ReportsIcon,
  SmartToy as AIAdvisorIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Transactions', icon: <TransactionsIcon />, path: '/transactions' },
  { text: 'Budgets', icon: <SavingsIcon />, path: '/budgets' },
  { text: 'Savings', icon: <SavingsIcon />, path: '/savings' },
  { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
  { text: 'AI Advisor', icon: <AIAdvisorIcon />, path: '/ai-advisor' },
];

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleProfileMenuClose();
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    handleProfileMenuClose();
    navigate('/settings');
  };

  const handleLogoutClick = () => {
    handleProfileMenuClose();
    logout();
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          SpendSmart
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flex: 1 }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
            sx={{
              mb: 1,
              borderRadius: 2,
              backgroundColor: location.pathname === item.path ? 'rgba(33, 150, 243, 0.08)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(33, 150, 243, 0.12)',
              },
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'text.secondary' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              sx={{
                color: location.pathname === item.path ? 'primary.main' : 'text.primary',
                fontWeight: location.pathname === item.path ? 600 : 400,
              }}
            />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem button onClick={() => navigate('/settings')}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: 'none',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton color="inherit">
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{
                padding: 0,
                '&:hover': {
                  backgroundColor: 'transparent',
                },
              }}
            >
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  cursor: 'pointer',
                  backgroundColor: 'primary.main',
                }}
              >
                U
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                  mt: 1.5,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleProfileClick}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={handleSettingsClick}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogoutClick}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout; 