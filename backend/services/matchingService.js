const User = require('../models/User');

/**
 * Calculate match score between two users based on their preferences
 * @param {Object} user1 - The user looking for matches
 * @param {Object} user2 - Potential match candidate
 * @returns {number} Match score (0-100)
 */
const calculateMatchScore = (user1, user2) => {
  let score = 0;
  let maxScore = 0;

  // Don't match users of the same gender
  if (user1.gender === user2.gender) {
    return 0;
  }

  // Don't match with self
  if (user1._id.toString() === user2._id.toString()) {
    return 0;
  }

  // Don't match with blocked users
  if (user1.blockedUsers?.some(id => id.toString() === user2._id.toString()) ||
      user2.blockedUsers?.some(id => id.toString() === user1._id.toString())) {
    return 0;
  }

  const prefs = user1.partnerPreferences || {};

  // 1. Age compatibility (Weight: 20 points)
  maxScore += 20;
  if (prefs.ageRange && prefs.ageRange.min && prefs.ageRange.max) {
    const age2 = user2.age;
    if (age2 >= prefs.ageRange.min && age2 <= prefs.ageRange.max) {
      score += 20;
    } else {
      // Partial score if close to range
      const distance = Math.min(
        Math.abs(age2 - prefs.ageRange.min),
        Math.abs(age2 - prefs.ageRange.max)
      );
      if (distance <= 3) score += 10;
      else if (distance <= 5) score += 5;
    }
  }

  // 2. Marital status compatibility (Weight: 15 points)
  maxScore += 15;
  if (prefs.maritalStatus && prefs.maritalStatus.length > 0) {
    if (prefs.maritalStatus.includes(user2.maritalStatus)) {
      score += 15;
    }
  } else {
    // No preference specified, give neutral score
    score += 10;
  }

  // 3. Religious level compatibility (Weight: 25 points - HIGH IMPORTANCE for Islamic platform)
  maxScore += 25;
  if (prefs.religiousLevel && prefs.religiousLevel.length > 0) {
    if (prefs.religiousLevel.includes(user2.religiousLevel)) {
      score += 25;
    } else {
      // Check if adjacent levels (practicing-moderate or moderate-learning)
      const levels = ['learning', 'moderate', 'practicing'];
      const user1LevelIndex = levels.indexOf(user2.religiousLevel);
      const prefLevels = prefs.religiousLevel.map(l => levels.indexOf(l));

      const isAdjacent = prefLevels.some(prefIndex =>
        Math.abs(prefIndex - user1LevelIndex) === 1
      );

      if (isAdjacent) score += 12;
    }
  } else {
    // No preference, give neutral score
    score += 15;
  }

  // 4. Prayer frequency compatibility (Weight: 15 points)
  maxScore += 15;
  const prayerLevels = {
    '5_times_daily': 4,
    'regularly': 3,
    'sometimes': 2,
    'rarely': 1
  };
  const user1PrayerLevel = prayerLevels[user1.prayerFrequency] || 0;
  const user2PrayerLevel = prayerLevels[user2.prayerFrequency] || 0;
  const prayerDiff = Math.abs(user1PrayerLevel - user2PrayerLevel);

  if (prayerDiff === 0) score += 15;
  else if (prayerDiff === 1) score += 10;
  else if (prayerDiff === 2) score += 5;

  // 5. Education compatibility (Weight: 10 points)
  maxScore += 10;
  if (prefs.education && prefs.education.length > 0) {
    if (prefs.education.includes(user2.education)) {
      score += 10;
    } else {
      // Give partial score for similar levels
      score += 5;
    }
  } else {
    score += 7; // Neutral score
  }

  // 6. Location compatibility (Weight: 15 points)
  maxScore += 15;
  if (prefs.location) {
    // Same city - perfect match
    if (user1.location?.city === user2.location?.city &&
        user1.location?.country === user2.location?.country) {
      score += 15;
    }
    // Same country - good match
    else if (user1.location?.country === user2.location?.country) {
      score += 10;
    }
    // Preferred countries list
    else if (prefs.location.countries && prefs.location.countries.length > 0) {
      if (prefs.location.countries.includes(user2.location?.country)) {
        score += 8;
      }
    }
  } else {
    // Same city or country still gets points
    if (user1.location?.city === user2.location?.city &&
        user1.location?.country === user2.location?.country) {
      score += 15;
    } else if (user1.location?.country === user2.location?.country) {
      score += 10;
    }
  }

  // 7. Profile completeness bonus (Weight: 10 points)
  maxScore += 10;
  let completeness = 0;
  if (user2.bio && user2.bio.length > 50) completeness += 3;
  if (user2.occupation) completeness += 2;
  if (user2.education) completeness += 2;
  if (user2.profilePhoto || user2.profileImages?.length > 0) completeness += 3;
  score += completeness;

  // Calculate percentage score
  const percentageScore = Math.round((score / maxScore) * 100);

  return Math.min(percentageScore, 100);
};

/**
 * Get match suggestions for a user
 * @param {String} userId - User ID to get matches for
 * @param {Object} options - Query options (limit, skip, minScore)
 * @returns {Array} Array of matched users with scores
 */
