const express = require('express');
const { adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Chat = require('../models/Chat');
const { calculateUserRiskScore, getRecommendedAction, checkContent } = require('../services/moderationService');

const router = express.Router();

// @route   GET /api/moderation/queue
// @desc    Get moderation queue (reported users and chats)
// @access  Private (Admin)
router.get('/queue', adminAuth, async (req, res) => {
  try {
    const { type = 'all', status = 'pending', limit = 20, skip = 0 } = req.query;

    let userReports = [];
    let chatReports = [];

    if (type === 'all' || type === 'users') {
      // Get users with pending reports
      userReports = await User.find({
        'reports.status': status
      })
      .select('firstName lastName email profilePhoto reports accountStatus')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

      // Calculate risk scores
      userReports = userReports.map(user => ({
        ...user,
        riskScore: calculateUserRiskScore(user, user.reports),
        pendingReportsCount: user.reports.filter(r => r.status === 'pending').length
      }));
    }

    if (type === 'all' || type === 'chats') {
      // Get chats with pending reports
      chatReports = await Chat.find({
        'reports.status': status
      })
      .populate('participants', 'firstName lastName profilePhoto')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

      chatReports = chatReports.map(chat => ({
        ...chat,
        pendingReportsCount: chat.reports.filter(r => r.status === 'pending').length
      }));
    }

    res.json({
      success: true,
      userReports,
      chatReports,
      counts: {
        users: userReports.length,
        chats: chatReports.length,
        total: userReports.length + chatReports.length
      }
    });

  } catch (error) {
    console.error('Get moderation queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get moderation queue'
    });
  }
});

// @route   POST /api/moderation/user/:userId/suspend
// @desc    Suspend a user
// @access  Private (Admin)
router.post('/user/:userId/suspend', adminAuth, async (req, res) => {
  try {
    const { reason, duration } = req.body; // duration in days

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.accountStatus = 'suspended';
    user.isActive = false;
    user.suspensionReason = reason;
    user.suspendedAt = new Date();
    user.suspendedUntil = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null;
    user.suspendedBy = req.user.userId;

    await user.save();

    res.json({
      success: true,
      message: 'User suspended successfully',
      user: {
        id: user._id,
        accountStatus: user.accountStatus,
        suspendedUntil: user.suspendedUntil
      }
    });

  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend user'
    });
  }
});

// @route   POST /api/moderation/user/:userId/unsuspend
// @desc    Unsuspend a user
// @access  Private (Admin)
router.post('/user/:userId/unsuspend', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.accountStatus = 'active';
    user.isActive = true;
    user.suspensionReason = undefined;
    user.suspendedAt = undefined;
    user.suspendedUntil = undefined;
    user.suspendedBy = undefined;

    await user.save();

    res.json({
      success: true,
      message: 'User unsuspended successfully',
      user: {
        id: user._id,
        accountStatus: user.accountStatus
      }
    });

  } catch (error) {
    console.error('Unsuspend user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsuspend user'
    });
  }
});

// @route   POST /api/moderation/report/:reportId/review
// @desc    Review and resolve a report
// @access  Private (Admin)
router.post('/report/:reportId/review', adminAuth, async (req, res) => {
  try {
    const { userId, action, notes } = req.body; // action: 'dismiss', 'warn', 'suspend'

    const user = await User.findOne({
      'reports._id': req.params.reportId
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Update report status
    const report = user.reports.id(req.params.reportId);
    report.status = 'reviewed';
    report.reviewedBy = req.user.userId;
    report.reviewedAt = new Date();
    report.adminNotes = notes;
    report.action = action;

    await user.save();

    res.json({
      success: true,
      message: 'Report reviewed successfully',
      report
    });

  } catch (error) {
    console.error('Review report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review report'
    });
  }
});

// @route   POST /api/moderation/content/check
// @desc    Check content for inappropriate material
// @access  Private (Admin)
router.post('/content/check', adminAuth, async (req, res) => {
  try {
    const { text } = req.body;

    const result = checkContent(text);

    res.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('Content check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check content'
    });
  }
});

// @route   GET /api/moderation/stats
// @desc    Get moderation statistics
// @access  Private (Admin)
router.get('/stats', adminAuth, async (req, res) => {
  try {
    // Get user report statistics
    const userReportStats = await User.aggregate([
      { $unwind: '$reports' },
      {
        $group: {
          _id: '$reports.status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get chat report statistics
    const chatReportStats = await Chat.aggregate([
      { $unwind: '$reports' },
      {
        $group: {
          _id: '$reports.status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get suspended users count
    const suspendedCount = await User.countDocuments({ accountStatus: 'suspended' });

    // Get inactive users count
    const inactiveCount = await User.countDocuments({ isActive: false });

    const stats = {
      userReports: {
        pending: userReportStats.find(s => s._id === 'pending')?.count || 0,
        reviewed: userReportStats.find(s => s._id === 'reviewed')?.count || 0,
        resolved: userReportStats.find(s => s._id === 'resolved')?.count || 0,
        total: userReportStats.reduce((sum, s) => sum + s.count, 0)
      },
      chatReports: {
        pending: chatReportStats.find(s => s._id === 'pending')?.count || 0,
        reviewed: chatReportStats.find(s => s._id === 'reviewed')?.count || 0,
        resolved: chatReportStats.find(s => s._id === 'resolved')?.count || 0,
        total: chatReportStats.reduce((sum, s) => sum + s.count, 0)
      },
      users: {
        suspended: suspendedCount,
        inactive: inactiveCount
      }
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get moderation stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get moderation statistics'
    });
  }
});

module.exports = router;
