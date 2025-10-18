const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { pusherService } = require('../services/pusherService');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Rate limiting for profile operations
const profileRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: 'Too many profile requests, please try again later'
});

router.use(auth, profileRateLimit);

const isPremiumUser = user => user?.subscription?.plan === 'premium';

const saveIfModified = async user => {
  if (user.isModified()) {
    await user.save();
  }
};

const getViewsRemaining = user => {
  if (isPremiumUser(user)) {
    return 'unlimited';
  }

  const usedViews = user.subscription?.profileViewsThisMonth || 0;
  return Math.max(0, 10 - usedViews);
};

// Get user's own profile
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .populate('wali', 'firstName lastName email phone');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/me', async (req, res) => {
  try {
    const allowedUpdates = [
      'firstName', 'lastName', 'bio', 'location', 'education', 'occupation',
      'height', 'weight', 'interests', 'hobbies', 'religiousLevel', 'prayerFrequency',
      'hijabWearing', 'smokingStatus', 'drinkingStatus', 'partnerPreferences',
      'profilePhoto', 'additionalPhotos', 'phone', 'emergencyContact'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Update last active timestamp
    updates.lastSeen = new Date();

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// View a profile
router.post('/:userId/view', async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const targetUserId = req.params.userId;
    const viewCheck = currentUser.canViewProfile(targetUserId);

    if (!viewCheck.allowed) {
      await saveIfModified(currentUser);

      const statusCode = viewCheck.requiresPremium ? 403 : 400;
      return res.status(statusCode).json({
        message: viewCheck.reason,
        limitReached: viewCheck.requiresPremium
      });
    }

    const { isNewView } = currentUser.recordProfileView(targetUserId);
    await saveIfModified(currentUser);

    if (isNewView) {
      const viewerInfo = {
        id: currentUser._id,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        profilePhoto: currentUser.profilePhoto
      };
      await pusherService.sendProfileView(targetUserId, viewerInfo);
    }

    res.json({ success: true, message: 'Profile viewed', alreadyViewed: !isNewView });
  } catch (error) {
    console.error('View profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like a profile
router.post('/:userId/like', async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const targetUser = await User.findById(req.params.userId);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.params.userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot like yourself' });
    }

    // Check if already liked
    if (currentUser.likedProfiles.includes(req.params.userId)) {
      return res.status(400).json({ message: 'Profile already liked' });
    }

    // Add to liked profiles
    currentUser.likedProfiles.push(req.params.userId);
    await currentUser.save();

    // Check for mutual like (match)
    const isMatch = targetUser.likedProfiles.includes(req.user.id);
    
    // Send like notification via Pusher
    const likerInfo = {
      id: currentUser._id,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      profilePhoto: currentUser.profilePhoto
    };
    await pusherService.sendLikeNotification(req.params.userId, likerInfo);
    
    // If it's a match, send match notification to both users
    if (isMatch) {
      const matchInfo = {
        user1: {
          id: currentUser._id,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          profilePhoto: currentUser.profilePhoto
        },
        user2: {
          id: targetUser._id,
          firstName: targetUser.firstName,
          lastName: targetUser.lastName,
          profilePhoto: targetUser.profilePhoto
        }
      };
      await pusherService.sendMatchNotification(currentUser._id, targetUser._id, matchInfo);
    }

    res.json({ 
      success: true, 
      message: isMatch ? 'It\'s a match!' : 'Profile liked!',
      match: isMatch
    });
  } catch (error) {
    console.error('Like profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get profile by ID
router.get('/:userId', async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ message: 'Current user not found' });
    }

    const targetUserId = req.params.userId;
    const isSelfView = targetUserId === req.user.id;

    if (!isSelfView) {
      const viewCheck = currentUser.canViewProfile(targetUserId);
      if (!viewCheck.allowed) {
        await saveIfModified(currentUser);

        return res.status(viewCheck.requiresPremium ? 403 : 400).json({
          message: viewCheck.reason,
          limitReached: viewCheck.requiresPremium
        });
      }
    } else {
      currentUser.resetMonthlyViews();
      await saveIfModified(currentUser);
    }

    const user = await User.findById(targetUserId)
      .select('-password -resetPasswordToken -resetPasswordExpires -email -phone -emergencyContact')
      .populate('wali', 'firstName lastName');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is blocked
    if (user.blockedUsers.includes(req.user.id) || currentUser.blockedUsers.includes(targetUserId)) {
      return res.status(403).json({ message: 'Profile not accessible' });
    }

    if (!isSelfView) {
      currentUser.recordProfileView(targetUserId);
      await saveIfModified(currentUser);
    }

    // Blur images for free users viewing other profiles
    let profileData = user.toObject();
    if (!isPremiumUser(currentUser) && !isSelfView) {
      profileData.imagesBlurred = true;
      // Keep profile photo but mark as blurred
      if (profileData.additionalPhotos) {
        profileData.additionalPhotos = profileData.additionalPhotos.map(() => null);
      }
    }

    res.json(profileData);
  } catch (error) {
    console.error('Get profile by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Browse profiles with filters
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      minAge,
      maxAge,
      location,
      education,
      maritalStatus,
      religiousLevel,
      hijabWearing,
      smokingStatus,
      drinkingStatus,
      sortBy = 'lastSeen',
      sortOrder = 'desc'
    } = req.query;

    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const premiumUser = isPremiumUser(currentUser);
    currentUser.resetMonthlyViews();

    if (!premiumUser && (currentUser.subscription?.profileViewsThisMonth || 0) >= 10) {
      await saveIfModified(currentUser);

      return res.status(403).json({
        message: 'Monthly profile view limit reached. Upgrade to premium for unlimited access.',
        limitReached: true
      });
    }

    await saveIfModified(currentUser);

    // Build filter
    const filter = {
      _id: { $ne: req.user.id }, // Exclude current user
      accountStatus: 'active',
      gender: currentUser.gender === 'male' ? 'female' : 'male' // Opposite gender
    };

    // Exclude blocked users
    if (currentUser.blockedUsers.length > 0) {
      filter._id.$nin = [...(filter._id.$nin || []), ...currentUser.blockedUsers];
    }

    // Age filter
    if (minAge || maxAge) {
      const today = new Date();
      if (maxAge) {
        const minDate = new Date(today.getFullYear() - maxAge - 1, today.getMonth(), today.getDate());
        filter.dateOfBirth = { $gte: minDate };
      }
      if (minAge) {
        const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
        filter.dateOfBirth = { ...filter.dateOfBirth, $lte: maxDate };
      }
    }

    // Other filters
    if (location) filter.location = new RegExp(location, 'i');
    if (education) filter.education = education;
    if (maritalStatus) filter.maritalStatus = maritalStatus;
    if (religiousLevel) filter.religiousLevel = religiousLevel;
    if (hijabWearing !== undefined) filter.hijabWearing = hijabWearing === 'true';
    if (smokingStatus) filter.smokingStatus = smokingStatus;
    if (drinkingStatus) filter.drinkingStatus = drinkingStatus;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('firstName lastName profilePhoto age location education maritalStatus religiousLevel bio lastSeen')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

    // Blur images for free users
    let profilesData = users.map(user => {
      let userData = user.toObject();
      if (!premiumUser) {
        userData.imagesBlurred = true;
      }
      return userData;
    });

    res.json({
      profiles: profilesData,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      },
      viewsRemaining: getViewsRemaining(currentUser)
    });
  } catch (error) {
    console.error('Browse profiles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Block user
router.post('/:userId/block', async (req, res) => {
  try {
    if (req.params.userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { blockedUsers: req.params.userId } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unblock user
router.delete('/:userId/block', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { blockedUsers: req.params.userId } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Report user
router.post('/:userId/report', async (req, res) => {
  try {
    const { reason, description } = req.body;
    
    if (!reason) {
      return res.status(400).json({ message: 'Report reason is required' });
    }

    if (req.params.userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot report yourself' });
    }

    const reportedUser = await User.findByIdAndUpdate(
      req.params.userId,
      {
        $push: {
          reports: {
            reportedBy: req.user.id,
            reason,
            description,
            reportedAt: new Date(),
            status: 'pending'
          }
        }
      },
      { new: true }
    );

    if (!reportedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User reported successfully' });
  } catch (error) {
    console.error('Report user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get blocked users list
router.get('/blocked/list', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('blockedUsers', 'firstName lastName profilePhoto')
      .select('blockedUsers');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ blockedUsers: user.blockedUsers });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;