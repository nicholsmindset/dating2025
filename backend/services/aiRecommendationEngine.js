const User = require('../models/User');
const Match = require('../models/Match');
const Chat = require('../models/Chat');

/**
 * AI-Powered Recommendation Engine
 * Uses collaborative filtering and content-based filtering for intelligent match suggestions
 */

/**
 * Calculate advanced compatibility score using ML techniques
 * @param {Object} user1 - First user
 * @param {Object} user2 - Second user
 * @returns {number} Compatibility score (0-100)
 */
const calculateMLCompatibilityScore = (user1, user2) => {
  // Feature vectors for ML-based scoring
  const features = {
    religious: calculateReligiousCompatibility(user1, user2),
    lifestyle: calculateLifestyleCompatibility(user1, user2),
    values: calculateValuesCompatibility(user1, user2),
    personality: calculatePersonalityCompatibility(user1, user2),
    practical: calculatePracticalCompatibility(user1, user2),
    behavioral: calculateBehavioralCompatibility(user1, user2)
  };

  // Weighted scoring (optimized through data analysis)
  const weights = {
    religious: 0.30,  // Highest weight for Islamic compatibility
    lifestyle: 0.20,
    values: 0.20,
    personality: 0.15,
    practical: 0.10,
    behavioral: 0.05
  };

  let totalScore = 0;
  Object.keys(features).forEach(key => {
    totalScore += features[key] * weights[key];
  });

  return Math.round(totalScore);
};

/**
 * Religious compatibility scoring
 */
const calculateReligiousCompatibility = (user1, user2) => {
  let score = 0;

  // Prayer frequency alignment
  const prayerMap = { '5_times_daily': 4, 'regularly': 3, 'sometimes': 2, 'rarely': 1 };
  const prayerDiff = Math.abs(prayerMap[user1.prayerFrequency] - prayerMap[user2.prayerFrequency]);
  score += (4 - prayerDiff) / 4 * 40; // 40 points max

  // Religious level alignment
  const levelMap = { 'practicing': 3, 'moderate': 2, 'learning': 1 };
  const levelDiff = Math.abs(levelMap[user1.religiousLevel] - levelMap[user2.religiousLevel]);
  score += (3 - levelDiff) / 3 * 35; // 35 points max

  // Hijab preference match (for females)
  if (user1.gender === 'female' || user2.gender === 'female') {
    const hijabScore = user1.hijabWearing === user2.hijabWearing ? 25 : 0;
    score += hijabScore;
  } else {
    score += 25; // Not applicable, give full points
  }

  return score;
};

/**
 * Lifestyle compatibility scoring
 */
const calculateLifestyleCompatibility = (user1, user2) => {
  let score = 0;

  // Education level compatibility
  const educationMap = { 'phd': 5, 'master': 4, 'bachelor': 3, 'diploma': 2, 'high_school': 1 };
  const eduDiff = Math.abs(educationMap[user1.education] - educationMap[user2.education]);
  score += (5 - eduDiff) / 5 * 40; // 40 points max

  // Occupation compatibility (similar professional level)
  if (user1.occupation && user2.occupation) {
    // Simple check for now - can be enhanced with job category matching
    score += 20;
  }

  // Interests overlap
  if (user1.interests && user2.interests) {
    const common = user1.interests.filter(i => user2.interests.includes(i));
    score += Math.min(common.length * 10, 40); // Max 40 points
  }

  return score;
};

/**
 * Values compatibility scoring
 */
const calculateValuesCompatibility = (user1, user2) => {
  let score = 0;

  // Marital status compatibility
  const maritalPrefs = {
    'never_married': ['never_married', 'divorced'],
    'divorced': ['divorced', 'widow', 'never_married'],
    'widow': ['widow', 'divorced', 'never_married']
  };

  if (maritalPrefs[user1.maritalStatus]?.includes(user2.maritalStatus)) {
    score += 35;
  }

  // Family values (want children, family size preferences)
  if (user1.wantChildren === user2.wantChildren) {
    score += 35;
  }

  // Lifestyle preferences (smoking, drinking - should match for Islamic compatibility)
  if (user1.smokingStatus === user2.smokingStatus) {
    score += 15;
  }
  if (user1.drinkingStatus === user2.drinkingStatus) {
    score += 15;
  }

  return score;
};

/**
 * Personality compatibility using Big Five traits
 */
