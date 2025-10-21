const User = require('../models/User');
const CompatibilityQuiz = require('../models/CompatibilityQuiz');
const ProfileBoost = require('../models/ProfileBoost');

class MatchingService {
  /**
   * Calculate compatibility score between two users
   * @param {ObjectId} userId1
   * @param {ObjectId} userId2
   * @returns {Object} Compatibility score and breakdown
   */
  static async calculateCompatibility(userId1, userId2) {
    try {
      const [user1, user2] = await Promise.all([
        User.findById(userId1),
        User.findById(userId2)
      ]);

      if (!user1 || !user2) {
        return { score: 0, breakdown: {} };
      }

      let totalScore = 0;
      const breakdown = {};

      // 1. Religious Compatibility (30 points)
      const religiousScore = this.calculateReligiousCompatibility(user1, user2);
      breakdown.religious = religiousScore;
      totalScore += religiousScore;

      // 2. Location Compatibility (15 points)
      const locationScore = this.calculateLocationCompatibility(user1, user2);
      breakdown.location = locationScore;
      totalScore += locationScore;

      // 3. Age Compatibility (15 points)
      const ageScore = this.calculateAgeCompatibility(user1, user2);
      breakdown.age = ageScore;
      totalScore += ageScore;

      // 4. Education & Career (10 points)
      const educationScore = this.calculateEducationCompatibility(user1, user2);
      breakdown.education = educationScore;
      totalScore += educationScore;

      // 5. Marital Status Compatibility (10 points)
      const maritalScore = this.calculateMaritalStatusCompatibility(user1, user2);
      breakdown.maritalStatus = maritalScore;
      totalScore += maritalScore;

      // 6. Compatibility Quiz (20 points) - if both completed
      const [quiz1, quiz2] = await Promise.all([
        CompatibilityQuiz.findOne({ user: userId1, isCompleted: true }),
        CompatibilityQuiz.findOne({ user: userId2, isCompleted: true })
      ]);

      if (quiz1 && quiz2) {
        const quizScore = CompatibilityQuiz.calculateCompatibility(quiz1, quiz2);
        breakdown.quiz = Math.round((quizScore / 100) * 20);
        totalScore += breakdown.quiz;
      } else {
        breakdown.quiz = 0;
      }

      return {
        score: Math.round(totalScore),
        breakdown,
        maxScore: 100
      };
    } catch (error) {
      console.error('Error calculating compatibility:', error);
      return { score: 0, breakdown: {} };
    }
  }

  /**
   * Calculate religious compatibility (30 points max)
   */
  static calculateReligiousCompatibility(user1, user2) {
    let score = 0;

    // Religious level (15 points)
    const religiousLevelMap = { practicing: 3, moderate: 2, learning: 1 };
    const level1 = religiousLevelMap[user1.religiousLevel] || 0;
    const level2 = religiousLevelMap[user2.religiousLevel] || 0;
    const levelDiff = Math.abs(level1 - level2);
    score += (3 - levelDiff) * 5; // 15, 10, 5, or 0 points

    // Prayer frequency (15 points)
    const prayerMap = { '5_times_daily': 4, regularly: 3, sometimes: 2, rarely: 1 };
    const prayer1 = prayerMap[user1.prayerFrequency] || 0;
    const prayer2 = prayerMap[user2.prayerFrequency] || 0;
    const prayerDiff = Math.abs(prayer1 - prayer2);
    score += (4 - prayerDiff) * 3.75; // 15, 11.25, 7.5, 3.75, or 0 points

    return Math.round(score);
  }

  /**
   * Calculate location compatibility (15 points max)
   */
  static calculateLocationCompatibility(user1, user2) {
    let score = 0;

    // Same country: 15 points
    if (user1.location.country === user2.location.country) {
      score = 15;

      // Same city: keep 15 points, just note it
      if (user1.location.city === user2.location.city) {
        score = 15; // Same city is ideal
      }
    } else {
      // Different country: 5 points (still possible with relocation)
      score = 5;
    }

    return score;
  }

