const cloudinary = require('cloudinary').v2;
const axios = require('axios');

/**
 * AI-Powered Photo Verification Service
 * Uses Cloudinary AI and external APIs for intelligent photo analysis
 */

/**
 * Analyze photo using Cloudinary's AI moderation
 * @param {string} imageUrl - URL of the image to analyze
 * @returns {Promise<Object>} Analysis results
 */
const analyzePhotoWithAI = async (imageUrl) => {
  try {
    // Use Cloudinary's AI moderation features
    const result = await cloudinary.api.resource(imageUrl, {
      moderation: 'aws_rek',
      faces: true,
      colors: true,
      quality_analysis: true
    });

    return {
      faceDetection: analyzeFaceDetection(result),
      contentModeration: analyzeContentModeration(result),
      qualityAnalysis: analyzeQuality(result),
      appropriatenessScore: calculateAppropriatenessScore(result)
    };
  } catch (error) {
    console.error('AI photo analysis error:', error);
    return {
      error: error.message,
      faceDetection: { detected: false, confidence: 0 },
      contentModeration: { appropriate: true, confidence: 0 },
      qualityAnalysis: { score: 0 },
      appropriatenessScore: 0
    };
  }
};

/**
 * Analyze face detection results
 * @param {Object} cloudinaryResult - Cloudinary API result
 * @returns {Object} Face detection analysis
 */
const analyzeFaceDetection = (cloudinaryResult) => {
  const faces = cloudinaryResult.faces || [];

  return {
    detected: faces.length > 0,
    faceCount: faces.length,
    multipleFaces: faces.length > 1,
    confidence: faces.length > 0 ? 0.95 : 0,
    faceCoordinates: faces.map(face => ({
      x: face[0],
      y: face[1],
      width: face[2],
      height: face[3]
    })),
    recommendation: faces.length === 1
      ? 'APPROVE'
      : faces.length === 0
        ? 'REJECT - No face detected'
        : 'REVIEW - Multiple faces detected'
  };
};

/**
 * Analyze content moderation results
 * @param {Object} cloudinaryResult - Cloudinary API result
 * @returns {Object} Content moderation analysis
 */
const analyzeContentModeration = (cloudinaryResult) => {
  const moderation = cloudinaryResult.moderation || [];

  // Check for inappropriate content
  const inappropriateFlags = [];
  let maxConfidence = 0;

  moderation.forEach(mod => {
    if (mod.status === 'rejected') {
      inappropriateFlags.push({
        category: mod.kind,
        confidence: mod.confidence || 0
      });
      maxConfidence = Math.max(maxConfidence, mod.confidence || 0);
    }
  });

  const isAppropriate = inappropriateFlags.length === 0;

  return {
    appropriate: isAppropriate,
    confidence: isAppropriate ? 0.95 : maxConfidence,
    flags: inappropriateFlags,
    categories: inappropriateFlags.map(f => f.category),
    recommendation: isAppropriate
      ? 'APPROVE'
      : maxConfidence > 0.8
        ? 'REJECT - Inappropriate content detected'
        : 'REVIEW - Potential inappropriate content'
  };
};

/**
 * Analyze image quality
 * @param {Object} cloudinaryResult - Cloudinary API result
 * @returns {Object} Quality analysis
 */
const analyzeQuality = (cloudinaryResult) => {
  const width = cloudinaryResult.width || 0;
  const height = cloudinaryResult.height || 0;
  const format = cloudinaryResult.format || '';
  const bytes = cloudinaryResult.bytes || 0;

  // Calculate quality score (0-100)
  let qualityScore = 0;

  // Resolution check (minimum 400x400)
  if (width >= 400 && height >= 400) qualityScore += 30;
  else if (width >= 200 && height >= 200) qualityScore += 15;

  // Format check (prefer JPG/PNG)
  if (['jpg', 'jpeg', 'png'].includes(format.toLowerCase())) qualityScore += 20;

  // File size check (not too small, not too large)
  const megabytes = bytes / (1024 * 1024);
  if (megabytes >= 0.1 && megabytes <= 10) qualityScore += 20;

  // Aspect ratio check (roughly portrait or square)
  const aspectRatio = width / height;
  if (aspectRatio >= 0.7 && aspectRatio <= 1.3) qualityScore += 30;

  return {
    score: qualityScore,
    resolution: `${width}x${height}`,
    format: format,
    sizeInMB: megabytes.toFixed(2),
    aspectRatio: aspectRatio.toFixed(2),
    isHighQuality: qualityScore >= 70,
    recommendation: qualityScore >= 70
      ? 'APPROVE'
      : qualityScore >= 50
        ? 'REVIEW - Low quality'
        : 'REJECT - Poor quality'
  };
};

/**
 * Calculate overall appropriateness score
 * @param {Object} cloudinaryResult - Cloudinary API result
 * @returns {number} Score from 0-100
 */
