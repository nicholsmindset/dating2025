import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { HelmetProvider } from 'react-helmet-async';

// Islamic-themed color palette
const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32', // Islamic green
      light: '#4CAF50',
      dark: '#1B5E20',
    },
    secondary: {
      main: '#D4AF37', // Gold
      light: '#FFD700',
      dark: '#B8860B',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Inter", "Amiri", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Amiri", serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Amiri", serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: '"Amiri", serif',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <SocketProvider>
              <App />
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);