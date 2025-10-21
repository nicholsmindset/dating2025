/**
 * AI-Powered Content Moderation Service
 * Enhanced natural language processing for chat and profile content
 */

/**
 * Advanced profanity and inappropriate content detection
 * Uses pattern matching, context analysis, and sentiment analysis
 */

// Extended profanity and inappropriate content database
const inappropriatePatterns = {
  // Profanity variations (with common obfuscations)
  profanity: [
    /\bf+[u\*]+c+k+/gi,
    /\bs+h+[i\*]+t+/gi,
    /\bb+[i\*]+t+c+h+/gi,
    /\ba+s+s+h+[o\*]+l+e+/gi,
    /\bd+a+m+n+/gi,
    /\bh+e+l+l+/gi,
    // Add more patterns with obfuscations
  ],

  // Explicit sexual content
  explicit: [
    /\bs+e+x+/gi,
    /\bn+[u\*]+d+e+/gi,
    /\bp+[o\*]+r+n+/gi,
    /\bx+x+x+/gi,
  ],

  // Contact information (phone, email, social media)
  contactInfo: [
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // Phone numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
    /\b(?:whatsapp|telegram|snapchat|instagram|facebook|twitter)\b/gi,
    /\b(?:@|#)\w+/g, // Handles @username or #hashtag
  ],

  // Scam/fraud indicators
  scam: [
    /\b(?:send|give|transfer)\s+(?:money|cash|bitcoin|crypto)\b/gi,
    /\b(?:western\s+union|moneygram|paypal)\b/gi,
    /\b(?:investment|opportunity|make\s+money)\b/gi,
    /\b(?:nigerian\s+prince|inheritance|lottery|winner)\b/gi,
  ],

  // Harassment and threats
  harassment: [
    /\b(?:kill|hurt|harm|attack)\s+(?:you|yourself)\b/gi,
    /\b(?:stupid|idiot|moron|loser)\b/gi,
    /\bdie\b/gi,
  ],

  // Inappropriate requests
  inappropriate: [
    /\bsend\s+(?:pics|pictures|photos|nudes)\b/gi,
    /\bshow\s+(?:me|your)\s+(?:body|pics)\b/gi,
    /\bmeet\s+(?:tonight|now|immediately)\b/gi,
  ]
};

/**
 * Check content for inappropriate material using AI-enhanced detection
 * @param {string} text - Text content to analyze
 * @returns {Object} Analysis results
 */
const checkContentWithAI = (text) => {
  if (!text || typeof text !== 'string') {
    return {
      isClean: true,
      violations: [],
      score: 0,
      requiresReview: false,
      sentiment: 'neutral'
    };
  }

  const violations = [];
  let score = 0;

  // Check each category
  Object.keys(inappropriatePatterns).forEach(category => {
    inappropriatePatterns[category].forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        violations.push({
          category,
          matched: matches.map(m => m.replace(/./g, '*')), // Redact matched content
          count: matches.length,
          severity: getCategorySeverity(category)
        });
        score += matches.length * getCategorySeverity(category);
      }
    });
  });

  // Analyze sentiment
  const sentiment = analyzeSentiment(text);

  // Context analysis for false positives
  const contextScore = analyzeContext(text, violations);

  // Adjust score based on context
  score = score * contextScore.multiplier;

  return {
    isClean: violations.length === 0,
    violations,
    score: Math.min(score, 100),
    requiresReview: score > 30 || sentiment.isNegative,
    sentiment: sentiment.overall,
    sentimentScore: sentiment.score,
    contextAnalysis: contextScore,
    recommendation: getRecommendation(score, violations, sentiment)
  };
};

/**
 * Get severity score for category
 * @param {string} category - Violation category
 * @returns {number} Severity score (1-10)
 */
const getCategorySeverity = (category) => {
  const severityMap = {
    explicit: 10,
    harassment: 9,
    scam: 8,
    contactInfo: 7,
    inappropriate: 6,
    profanity: 5
  };
  return severityMap[category] || 3;
};

/**
 * Analyze sentiment of text
 * @param {string} text - Text to analyze
 * @returns {Object} Sentiment analysis
 */
