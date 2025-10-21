// Content Moderation Service
// Automated content filtering for inappropriate content

// Profanity/inappropriate word list (sample - expand as needed)
const profanityList = [
  'profane1', 'profane2', 'inappropriate1', 'inappropriate2',
  // Add more words as needed
];

// Inappropriate patterns
const inappropriatePatterns = [
  /\b(sex|nude|naked)\b/i,
  /\b(whatsapp|telegram|snapchat)\s*[:+]?\s*\d/i, // Contact sharing
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // Phone numbers
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email addresses
];

/**
 * Check if text contains profanity or inappropriate content
 * @param {String} text - Text to check
 * @returns {Object} - {isClean, violations, score}
 */
const checkContent = (text) => {
  if (!text || typeof text !== 'string') {
    return { isClean: true, violations: [], score: 100 };
  }

  const violations = [];
  const lowerText = text.toLowerCase();

  // Check profanity list
  profanityList.forEach(word => {
    if (lowerText.includes(word)) {
      violations.push({
        type: 'profanity',
        word: word,
        severity: 'high'
      });
    }
  });

  // Check inappropriate patterns
  inappropriatePatterns.forEach((pattern, index) => {
    if (pattern.test(text)) {
      violations.push({
        type: 'inappropriate_pattern',
        pattern: `pattern_${index}`,
        severity: 'medium',
        description: getPatternDescription(index)
      });
    }
  });

  // Calculate cleanliness score (0-100)
  const score = Math.max(0, 100 - (violations.length * 20));

  return {
    isClean: violations.length === 0,
    violations,
    score,
    requiresReview: score < 60
  };
};

const getPatternDescription = (index) => {
  const descriptions = [
    'Sexually explicit content',
    'Contact information sharing',
    'Phone number detected',
    'Email address detected'
  ];
  return descriptions[index] || 'Inappropriate content';
};

/**
 * Filter and clean text by removing inappropriate content
 * @param {String} text - Text to filter
 * @returns {String} - Filtered text
 */
const filterContent = (text) => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let filtered = text;

  // Replace profanity with asterisks
  profanityList.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  });

  // Remove phone numbers
  filtered = filtered.replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[PHONE_REMOVED]');

  // Remove email addresses
  filtered = filtered.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REMOVED]');

  return filtered;
};

/**
 * Check if user should be flagged for review based on violation history
 * @param {Array} violationHistory - Array of past violations
 * @returns {Boolean} - Should flag for admin review
 */
const shouldFlagUser = (violationHistory) => {
  if (!violationHistory || violationHistory.length === 0) {
    return false;
  }

  const recentViolations = violationHistory.filter(v => {
    const violationDate = new Date(v.timestamp);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return violationDate > weekAgo;
  });

  // Flag if more than 3 violations in the past week
  return recentViolations.length >= 3;
};

/**
 * Analyze image URL for inappropriate content (placeholder)
 * In production, integrate with ML service like Google Cloud Vision, AWS Rekognition
 * @param {String} imageUrl - URL of image to check
 * @returns {Object} - Analysis result
 */
const analyzeImage = async (imageUrl) => {
  // TODO: Integrate with ML service for actual image analysis
  // For now, return placeholder
  return {
    isAppropriate: true,
    confidence: 0.95,
    labels: [],
    violations: [],
    requiresReview: false
  };
};

/**
 * Calculate user risk score based on activity
 * @param {Object} user - User object
 * @param {Array} reports - Reports against user
 * @returns {Number} - Risk score (0-100, higher is riskier)
 */
const calculateUserRiskScore = (user, reports = []) => {
  let riskScore = 0;

  // Reports count
  if (reports.length > 0) riskScore += reports.length * 10;

  // Account age (newer accounts are slightly riskier)
  const accountAge = Date.now() - new Date(user.createdAt).getTime();
  const daysOld = accountAge / (1000 * 60 * 60 * 24);
  if (daysOld < 7) riskScore += 15;
  else if (daysOld < 30) riskScore += 5;

  // Profile completeness (incomplete profiles are riskier)
  let completeness = 0;
  if (user.bio) completeness += 20;
  if (user.profilePhoto) completeness += 20;
  if (user.occupation) completeness += 20;
  if (user.education) completeness += 20;
  if (user.profileImages && user.profileImages.length > 0) completeness += 20;

  riskScore += (100 - completeness) / 5; // Max 20 points

  // Not verified
  if (!user.isVerified) riskScore += 10;
  if (!user.isPhotoVerified) riskScore += 10;

  // Cap at 100
  return Math.min(100, riskScore);
};

/**
 * Get moderation action recommendation
 * @param {Number} riskScore - User risk score
 * @param {Object} contentCheck - Content check result
 * @returns {String} - Recommended action
 */
const getRecommendedAction = (riskScore, contentCheck) => {
  if (riskScore > 80 || (contentCheck && contentCheck.score < 40)) {
    return 'suspend'; // Immediate suspension
  } else if (riskScore > 60 || (contentCheck && contentCheck.score < 60)) {
    return 'warn'; // Send warning
  } else if (riskScore > 40) {
    return 'monitor'; // Increase monitoring
  }
  return 'none'; // No action needed
};

module.exports = {
  checkContent,
  filterContent,
  shouldFlagUser,
  analyzeImage,
  calculateUserRiskScore,
  getRecommendedAction
};
