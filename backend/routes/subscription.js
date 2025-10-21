const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const PaymentService = require('../services/paymentService');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

// Rate limiting for subscription operations
const subscriptionRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: 'Too many subscription requests, please try again later'
});

router.use(auth, subscriptionRateLimit);

// Get current subscription status
router.get('/status', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('subscription profileViews');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate monthly views for free users
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyViews = user.profileViews.filter(view => {
      const viewDate = new Date(view.viewedAt);
      return viewDate.getMonth() === currentMonth && viewDate.getFullYear() === currentYear;
    }).length;

    const subscriptionData = {
      isPremium: user.isPremium(),
      startDate: user.subscription.startDate,
      endDate: user.subscription.endDate,
      plan: user.subscription.plan,
      monthlyViews,
      viewsRemaining: user.isPremium() ? 'unlimited' : Math.max(0, 10 - monthlyViews),
      features: {
        unlimitedViews: user.isPremium(),
        unblurredPhotos: user.isPremium(),
        advancedFilters: user.isPremium(),
        prioritySupport: user.isPremium(),
        readReceipts: user.isPremium()
      }
    };

    res.json(subscriptionData);
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Free Plan',
        price: 0,
        currency: 'SGD',
        duration: 'monthly',
        features: [
          '10 profile views per month',
          'Blurred photos',
          'Basic chat functionality',
          'Basic search filters',
          'Community support'
        ],
        limitations: [
          'Limited profile views',
          'Photos are blurred',
          'No advanced filters',
          'No priority support'
        ]
      },
      {
        id: 'premium',
        name: 'Premium Plan',
        price: 23,
        currency: 'SGD',
        duration: 'monthly',
        features: [
          'Unlimited profile views',
          'Full-resolution photos',
          'Advanced chat features',
          'Advanced search filters',
          'Priority customer support',
          'Read receipts',
          'Profile boost',
          'Who viewed your profile'
        ],
        popular: true
      }
    ];

    res.json({ plans });
  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create payment intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isPremium() && user.subscription.endDate > new Date()) {
      return res.status(400).json({ message: 'You already have an active premium subscription' });
    }

    // Create or get Stripe customer
    await PaymentService.createOrGetCustomer(req.user.id);

    // Create payment intent
    const paymentIntent = await PaymentService.createPaymentIntent(req.user.id);

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create subscription with payment method
router.post('/create', async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    
    if (!paymentMethodId) {
      return res.status(400).json({ message: 'Payment method is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isPremium() && user.subscription.endDate > new Date()) {
      return res.status(400).json({ message: 'You already have an active premium subscription' });
    }

    // Create subscription with Stripe
    const subscription = await PaymentService.createSubscription(req.user.id, paymentMethodId);

    res.json({
      message: 'Subscription created successfully',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret
      }
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel subscription
router.post('/cancel', async (req, res) => {
  try {
    const subscription = await PaymentService.cancelSubscription(req.user.id);
    
    res.json({ 
      message: 'Subscription cancelled successfully',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Reactivate subscription
router.post('/reactivate', async (req, res) => {
  try {
    const subscription = await PaymentService.reactivateSubscription(req.user.id);
    
    res.json({ 
      message: 'Subscription reactivated successfully',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      }
    });
  } catch (error) {
    console.error('Reactivate subscription error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Get subscription history
router.get('/history', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('subscriptionHistory');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Sort by start date (newest first)
    const history = user.subscriptionHistory.sort((a, b) => 
      new Date(b.startDate) - new Date(a.startDate)
    );

    res.json({ history });
  } catch (error) {
    console.error('Get subscription history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Stripe webhook endpoint
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await PaymentService.handleWebhook(event);
    res.json({received: true});
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ message: 'Webhook handler error' });
  }
});

// Simulate payment processing
async function simulatePayment(paymentMethod, amount) {
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate payment success/failure (90% success rate)
  const success = Math.random() > 0.1;
  
  if (success) {
    return {
      success: true,
      paymentId: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      currency: 'SGD',
      method: paymentMethod
    };
  } else {
    return {
      success: false,
      error: 'Payment declined by bank'
    };
  }
}

// Check expired subscriptions (cron job endpoint)
router.post('/check-expired', async (req, res) => {
  try {
    // Verify cron job authentication token
    const cronSecret = req.headers['x-cron-secret'];
    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Invalid cron secret'
      });
    }

    const expiredUsers = await User.find({
      'subscription.status': 'active',
      'subscription.endDate': { $lt: new Date() }
    });

    for (const user of expiredUsers) {
      user.subscription.status = 'expired';
      user.subscription.plan = 'free';
      await user.save();
    }

    res.json({
      success: true,
      message: `Processed ${expiredUsers.length} expired subscriptions`,
      count: expiredUsers.length
    });
  } catch (error) {
    console.error('Check expired subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create Stripe Customer Portal session
router.post('/create-portal-session', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has a Stripe customer ID
    if (!user.subscription.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'No active Stripe customer found. Please subscribe first.'
      });
    }

    // Create Stripe Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.subscription.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/dashboard`,
    });

    res.json({
      success: true,
      url: session.url
    });
  } catch (error) {
    console.error('Create portal session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create portal session'
    });
  }
});

module.exports = router;