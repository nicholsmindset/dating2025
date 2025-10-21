const express = require('express');
const SubscriptionPlan = require('../../models/SubscriptionPlan');
const { auth } = require('../../middleware/auth');

const router = express.Router();

// @route   GET /api/v1/subscription-plans
// @desc    Get all active subscription plans
// @access  Public
router.get('/', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true })
      .sort({ sortOrder: 1 });

    res.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription plans'
    });
  }
});

// @route   GET /api/v1/subscription-plans/:planName
// @desc    Get specific subscription plan details
// @access  Public
router.get('/:planName', async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findOne({
      name: req.params.planName,
      isActive: true
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    res.json({
      success: true,
      plan
    });
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription plan'
    });
  }
});

// @route   GET /api/v1/subscription-plans/compare/all
// @desc    Get comparison of all plans
// @access  Public
router.get('/compare/all', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true })
      .sort({ sortOrder: 1 });

    const comparison = plans.map((plan) => ({
      name: plan.name,
      displayName: plan.displayName,
      description: plan.description,
      monthlyPrice: plan.price.monthly.amount / 100,
      annualPrice: plan.price.annual?.amount / 100,
      annualDiscount: plan.price.annual?.discount || 0,
      features: plan.features
    }));

    res.json({
      success: true,
      comparison
    });
  } catch (error) {
    console.error('Error comparing plans:', error);
    res.status(500).json({
      success: false,
      message: 'Error comparing plans'
    });
  }
});

module.exports = router;
