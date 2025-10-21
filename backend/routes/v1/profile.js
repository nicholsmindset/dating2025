const express = require('express');
const User = require('../../models/User');
const { auth } = require('../../middleware/auth');

const router = express.Router();

// @route   GET /api/v1/profile/completion
// @desc    Get profile completion status
// @access  Private
router.get('/completion', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const percentage = user.calculateProfileCompletion();
    await user.save();

    res.json({
      success: true,
      profileCompletion: {
        percentage,
        missingFields: user.profileCompletion.missingFields,
        suggestions: getSuggestions(user.profileCompletion.missingFields)
      }
    });
  } catch (error) {
    console.error('Error fetching profile completion:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile completion'
    });
  }
});

// Helper function to get suggestions
function getSuggestions(missingFields) {
  const suggestions = [];
  const fieldSuggestions = {
    bio: 'Add a bio to tell others about yourself',
    occupation: 'Add your occupation to help matches understand your lifestyle',
    education: 'Share your education level',
    height: 'Add your height',
    ethnicity: 'Share your ethnicity',
    languages: 'List languages you speak',
    profilePhoto: 'Upload a profile photo to increase your visibility',
    'wali.hasWali': 'Add information about your Wali/Guardian',
    'partnerPreferences.ageRange.min': 'Set your preferred age range',
    'partnerPreferences.ageRange.max': 'Set your preferred age range',
    'partnerPreferences.religiousLevel': 'Specify your religious level preferences',
    hasCompletedQuiz: 'Complete the compatibility quiz for better matches'
  };

  missingFields.forEach((field) => {
    if (fieldSuggestions[field]) {
      suggestions.push({
        field,
        suggestion: fieldSuggestions[field]
      });
    }
  });

  return suggestions;
}

// @route   GET /api/v1/profile/who-liked-me
// @desc    See who liked your profile (premium feature)
// @access  Private
router.get('/who-liked-me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user can access this feature
    const canSee = await user.canUseFeature('see_who_liked_you');
    if (!canSee) {
      return res.status(403).json({
        success: false,
        message: 'Upgrade to premium to see who liked you',
        requiresUpgrade: true,
        totalLikes: user.likedBy?.length || 0
      });
    }

    // Get users who liked this user
    const likedByUsers = await User.find({
      _id: { $in: user.likedBy.map((like) => like.user) }
    }).select('firstName lastName age location profilePhoto religiousLevel maritalStatus');

    // Mark as seen
    if (user.likedBy && user.likedBy.length > 0) {
      user.likedBy.forEach((like) => {
        like.isSeen = true;
      });
      await user.save();
    }

    res.json({
      success: true,
      likedBy: likedByUsers,
      total: likedByUsers.length
    });
  } catch (error) {
    console.error('Error fetching who liked me:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching who liked you'
    });
  }
});

// @route   GET /api/v1/profile/new-likes
// @desc    Get count of unseen likes
// @access  Private
router.get('/new-likes', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const unseenLikes = user.likedBy?.filter((like) => !like.isSeen).length || 0;

    res.json({
      success: true,
      unseenLikes,
      totalLikes: user.likedBy?.length || 0
    });
  } catch (error) {
    console.error('Error fetching new likes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching new likes'
    });
  }
});

// @route   POST /api/v1/profile/verification/request
// @desc    Request profile verification
// @access  Private
router.post('/verification/request', auth, async (req, res) => {
  try {
    const { verificationType, documentUrl } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.verification.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Profile is already verified'
      });
    }

    // In production, this would trigger an admin review
    // For now, auto-verify (you should implement proper verification)
    user.verification = {
      isVerified: true,
      verificationMethod: verificationType,
      verifiedAt: new Date(),
      verificationBadgeActive: true
    };

    await user.save();

    res.json({
      success: true,
      message: 'Verification request submitted successfully',
      verification: user.verification
    });
  } catch (error) {
    console.error('Error requesting verification:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting verification'
    });
  }
});

// @route   GET /api/v1/profile/analytics
// @desc    Get profile analytics (premium feature)
// @access  Private
router.get('/analytics', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const canView = await user.canUseFeature('profile_analytics');
    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Upgrade to premium for profile analytics',
        requiresUpgrade: true
      });
    }

    // Calculate analytics
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const analytics = {
      profileViews: {
        total: user.profileViews?.length || 0,
        lastWeek: user.profileViews?.filter((v) => v.viewedAt >= lastWeek).length || 0,
        lastMonth: user.profileViews?.filter((v) => v.viewedAt >= lastMonth).length || 0
      },
      likes: {
        total: user.likedBy?.length || 0,
        lastWeek: user.likedBy?.filter((l) => l.likedAt >= lastWeek).length || 0,
        lastMonth: user.likedBy?.filter((l) => l.likedAt >= lastMonth).length || 0
      },
      profileCompletion: user.profileCompletion?.percentage || 0,
      isVerified: user.verification?.isVerified || false,
      subscriptionTier: user.getSubscriptionTier(),
      responseRate: calculateResponseRate(user), // You can implement this
      averageResponseTime: calculateAverageResponseTime(user) // You can implement this
    };

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics'
    });
  }
});

// Helper functions (implement as needed)
function calculateResponseRate(user) {
  // Implement logic to calculate response rate to messages
  return 0.75; // 75% placeholder
}

function calculateAverageResponseTime(user) {
  // Implement logic to calculate average response time
  return '2 hours'; // Placeholder
}

module.exports = router;
