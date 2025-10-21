const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: [
      'religious_practice',
      'family_values',
      'lifestyle',
      'marriage_expectations',
      'financial_views',
      'children',
      'career_ambitions'
    ],
    required: true
  },
  options: [{
    value: String,
    points: Number,
    label: String
  }],
  weight: {
    type: Number,
    default: 1 // Some questions are more important
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const compatibilityQuizSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    category: String,
    answer: String,
    points: Number
  }],
  scores: {
    religious_practice: { type: Number, default: 0 },
    family_values: { type: Number, default: 0 },
    lifestyle: { type: Number, default: 0 },
    marriage_expectations: { type: Number, default: 0 },
    financial_views: { type: Number, default: 0 },
    children: { type: Number, default: 0 },
    career_ambitions: { type: Number, default: 0 }
  },
  overallScore: {
    type: Number,
    default: 0
  },
  completedAt: Date,
  isCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

compatibilityQuizSchema.index({ user: 1 });
compatibilityQuizSchema.index({ isCompleted: 1 });

// Calculate compatibility score between two users
compatibilityQuizSchema.statics.calculateCompatibility = function(quiz1, quiz2) {
  if (!quiz1 || !quiz2 || !quiz1.isCompleted || !quiz2.isCompleted) {
    return null;
  }

  const categories = [
    'religious_practice',
    'family_values',
    'lifestyle',
    'marriage_expectations',
    'financial_views',
    'children',
    'career_ambitions'
  ];

  let totalScore = 0;
  let maxPossibleScore = 0;

  categories.forEach((category) => {
    const score1 = quiz1.scores[category] || 0;
    const score2 = quiz2.scores[category] || 0;
    const maxScore = Math.max(score1, score2);

    if (maxScore > 0) {
      const similarity = 1 - Math.abs(score1 - score2) / maxScore;
      totalScore += similarity * 100;
      maxPossibleScore += 100;
    }
  });

  if (maxPossibleScore === 0) return 0;

  return Math.round((totalScore / maxPossibleScore) * 100);
};

// Method to complete quiz and calculate scores
compatibilityQuizSchema.methods.completeQuiz = function() {
  // Calculate scores by category
  const categoryScores = {};

  this.answers.forEach((answer) => {
    if (answer.category) {
      if (!categoryScores[answer.category]) {
        categoryScores[answer.category] = 0;
      }
      categoryScores[answer.category] += answer.points || 0;
    }
  });

  this.scores = categoryScores;
  this.overallScore = Object.values(categoryScores).reduce((a, b) => a + b, 0);
  this.isCompleted = true;
  this.completedAt = new Date();

  return this.save();
};

module.exports = mongoose.model('CompatibilityQuiz', compatibilityQuizSchema);
