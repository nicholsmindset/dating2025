import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Check,
  Star,
  Visibility,
  Chat,
  Security,
  Speed,
  Support,
  WorkspacePremium,
  Payment,
  Cancel
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { toast } from 'react-toastify';
import PaymentForm from '../../components/payment/PaymentForm';
import { SubscriptionSEO } from '../../components/common/SEO';
import Breadcrumbs from '../../components/common/Breadcrumbs';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const Subscription = () => {
  const [loading, setLoading] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const isPremium = user?.subscription?.plan === 'premium' && 
                   user?.subscription?.status === 'active';

  useEffect(() => {
    fetchSubscriptionHistory();
  }, []);

  const fetchSubscriptionHistory = async () => {
    try {
      const response = await axios.get('/api/subscription/history');
      if (response.data.success) {
        setSubscriptionHistory(response.data.history);
      }
    } catch (error) {
      console.error('Failed to fetch subscription history:', error);
    }
  };

  const handleUpgrade = () => {
    setPaymentDialog(true);
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      toast.success('Payment successful! Your premium subscription is now active.');
      setPaymentDialog(false);
      
      // Refresh user data
      const response = await axios.get('/api/user/profile');
      if (response.data.success) {
        updateUser(response.data.user);
      }
      
    } catch (error) {
      console.error('Post-payment error:', error);
      toast.error('Payment succeeded but there was an error updating your account. Please contact support.');
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    toast.error(error.message || 'Payment failed. Please try again.');
  };

  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      
      const response = await axios.post('/api/subscription/cancel');
      
      if (response.data.success) {
        updateUser(response.data.user);
        toast.success('Subscription cancelled successfully');
        setCancelDialog(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const freeFeatures = [
    { text: '10 profile views per month', icon: <Visibility /> },
    { text: 'Blurred profile photos', icon: <Visibility /> },
    { text: 'Basic matching', icon: <Check /> },
    { text: 'Limited chat features', icon: <Chat /> },
    { text: 'Community support', icon: <Support /> }
  ];

  const premiumFeatures = [
    { text: 'Unlimited profile views', icon: <Visibility /> },
    { text: 'Full-resolution photos', icon: <Visibility /> },
    { text: 'Advanced matching algorithm', icon: <Star /> },
    { text: 'Unlimited messaging', icon: <Chat /> },
    { text: 'Read receipts', icon: <Check /> },
    { text: 'Priority customer support', icon: <Support /> },
    { text: 'Profile boost feature', icon: <Speed /> },
    { text: 'Advanced privacy controls', icon: <Security /> },
    { text: 'See who liked your profile', icon: <Star /> },
    { text: 'Wali supervision tools', icon: <Security /> }
  ];

  return (
    <>
      <SubscriptionSEO />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Breadcrumbs />
        {/* Header */}
        <Box textAlign="center" mb={6}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #2E7D32, #4CAF50)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Choose Your Plan
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Find your perfect halal match with the right plan for you
        </Typography>
      </Box>

      {/* Current Subscription Status */}
      {isPremium && (
        <Alert
          severity="success"
          icon={<WorkspacePremium />}
          sx={{ mb: 4, fontSize: '1.1rem' }}
        >
          <Typography variant="h6" component="div">
            You're currently on the Premium plan
          </Typography>
          <Typography variant="body2">
            Next billing date: {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}
          </Typography>
        </Alert>
      )}

      {/* Pricing Cards */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        {/* Free Plan */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: !isPremium ? '2px solid' : '1px solid',
                borderColor: !isPremium ? 'primary.main' : 'divider',
                position: 'relative'
              }}
            >
              {!isPremium && (
                <Chip
                  label="Current Plan"
                  color="primary"
                  sx={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }}
                />
              )}
              
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 4 }}>
                <Typography variant="h4" component="h2" gutterBottom>
                  Free Plan
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h2" component="div" color="primary">
                    $0
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Forever free
                  </Typography>
                </Box>
                
                <List>
                  {freeFeatures.map((feature, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {feature.icon}
                      </ListItemIcon>
                      <ListItemText primary={feature.text} />
                    </ListItem>
                  ))}
                </List>
                
                <Box sx={{ mt: 3 }}>
                  {!isPremium ? (
                    <Button
                      variant="outlined"
                      size="large"
                      disabled
                      fullWidth
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      size="large"
                      fullWidth
                      onClick={() => setCancelDialog(true)}
                      startIcon={<Cancel />}
                    >
                      Downgrade to Free
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Premium Plan */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: isPremium ? '2px solid' : '1px solid',
                borderColor: isPremium ? 'warning.main' : 'divider',
                position: 'relative',
                background: isPremium 
                  ? 'linear-gradient(135deg, #fff8e1 0%, #ffffff 100%)'
                  : 'white'
              }}
            >
              {isPremium && (
                <Chip
                  label="Current Plan"
                  color="warning"
                  icon={<WorkspacePremium />}
                  sx={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }}
                />
              )}
              
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                  <WorkspacePremium sx={{ fontSize: 32, color: 'warning.main', mr: 1 }} />
                  <Typography variant="h4" component="h2">
                    Premium Plan
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h2" component="div" color="warning.main">
                    $23
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    SGD per month
                  </Typography>
                </Box>
                
                <List>
                  {premiumFeatures.map((feature, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {feature.icon}
                      </ListItemIcon>
                      <ListItemText primary={feature.text} />
                    </ListItem>
                  ))}
                </List>
                
                <Box sx={{ mt: 3 }}>
                  {isPremium ? (
                    <Button
                      variant="contained"
                      size="large"
                      disabled
                      fullWidth
                      sx={{
                        background: 'linear-gradient(45deg, #FF8F00, #FFA000)',
                        '&:disabled': {
                          background: 'linear-gradient(45deg, #FF8F00, #FFA000)',
                          color: 'white'
                        }
                      }}
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={handleUpgrade}
                      startIcon={<Payment />}
                      sx={{
                        background: 'linear-gradient(45deg, #2E7D32, #4CAF50)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #1B5E20, #2E7D32)'
                        }
                      }}
                    >
                      Upgrade Now
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Features Comparison */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom textAlign="center">
          Why Choose Premium?
        </Typography>
        
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Box textAlign="center">
              <Visibility sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Unlimited Access
              </Typography>
              <Typography variant="body2" color="text.secondary">
                View unlimited profiles without restrictions and see full-resolution photos
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box textAlign="center">
              <Star sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Advanced Matching
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Get better matches with our advanced algorithm and see who liked your profile
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box textAlign="center">
              <Security sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Enhanced Privacy
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Advanced privacy controls and enhanced wali supervision tools
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Subscription History */}
      {subscriptionHistory.length > 0 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Subscription History
          </Typography>
          
          <List>
            {subscriptionHistory.map((item, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={`${item.plan} Plan - ${item.status}`}
                    secondary={`${new Date(item.startDate).toLocaleDateString()} - ${new Date(item.endDate).toLocaleDateString()}`}
                  />
                  <Typography variant="body2" color="primary">
                    ${item.amount}
                  </Typography>
                </ListItem>
                {index < subscriptionHistory.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Cancel Subscription Dialog */}
      <Dialog
        open={cancelDialog}
        onClose={() => setCancelDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Cancel Premium Subscription
        </DialogTitle>
        
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Are you sure you want to cancel your Premium subscription?
          </Alert>
          
          <Typography variant="body1" paragraph>
            You will lose access to:
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon>
                <Cancel color="error" />
              </ListItemIcon>
              <ListItemText primary="Unlimited profile views" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Cancel color="error" />
              </ListItemIcon>
              <ListItemText primary="Full-resolution photos" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Cancel color="error" />
              </ListItemIcon>
              <ListItemText primary="Advanced matching features" />
            </ListItem>
          </List>
          
          <Typography variant="body2" color="text.secondary">
            Your subscription will remain active until {new Date(user?.subscription?.currentPeriodEnd).toLocaleDateString()}
          </Typography>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>
            Keep Premium
          </Button>
          
          <Button
            onClick={handleCancelSubscription}
            disabled={loading}
            color="error"
            variant="contained"
          >
            {loading ? 'Cancelling...' : 'Cancel Subscription'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ color: '#2E7D32' }}>
            Complete Your Subscription
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" gutterBottom>
              You're subscribing to our Premium plan for <strong>23 SGD/month</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This will give you unlimited access to all profiles and premium features.
            </Typography>
          </Box>
          
          <Elements stripe={stripePromise}>
            <PaymentForm
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </Elements>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    </>
  );
};

export default Subscription;