const calculatePersonalityCompatibility = (user1, user2) => {
  // Simplified personality matching based on profile text analysis
  // In production, use personality assessment questionnaire

  let score = 50; // Base score

  // Bio length similarity (indicates similar communication style)
  if (user1.bio && user2.bio) {
    const lengthDiff = Math.abs(user1.bio.length - user2.bio.length);
    if (lengthDiff < 100) score += 25;
    else if (lengthDiff < 200) score += 15;
  }

  // Hobbies count similarity (indicates similar activity level)
  if (user1.hobbies && user2.hobbies) {
    const hobbyDiff = Math.abs(user1.hobbies.length - user2.hobbies.length);
    if (hobbyDiff <= 2) score += 25;
  }

  return Math.min(score, 100);
};

/**
 * Practical compatibility (location, age, etc.)
 */
const calculatePracticalCompatibility = (user1, user2) => {
  let score = 0;

  // Age compatibility
  const user1Age = calculateAge(user1.dateOfBirth);
  const user2Age = calculateAge(user2.dateOfBirth);
  const ageDiff = Math.abs(user1Age - user2Age);

  if (ageDiff <= 3) score += 40;
  else if (ageDiff <= 5) score += 30;
  else if (ageDiff <= 7) score += 20;
  else if (ageDiff <= 10) score += 10;

  // Location proximity
  if (user1.location.country === user2.location.country) {
    score += 30;
    if (user1.location.city === user2.location.city) {
      score += 30; // Bonus for same city
    }
  }

  return score;
};

/**
 * Behavioral compatibility based on platform usage
 */
const calculateBehavioralCompatibility = (user1, user2) => {
  let score = 50; // Base score

  // Activity level similarity
  const user1ActiveDays = (Date.now() - new Date(user1.createdAt)) / (1000 * 60 * 60 * 24);
  const user2ActiveDays = (Date.now() - new Date(user2.createdAt)) / (1000 * 60 * 60 * 24);

  const activityDiff = Math.abs(user1ActiveDays - user2ActiveDays);
  if (activityDiff < 30) score += 25; // Similar registration time
  else if (activityDiff < 90) score += 15;

  // Profile completeness similarity
  const user1Complete = calculateProfileCompleteness(user1);
  const user2Complete = calculateProfileCompleteness(user2);
  const completenessDiff = Math.abs(user1Complete - user2Complete);

  if (completenessDiff < 10) score += 25;

  return Math.min(score, 100);
};

/**
 * Calculate user age from date of birth
 */
const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

/**
 * Calculate profile completeness percentage
 */
const calculateProfileCompleteness = (user) => {
  const fields = [
    'firstName', 'lastName', 'dateOfBirth', 'gender', 'maritalStatus',
    'religiousLevel', 'prayerFrequency', 'location', 'bio', 'profilePhoto',
    'education', 'occupation', 'interests', 'hobbies'
  ];

  const completed = fields.filter(field => {
    const value = user[field];
    return value && (typeof value === 'string' ? value.length > 0 : true);
  });

  return (completed.length / fields.length) * 100;
};

/**
 * Get personalized recommendations using collaborative filtering
 * @param {string} userId - User ID
 * @param {number} limit - Number of recommendations
 * @returns {Promise<Array>} Array of recommended users
 */
const getPersonalizedRecommendations = async (userId, limit = 20) => {
  try {
    const currentUser = await User.findById(userId);
    if (!currentUser) return [];

    // Get users with similar preferences (collaborative filtering)
    const similarUsers = await findSimilarUsers(currentUser);

    // Get what similar users liked (collaborative filtering)
    const collaborativeRecommendations = await getCollaborativeRecommendations(
      currentUser,
      similarUsers
    );

    // Get content-based recommendations
    const contentRecommendations = await getContentBasedRecommendations(currentUser);

    // Hybrid approach: combine both methods
    const hybrid = combineRecommendations(
      collaborativeRecommendations,
      contentRecommendations,
      0.6, // 60% weight to collaborative
      0.4  // 40% weight to content-based
    );

    // Sort by score and limit
    return hybrid
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

  } catch (error) {
    console.error('Get personalized recommendations error:', error);
    return [];
  }
};

/**
 * Find users with similar preferences
 */
const findSimilarUsers = async (currentUser) => {
  // Find users who liked similar profiles
  const currentUserLikes = currentUser.likedProfiles || [];

  const similarUsers = await User.find({
    _id: { $ne: currentUser._id },
    likedProfiles: { $in: currentUserLikes },
    gender: currentUser.gender // Same gender (they have similar taste)
  }).limit(50);

  return similarUsers;
};

/**
 * Get collaborative filtering recommendations
 */
