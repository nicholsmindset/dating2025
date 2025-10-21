const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid - user not found'
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Add user to request object
    // NOTE: Both 'id' and 'userId' are provided for backward compatibility
    // - req.user.id: String version of user ID (used in legacy routes)
    // - req.user.userId: ObjectId version (used in v1 routes)
    // TODO: Standardize on req.user.userId in future refactor
    req.user = {
      id: user._id.toString(),
      userId: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      gender: user.gender,
      profilePhoto: user.profilePhoto,
      subscription: user.subscription,
      isVerified: user.isVerified
    };

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    // First run regular auth
    await new Promise((resolve, reject) => {
      auth(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Get full user details to check admin status
    const user = await User.findById(req.user.userId);
    
    // Check if user is admin (you can add an isAdmin field to User model)
    // For now, we'll check if user email is in admin list
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(email => email.trim());
    
    if (!adminEmails.includes(user.email)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Admin privileges required'
      });
    }

    req.user.isAdmin = true;
    next();

  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in admin authentication'
    });
  }
};

// Premium subscription middleware
const premiumAuth = async (req, res, next) => {
  try {
    // First run regular auth
    await new Promise((resolve, reject) => {
      auth(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Check if user has premium subscription
    if (req.user.subscription.plan !== 'premium') {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required for this feature'
      });
    }

    // Check if subscription is still active
    if (req.user.subscription.endDate && new Date() > new Date(req.user.subscription.endDate)) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription has expired'
      });
    }

    next();

  } catch (error) {
    console.error('Premium auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in premium authentication'
    });
  }
};

// Verified user middleware
const verifiedAuth = async (req, res, next) => {
  try {
    // First run regular auth
    await new Promise((resolve, reject) => {
      auth(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Check if user is verified
    if (!req.user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email verification required for this feature'
      });
    }

    next();

  } catch (error) {
    console.error('Verified auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in verification check'
    });
  }
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user info
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.isActive) {
      // NOTE: Both 'id' and 'userId' provided for backward compatibility
      req.user = {
        id: user._id.toString(),
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
        profilePhoto: user.profilePhoto,
        subscription: user.subscription,
        isVerified: user.isVerified
      };
    } else {
      req.user = null;
    }

    next();

  } catch (error) {
    // If token is invalid, continue without user info
    req.user = null;
    next();
  }
};

// Gender-based access middleware
const genderAuth = (allowedGenders) => {
  return async (req, res, next) => {
    try {
      // First run regular auth
      await new Promise((resolve, reject) => {
        auth(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Check if user's gender is allowed
      if (!allowedGenders.includes(req.user.gender)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - Gender restriction applies'
        });
      }

      next();

    } catch (error) {
      console.error('Gender auth middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error in gender authentication'
      });
    }
  };
};

// Rate limiting by user
const userRateLimit = (maxRequests, windowMs) => {
  const userRequests = new Map();
  
  return async (req, res, next) => {
    try {
      // First run regular auth
      await new Promise((resolve, reject) => {
        auth(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const userId = req.user.userId.toString();
      const now = Date.now();
      
      // Clean up old entries
      for (const [key, data] of userRequests.entries()) {
        if (now - data.firstRequest > windowMs) {
          userRequests.delete(key);
        }
      }
      
      // Check user's request count
      const userRequestData = userRequests.get(userId);
      
      if (!userRequestData) {
        userRequests.set(userId, {
          count: 1,
          firstRequest: now
        });
      } else {
        userRequestData.count++;
        
        if (userRequestData.count > maxRequests) {
          return res.status(429).json({
            success: false,
            message: 'Too many requests. Please try again later.'
          });
        }
      }

      next();

    } catch (error) {
      console.error('User rate limit middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error in rate limiting'
      });
    }
  };
};

module.exports = {
  auth,
  adminAuth,
  premiumAuth,
  verifiedAuth,
  optionalAuth,
  genderAuth,
  userRateLimit
};