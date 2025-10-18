const express = require('express');
const User = require('../models/User');
const Chat = require('../models/Chat');
const { auth, adminAuth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const PREMIUM_ACCESS_STATUSES = ['active', 'trialing', 'past_due'];
const PREMIUM_SUBSCRIPTION_FILTER = {
  'subscription.plan': 'premium',
  'subscription.status': { $in: PREMIUM_ACCESS_STATUSES }
};

// Rate limiting for admin operations
const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many admin requests, please try again later'
});

// Apply admin authentication to all routes
router.use(auth, adminAuth, adminRateLimit);

// Dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const [totalUsers, activeUsers, premiumUsers, totalChats, recentReports] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ accountStatus: 'active' }),
      User.countDocuments(PREMIUM_SUBSCRIPTION_FILTER),
      Chat.countDocuments(),
      User.find({ 'reports.0': { $exists: true } })
        .select('firstName lastName email reports')
        .sort({ 'reports.reportedAt': -1 })
        .limit(10)
    ]);

    // Calculate revenue (simplified)
    const monthlyRevenue = premiumUsers * 23; // 23 SGD per premium user

    // User registration stats for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Gender distribution
    const [maleUsers, femaleUsers] = await Promise.all([
      User.countDocuments({ gender: 'male', accountStatus: 'active' }),
      User.countDocuments({ gender: 'female', accountStatus: 'active' })
    ]);

    res.json({
      totalUsers,
      activeUsers,
      premiumUsers,
      totalChats,
      monthlyRevenue,
      recentRegistrations,
      genderDistribution: {
        male: maleUsers,
        female: femaleUsers
      },
      recentReports: recentReports.length
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users with pagination and filtering
router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      gender,
      subscription,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.accountStatus = status;
    if (gender) filter.gender = gender;
    if (subscription === 'premium') {
      filter['subscription.plan'] = 'premium';
      filter['subscription.status'] = { $in: PREMIUM_ACCESS_STATUSES };
    }
    if (subscription === 'free') {
      filter['subscription.plan'] = 'free';
    }
    
    if (search) {
      filter.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -resetPasswordToken -resetPasswordExpires')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific user details
router.get('/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .populate('wali', 'firstName lastName email');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's chats count
    const chatCount = await Chat.countDocuments({
      participants: user._id
    });

    res.json({
      ...user.toObject(),
      chatCount
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user status
router.put('/users/:userId/status', async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    const validStatuses = ['active', 'suspended', 'banned', 'inactive'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updateData = { accountStatus: status };
    if (status === 'suspended' || status === 'banned') {
      updateData.suspensionReason = reason;
      updateData.suspendedAt = new Date();
      updateData.suspendedBy = req.user.id;
    } else {
      updateData.$unset = {
        suspensionReason: 1,
        suspendedAt: 1,
        suspendedBy: 1
      };
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: `User ${status} successfully`, user });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user account
router.delete('/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user's chats
    await Chat.deleteMany({
      participants: req.params.userId
    });

    // Delete user
    await User.findByIdAndDelete(req.params.userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reported users
router.get('/reports/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'pending' } = req.query;
    
    const skip = (page - 1) * limit;
    
    const users = await User.find({
      'reports.0': { $exists: true },
      ...(status !== 'all' && { 'reports.status': status })
    })
    .select('firstName lastName email profilePhoto reports accountStatus')
    .populate('reports.reportedBy', 'firstName lastName email')
    .sort({ 'reports.reportedAt': -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await User.countDocuments({
      'reports.0': { $exists: true },
      ...(status !== 'all' && { 'reports.status': status })
    });

    res.json({
      reports: users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get reported users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reported chats
router.get('/reports/chats', async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'pending' } = req.query;
    
    const skip = (page - 1) * limit;
    
    const chats = await Chat.find({
      'reports.0': { $exists: true },
      ...(status !== 'all' && { 'reports.status': status })
    })
    .populate('participants', 'firstName lastName email')
    .populate('reports.reportedBy', 'firstName lastName email')
    .sort({ 'reports.reportedAt': -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Chat.countDocuments({
      'reports.0': { $exists: true },
      ...(status !== 'all' && { 'reports.status': status })
    });

    res.json({
      reports: chats,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get reported chats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Handle user report
router.put('/reports/users/:userId/:reportId', async (req, res) => {
  try {
    const { action, adminNotes } = req.body; // action: 'resolved', 'dismissed', 'escalated'
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const report = user.reports.id(req.params.reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = action;
    report.adminNotes = adminNotes;
    report.reviewedBy = req.user.id;
    report.reviewedAt = new Date();

    await user.save();

    res.json({ message: `Report ${action} successfully` });
  } catch (error) {
    console.error('Handle user report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Handle chat report
router.put('/reports/chats/:chatId/:reportId', async (req, res) => {
  try {
    const { action, adminNotes } = req.body;
    
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const report = chat.reports.id(req.params.reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = action;
    report.adminNotes = adminNotes;
    report.reviewedBy = req.user.id;
    report.reviewedAt = new Date();

    await chat.save();

    res.json({ message: `Report ${action} successfully` });
  } catch (error) {
    console.error('Handle chat report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get subscription analytics
router.get('/analytics/subscriptions', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Get subscription stats
    const [totalPremium, newPremiumThisPeriod, cancelledThisPeriod] = await Promise.all([
      User.countDocuments(PREMIUM_SUBSCRIPTION_FILTER),
      User.countDocuments({
        'subscription.plan': 'premium',
        'subscription.status': { $in: PREMIUM_ACCESS_STATUSES },
        'subscription.startDate': { $gte: daysAgo }
      }),
      User.countDocuments({
        'subscription.status': 'cancelled',
        'subscription.endDate': { $gte: daysAgo, $lte: new Date() }
      })
    ]);

    // Calculate revenue
    const currentRevenue = totalPremium * 23;
    const projectedMonthlyRevenue = (newPremiumThisPeriod / parseInt(period)) * 30 * 23;

    res.json({
      totalPremium,
      newPremiumThisPeriod,
      cancelledThisPeriod,
      currentRevenue,
      projectedMonthlyRevenue,
      conversionRate: newPremiumThisPeriod > 0 ? (newPremiumThisPeriod / (newPremiumThisPeriod + cancelledThisPeriod)) * 100 : 0
    });
  } catch (error) {
    console.error('Get subscription analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user activity analytics
router.get('/analytics/activity', async (req, res) => {
  try {
    const { period = '7' } = req.query; // days
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Daily active users
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const [dailyActiveUsers, weeklyActiveUsers, newRegistrations, totalMessages] = await Promise.all([
      User.countDocuments({
        lastSeen: { $gte: oneDayAgo },
        accountStatus: 'active'
      }),
      User.countDocuments({
        lastSeen: { $gte: daysAgo },
        accountStatus: 'active'
      }),
      User.countDocuments({
        createdAt: { $gte: daysAgo }
      }),
      Chat.aggregate([
        { $unwind: '$messages' },
        { $match: { 'messages.sentAt': { $gte: daysAgo } } },
        { $count: 'total' }
      ])
    ]);

    res.json({
      dailyActiveUsers,
      weeklyActiveUsers,
      newRegistrations,
      totalMessages: totalMessages[0]?.total || 0
    });
  } catch (error) {
    console.error('Get activity analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create admin user
router.post('/create-admin', async (req, res) => {
  try {
    const { email, firstName, lastName, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create admin user
    const adminUser = new User({
      email,
      firstName,
      lastName,
      password,
      role: 'admin',
      accountStatus: 'active',
      isEmailVerified: true,
      gender: 'male', // Default, can be changed
      dateOfBirth: new Date('1990-01-01'), // Default
      maritalStatus: 'single' // Default
    });

    await adminUser.save();

    res.status(201).json({ 
      message: 'Admin user created successfully',
      user: {
        id: adminUser._id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        role: adminUser.role
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get system settings
router.get('/settings', async (req, res) => {
  try {
    // In a real app, these would be stored in a settings collection
    const settings = {
      subscriptionPrice: 23,
      freeUserProfileLimit: 10,
      maxFileUploadSize: 5, // MB
      maintenanceMode: false,
      registrationEnabled: true,
      chatEnabled: true,
      waliSupervisionRequired: false // Global setting
    };

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update system settings
router.put('/settings', async (req, res) => {
  try {
    // In a real app, these would be stored in a settings collection
    const allowedSettings = [
      'subscriptionPrice',
      'freeUserProfileLimit',
      'maxFileUploadSize',
      'maintenanceMode',
      'registrationEnabled',
      'chatEnabled',
      'waliSupervisionRequired'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedSettings.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // In a real app, save to settings collection
    res.json({ message: 'Settings updated successfully', settings: updates });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;