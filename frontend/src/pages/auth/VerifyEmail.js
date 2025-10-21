import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Button
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Email,
  Mosque
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [verificationState, setVerificationState] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setVerificationState('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }

      try {
        const response = await axios.post(`${API_URL}/auth/verify-email`, { token });

        if (response.data.success) {
          setVerificationState('success');
          setMessage(response.data.message);

          // Store token and user data from verification
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          }

          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        }
      } catch (error) {
        setVerificationState('error');
        setMessage(
          error.response?.data?.message ||
          'Email verification failed. The link may be invalid or expired.'
        );
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  const getIcon = () => {
    switch (verificationState) {
      case 'success':
        return <CheckCircle sx={{ fontSize: 80, color: 'success.main' }} />;
      case 'error':
        return <Error sx={{ fontSize: 80, color: 'error.main' }} />;
      default:
        return <Email sx={{ fontSize: 80, color: 'primary.main' }} />;
    }
  };

  const getTitle = () => {
    switch (verificationState) {
      case 'success':
        return 'Email Verified Successfully!';
      case 'error':
        return 'Verification Failed';
      default:
        return 'Verifying Your Email...';
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
          }}
        >
          {/* Header */}
          <Box textAlign="center" mb={4}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)'
                }}
              >
                <Mosque sx={{ fontSize: 40, color: 'white' }} />
              </Box>
            </motion.div>

            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Email Verification
            </Typography>
          </Box>

          {/* Status Icon */}
          <Box textAlign="center" mb={3}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
            >
              {verificationState === 'verifying' ? (
                <CircularProgress size={80} />
              ) : (
                getIcon()
              )}
            </motion.div>
          </Box>

          {/* Title */}
          <Typography
            variant="h5"
            align="center"
            gutterBottom
            sx={{ fontWeight: 600, mb: 2 }}
          >
            {getTitle()}
          </Typography>

          {/* Message */}
          {message && (
            <Alert
              severity={verificationState === 'success' ? 'success' : verificationState === 'error' ? 'error' : 'info'}
              sx={{ mb: 3 }}
            >
              {message}
            </Alert>
          )}

          {verificationState === 'success' && (
            <Box textAlign="center">
              <Typography variant="body1" color="text.secondary" paragraph>
                Assalamu Alaikum! Your account is now active. You will be redirected to the dashboard shortly...
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/dashboard')}
                sx={{
                  mt: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  textTransform: 'none',
                  fontSize: '1rem',
                  py: 1.5,
                  px: 4,
                  borderRadius: 2,
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #6a3e8f 100%)',
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                  }
                }}
              >
                Go to Dashboard
              </Button>
            </Box>
          )}

          {verificationState === 'error' && (
            <Box textAlign="center">
              <Typography variant="body1" color="text.secondary" paragraph>
                Don't worry! You can request a new verification email.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
                <Button
                  component={Link}
                  to="/resend-verification"
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    textTransform: 'none',
                    fontSize: '1rem',
                    py: 1.5,
                    px: 4,
                    borderRadius: 2,
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #6a3e8f 100%)',
                      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                    }
                  }}
                >
                  Resend Verification
                </Button>
                <Button
                  component={Link}
                  to="/login"
                  variant="outlined"
                  sx={{
                    textTransform: 'none',
                    fontSize: '1rem',
                    py: 1.5,
                    px: 4,
                    borderRadius: 2,
                    borderColor: '#667eea',
                    color: '#667eea',
                    '&:hover': {
                      borderColor: '#5568d3',
                      backgroundColor: 'rgba(102, 126, 234, 0.04)',
                    }
                  }}
                >
                  Back to Login
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </motion.div>
    </Container>
  );
};

export default VerifyEmail;
