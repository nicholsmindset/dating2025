const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Purchase = require('../../models/Purchase');
const User = require('../../models/User');
const ProfileBoost = require('../../models/ProfileBoost');
const { auth } = require('../../middleware/auth');

const router = express.Router();

// Pricing for à la carte items (in cents)
const ITEM_PRICING = {
  profile_boost: { amount: 499, duration: 30 }, // $4.99 for 30 min boost
  super_likes_pack: { amount: 999, quantity: 10 }, // $9.99 for 10 super likes
  read_receipts: { amount: 299, duration: 30 }, // $2.99 for 30 days
  rewind_pack: { amount: 199, quantity: 5 }, // $1.99 for 5 rewinds
  verification_badge: { amount: 1999 }, // $19.99 one-time
  background_check: { amount: 2999 } // $29.99 one-time
};

// @route   POST /api/v1/purchases/create-payment-intent
// @desc    Create payment intent for à la carte purchase
// @access  Private
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { itemType, quantity = 1 } = req.body;

    if (!ITEM_PRICING[itemType]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item type'
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const pricing = ITEM_PRICING[itemType];
    const totalAmount = pricing.amount * quantity;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'sgd',
      customer: user.subscription.stripeCustomerId,
      metadata: {
        userId: user._id.toString(),
        itemType,
        quantity: quantity.toString()
      },
      description: `Purchase: ${itemType.replace(/_/g, ' ')}`
    });

    // Create purchase record
    const purchase = new Purchase({
      user: user._id,
      itemType,
      itemDetails: {
        name: itemType.replace(/_/g, ' '),
        quantity,
        description: `Purchase of ${quantity} ${itemType.replace(/_/g, ' ')}`
      },
      price: {
        amount: totalAmount,
        currency: 'SGD'
      },
      status: 'pending',
      stripePaymentIntentId: paymentIntent.id
    });

    await purchase.save();

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      purchaseId: purchase._id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment intent'
    });
  }
});

// @route   POST /api/v1/purchases/:purchaseId/confirm
// @desc    Confirm purchase and activate item
// @access  Private
router.post('/:purchaseId/confirm', auth, async (req, res) => {
  try {
    const purchase = await Purchase.findOne({
      _id: req.params.purchaseId,
      user: req.user.userId
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(purchase.stripePaymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      purchase.status = 'completed';

      // Activate the purchased item
      const user = await User.findById(req.user.userId);

      switch (purchase.itemType) {
        case 'profile_boost':
          // Create profile boost with immediate activation
          const now = new Date();
          const boostDuration = ITEM_PRICING.profile_boost.duration || 30; // 30 minutes default
          const boost = new ProfileBoost({
            user: user._id,
            boostType: 'standard',
            status: 'scheduled',
            startTime: now,
            endTime: new Date(now.getTime() + boostDuration * 60000),
            duration: boostDuration,
            purchase: purchase._id,
            isAutoActivated: true
          });
          await boost.save();
          purchase.boostStartTime = boost.startTime;
          purchase.boostEndTime = boost.endTime;
          break;

        case 'super_likes_pack':
          user.subscription.superLikesRemaining += ITEM_PRICING.super_likes_pack.quantity;
          await user.save();
          break;

        case 'read_receipts':
          // Set expiration for 30 days
          purchase.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          break;

        case 'rewind_pack':
          // Add to user's rewind count (you'll need to add this field to User model)
          break;

        case 'verification_badge':
          user.verification.verificationBadgeActive = true;
          await user.save();
          break;
      }

      await purchase.save();

      res.json({
        success: true,
        message: 'Purchase confirmed and item activated',
        purchase
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not successful'
      });
    }
  } catch (error) {
    console.error('Error confirming purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming purchase'
    });
  }
});

// @route   GET /api/v1/purchases
// @desc    Get user's purchase history
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const purchases = await Purchase.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      purchases
    });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchases'
    });
  }
});

// @route   GET /api/v1/purchases/pricing
// @desc    Get pricing for all à la carte items
// @access  Public
router.get('/pricing', (req, res) => {
  const pricing = Object.entries(ITEM_PRICING).map(([itemType, details]) => ({
    itemType,
    displayName: itemType.replace(/_/g, ' '),
    price: details.amount / 100,
    currency: 'SGD',
    ...details
  }));

  res.json({
    success: true,
    pricing
  });
});

module.exports = router;
