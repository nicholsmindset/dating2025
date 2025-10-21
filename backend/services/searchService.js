const User = require('../models/User');

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Build MongoDB query from search filters
 * @param {Object} filters - Search filters
 * @param {string} currentUserId - ID of user performing search
 * @returns {Object} MongoDB query object
 */
const buildSearchQuery = (filters, currentUserId) => {
  const query = {
    _id: { $ne: currentUserId },
    isActive: true,
    accountStatus: 'active'
  };

  // Gender filter (show opposite gender by default)
  if (filters.gender) {
    query.gender = filters.gender;
  }

  // Age range filter
  if (filters.ageMin || filters.ageMax) {
    const today = new Date();

    if (filters.ageMax) {
      const minDateOfBirth = new Date(
        today.getFullYear() - filters.ageMax - 1,
        today.getMonth(),
        today.getDate()
      );
      query.dateOfBirth = { $gte: minDateOfBirth };
    }

    if (filters.ageMin) {
      const maxDateOfBirth = new Date(
        today.getFullYear() - filters.ageMin,
        today.getMonth(),
        today.getDate()
      );
      query.dateOfBirth = query.dateOfBirth || {};
      query.dateOfBirth.$lte = maxDateOfBirth;
    }
  }

  // Marital status filter
  if (filters.maritalStatus && filters.maritalStatus.length > 0) {
    query.maritalStatus = { $in: filters.maritalStatus };
  }

  // Religious level filter
  if (filters.religiousLevel && filters.religiousLevel.length > 0) {
    query.religiousLevel = { $in: filters.religiousLevel };
  }

  // Prayer frequency filter
  if (filters.prayerFrequency && filters.prayerFrequency.length > 0) {
    query.prayerFrequency = { $in: filters.prayerFrequency };
  }

  // Education filter
  if (filters.education && filters.education.length > 0) {
    query.education = { $in: filters.education };
  }

  // Location filters
  if (filters.country) {
    query['location.country'] = filters.country;
  }

  if (filters.city) {
    query['location.city'] = filters.city;
  }

  if (filters.state) {
    query['location.state'] = filters.state;
  }

  // Height filter
  if (filters.heightMin || filters.heightMax) {
    query.height = {};
    if (filters.heightMin) query.height.$gte = filters.heightMin;
    if (filters.heightMax) query.height.$lte = filters.heightMax;
  }

  // Ethnicity filter
  if (filters.ethnicity) {
    query.ethnicity = filters.ethnicity;
  }

  // Languages filter
  if (filters.languages && filters.languages.length > 0) {
    query.languages = { $in: filters.languages };
  }

  // Occupation filter (text search)
  if (filters.occupation) {
    query.occupation = { $regex: filters.occupation, $options: 'i' };
  }

  // Photo verified only
  if (filters.photoVerifiedOnly === true) {
    query.isPhotoVerified = true;
  }

  // Premium users only
  if (filters.premiumOnly === true) {
    query['subscription.plan'] = 'premium';
  }

  // Has photo
  if (filters.hasPhoto === true) {
    query.profilePhoto = { $exists: true, $ne: null };
  }

  // Verified users only
  if (filters.verifiedOnly === true) {
    query.isVerified = true;
  }

  // Online users only
  if (filters.onlineOnly === true) {
    query.isOnline = true;
  }

  return query;
};

/**
 * Search for users based on filters
 * @param {Object} filters - Search filters
 * @param {string} currentUserId - ID of user performing search
 * @param {Object} options - Pagination and sorting options
 * @returns {Promise<Object>} Search results
 */
