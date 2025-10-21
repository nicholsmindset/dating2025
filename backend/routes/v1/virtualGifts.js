const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const VirtualGift = require('../../models/VirtualGift');
const Purchase = require('../../models/Purchase');
const User = require('../../models/User');
const { auth } = require('../../middleware/auth');
const { pusherService } = require('../../services/pusherService');

const router = express.Router();

// @route   GET /api/v1/virtual-gifts
// @desc    Get all available virtual gifts
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { category } = req.query;

    const query = { isActive: true };
    if (category) {
      query.category = category;
    }

    // Check for limited edition gifts
    const now = new Date();
    query.$or = [
      { isLimitedEdition: false },
      {
        isLimitedEdition: true,
        availableFrom: { $lte: now },
        availableUntil: { $gte: now }
      }
    ];

    const gifts = await VirtualGift.find(query).sort({ sortOrder: 1 });

    res.json({
      success: true,
      gifts
    });
  } catch (error) {
    console.error('Error fetching virtual gifts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching virtual gifts'
    });
  }
});

// @route   GET /api/v1/virtual-gifts/categories
// @desc    Get all gift categories
// @access  Private
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await VirtualGift.distinct('category', { isActive: true });

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
});

// @route   POST /api/v1/virtual-gifts/send
// @desc    Send a virtual gift to another user
// @access  Private
router.post('/send', auth, async (req, res) => {
  try {
    const { giftId, recipientId, message } = req.body;

    // Validate inputs
    if (!giftId || !recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Gift and recipient are required'
      });
    }

    const [sender, recipient, gift] = await Promise.all([
      User.findById(req.user.userId),
      User.findById(recipientId),
      VirtualGift.findById(giftId)
    ]);

    if (!sender || !recipient) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!gift || !gift.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Gift not available'
      });
    }

    // Check if user can send gifts (premium feature)
    const canSendGifts = await sender.canUseFeature('send_gifts');
    if (!canSendGifts) {
      return res.status(403).json({
        success: false,
        message: 'Upgrade to premium to send virtual gifts',
        requiresUpgrade: true
      });
    }

    // Check if users haven't blocked each other
    if (sender.blockedUsers.includes(recipientId) || recipient.blockedUsers.includes(sender._id)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot send gift to this user'
      });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: gift.price.amount,
      currency: 'sgd',
      customer: sender.subscription.stripeCustomerId,
      metadata: {
        userId: sender._id.toString(),
        recipientId,
        giftId: gift._id.toString()
      },
      description: `Virtual Gift: ${gift.displayName} to ${recipient.firstName}`
    });

    // Create purchase record
    const purchase = new Purchase({
      user: sender._id,
      itemType: 'virtual_gift',
      itemDetails: {
        name: gift.displayName,
        quantity: 1,
        description: gift.description
      },
      price: {
        amount: gift.price.amount,
        currency: gift.price.currency
      },
      status: 'pending',
      stripePaymentIntentId: paymentIntent.id,
      recipient: recipientId,
      giftMessage: message
    });

    await purchase.save();

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      purchaseId: purchase._id
    });
  } catch (error) {
    console.error('Error sending virtual gift:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending virtual gift'
    });
  }
});

// @route   POST /api/v1/virtual-gifts/confirm/:purchaseId
// @desc    Confirm gift purchase and deliver to recipient
// @access  Private
router.post('/confirm/:purchaseId', auth, async (req, res) => {
  try {
    const purchase = await Purchase.findOne({
      _id: req.params.purchaseId,
      user: req.user.userId,
      itemType: 'virtual_gift'
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    // Verify payment
    const paymentIntent = await stripe.paymentIntents.retrieve(purchase.stripePaymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      purchase.status = 'completed';
      purchase.usedAt = new Date();
      await purchase.save();

      // Update gift purchase count
      await VirtualGift.findByIdAndUpdate(
        paymentIntent.metadata.giftId,
        { $inc: { purchaseCount: 1 } }
      );

      // Send notification to recipient
      const [sender, recipient, gift] = await Promise.all([
        User.findById(req.user.userId).select('firstName lastName profilePhoto'),
        User.findById(purchase.recipient),
        VirtualGift.findById(paymentIntent.metadata.giftId)
      ]);

      if (recipient && gift) {
        await pusherService.sendGiftNotification(purchase.recipient.toString(), 'gift_received', {
          sender: {
            id: sender._id,
            name: `${sender.firstName} ${sender.lastName}`,
            photo: sender.profilePhoto
          },
          gift: {
            name: gift.displayName,
            icon: gift.icon
          },
          message: purchase.giftMessage
        });
      }

      res.json({
        success: true,
        message: 'Gift sent successfully!',
        purchase
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not successful'
      });
    }
  } catch (error) {
    console.error('Error confirming gift:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming gift purchase'
    });
  }
});

// @route   GET /api/v1/virtual-gifts/received
// @desc    Get gifts received by user
// @access  Private
router.get('/received', auth, async (req, res) => {
  try {
    const gifts = await Purchase.find({
      recipient: req.user.userId,
      itemType: 'virtual_gift',
      status: 'completed'
    })
      .populate('user', 'firstName lastName profilePhoto')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      gifts
    });
  } catch (error) {
    console.error('Error fetching received gifts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching received gifts'
    });
  }
});

// @route   GET /api/v1/virtual-gifts/sent
// @desc    Get gifts sent by user
// @access  Private
router.get('/sent', auth, async (req, res) => {
  try {
    const gifts = await Purchase.find({
      user: req.user.userId,
      itemType: 'virtual_gift',
      status: 'completed'
    })
      .populate('recipient', 'firstName lastName profilePhoto')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      gifts
    });
  } catch (error) {
    console.error('Error fetching sent gifts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sent gifts'
    });
  }
});

module.exports = router;