const getMatchSuggestions = async (userId, options = {}) => {
  const {
    limit = 20,
    skip = 0,
    minScore = 40 // Minimum 40% match score
  } = options;

  try {
    // Get the current user with preferences
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      throw new Error('User not found');
    }

    // Build query to filter potential matches
    const query = {
      _id: {
        $ne: userId, // Not self
        $nin: currentUser.blockedUsers || [] // Not blocked
      },
      gender: currentUser.gender === 'male' ? 'female' : 'male', // Opposite gender
      isActive: true,
      isVerified: true,
      accountStatus: 'active'
    };

    // Add basic preference filters if specified
    const prefs = currentUser.partnerPreferences || {};

    // Age range filter
    if (prefs.ageRange && prefs.ageRange.min && prefs.ageRange.max) {
      const today = new Date();
      const maxBirthDate = new Date(today.getFullYear() - prefs.ageRange.min, today.getMonth(), today.getDate());
      const minBirthDate = new Date(today.getFullYear() - prefs.ageRange.max - 1, today.getMonth(), today.getDate());

      query.dateOfBirth = {
        $gte: minBirthDate,
        $lte: maxBirthDate
      };
    }

    // Marital status filter
    if (prefs.maritalStatus && prefs.maritalStatus.length > 0) {
      query.maritalStatus = { $in: prefs.maritalStatus };
    }

    // Religious level filter
    if (prefs.religiousLevel && prefs.religiousLevel.length > 0) {
      query.religiousLevel = { $in: prefs.religiousLevel };
    }

    // Location filter (country)
    if (prefs.location && prefs.location.countries && prefs.location.countries.length > 0) {
      query['location.country'] = { $in: prefs.location.countries };
    }

    // Get potential matches
    let potentialMatches = await User.find(query)
      .select('-password -resetPasswordToken -verificationToken')
      .limit(limit * 3) // Get more than needed so we can filter by score
      .lean();

    // Calculate match scores
    const matchesWithScores = potentialMatches.map(match => ({
      ...match,
      matchScore: calculateMatchScore(currentUser, match),
      matchReasons: getMatchReasons(currentUser, match)
    }));

    // Filter by minimum score and sort
    const filteredMatches = matchesWithScores
      .filter(match => match.matchScore >= minScore)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(skip, skip + limit);

    return filteredMatches;
  } catch (error) {
    console.error('Error getting match suggestions:', error);
    throw error;
  }
};

/**
 * Get reasons why two users match
 * @param {Object} user1 - The user
 * @param {Object} user2 - The match
 * @returns {Array} Array of match reason strings
 */
const getMatchReasons = (user1, user2) => {
  const reasons = [];
  const prefs = user1.partnerPreferences || {};

  // Age compatibility
  if (prefs.ageRange && prefs.ageRange.min && prefs.ageRange.max) {
    const age2 = user2.age;
    if (age2 >= prefs.ageRange.min && age2 <= prefs.ageRange.max) {
      reasons.push(`Age range match (${age2} years old)`);
    }
  }

  // Same city
  if (user1.location?.city === user2.location?.city &&
      user1.location?.country === user2.location?.country) {
    reasons.push(`Lives in ${user2.location.city}`);
  }
  // Same country
  else if (user1.location?.country === user2.location?.country) {
    reasons.push(`Lives in ${user2.location.country}`);
  }

  // Religious compatibility
  if (prefs.religiousLevel && prefs.religiousLevel.includes(user2.religiousLevel)) {
    const levelMap = {
      'practicing': 'Practicing Muslim',
      'moderate': 'Moderate Muslim',
      'learning': 'Learning Muslim'
    };
    reasons.push(levelMap[user2.religiousLevel]);
  }

  // Marital status
  if (prefs.maritalStatus && prefs.maritalStatus.includes(user2.maritalStatus)) {
    const statusMap = {
      'widow': 'Widow/Widower',
      'divorced': 'Divorced',
      'separated': 'Separated',
      'never_married': 'Never married'
    };
    reasons.push(statusMap[user2.maritalStatus]);
  }

  // Education
  if (user2.education) {
    const eduMap = {
      'high_school': 'High School',
      'diploma': 'Diploma',
      'bachelor': "Bachelor's Degree",
      'master': "Master's Degree",
      'phd': 'PhD',
      'other': 'Education'
    };
    reasons.push(eduMap[user2.education]);
  }

  // Prayer frequency match
  const prayerLevels = {
    '5_times_daily': 'Prays 5 times daily',
    'regularly': 'Prays regularly',
    'sometimes': 'Prays sometimes',
    'rarely': 'Prays rarely'
  };
  if (Math.abs(
    Object.keys(prayerLevels).indexOf(user1.prayerFrequency) -
    Object.keys(prayerLevels).indexOf(user2.prayerFrequency)
  ) <= 1) {
    reasons.push(prayerLevels[user2.prayerFrequency]);
  }

  return reasons.slice(0, 4); // Return top 4 reasons
};

/**
 * Check if two users are a mutual match
 * @param {String} userId1 - First user ID
 * @param {String} userId2 - Second user ID
 * @returns {Boolean} True if mutual match
 */
const isMutualMatch = async (userId1, userId2) => {
  try {
    const user1 = await User.findById(userId1);
    const user2 = await User.findById(userId2);

    if (!user1 || !user2) return false;

    const user1LikesUser2 = user1.likedProfiles?.some(id => id.toString() === userId2);
    const user2LikesUser1 = user2.likedProfiles?.some(id => id.toString() === userId1);

    return user1LikesUser2 && user2LikesUser1;
  } catch (error) {
    console.error('Error checking mutual match:', error);
    return false;
  }
};

module.exports = {
  calculateMatchScore,
  getMatchSuggestions,
  getMatchReasons,
  isMutualMatch
};
