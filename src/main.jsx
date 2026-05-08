import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import App from './App';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#74c0fc' },
    secondary: { main: '#f783ac' },
    background: { default: '#070a10', paper: '#0d1119' },
    text: { primary: '#eef2f8', secondary: '#9ca8ba' },
  },
  shape: { borderRadius: 8 },
  typography: { fontFamily: 'Inter, Roboto, Arial, sans-serif' },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(13, 17, 25, 0.96)',
          border: '1px solid rgba(132, 146, 166, 0.20)',
          borderRadius: 8,
          boxShadow: '0 20px 54px rgba(0, 0, 0, 0.34)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          backgroundColor: '#101620',
          borderRadius: 8,
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