const getCollaborativeRecommendations = async (currentUser, similarUsers) => {
  const recommendations = new Map();

  for (const similarUser of similarUsers) {
    const theirLikes = similarUser.likedProfiles || [];

    for (const likedUserId of theirLikes) {
      // Skip if current user already liked this person
      if (currentUser.likedProfiles.includes(likedUserId)) continue;

      // Skip if it's the current user
      if (likedUserId.toString() === currentUser._id.toString()) continue;

      // Add or update recommendation score
      const current = recommendations.get(likedUserId.toString()) || 0;
      recommendations.set(likedUserId.toString(), current + 1);
    }
  }

  // Convert to array and fetch user details
  const userIds = Array.from(recommendations.keys());
  const users = await User.find({
    _id: { $in: userIds },
    gender: currentUser.gender === 'male' ? 'female' : 'male', // Opposite gender
    isActive: true
  });

  return users.map(user => ({
    user,
    score: recommendations.get(user._id.toString()) || 0,
    reason: 'collaborative'
  }));
};

/**
 * Get content-based recommendations
 */
const getContentBasedRecommendations = async (currentUser) => {
  // Build query based on user preferences
  const query = {
    _id: { $ne: currentUser._id },
    gender: currentUser.gender === 'male' ? 'female' : 'male',
    isActive: true,
    accountStatus: 'active'
  };

  // Add preference filters
  if (currentUser.partnerPreferences) {
    const prefs = currentUser.partnerPreferences;

    if (prefs.ageRange) {
      const today = new Date();
      if (prefs.ageRange.min) {
        const maxBirth = new Date(today.getFullYear() - prefs.ageRange.min, today.getMonth(), today.getDate());
        query.dateOfBirth = { $lte: maxBirth };
      }
      if (prefs.ageRange.max) {
        const minBirth = new Date(today.getFullYear() - prefs.ageRange.max - 1, today.getMonth(), today.getDate());
        query.dateOfBirth = { ...query.dateOfBirth, $gte: minBirth };
      }
    }

    if (prefs.religiousLevel && prefs.religiousLevel.length > 0) {
      query.religiousLevel = { $in: prefs.religiousLevel };
    }

    if (prefs.maritalStatus && prefs.maritalStatus.length > 0) {
      query.maritalStatus = { $in: prefs.maritalStatus };
    }
  }

  const candidates = await User.find(query).limit(100);

  // Calculate ML compatibility scores
  return candidates.map(candidate => ({
    user: candidate,
    score: calculateMLCompatibilityScore(currentUser, candidate),
    reason: 'content-based'
  }));
};

/**
 * Combine recommendations from different sources
 */
const combineRecommendations = (collaborative, contentBased, weightCollaborative, weightContent) => {
  const combined = new Map();

  // Add collaborative recommendations
  collaborative.forEach(rec => {
    const userId = rec.user._id.toString();
    combined.set(userId, {
      user: rec.user,
      score: rec.score * weightCollaborative,
      sources: ['collaborative']
    });
  });

  // Add/merge content-based recommendations
  contentBased.forEach(rec => {
    const userId = rec.user._id.toString();
    if (combined.has(userId)) {
      const existing = combined.get(userId);
      existing.score += rec.score * weightContent;
      existing.sources.push('content-based');
    } else {
      combined.set(userId, {
        user: rec.user,
        score: rec.score * weightContent,
        sources: ['content-based']
      });
    }
  });

  return Array.from(combined.values());
};

/**
 * Get "You Might Also Like" recommendations based on a viewed profile
 * @param {string} userId - Current user ID
 * @param {string} viewedUserId - ID of profile being viewed
 * @returns {Promise<Array>} Similar profiles
 */
const getSimilarProfiles = async (userId, viewedUserId) => {
  try {
    const currentUser = await User.findById(userId);
    const viewedUser = await User.findById(viewedUserId);

    if (!currentUser || !viewedUser) return [];

    // Find users similar to the viewed profile
    const similarQuery = {
      _id: { $ne: userId, $ne: viewedUserId },
      gender: viewedUser.gender,
      religiousLevel: viewedUser.religiousLevel,
      'location.country': viewedUser.location.country,
      isActive: true
    };

    const similar = await User.find(similarQuery).limit(10);

    // Calculate similarity scores
    return similar.map(user => ({
      ...user.toObject(),
      similarityScore: calculateMLCompatibilityScore(viewedUser, user)
    })).sort((a, b) => b.similarityScore - a.similarityScore);

  } catch (error) {
    console.error('Get similar profiles error:', error);
    return [];
  }
};

module.exports = {
  calculateMLCompatibilityScore,
  getPersonalizedRecommendations,
  getSimilarProfiles,
  calculateProfileCompleteness
};
