const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const {
  getUserActivityStats,
  getPlatformAnalytics,
  getRetentionMetrics,
  getFeatureUsageStats,
  trackUserAction,
  getMatchSuccessMetrics
} = require('../services/analyticsService');

const router = express.Router();

// @route   GET /api/analytics/my-activity
// @desc    Get current user's activity statistics
// @access  Private
router.get('/my-activity', auth, async (req, res) => {
  try {
    const period = req.query.period || 'week'; // day, week, month, year

    const result = await getUserActivityStats(req.user.userId, { period });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Get my activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activity statistics'
    });
  }
});

// @route   POST /api/analytics/track
// @desc    Track user action
// @access  Private
router.post('/track', auth, async (req, res) => {
  try {
    const { action, metadata } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Action type is required'
      });
    }

    const result = await trackUserAction(req.user.userId, action, metadata);

    res.json(result);

  } catch (error) {
    console.error('Track action error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track action'
    });
  }
});

// @route   GET /api/analytics/platform
// @desc    Get platform-wide analytics (admin only)
// @access  Private (Admin)
router.get('/platform', adminAuth, async (req, res) => {
  try {
    const period = req.query.period || 'month'; // day, week, month, year

    const result = await getPlatformAnalytics({ period });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Get platform analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get platform analytics'
    });
  }
});

// @route   GET /api/analytics/retention
// @desc    Get user retention metrics (admin only)
// @access  Private (Admin)
router.get('/retention', adminAuth, async (req, res) => {
  try {
    const cohortPeriod = req.query.cohortPeriod || 'week'; // week or month

    const result = await getRetentionMetrics({ cohortPeriod });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Get retention metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get retention metrics'
    });
  }
});

// @route   GET /api/analytics/features
// @desc    Get feature usage statistics (admin only)
// @access  Private (Admin)
router.get('/features', adminAuth, async (req, res) => {
  try {
    const result = await getFeatureUsageStats();

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Get feature usage stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get feature usage statistics'
    });
  }
});

// @route   GET /api/analytics/match-success
// @desc    Get match success metrics (admin only)
// @access  Private (Admin)
router.get('/match-success', adminAuth, async (req, res) => {
  try {
    const period = req.query.period || 'month';

    const result = await getMatchSuccessMetrics({ period });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Get match success metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get match success metrics'
    });
  }
});

// @route   GET /api/analytics/dashboard
// @desc    Get comprehensive dashboard data (admin only)
// @access  Private (Admin)
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const period = req.query.period || 'month';

    // Get all analytics data in parallel
    const [
      platformAnalytics,
      retentionMetrics,
      featureUsage,
      matchSuccess
    ] = await Promise.all([
      getPlatformAnalytics({ period }),
      getRetentionMetrics({ cohortPeriod: 'week' }),
      getFeatureUsageStats(),
      getMatchSuccessMetrics({ period })
    ]);

    res.json({
      success: true,
      period,
      dashboard: {
        platform: platformAnalytics.analytics || {},
        retention: retentionMetrics.overall || {},
        features: featureUsage.features || {},
        matchSuccess: matchSuccess.metrics || {}
      }
    });

  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard analytics'
    });
  }
});

module.exports = router;
