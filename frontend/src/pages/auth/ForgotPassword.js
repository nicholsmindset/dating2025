import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  Grid
} from '@mui/material';
import {
  Email,
  ArrowBack,
  Mosque,
  CheckCircle
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ForgotPassword = () => {
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Form validation schema
  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Please enter a valid email address')
      .required('Email is required')
  });

  // Formik setup
  const formik = useFormik({
    initialValues: {
      email: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      try {
        const response = await axios.post(`${API_URL}/auth/forgot-password`, {
          email: values.email
        });

        if (response.data.success) {
          setSuccessMessage(
            'Password reset instructions have been sent to your email. Please check your inbox.'
          );
          formik.resetForm();
        }
      } catch (error) {
        setErrorMessage(
          error.response?.data?.message ||
          'Failed to send password reset email. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    }
  });

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
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  mb: 2
                }}
              >
                <Mosque sx={{ fontSize: 40, color: 'primary.main', mr: 1 }} />
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #2E7D32, #4CAF50)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Halal Hearts
                </Typography>
              </Box>
            </motion.div>

            <Typography variant="h5" gutterBottom sx={{ fontWeight: 500 }}>
              Forgot Password?
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enter your email address and we'll send you instructions to reset your password
            </Typography>
          </Box>

          {/* Success Alert */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Alert
                severity="success"
                icon={<CheckCircle />}
                sx={{ mb: 3 }}
              >
                {successMessage}
              </Alert>
            </motion.div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Alert severity="error" sx={{ mb: 3 }}>
                {errorMessage}
              </Alert>
            </motion.div>
          )}

          {/* Forgot Password Form */}
          <Box component="form" onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              {/* Email Field */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email Address"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: 'primary.main'
                      }
                    }
                  }}
                />
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      background: 'linear-gradient(45deg, #2E7D32, #4CAF50)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #1B5E20, #2E7D32)'
                      }
                    }}
                  >
                    {loading ? 'Sending...' : 'Send Reset Instructions'}
                  </Button>
                </motion.div>
              </Grid>

              {/* Back to Login Link */}
              <Grid item xs={12}>
                <Box textAlign="center">
                  <Button
                    component={Link}
                    to="/login"
                    startIcon={<ArrowBack />}
                    sx={{
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'rgba(46, 125, 50, 0.04)'
                      }
                    }}
                  >
                    Back to Login
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Additional Help */}
          <Box
            mt={4}
            p={2}
            sx={{
              backgroundColor: 'rgba(33, 150, 243, 0.05)',
              borderRadius: 2,
              borderLeft: '4px solid #2196F3'
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                textAlign: 'center'
              }}
            >
              <strong>Need help?</strong><br />
              If you don't receive an email within 5 minutes, check your spam folder or contact support.
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default ForgotPassword;
