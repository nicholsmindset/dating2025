import React, { useState, useEffect } from 'react';
import {
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Divider
} from '@mui/material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const PaymentForm = ({ onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntent, setPaymentIntent] = useState(null);

  useEffect(() => {
    // Create payment intent when component mounts
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      const response = await axios.post('/api/subscription/create-payment-intent');
      setClientSecret(response.data.clientSecret);
      setPaymentIntent({
        amount: response.data.amount,
        currency: response.data.currency
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      setError('Failed to initialize payment. Please try again.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError('');

    const card = elements.getElement(CardElement);

    // Confirm payment
    const { error: stripeError, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: card,
          billing_details: {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
          },
        },
      }
    );

    if (stripeError) {
      setError(stripeError.message);
      setLoading(false);
      if (onError) onError(stripeError);
    } else {
      // Payment succeeded
      console.log('Payment succeeded:', confirmedPayment);
      if (onSuccess) onSuccess(confirmedPayment);
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 500, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom align="center" sx={{ color: '#2E7D32', fontWeight: 'bold' }}>
          Premium Subscription
        </Typography>
        
        <Typography variant="body1" align="center" sx={{ mb: 3, color: '#666' }}>
          Unlock full access to all profiles and features
        </Typography>

        {paymentIntent && (
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="h6" align="center">
              {(paymentIntent.amount / 100).toFixed(2)} {paymentIntent.currency.toUpperCase()}
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary">
              Monthly subscription
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Payment Details
            </Typography>
            <Box
              sx={{
                p: 2,
                border: '1px solid #ddd',
                borderRadius: 1,
                bgcolor: '#fff'
              }}
            >
              <CardElement options={cardElementOptions} />
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={!stripe || loading}
            sx={{
              py: 1.5,
              bgcolor: '#2E7D32',
              '&:hover': {
                bgcolor: '#1B5E20'
              },
              '&:disabled': {
                bgcolor: '#ccc'
              }
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                Processing...
              </Box>
            ) : (
              `Pay ${paymentIntent ? (paymentIntent.amount / 100).toFixed(2) : '23.00'} SGD`
            )}
          </Button>
        </form>

        <Typography variant="body2" align="center" sx={{ mt: 2, color: '#666' }}>
          Your payment is secured by Stripe. Cancel anytime.
        </Typography>
      </Paper>
    </motion.div>
  );
};

export default PaymentForm;