const analyzeSentiment = (text) => {
  const positiveWords = ['love', 'happy', 'good', 'great', 'wonderful', 'nice', 'kind', 'beautiful', 'amazing', 'excellent'];
  const negativeWords = ['hate', 'bad', 'terrible', 'awful', 'horrible', 'disgusting', 'ugly', 'stupid', 'worst'];

  const words = text.toLowerCase().split(/\s+/);

  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach(word => {
    if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
    if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
  });

  const score = (positiveCount - negativeCount) / Math.max(words.length, 1) * 100;

  return {
    score,
    overall: score > 10 ? 'positive' : score < -10 ? 'negative' : 'neutral',
    isNegative: score < -10,
    positiveCount,
    negativeCount
  };
};

/**
 * Analyze context to reduce false positives
 * @param {string} text - Original text
 * @param {Array} violations - Detected violations
 * @returns {Object} Context analysis
 */
const analyzeContext = (text, violations) => {
  let multiplier = 1.0;
  const contextFlags = [];

  // Check for quotes or references (possible false positive)
  if (text.includes('"') || text.includes("'")) {
    multiplier *= 0.8;
    contextFlags.push('Contains quotes - possible reference');
  }

  // Check for questions (less severe than statements)
  if (text.includes('?')) {
    multiplier *= 0.9;
    contextFlags.push('Question format - less severe');
  }

  // Check for negations (could reverse meaning)
  const negationWords = ['not', "n't", 'never', 'no'];
  const hasNegation = negationWords.some(word =>
    text.toLowerCase().includes(word)
  );
  if (hasNegation) {
    multiplier *= 0.7;
    contextFlags.push('Contains negation - context important');
  }

  // Check message length (very short messages might be false positives)
  if (text.trim().length < 10) {
    multiplier *= 0.8;
    contextFlags.push('Very short message - might be fragment');
  }

  return {
    multiplier,
    flags: contextFlags,
    suggestion: multiplier < 1 ? 'Manual review recommended for context' : 'Automated action appropriate'
  };
};

/**
 * Get moderation recommendation
 * @param {number} score - Violation score
 * @param {Array} violations - List of violations
 * @param {Object} sentiment - Sentiment analysis
 * @returns {Object} Recommendation
 */
const getRecommendation = (score, violations, sentiment) => {
  if (score >= 70) {
    return {
      action: 'BLOCK',
      confidence: 0.95,
      reason: 'Severe violations detected',
      automate: true
    };
  }

  if (score >= 40) {
    return {
      action: 'REVIEW',
      confidence: 0.75,
      reason: 'Multiple violations or moderate severity',
      automate: false
    };
  }

  if (score >= 20) {
    return {
      action: 'WARN',
      confidence: 0.6,
      reason: 'Minor violations detected',
      automate: true
    };
  }

  return {
    action: 'ALLOW',
    confidence: 0.9,
    reason: 'Content appears appropriate',
    automate: true
  };
};

/**
 * Analyze profile bio for appropriateness
 * @param {string} bio - User bio text
 * @returns {Object} Bio analysis
 */
const analyzeProfileBio = (bio) => {
  const contentCheck = checkContentWithAI(bio);

  // Additional checks specific to profiles
  const length = bio.trim().length;
  const hasContactInfo = contentCheck.violations.some(v => v.category === 'contactInfo');

  const profileScore = {
    ...contentCheck,
    lengthAppropriate: length >= 50 && length <= 500,
    hasContactInfo,
    isComplete: length >= 100,
    suggestions: []
  };

  // Generate suggestions
  if (length < 50) {
    profileScore.suggestions.push('Bio is too short. Add more details about yourself.');
  }
  if (length > 500) {
    profileScore.suggestions.push('Bio is quite long. Consider condensing key points.');
  }
  if (hasContactInfo) {
    profileScore.suggestions.push('Remove contact information from bio. Use chat feature instead.');
  }
  if (contentCheck.requiresReview) {
    profileScore.suggestions.push('Bio contains content that requires review.');
  }

  return profileScore;
};

/**
 * Analyze chat message in real-time
 * @param {string} message - Chat message
 * @param {Object} context - Conversation context
 * @returns {Object} Message analysis
 */
const analyzeChatMessage = (message, context = {}) => {
  const contentCheck = checkContentWithAI(message);

  // Consider conversation context
  const { messageCount = 0, reportCount = 0, previousViolations = 0 } = context;

  // Adjust severity based on user history
  let adjustedScore = contentCheck.score;
  if (previousViolations > 3) adjustedScore *= 1.5;
  if (reportCount > 0) adjustedScore *= 1.3;

  return {
    ...contentCheck,
    score: Math.min(adjustedScore, 100),
    allowSend: adjustedScore < 70,
    userHistory: {
      messageCount,
      reportCount,
      previousViolations
    },
    action: adjustedScore >= 70 ? 'BLOCK_MESSAGE' : 'ALLOW'
  };
};

