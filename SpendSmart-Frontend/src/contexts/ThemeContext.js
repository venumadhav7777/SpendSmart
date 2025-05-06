import React, { createContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const lightPalette = {
  primary: {
    main: '#2196F3',
    light: '#64B5F6',
    dark: '#1976D2',
  },
  secondary: {
    main: '#00BCD4',
    light: '#4DD0E1',
    dark: '#0097A7',
  },
  background: {
    default: '#F5F7FA',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#2C3E50',
    secondary: '#546E7A',
  },
};

const darkPalette = {
  primary: {
    main: '#90caf9',
    light: '#e3f2fd',
    dark: '#42a5f5',
  },
  secondary: {
    main: '#80deea',
    light: '#b2ebf2',
    dark: '#4dd0e1',
  },
  background: {
    default: '#2c2c2c',
    paper: '#3a3a3a',
  },
  text: {
    primary: '#e0e0e0',
    secondary: '#b0b0b0',
  },
  action: {
    active: '#90caf9',
    hover: '#64b5f6',
    selected: '#42a5f5',
    disabled: '#777777',
    disabledBackground: '#444444',
  },
};

const ThemeContext = createContext({
  toggleTheme: () => {},
  mode: 'light',
});

export const CustomThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('light');

  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode');
    if (savedMode === 'dark' || savedMode === 'light') {
      setMode(savedMode);
    }
  }, []);

  const toggleTheme = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return newMode;
    });
  };

  const theme = useMemo(() => createTheme({
    palette: mode === 'light' ? lightPalette : darkPalette,
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
      MuiSvgIcon: {
        styleOverrides: {
          root: {
            color: mode === 'light' ? undefined : '#90caf9',
          },
        },
      },
      MuiListItemText: {
        styleOverrides: {
          primary: {
            color: mode === 'light' ? undefined : '#e0e0e0',
          },
          secondary: {
            color: mode === 'light' ? undefined : '#b0b0b0',
          },
        },
      },
    },
  }), [mode]);

  return (
    <ThemeContext.Provider value={{ toggleTheme, mode }}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
