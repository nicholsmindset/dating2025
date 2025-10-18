const express = require('express');
const User = require('../models/User');
const { auth, premiumAuth, adminAuth } = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const rateLimit = require('express-rate-limit');
const router = express.Router();

const PREMIUM_ACCESS_STATUSES = ['active', 'trialing', 'past_due'];
const hasPremiumAccess = (subscription = {}) => (
  subscription.plan === 'premium' && PREMIUM_ACCESS_STATUSES.includes(subscription.status)
);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Rate limiting
const profileViewLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // limit each IP to 100 profile views per hour
  message: 'Too many profile views, please try again later'
});

const updateProfileLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 profile updates per 15 minutes
  message: 'Too many profile updates, please try again later'
});

// Get liked profiles
router.get('/liked-profiles', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('likedProfiles', 'firstName lastName profileImage age location')
      .select('likedProfiles');
    
    res.json({
      success: true,
      likedProfiles: user.likedProfiles.map(profile => profile._id)
    });
  } catch (error) {
    console.error('Get liked profiles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get viewed profiles
router.get('/viewed-profiles', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('profileViews');
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const viewedThisMonth = user.profileViews.filter(view => {
      const viewDate = new Date(view.viewedAt);
      return viewDate.getMonth() === currentMonth && viewDate.getFullYear() === currentYear;
    }).map(view => view.profileId);
    
    res.json({
      success: true,
      viewedProfiles: viewedThisMonth
    });
  } catch (error) {
    console.error('Get viewed profiles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .populate('wali', 'firstName lastName email phone');
    
    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update current user profile
router.put('/me', auth, updateProfileLimit, async (req, res) => {
  try {
    const allowedUpdates = [
      'firstName', 'lastName', 'bio', 'dateOfBirth', 'height', 'weight',
      'education', 'occupation', 'income', 'location', 'interests',
      'lookingFor', 'ageRangeMin', 'ageRangeMax', 'maxDistance',
      'religiousLevel', 'prayerFrequency', 'hijabPreference',
      'smokingPreference', 'drinkingPreference', 'dietaryPreferences',
      'languagesSpoken', 'hobbies', 'personalityTraits',
      'familyValues', 'careerAmbitions', 'travelPreferences'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Validate age if dateOfBirth is being updated
    if (updates.dateOfBirth) {
      const age = new Date().getFullYear() - new Date(updates.dateOfBirth).getFullYear();
      if (age < 18) {
        return res.status(400).json({ message: 'Must be at least 18 years old' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires');

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload profile photo
router.post('/me/photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'islamic-marriage-site/profiles',
          transformation: [
            { width: 500, height: 500, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    // Update user profile photo
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePhoto: result.secure_url },
      { new: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires');

    res.json({ profilePhoto: user.profilePhoto });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ message: 'Failed to upload photo' });
  }
});

// Browse profiles with filtering
router.get('/browse', auth, profileViewLimit, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      ageMin,
      ageMax,
      location,
      religiousLevel,
      maritalStatus,
      education,
      maxDistance = 50
    } = req.query;

    // Check if user can view more profiles (subscription limits)
    const currentUser = await User.findById(req.user.id);
    const isPremium = hasPremiumAccess(currentUser.subscription);
    const viewsThisMonth = currentUser.subscription?.profileViewsThisMonth || 0;
    if (!isPremium) {
      if (viewsThisMonth >= 10) {
        return res.status(403).json({
          message: 'Monthly profile view limit reached. Upgrade to premium for unlimited views.',
          requiresPremium: true
        });
      }
    }

    // Build filter query
    const filter = {
      _id: { $ne: req.user.id }, // Exclude current user
      accountStatus: 'active',
      gender: currentUser.gender === 'male' ? 'female' : 'male' // Opposite gender
    };

    // Age filter
    if (ageMin || ageMax) {
      const currentYear = new Date().getFullYear();
      if (ageMax) {
        filter.dateOfBirth = { $gte: new Date(currentYear - ageMax, 0, 1) };
      }
      if (ageMin) {
        filter.dateOfBirth = {
          ...filter.dateOfBirth,
          $lte: new Date(currentYear - ageMin, 11, 31)
        };
      }
    }

    // Other filters
    if (religiousLevel) filter.religiousLevel = religiousLevel;
    if (maritalStatus) filter.maritalStatus = maritalStatus;
    if (education) filter.education = education;

    // Location filter (simplified - in production, use geospatial queries)
    if (location) {
      filter['location.city'] = new RegExp(location, 'i');
    }

    const skip = (page - 1) * limit;
    
    const users = await User.find(filter)
      .select('firstName lastName profilePhoto age location education occupation bio religiousLevel maritalStatus isOnline lastSeen')
      .sort({ lastSeen: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Increment profile views for non-premium users
    if (!isPremium) {
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { 'subscription.profileViewsThisMonth': users.length }
      });
    }

    // For free users, blur profile photos
    const processedUsers = users.map(user => {
      const userObj = user.toObject();
      if (!isPremium) {
        userObj.profilePhotoBlurred = true;
      }
      return userObj;
    });

    const total = await User.countDocuments(filter);
    
    res.json({
      success: true,
      profiles: processedUsers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      },
      viewsRemaining: isPremium ? null : (10 - (currentUser.subscription?.profileViewsThisMonth || 0))
    });
  } catch (error) {
    console.error('Browse profiles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific user profile
router.get('/:userId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const isPremium = hasPremiumAccess(currentUser.subscription);

    // Check profile view permissions
    const canView = await currentUser.canViewProfile(req.params.userId);
    if (!canView.allowed) {
      return res.status(403).json({ 
        message: canView.reason,
        requiresPremium: canView.requiresPremium
      });
    }

    const user = await User.findById(req.params.userId)
      .select('-password -email -phone -resetPasswordToken -resetPasswordExpires -blockedUsers -reportedUsers')
      .populate('wali', 'firstName lastName');

    if (!user || user.accountStatus !== 'active') {
      return res.status(404).json({ message: 'User not found' });
    }

    // Increment profile view count for non-premium users
    if (!isPremium) {
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { 'subscription.profileViewsThisMonth': 1 }
      });
    }

    // For free users, blur profile photos
    const userObj = user.toObject();
    if (!isPremium) {
      userObj.profilePhotoBlurred = true;
    }

    res.json(userObj);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Block user
router.post('/:userId/block', auth, async (req, res) => {
  try {
    if (req.params.userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    const user = await User.findById(req.user.id);
    if (!user.blockedUsers.includes(req.params.userId)) {
      user.blockedUsers.push(req.params.userId);
      await user.save();
    }

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unblock user
router.delete('/:userId/block', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== req.params.userId);
    await user.save();

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Report user
router.post('/:userId/report', auth, async (req, res) => {
  try {
    const { reason, description } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Report reason is required' });
    }

    if (req.params.userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot report yourself' });
    }

    const reportedUser = await User.findById(req.params.userId);
    if (!reportedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add to current user's reported users list
    const currentUser = await User.findById(req.user.id);
    if (!currentUser.reportedUsers.includes(req.params.userId)) {
      currentUser.reportedUsers.push(req.params.userId);
      await currentUser.save();
    }

    // Add report to reported user's reports
    reportedUser.reports.push({
      reportedBy: req.user.id,
      reason,
      description: description || '',
      reportedAt: new Date()
    });
    await reportedUser.save();

    res.json({ message: 'User reported successfully' });
  } catch (error) {
    console.error('Report user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get blocked users
router.get('/me/blocked', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('blockedUsers', 'firstName lastName profilePhoto')
      .select('blockedUsers');

    res.json(user.blockedUsers);
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users
router.get('/search/:query', auth, async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const currentUser = await User.findById(req.user.id);
    
    const searchFilter = {
      _id: { $ne: req.user.id },
      accountStatus: 'active',
      gender: currentUser.gender === 'male' ? 'female' : 'male',
      $or: [
        { firstName: new RegExp(query, 'i') },
        { lastName: new RegExp(query, 'i') },
        { 'location.city': new RegExp(query, 'i') },
        { occupation: new RegExp(query, 'i') }
      ]
    };

    const skip = (page - 1) * limit;
    
    const users = await User.find(searchFilter)
      .select('firstName lastName profilePhoto age location education occupation bio religiousLevel maritalStatus')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(searchFilter);
    
    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update privacy settings
router.put('/me/privacy', auth, async (req, res) => {
  try {
    const allowedSettings = [
      'showAge', 'showLocation', 'showLastSeen', 'showOnlineStatus',
      'allowMessages', 'allowProfileViews'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedSettings.includes(key)) {
        updates[`privacy.${key}`] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true }
    ).select('privacy');

    res.json(user.privacy);
  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Deactivate account
router.put('/me/deactivate', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      accountStatus: 'inactive',
      deactivatedAt: new Date()
    });

    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reactivate account
router.put('/me/reactivate', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      accountStatus: 'active',
      $unset: { deactivatedAt: 1 }
    });

    res.json({ message: 'Account reactivated successfully' });
  } catch (error) {
    console.error('Reactivate account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;