  /**
   * Calculate age compatibility (15 points max)
   */
  static calculateAgeCompatibility(user1, user2) {
    const age1 = user1.age;
    const age2 = user2.age;

    // Check if ages match each other's preferences
    let score = 0;

    // Check if user2's age falls within user1's preference
    if (user1.partnerPreferences?.ageRange?.min && user1.partnerPreferences?.ageRange?.max) {
      if (age2 >= user1.partnerPreferences.ageRange.min && age2 <= user1.partnerPreferences.ageRange.max) {
        score += 7.5;
      }
    } else {
      // No preference set, give partial points
      score += 3;
    }

    // Check if user1's age falls within user2's preference
    if (user2.partnerPreferences?.ageRange?.min && user2.partnerPreferences?.ageRange?.max) {
      if (age1 >= user2.partnerPreferences.ageRange.min && age1 <= user2.partnerPreferences.ageRange.max) {
        score += 7.5;
      }
    } else {
      // No preference set, give partial points
      score += 3;
    }

    return Math.round(score);
  }

  /**
   * Calculate education compatibility (10 points max)
   */
  static calculateEducationCompatibility(user1, user2) {
    if (!user1.education || !user2.education) {
      return 5; // Partial points if missing
    }

    const educationLevelMap = {
      phd: 6,
      master: 5,
      bachelor: 4,
      diploma: 3,
      high_school: 2,
      other: 1
    };

    const level1 = educationLevelMap[user1.education] || 0;
    const level2 = educationLevelMap[user2.education] || 0;
    const diff = Math.abs(level1 - level2);

    // Same level: 10 points, 1 level difference: 7, 2 levels: 4, 3+: 0
    if (diff === 0) return 10;
    if (diff === 1) return 7;
    if (diff === 2) return 4;
    return 2;
  }

  /**
   * Calculate marital status compatibility (10 points max)
   */
  static calculateMaritalStatusCompatibility(user1, user2) {
    // Check if each user's marital status is acceptable to the other
    let score = 0;

    // If user1 has preferences
    if (user1.partnerPreferences?.maritalStatus && user1.partnerPreferences.maritalStatus.length > 0) {
      if (user1.partnerPreferences.maritalStatus.includes(user2.maritalStatus)) {
        score += 5;
      }
    } else {
      score += 2.5; // No preference = partial points
    }

    // If user2 has preferences
    if (user2.partnerPreferences?.maritalStatus && user2.partnerPreferences.maritalStatus.length > 0) {
      if (user2.partnerPreferences.maritalStatus.includes(user1.maritalStatus)) {
        score += 5;
      }
    } else {
      score += 2.5; // No preference = partial points
    }

    return Math.round(score);
  }

  /**
   * Generate Today's Top Picks for a user
   * @param {ObjectId} userId
   * @param {Number} limit - Number of picks to generate (default 5)
   * @returns {Array} Array of user objects with compatibility scores
   */
  static async generateTopPicks(userId, limit = 5) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if we already generated picks for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (user.topPicks?.generatedFor) {
        const generatedDate = new Date(user.topPicks.generatedFor);
        generatedDate.setHours(0, 0, 0, 0);

        if (generatedDate.getTime() === today.getTime()) {
          // Return existing picks
          return User.find({
            _id: { $in: user.topPicks.picks }
          }).select('-password');
        }
      }

      // Build query for potential matches
      const query = {
        _id: { $ne: userId },
        gender: user.gender === 'male' ? 'female' : 'male',
        isActive: true,
        accountStatus: 'active'
      };

      // Exclude blocked users and users who blocked this user
      query._id.$nin = [...(user.blockedUsers || []), userId];

      // Get all potential matches
      const potentialMatches = await User.find(query)
        .limit(100) // Get top 100 candidates
        .select('-password');

      // Calculate compatibility for each
      const matchesWithScores = await Promise.all(
        potentialMatches.map(async (match) => {
          const compatibility = await this.calculateCompatibility(userId, match._id);
          return {
            user: match,
            compatibilityScore: compatibility.score,
            breakdown: compatibility.breakdown
          };
        })
      );

      // Sort by compatibility score
      matchesWithScores.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

