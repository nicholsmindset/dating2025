const User = require('../models/User');
const Chat = require('../models/Chat');
const Match = require('../models/Match');

/**
 * Get user activity statistics
 * @param {string} userId - User ID
 * @param {Object} options - Time range options
 * @returns {Promise<Object>} User activity stats
 */
const getUserActivityStats = async (userId, options = {}) => {
  try {
    const { startDate, endDate } = getDateRange(options.period || 'week');

    const user = await User.findById(userId)
      .populate('likedProfiles', 'firstName lastName profilePhoto')
      .lean();

    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Get profile views in the period
    const profileViewsCount = user.profileViews?.filter(view => {
      const viewDate = new Date(view.viewedAt);
      return viewDate >= startDate && viewDate <= endDate;
    }).length || 0;

    // Get likes given
    const likesGiven = user.likedProfiles?.length || 0;

    // Get matches
    const matches = await Match.find({
      $or: [
        { user1: userId },
        { user2: userId }
      ],
      status: 'matched',
      matchedAt: { $gte: startDate, $lte: endDate }
    }).countDocuments();

    // Get messages sent
    const messagesSent = await Chat.aggregate([
      {
        $match: {
          participants: userId,
          'messages.sender': userId,
          'messages.timestamp': { $gte: startDate, $lte: endDate }
        }
      },
      { $unwind: '$messages' },
      {
        $match: {
          'messages.sender': userId.toString(),
          'messages.timestamp': { $gte: startDate, $lte: endDate }
        }
      },
      { $count: 'total' }
    ]);

    // Get conversations started
    const conversationsStarted = await Chat.countDocuments({
      participants: userId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    return {
      success: true,
      stats: {
        period: options.period || 'week',
        profileViews: profileViewsCount,
        likesGiven,
        matches,
        messagesSent: messagesSent[0]?.total || 0,
        conversationsStarted
      }
    };

  } catch (error) {
    console.error('Get user activity stats error:', error);
    return {
      success: false,
      message: 'Failed to get user activity stats',
      error: error.message
    };
  }
};

/**
 * Get platform-wide analytics (admin)
 * @param {Object} options - Filter options
 * @returns {Promise<Object>} Platform analytics
 */
const getPlatformAnalytics = async (options = {}) => {
  try {
    const { startDate, endDate } = getDateRange(options.period || 'month');

    // Total users
    const totalUsers = await User.countDocuments();

    // Active users (logged in within period)
    const activeUsers = await User.countDocuments({
      lastSeen: { $gte: startDate, $lte: endDate }
    });

    // New registrations in period
    const newRegistrations = await User.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Verified users
    const verifiedUsers = await User.countDocuments({
      isVerified: true
    });

    // Photo verified users
    const photoVerifiedUsers = await User.countDocuments({
      isPhotoVerified: true
    });

    // Premium subscribers
    const premiumUsers = await User.countDocuments({
      'subscription.plan': 'premium'
    });

    // Total matches in period
    const totalMatches = await Match.countDocuments({
      status: 'matched',
      matchedAt: { $gte: startDate, $lte: endDate }
    });

    // Total messages in period
    const totalMessages = await Chat.aggregate([
      { $unwind: '$messages' },
      {
        $match: {
          'messages.timestamp': { $gte: startDate, $lte: endDate }
        }
      },
      { $count: 'total' }
    ]);

    // Total conversations in period
    const totalConversations = await Chat.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Gender distribution
    const genderDistribution = await User.aggregate([
      { $group: { _id: '$gender', count: { $sum: 1 } } }
    ]);

    // Religious level distribution
    const religiousDistribution = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$religiousLevel', count: { $sum: 1 } } }
    ]);

    // Top countries
    const topCountries = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$location.country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Age distribution
    const today = new Date();
    const ageDistribution = await User.aggregate([
      { $match: { isActive: true, dateOfBirth: { $exists: true } } },
      {
        $project: {
          age: {
            $floor: {
              $divide: [
                { $subtract: [today, '$dateOfBirth'] },
                1000 * 60 * 60 * 24 * 365.25
              ]
            }
          }
        }
      },
      {
        $bucket: {
          groupBy: '$age',
          boundaries: [18, 25, 30, 35, 40, 45, 50, 55, 60, 100],
          default: '60+',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    // Engagement metrics
    const dailyActiveUsers = await User.countDocuments({
      lastSeen: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    const weeklyActiveUsers = await User.countDocuments({
      lastSeen: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const monthlyActiveUsers = await User.countDocuments({
      lastSeen: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    // Conversion metrics
    const usersWithMatches = await Match.distinct('user1').then(users1 =>
      Match.distinct('user2').then(users2 =>
        new Set([...users1.map(String), ...users2.map(String)]).size
      )
    );

    const usersWithMessages = await Chat.distinct('participants').then(participants =>
      participants.length
    );

    // Match to conversation rate
    const matchesToConversations = totalMatches > 0
      ? ((totalConversations / totalMatches) * 100).toFixed(2)
      : 0;

    return {
      success: true,
      period: options.period || 'month',
      analytics: {
        users: {
          total: totalUsers,
          active: activeUsers,
          new: newRegistrations,
          verified: verifiedUsers,
          photoVerified: photoVerifiedUsers,
          premium: premiumUsers,
          dailyActive: dailyActiveUsers,
          weeklyActive: weeklyActiveUsers,
          monthlyActive: monthlyActiveUsers
        },
        engagement: {
          totalMatches,
          totalMessages: totalMessages[0]?.total || 0,
          totalConversations,
          usersWithMatches,
          usersWithMessages,
          matchToConversationRate: matchesToConversations
        },
        demographics: {
          gender: genderDistribution,
          religiousLevel: religiousDistribution,
          age: ageDistribution,
          topCountries
        }
      }
    };

  } catch (error) {
    console.error('Get platform analytics error:', error);
    return {
      success: false,
      message: 'Failed to get platform analytics',
      error: error.message
    };
  }
};

/**
 * Get user retention data
 * @param {Object} options - Filter options
 * @returns {Promise<Object>} Retention data
 */
const getRetentionMetrics = async (options = {}) => {
  try {
    const cohortPeriod = options.cohortPeriod || 'week'; // week or month
    const { startDate } = getDateRange('month', 3); // Last 3 months

    // Get cohorts (groups of users who registered in same period)
    const cohorts = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: cohortPeriod === 'week' ? '%Y-W%V' : '%Y-%m',
              date: '$createdAt'
            }
          },
          users: { $push: '$_id' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate retention for each cohort
    const retentionData = await Promise.all(
      cohorts.map(async (cohort) => {
        const week1 = await User.countDocuments({
          _id: { $in: cohort.users },
          lastSeen: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        const week2 = await User.countDocuments({
          _id: { $in: cohort.users },
          lastSeen: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
        });

        const month1 = await User.countDocuments({
          _id: { $in: cohort.users },
          lastSeen: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        return {
          cohort: cohort._id,
          totalUsers: cohort.count,
          retention: {
            week1: ((week1 / cohort.count) * 100).toFixed(2),
            week2: ((week2 / cohort.count) * 100).toFixed(2),
            month1: ((month1 / cohort.count) * 100).toFixed(2)
          }
        };
      })
    );

    // Overall retention rates
    const allUsers = await User.countDocuments();
    const activeWeek1 = await User.countDocuments({
      lastSeen: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });
    const activeWeek2 = await User.countDocuments({
      lastSeen: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
    });
    const activeMonth1 = await User.countDocuments({
      lastSeen: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    return {
      success: true,
      overall: {
        week1: ((activeWeek1 / allUsers) * 100).toFixed(2),
        week2: ((activeWeek2 / allUsers) * 100).toFixed(2),
        month1: ((activeMonth1 / allUsers) * 100).toFixed(2)
      },
      cohorts: retentionData
    };

  } catch (error) {
    console.error('Get retention metrics error:', error);
    return {
      success: false,
      message: 'Failed to get retention metrics',
      error: error.message
    };
  }
};

/**
 * Get feature usage statistics
 * @returns {Promise<Object>} Feature usage data
 */
const getFeatureUsageStats = async () => {
  try {
    const totalUsers = await User.countDocuments({ isActive: true });

    // Users with profile photos
    const usersWithPhotos = await User.countDocuments({
      isActive: true,
      profilePhoto: { $exists: true, $ne: null }
    });

    // Users with complete profiles
    const usersWithCompleteBio = await User.countDocuments({
      isActive: true,
      bio: { $exists: true, $ne: null, $ne: '' }
    });

    // Users who have liked profiles
    const usersWhoLiked = await User.countDocuments({
      isActive: true,
      likedProfiles: { $exists: true, $not: { $size: 0 } }
    });

    // Users with saved searches
    const usersWithSavedSearches = await User.countDocuments({
      isActive: true,
      savedSearches: { $exists: true, $not: { $size: 0 } }
    });

    // Users with wali
    const usersWithWali = await User.countDocuments({
      isActive: true,
      'wali.hasWali': true
    });

    // Premium subscription rate
    const premiumUsers = await User.countDocuments({
      isActive: true,
      'subscription.plan': 'premium'
    });

    return {
      success: true,
      features: {
        profilePhotos: {
          users: usersWithPhotos,
          percentage: ((usersWithPhotos / totalUsers) * 100).toFixed(2)
        },
        completeBio: {
          users: usersWithCompleteBio,
          percentage: ((usersWithCompleteBio / totalUsers) * 100).toFixed(2)
        },
        liked: {
          users: usersWhoLiked,
          percentage: ((usersWhoLiked / totalUsers) * 100).toFixed(2)
        },
        savedSearches: {
          users: usersWithSavedSearches,
          percentage: ((usersWithSavedSearches / totalUsers) * 100).toFixed(2)
        },
        wali: {
          users: usersWithWali,
          percentage: ((usersWithWali / totalUsers) * 100).toFixed(2)
        },
        premium: {
          users: premiumUsers,
          percentage: ((premiumUsers / totalUsers) * 100).toFixed(2)
        }
      },
      totalActiveUsers: totalUsers
    };

  } catch (error) {
    console.error('Get feature usage stats error:', error);
    return {
      success: false,
      message: 'Failed to get feature usage stats',
      error: error.message
    };
  }
};

/**
 * Track user action (login, profile view, like, message, etc.)
 * @param {string} userId - User ID
 * @param {string} action - Action type
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Result
 */
const trackUserAction = async (userId, action, metadata = {}) => {
  try {
    // This could be enhanced to store in a separate analytics collection
    // For now, we update the user's lastSeen
    if (action === 'login' || action === 'activity') {
      await User.findByIdAndUpdate(userId, {
        lastSeen: new Date(),
        isOnline: true
      });
    }

    return {
      success: true,
      message: 'Action tracked'
    };

  } catch (error) {
    console.error('Track user action error:', error);
    return {
      success: false,
      message: 'Failed to track action'
    };
  }
};

/**
 * Get date range based on period
 * @param {string} period - Time period (day, week, month, year)
 * @param {number} count - Number of periods to go back
 * @returns {Object} Start and end dates
 */
const getDateRange = (period = 'week', count = 1) => {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case 'day':
      startDate.setDate(startDate.getDate() - count);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - (7 * count));
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - count);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - count);
      break;
    default:
      startDate.setDate(startDate.getDate() - 7);
  }

  return { startDate, endDate };
};

/**
 * Get match success metrics
 * @param {Object} options - Filter options
 * @returns {Promise<Object>} Match success data
 */
const getMatchSuccessMetrics = async (options = {}) => {
  try {
    const { startDate, endDate } = getDateRange(options.period || 'month');

    // Total matches
    const totalMatches = await Match.countDocuments({
      status: 'matched',
      matchedAt: { $gte: startDate, $lte: endDate }
    });

    // Matches that led to conversations
    const matchesWithConversations = await Match.aggregate([
      {
        $match: {
          status: 'matched',
          matchedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'chats',
          let: { user1: '$user1', user2: '$user2' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$$user1', '$participants'] },
                    { $in: ['$$user2', '$participants'] }
                  ]
                }
              }
            }
          ],
          as: 'conversations'
        }
      },
      {
        $match: {
          conversations: { $ne: [] }
        }
      },
      { $count: 'total' }
    ]);

    const conversationRate = totalMatches > 0
      ? ((matchesWithConversations[0]?.total || 0) / totalMatches * 100).toFixed(2)
      : 0;

    // Average time to first message after match
    const avgTimeToMessage = await Match.aggregate([
      {
        $match: {
          status: 'matched',
          matchedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'chats',
          let: { user1: '$user1', user2: '$user2', matchedAt: '$matchedAt' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$$user1', '$participants'] },
                    { $in: ['$$user2', '$participants'] }
                  ]
                }
              }
            },
            { $unwind: '$messages' },
            { $sort: { 'messages.timestamp': 1 } },
            { $limit: 1 },
            {
              $project: {
                timeToMessage: {
                  $subtract: ['$messages.timestamp', '$$matchedAt']
                }
              }
            }
          ],
          as: 'firstMessage'
        }
      },
      { $unwind: { path: '$firstMessage', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$firstMessage.timeToMessage' }
        }
      }
    ]);

    const avgHoursToMessage = avgTimeToMessage[0]?.avgTime
      ? (avgTimeToMessage[0].avgTime / (1000 * 60 * 60)).toFixed(2)
      : null;

    return {
      success: true,
      metrics: {
        totalMatches,
        matchesWithConversations: matchesWithConversations[0]?.total || 0,
        conversationRate: `${conversationRate}%`,
        avgHoursToFirstMessage: avgHoursToMessage
      }
    };

  } catch (error) {
    console.error('Get match success metrics error:', error);
    return {
      success: false,
      message: 'Failed to get match success metrics',
      error: error.message
    };
  }
};

module.exports = {
  getUserActivityStats,
  getPlatformAnalytics,
  getRetentionMetrics,
  getFeatureUsageStats,
  trackUserAction,
  getMatchSuccessMetrics
};