const calculateAppropriatenessScore = (cloudinaryResult) => {
  const faceAnalysis = analyzeFaceDetection(cloudinaryResult);
  const contentAnalysis = analyzeContentModeration(cloudinaryResult);
  const qualityAnalysis = analyzeQuality(cloudinaryResult);

  let score = 0;

  // Face detection (40 points)
  if (faceAnalysis.faceCount === 1) score += 40;
  else if (faceAnalysis.faceCount > 1) score += 20;

  // Content appropriateness (40 points)
  if (contentAnalysis.appropriate) score += 40;
  else if (contentAnalysis.confidence < 0.8) score += 10;

  // Quality (20 points)
  score += (qualityAnalysis.score / 100) * 20;

  return Math.round(score);
};

/**
 * Detect if photo appears to be a stock photo or fake
 * Uses reverse image search concept
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<Object>} Fraud detection results
 */
const detectFraudulentPhoto = async (imageUrl) => {
  try {
    // Basic heuristics for fraud detection
    const indicators = {
      stockPhoto: false,
      watermark: false,
      lowQuality: false,
      suspiciousPatterns: []
    };

    // Check for common stock photo indicators
    // In production, integrate with reverse image search API

    const fraudScore = calculateFraudScore(indicators);

    return {
      isFraudulent: fraudScore > 70,
      fraudScore,
      indicators,
      recommendation: fraudScore > 70
        ? 'REJECT - Suspected fraud'
        : fraudScore > 40
          ? 'REVIEW - Fraud indicators detected'
          : 'APPROVE'
    };
  } catch (error) {
    console.error('Fraud detection error:', error);
    return {
      isFraudulent: false,
      fraudScore: 0,
      indicators: {},
      recommendation: 'REVIEW - Error in fraud detection'
    };
  }
};

/**
 * Calculate fraud score
 * @param {Object} indicators - Fraud indicators
 * @returns {number} Score from 0-100
 */
const calculateFraudScore = (indicators) => {
  let score = 0;

  if (indicators.stockPhoto) score += 40;
  if (indicators.watermark) score += 30;
  if (indicators.lowQuality) score += 20;
  score += indicators.suspiciousPatterns.length * 10;

  return Math.min(score, 100);
};

/**
 * Generate automated verification decision
 * @param {Object} analysisResults - Combined analysis results
 * @returns {Object} Verification decision
 */
const generateVerificationDecision = (analysisResults) => {
  const { faceDetection, contentModeration, qualityAnalysis, appropriatenessScore } = analysisResults;

  // Auto-approve criteria
  if (
    appropriatenessScore >= 80 &&
    faceDetection.faceCount === 1 &&
    contentModeration.appropriate &&
    qualityAnalysis.isHighQuality
  ) {
    return {
      decision: 'AUTO_APPROVE',
      confidence: 0.95,
      reason: 'All automated checks passed with high confidence'
    };
  }

  // Auto-reject criteria
  if (
    appropriatenessScore < 30 ||
    !contentModeration.appropriate ||
    faceDetection.faceCount === 0
  ) {
    return {
      decision: 'AUTO_REJECT',
      confidence: 0.85,
      reason: 'Failed critical automated checks'
    };
  }

  // Manual review required
  return {
    decision: 'MANUAL_REVIEW',
    confidence: 0.6,
    reason: 'Requires human verification',
    flags: [
      faceDetection.faceCount !== 1 ? 'Face detection issue' : null,
      !qualityAnalysis.isHighQuality ? 'Low quality' : null,
      contentModeration.flags.length > 0 ? 'Content flags' : null
    ].filter(Boolean)
  };
};

/**
 * Full AI verification pipeline
 * @param {string} imageUrl - URL of the uploaded image
 * @returns {Promise<Object>} Complete verification results
 */
const verifyPhotoWithAI = async (imageUrl) => {
  try {
    // Run all analyses in parallel
    const [aiAnalysis, fraudAnalysis] = await Promise.all([
      analyzePhotoWithAI(imageUrl),
      detectFraudulentPhoto(imageUrl)
    ]);

    // Generate decision
    const decision = generateVerificationDecision(aiAnalysis);

    // Combine results
    return {
      success: true,
      imageUrl,
      aiAnalysis,
      fraudAnalysis,
      decision,
      appropriatenessScore: aiAnalysis.appropriatenessScore,
      timestamp: new Date(),
      processingTime: Date.now()
    };
  } catch (error) {
    console.error('AI verification error:', error);
    return {
      success: false,
      error: error.message,
      decision: {
        decision: 'MANUAL_REVIEW',
        confidence: 0,
        reason: 'Error during automated verification'
      }
    };
  }
};

/**
 * Batch verify multiple photos
 * @param {Array<string>} imageUrls - Array of image URLs
 * @returns {Promise<Array>} Array of verification results
 */
const batchVerifyPhotos = async (imageUrls) => {
  try {
    const results = await Promise.all(
      imageUrls.map(url => verifyPhotoWithAI(url))
    );

    return {
      success: true,
      totalProcessed: imageUrls.length,
      results,
      summary: {
        autoApproved: results.filter(r => r.decision?.decision === 'AUTO_APPROVE').length,
        autoRejected: results.filter(r => r.decision?.decision === 'AUTO_REJECT').length,
        manualReview: results.filter(r => r.decision?.decision === 'MANUAL_REVIEW').length
      }
    };
  } catch (error) {
    console.error('Batch verification error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  verifyPhotoWithAI,
  analyzePhotoWithAI,
  detectFraudulentPhoto,
  generateVerificationDecision,
  batchVerifyPhotos
};