/**
 * Generate safety score for user
 * @param {Object} user - User object
 * @param {Array} messages - User's messages
 * @returns {Object} Safety score
 */
const calculateUserSafetyScore = (user, messages = []) => {
  let safetyScore = 100;
  const issues = [];

  // Analyze all messages
  const messageAnalyses = messages.map(msg => checkContentWithAI(msg.content));
  const totalViolations = messageAnalyses.reduce((sum, analysis) =>
    sum + analysis.violations.length, 0
  );

  // Deduct points for violations
  safetyScore -= totalViolations * 5;

  // Check report history
  const reportCount = user.reports?.length || 0;
  safetyScore -= reportCount * 10;
  if (reportCount > 0) issues.push(`${reportCount} reports received`);

  // Check account age (newer accounts more risky)
  const accountAgeInDays = (Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24);
  if (accountAgeInDays < 7) {
    safetyScore -= 10;
    issues.push('New account (< 7 days)');
  }

  // Check verification status
  if (!user.isVerified) {
    safetyScore -= 15;
    issues.push('Email not verified');
  }
  if (!user.isPhotoVerified) {
    safetyScore -= 10;
    issues.push('Photo not verified');
  }

  // Check profile completeness
  if (!user.bio || user.bio.length < 50) {
    safetyScore -= 5;
    issues.push('Incomplete profile');
  }

  safetyScore = Math.max(safetyScore, 0);

  return {
    score: safetyScore,
    rating: safetyScore >= 80 ? 'TRUSTED' : safetyScore >= 60 ? 'NORMAL' : safetyScore >= 40 ? 'CAUTION' : 'HIGH_RISK',
    issues,
    totalViolations,
    reportCount,
    recommendation: safetyScore < 40 ? 'REVIEW_ACCOUNT' : safetyScore < 60 ? 'MONITOR' : 'NO_ACTION'
  };
};

/**
 * Detect spam patterns in messages
 * @param {Array} messages - Array of messages from user
 * @returns {Object} Spam analysis
 */
const detectSpamPattern = (messages) => {
  if (!messages || messages.length === 0) {
    return { isSpam: false, confidence: 0, patterns: [] };
  }

  const patterns = [];
  let spamScore = 0;

  // Check for repeated messages
  const messageTexts = messages.map(m => m.content);
  const uniqueMessages = new Set(messageTexts);
  if (uniqueMessages.size < messageTexts.length * 0.5) {
    patterns.push('High message repetition');
    spamScore += 30;
  }

  // Check for rapid messaging (flood)
  const timeGaps = [];
  for (let i = 1; i < messages.length; i++) {
    const gap = new Date(messages[i].timestamp) - new Date(messages[i - 1].timestamp);
    timeGaps.push(gap);
  }
  const avgGap = timeGaps.reduce((a, b) => a + b, 0) / timeGaps.length;
  if (avgGap < 1000) { // Less than 1 second between messages
    patterns.push('Rapid message sending (flood)');
    spamScore += 40;
  }

  // Check for copy-paste indicators (very long messages)
  const avgLength = messageTexts.reduce((sum, msg) => sum + msg.length, 0) / messageTexts.length;
  if (avgLength > 500) {
    patterns.push('Unusually long messages');
    spamScore += 20;
  }

  // Check for URL/link spam
  const urlCount = messageTexts.filter(msg =>
    msg.match(/https?:\/\/|www\./gi)
  ).length;
  if (urlCount > messages.length * 0.3) {
    patterns.push('High URL frequency');
    spamScore += 35;
  }

  return {
    isSpam: spamScore >= 50,
    confidence: Math.min(spamScore / 100, 1),
    spamScore,
    patterns,
    recommendation: spamScore >= 70 ? 'BLOCK_USER' : spamScore >= 50 ? 'LIMIT_MESSAGES' : 'ALLOW'
  };
};

module.exports = {
  checkContentWithAI,
  analyzeProfileBio,
  analyzeChatMessage,
  calculateUserSafetyScore,
  detectSpamPattern
};