const searchUsers = async (filters, currentUserId, options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    // Build the query
    const query = buildSearchQuery(filters, currentUserId);

    // Get current user to exclude blocked users
    const currentUser = await User.findById(currentUserId);
    if (currentUser) {
      // Exclude users that current user has blocked
      if (currentUser.blockedUsers && currentUser.blockedUsers.length > 0) {
        query._id = query._id || {};
        query._id.$nin = currentUser.blockedUsers;
      }

      // Exclude users who have blocked current user
      query.blockedUsers = { $ne: currentUserId };
    }

    // Build sort object
    const sort = {};
    if (sortBy === 'lastSeen') {
      sort.lastSeen = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'age') {
      sort.dateOfBirth = sortOrder === 'asc' ? -1 : 1; // Reverse for age
    } else {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select('-password -verificationToken -resetPasswordToken -resetPasswordExpire')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await User.countDocuments(query);

    // If distance filter is specified, calculate distances and filter
    let filteredUsers = users;
    if (filters.maxDistance && filters.userLatitude && filters.userLongitude) {
      filteredUsers = users
        .map(user => {
          // Calculate distance if user has coordinates
          if (user.location && user.location.latitude && user.location.longitude) {
            const distance = calculateDistance(
              filters.userLatitude,
              filters.userLongitude,
              user.location.latitude,
              user.location.longitude
            );
            return { ...user, distance };
          }
          return user;
        })
        .filter(user => !user.distance || user.distance <= filters.maxDistance)
        .sort((a, b) => {
          if (sortBy === 'distance') {
            const distA = a.distance || Infinity;
            const distB = b.distance || Infinity;
            return sortOrder === 'asc' ? distA - distB : distB - distA;
          }
          return 0;
        });
    }

    return {
      success: true,
      users: filteredUsers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalResults: totalCount,
        resultsPerPage: limit,
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1
      }
    };

  } catch (error) {
    console.error('Search users error:', error);
    return {
      success: false,
      message: 'Failed to search users',
      error: error.message
    };
  }
};

/**
 * Get suggested filters based on user preferences
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Suggested filters
 */
const getSuggestedFilters = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user || !user.partnerPreferences) {
      return {
        success: true,
        filters: {}
      };
    }

    const filters = {
      gender: user.gender === 'male' ? 'female' : 'male'
    };

    // Age range from preferences
    if (user.partnerPreferences.ageRange) {
      if (user.partnerPreferences.ageRange.min) {
        filters.ageMin = user.partnerPreferences.ageRange.min;
      }
      if (user.partnerPreferences.ageRange.max) {
        filters.ageMax = user.partnerPreferences.ageRange.max;
      }
    }

    // Marital status from preferences
    if (user.partnerPreferences.maritalStatus && user.partnerPreferences.maritalStatus.length > 0) {
      filters.maritalStatus = user.partnerPreferences.maritalStatus;
    }

    // Religious level from preferences
    if (user.partnerPreferences.religiousLevel && user.partnerPreferences.religiousLevel.length > 0) {
      filters.religiousLevel = user.partnerPreferences.religiousLevel;
    }

    // Location from preferences
    if (user.partnerPreferences.location) {
      if (user.partnerPreferences.location.countries && user.partnerPreferences.location.countries.length > 0) {
        filters.country = user.partnerPreferences.location.countries[0]; // Use first country
      }
      if (user.partnerPreferences.location.maxDistance) {
        filters.maxDistance = user.partnerPreferences.location.maxDistance;
      }
    }

    // Education from preferences
    if (user.partnerPreferences.education && user.partnerPreferences.education.length > 0) {
      filters.education = user.partnerPreferences.education;
    }

    return {
      success: true,
      filters
    };

  } catch (error) {
    console.error('Get suggested filters error:', error);
    return {
      success: false,
      message: 'Failed to get suggested filters',
      error: error.message
    };
  }
};

/**
 * Get popular search filters
 * @returns {Promise<Object>} Popular filters data
 */
const getPopularFilters = async () => {
  try {
    // Aggregate most common search criteria
    const religiousLevelStats = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$religiousLevel', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const maritalStatusStats = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$maritalStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const educationStats = await User.aggregate([
      { $match: { isActive: true, education: { $exists: true } } },
      { $group: { _id: '$education', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const locationStats = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$location.country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    return {
      success: true,
      data: {
        religiousLevel: religiousLevelStats,
        maritalStatus: maritalStatusStats,
        education: educationStats,
        topCountries: locationStats
      }
    };

  } catch (error) {
    console.error('Get popular filters error:', error);
    return {
      success: false,
      message: 'Failed to get popular filters'
    };
  }
};

module.exports = {
  searchUsers,
  getSuggestedFilters,
  getPopularFilters,
  calculateDistance
};
