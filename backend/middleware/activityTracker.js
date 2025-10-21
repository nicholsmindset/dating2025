const User = require('../models/User');

/**
 * Middleware to track user activity
 * Updates lastSeen and isOnline status for authenticated users
 */
const trackActivity = async (req, res, next) => {
  // Only track if user is authenticated
  if (req.user && req.user.userId) {
    try {
      // Update user's last seen asynchronously (don't wait for it)
      User.findByIdAndUpdate(
        req.user.userId,
        {
          lastSeen: new Date(),
          isOnline: true
        },
        { new: false }
      ).catch(err => {
        // Silently fail - don't block the request
        console.error('Activity tracking error:', err);
      });

    } catch (error) {
      // Don't block the request if tracking fails
      console.error('Activity tracking error:', error);
    }
  }

  next();
};

/**
 * Middleware to set user offline
 * Call this on logout endpoints
 */
const setOffline = async (req, res, next) => {
  if (req.user && req.user.userId) {
    try {
      await User.findByIdAndUpdate(
        req.user.userId,
        { isOnline: false }
      );
    } catch (error) {
      console.error('Set offline error:', error);
    }
  }

  next();
};

module.exports = {
  trackActivity,
  setOffline
};
