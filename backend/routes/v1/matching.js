const express = require('express');
const MatchingService = require('../../services/matchingService');
const User = require('../../models/User');
const { auth } = require('../../middleware/auth');

const router = express.Router();

// @route   GET /api/v1/matching/smart-matches
// @desc    Get smart matches with compatibility scores
// @access  Private
router.get('/smart-matches', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      minAge,
      maxAge,
      country,
      city,
      religiousLevel,
      maritalStatus
    } = req.query;

    const filters = {};
    if (minAge) filters.minAge = parseInt(minAge);
    if (maxAge) filters.maxAge = parseInt(maxAge);
    if (country) filters.country = country;
    if (city) filters.city = city;
    if (religiousLevel) filters.religiousLevel = religiousLevel;
    if (maritalStatus) filters.maritalStatus = maritalStatus;

    const result = await MatchingService.getSmartMatches(
      req.user.userId,
      filters,
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching smart matches:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching smart matches'
    });
  }
});

// @route   GET /api/v1/matching/compatibility/:userId
// @desc    Get compatibility score with specific user
// @access  Private
router.get('/compatibility/:userId', auth, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const compatibility = await MatchingService.calculateCompatibility(
      req.user.userId,
      req.params.userId
    );

    res.json({
      success: true,
      compatibility
    });
  } catch (error) {
    console.error('Error calculating compatibility:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating compatibility'
    });
  }
});

// @route   GET /api/v1/matching/top-picks
// @desc    Get today's top picks (5 curated matches)
// @access  Private
router.get('/top-picks', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const topPicks = await MatchingService.generateTopPicks(req.user.userId, limit);

    res.json({
      success: true,
      topPicks,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error generating top picks:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating top picks'
    });
  }
});

// @route   POST /api/v1/matching/refresh-picks
// @desc    Force refresh today's top picks
// @access  Private
router.post('/refresh-picks', auth, async (req, res) => {
  try {
    // Clear existing picks
    const user = await User.findById(req.user.userId);
    user.topPicks = {
      lastGenerated: null,
      generatedFor: null,
      picks: []
    };
    await user.save();

    // Generate new picks
    const limit = parseInt(req.query.limit) || 5;
    const topPicks = await MatchingService.generateTopPicks(req.user.userId, limit);

    res.json({
      success: true,
      message: 'Top picks refreshed',
      topPicks
    });
  } catch (error) {
    console.error('Error refreshing top picks:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing top picks'
    });
  }
});

module.exports = router;
