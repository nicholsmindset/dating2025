const express = require('express');
const { auth } = require('../middleware/auth');
const { getMatchSuggestions, calculateMatchScore, isMutualMatch } = require('../services/matchingService');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/matches/suggestions
// @desc    Get match suggestions for current user
// @access  Private
router.get('/suggestions', auth, async (req, res) => {
  try {
    const { limit = 20, skip = 0, minScore = 40 } = req.query;

    const matches = await getMatchSuggestions(req.user.userId, {
      limit: parseInt(limit),
      skip: parseInt(skip),
      minScore: parseInt(minScore)
    });

    res.json({
      success: true,
      count: matches.length,
      matches
    });

  } catch (error) {
    console.error('Get match suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get match suggestions'
    });
  }
});

// @route   GET /api/matches/score/:userId
// @desc    Get match score with a specific user
// @access  Private
router.get('/score/:userId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    const targetUser = await User.findById(req.params.userId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const matchScore = calculateMatchScore(currentUser, targetUser);

    res.json({
      success: true,
      matchScore,
      userId: targetUser._id
    });

  } catch (error) {
    console.error('Get match score error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate match score'
    });
  }
});

// @route   GET /api/matches/mutual
// @desc    Get mutual matches (users who liked each other)
// @access  Private
router.get('/mutual', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId)
      .populate('likedProfiles', '-password -resetPasswordToken -verificationToken')
      .lean();

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find mutual matches
    const mutualMatches = [];

    for (const likedUser of currentUser.likedProfiles || []) {
      const theyLikedBack = likedUser.likedProfiles?.some(
        id => id.toString() === req.user.userId
      );

      if (theyLikedBack) {
        // Calculate match score
        const fullLikedUser = await User.findById(likedUser._id);
        const fullCurrentUser = await User.findById(req.user.userId);
        const matchScore = calculateMatchScore(fullCurrentUser, fullLikedUser);

        mutualMatches.push({
          ...likedUser,
          matchScore
        });
      }
    }

    // Sort by match score
    mutualMatches.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      count: mutualMatches.length,
      matches: mutualMatches
    });

  } catch (error) {
    console.error('Get mutual matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get mutual matches'
    });
  }
});

// @route   GET /api/matches/check/:userId
// @desc    Check if there's a mutual match with specific user
// @access  Private
router.get('/check/:userId', auth, async (req, res) => {
  try {
    const isMutual = await isMutualMatch(req.user.userId, req.params.userId);

    res.json({
      success: true,
      isMutualMatch: isMutual,
      userId: req.params.userId
    });

  } catch (error) {
    console.error('Check mutual match error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check mutual match'
    });
  }
});

// @route   GET /api/matches/top
// @desc    Get top matches for current user (highest scores)
// @access  Private
router.get('/top', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get high-quality matches with min score of 60%
    const matches = await getMatchSuggestions(req.user.userId, {
      limit: parseInt(limit),
      skip: 0,
      minScore: 60
    });

    res.json({
      success: true,
      count: matches.length,
      matches
    });

  } catch (error) {
    console.error('Get top matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top matches'
    });
  }
});

module.exports = router;