      // Take top N picks
      const topPicks = matchesWithScores.slice(0, limit);

      // Update user's top picks
      user.topPicks = {
        lastGenerated: new Date(),
        generatedFor: today,
        picks: topPicks.map((pick) => pick.user._id)
      };
      await user.save();

      return topPicks;
    } catch (error) {
      console.error('Error generating top picks:', error);
      throw error;
    }
  }

  /**
   * Get smart match recommendations with filters
   * @param {ObjectId} userId
   * @param {Object} filters - Additional filters
   * @param {Number} page
   * @param {Number} limit
   * @returns {Object} Paginated matches with compatibility scores
   */
  static async getSmartMatches(userId, filters = {}, page = 1, limit = 20) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Build query
      const query = {
        _id: { $ne: userId, $nin: [...(user.blockedUsers || []), userId] },
        gender: user.gender === 'male' ? 'female' : 'male',
        isActive: true,
        accountStatus: 'active'
      };

      // Apply user preferences
      if (user.partnerPreferences) {
        if (user.partnerPreferences.ageRange?.min || user.partnerPreferences.ageRange?.max) {
          const now = new Date();
          if (user.partnerPreferences.ageRange.max) {
            const minBirthDate = new Date(now.getFullYear() - user.partnerPreferences.ageRange.max - 1, now.getMonth(), now.getDate());
            query.dateOfBirth = { $gte: minBirthDate };
          }
          if (user.partnerPreferences.ageRange.min) {
            const maxBirthDate = new Date(now.getFullYear() - user.partnerPreferences.ageRange.min, now.getMonth(), now.getDate());
            query.dateOfBirth = { ...query.dateOfBirth, $lte: maxBirthDate };
          }
        }

        if (user.partnerPreferences.location?.countries?.length > 0) {
          query['location.country'] = { $in: user.partnerPreferences.location.countries };
        }

        if (user.partnerPreferences.religiousLevel?.length > 0) {
          query.religiousLevel = { $in: user.partnerPreferences.religiousLevel };
        }

        if (user.partnerPreferences.education?.length > 0) {
          query.education = { $in: user.partnerPreferences.education };
        }
      }

      // Apply additional filters
      if (filters.minAge || filters.maxAge) {
        const now = new Date();
        if (filters.maxAge) {
          const minBirthDate = new Date(now.getFullYear() - filters.maxAge - 1, now.getMonth(), now.getDate());
          query.dateOfBirth = { ...query.dateOfBirth, $gte: minBirthDate };
        }
        if (filters.minAge) {
          const maxBirthDate = new Date(now.getFullYear() - filters.minAge, now.getMonth(), now.getDate());
          query.dateOfBirth = { ...query.dateOfBirth, $lte: maxBirthDate };
        }
      }

      if (filters.country) {
        query['location.country'] = filters.country;
      }

      if (filters.city) {
        query['location.city'] = filters.city;
      }

      if (filters.religiousLevel) {
        query.religiousLevel = filters.religiousLevel;
      }

      if (filters.maritalStatus) {
        query.maritalStatus = filters.maritalStatus;
      }

      // Check if user is currently boosted (affects ranking)
      const activeBoost = await ProfileBoost.findOne({
        user: userId,
        status: 'active',
        startTime: { $lte: new Date() },
        endTime: { $gte: new Date() }
      });

      // Get matches
      const skip = (page - 1) * limit;
      const matches = await User.find(query)
        .select('-password')
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(query);

      // Calculate compatibility for each match
      const matchesWithScores = await Promise.all(
        matches.map(async (match) => {
          const compatibility = await this.calculateCompatibility(userId, match._id);
          return {
            ...match.toObject(),
            compatibilityScore: compatibility.score,
            compatibilityBreakdown: compatibility.breakdown
          };
        })
      );

      // Sort by compatibility
      matchesWithScores.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

      return {
        matches: matchesWithScores,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        userIsBoosted: !!activeBoost
      };
    } catch (error) {
      console.error('Error getting smart matches:', error);
      throw error;
    }
  }
}

module.exports = MatchingService;
