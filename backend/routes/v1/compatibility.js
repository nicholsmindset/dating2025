const express = require('express');
const CompatibilityQuiz = require('../../models/CompatibilityQuiz');
const User = require('../../models/User');
const { auth } = require('../../middleware/auth');

const router = express.Router();

// Islamic compatibility quiz questions
const quizQuestions = [
  {
    _id: '1',
    question: 'How important is daily prayer in your life?',
    category: 'religious_practice',
    options: [
      { value: 'very_important', points: 10, label: 'Very important - I pray 5 times daily' },
      { value: 'important', points: 7, label: 'Important - I pray regularly' },
      { value: 'somewhat', points: 4, label: 'Somewhat - I try to pray when I can' },
      { value: 'learning', points: 2, label: 'Learning - I\'m working on establishing this habit' }
    ],
    weight: 2
  },
  {
    _id: '2',
    question: 'How do you envision the role of family in your marriage?',
    category: 'family_values',
    options: [
      { value: 'central', points: 10, label: 'Central - Family involvement is very important' },
      { value: 'balanced', points: 7, label: 'Balanced - Independent but family remains important' },
      { value: 'independent', points: 4, label: 'Independent - Prefer privacy with occasional family time' },
      { value: 'minimal', points: 2, label: 'Minimal - Prefer to keep family separate' }
    ],
    weight: 1.5
  },
  {
    _id: '3',
    question: 'What is your preferred lifestyle after marriage?',
    category: 'lifestyle',
    options: [
      { value: 'traditional', points: 10, label: 'Traditional - One spouse works, other manages home' },
      { value: 'dual_career', points: 7, label: 'Dual career - Both pursue careers' },
      { value: 'flexible', points: 5, label: 'Flexible - Adapt based on circumstances' },
      { value: 'undecided', points: 3, label: 'Still deciding' }
    ],
    weight: 1
  },
  {
    _id: '4',
    question: 'When do you hope to get married?',
    category: 'marriage_expectations',
    options: [
      { value: 'asap', points: 10, label: 'As soon as I find the right person' },
      { value: 'within_year', points: 8, label: 'Within the next year' },
      { value: 'one_to_two', points: 6, label: '1-2 years' },
      { value: 'flexible', points: 4, label: 'No specific timeline' }
    ],
    weight: 1.5
  },
  {
    _id: '5',
    question: 'How do you view financial responsibilities in marriage?',
    category: 'financial_views',
    options: [
      { value: 'provider_model', points: 10, label: 'Husband provides, wife manages household' },
      { value: 'shared_equally', points: 8, label: 'All expenses shared equally' },
      { value: 'proportional', points: 6, label: 'Each contributes proportionally to income' },
      { value: 'flexible', points: 5, label: 'Flexible arrangement based on situation' }
    ],
    weight: 1.5
  },
  {
    _id: '6',
    question: 'Do you want children?',
    category: 'children',
    options: [
      { value: 'yes_soon', points: 10, label: 'Yes, soon after marriage' },
      { value: 'yes_later', points: 8, label: 'Yes, but after a few years' },
      { value: 'yes_maybe', points: 5, label: 'Yes, but open to timing' },
      { value: 'undecided', points: 3, label: 'Undecided' },
      { value: 'no', points: 1, label: 'No' }
    ],
    weight: 2
  },
  {
    _id: '7',
    question: 'How many children would you like to have?',
    category: 'children',
    options: [
      { value: '1-2', points: 7, label: '1-2 children' },
      { value: '3-4', points: 10, label: '3-4 children' },
      { value: '5+', points: 8, label: '5 or more children' },
      { value: 'flexible', points: 5, label: 'Flexible/Will see' }
    ],
    weight: 1
  },
  {
    _id: '8',
    question: 'How important is Islamic education for your future children?',
    category: 'children',
    options: [
      { value: 'essential', points: 10, label: 'Essential - Islamic school is a must' },
      { value: 'important', points: 7, label: 'Important - Supplement with weekend classes' },
      { value: 'moderate', points: 4, label: 'Moderate - Home teaching is sufficient' },
      { value: 'basic', points: 2, label: 'Basic - General moral education is enough' }
    ],
    weight: 1.5
  },
  {
    _id: '9',
    question: 'How important is career advancement to you?',
    category: 'career_ambitions',
    options: [
      { value: 'very', points: 10, label: 'Very - Career is a top priority' },
      { value: 'balanced', points: 7, label: 'Balanced - Important but not everything' },
      { value: 'moderate', points: 4, label: 'Moderate - Prefer work-life balance' },
      { value: 'low', points: 2, label: 'Low - Family comes first' }
    ],
    weight: 1
  },
  {
    _id: '10',
    question: 'How often do you read/study the Quran?',
    category: 'religious_practice',
    options: [
      { value: 'daily', points: 10, label: 'Daily' },
      { value: 'weekly', points: 7, label: 'Weekly' },
      { value: 'occasionally', points: 4, label: 'Occasionally' },
      { value: 'rarely', points: 2, label: 'Rarely' }
    ],
    weight: 1.5
  },
  {
    _id: '11',
    question: 'How do you handle disagreements?',
    category: 'family_values',
    options: [
      { value: 'calm_discussion', points: 10, label: 'Calm discussion and compromise' },
      { value: 'need_time', points: 7, label: 'Need time to think, then discuss' },
      { value: 'emotional', points: 4, label: 'Can be emotional but work through it' },
      { value: 'avoid', points: 2, label: 'Prefer to avoid conflict' }
    ],
    weight: 1.5
  },
  {
    _id: '12',
    question: 'What role should in-laws play in your marriage?',
    category: 'family_values',
    options: [
      { value: 'very_involved', points: 10, label: 'Very involved - They are our support system' },
      { value: 'regular_contact', points: 7, label: 'Regular contact and visits' },
      { value: 'occasional', points: 5, label: 'Occasional visits and special occasions' },
      { value: 'minimal', points: 3, label: 'Minimal - Maintain our privacy' }
    ],
    weight: 1
  },
  {
    _id: '13',
    question: 'How do you prefer to spend your free time?',
    category: 'lifestyle',
    options: [
      { value: 'religious', points: 10, label: 'Religious activities and learning' },
      { value: 'family_time', points: 8, label: 'Quality time with family' },
      { value: 'social', points: 6, label: 'Socializing with friends' },
      { value: 'hobbies', points: 5, label: 'Personal hobbies and interests' }
    ],
    weight: 1
  },
  {
    _id: '14',
    question: 'Where would you prefer to live after marriage?',
    category: 'lifestyle',
    options: [
      { value: 'near_family', points: 10, label: 'Near family' },
      { value: 'same_city', points: 7, label: 'Same city but independent' },
      { value: 'different_city', points: 5, label: 'Different city for career' },
      { value: 'anywhere', points: 3, label: 'Anywhere - Very flexible' }
    ],
    weight: 1
  },
  {
    _id: '15',
    question: 'What is your approach to Islamic learning?',
    category: 'religious_practice',
    options: [
      { value: 'active_student', points: 10, label: 'Active student - Attend classes regularly' },
      { value: 'self_study', points: 7, label: 'Self-study and online learning' },
      { value: 'occasional', points: 4, label: 'Occasional lectures and reminders' },
      { value: 'basic', points: 2, label: 'Basic knowledge is sufficient' }
    ],
    weight: 1.5
  },
  {
    _id: '16',
    question: 'How do you want to celebrate Islamic occasions?',
    category: 'religious_practice',
    options: [
      { value: 'traditional', points: 10, label: 'Traditional celebrations with community' },
      { value: 'family_focused', points: 7, label: 'Focus on family gatherings' },
      { value: 'simple', points: 5, label: 'Simple, low-key celebrations' },
      { value: 'not_important', points: 2, label: 'Not particularly important' }
    ],
    weight: 1
  },
  {
    _id: '17',
    question: 'What is your view on saving money?',
    category: 'financial_views',
    options: [
      { value: 'very_important', points: 10, label: 'Very important - Save aggressively' },
      { value: 'balanced', points: 7, label: 'Balanced - Save but also enjoy life' },
      { value: 'minimal', points: 4, label: 'Minimal - Live for today' },
      { value: 'no_plan', points: 2, label: 'No specific plan' }
    ],
    weight: 1.5
  },
  {
    _id: '18',
    question: 'What type of communication do you prefer?',
    category: 'marriage_expectations',
    options: [
      { value: 'constant', points: 10, label: 'Constant - Throughout the day' },
      { value: 'regular', points: 7, label: 'Regular - Daily check-ins' },
      { value: 'moderate', points: 5, label: 'Moderate - When needed' },
      { value: 'independent', points: 3, label: 'Independent - Give each other space' }
    ],
    weight: 1
  },
  {
    _id: '19',
    question: 'How do you view household responsibilities?',
    category: 'marriage_expectations',
    options: [
      { value: 'traditional', points: 10, label: 'Traditional gender roles' },
      { value: 'flexible_traditional', points: 7, label: 'Traditional but flexible' },
      { value: 'shared', points: 5, label: 'Shared responsibilities' },
      { value: 'negotiable', points: 3, label: 'Completely negotiable' }
    ],
    weight: 1.5
  },
  {
    _id: '20',
    question: 'What is most important in a marriage partner?',
    category: 'marriage_expectations',
    options: [
      { value: 'deen', points: 10, label: 'Strong Deen (faith)' },
      { value: 'character', points: 8, label: 'Good character and values' },
      { value: 'compatibility', points: 6, label: 'Lifestyle compatibility' },
      { value: 'balanced', points: 7, label: 'Balance of all the above' }
    ],
    weight: 2
  }
];

// @route   GET /api/v1/compatibility/quiz/questions
// @desc    Get compatibility quiz questions
// @access  Private
router.get('/quiz/questions', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      questions: quizQuestions,
      totalQuestions: quizQuestions.length
    });
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching quiz questions'
    });
  }
});

// @route   POST /api/v1/compatibility/quiz/submit
// @desc    Submit compatibility quiz answers
// @access  Private
router.post('/quiz/submit', auth, async (req, res) => {
  try {
    const { answers } = req.body;

    // Validate answers array
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Quiz answers are required'
      });
    }

    // Validate number of answers (should match quiz questions length)
    if (answers.length > quizQuestions.length) {
      return res.status(400).json({
        success: false,
        message: `Too many answers provided. Maximum ${quizQuestions.length} answers allowed.`
      });
    }

    // Validate each answer structure and content
    const validatedAnswers = [];
    const seenQuestionIds = new Set();

    for (const answer of answers) {
      // Validate answer structure
      if (!answer.questionId || !answer.answer) {
        return res.status(400).json({
          success: false,
          message: 'Each answer must have questionId and answer fields'
        });
      }

      // Check for duplicate answers
      if (seenQuestionIds.has(answer.questionId)) {
        return res.status(400).json({
          success: false,
          message: 'Duplicate answers for the same question are not allowed'
        });
      }
      seenQuestionIds.add(answer.questionId);

      // Validate question exists
      const question = quizQuestions.find((q) => q._id === answer.questionId);
      if (!question) {
        return res.status(400).json({
          success: false,
          message: `Invalid question ID: ${answer.questionId}`
        });
      }

      // Validate answer value is a valid option
      const option = question.options.find((o) => o.value === answer.answer);
      if (!option) {
        return res.status(400).json({
          success: false,
          message: `Invalid answer for question ${answer.questionId}`
        });
      }

      // Add validated answer
      validatedAnswers.push({
        questionId: answer.questionId,
        category: question.category,
        answer: answer.answer,
        points: option.points || 0
      });
    }

    // Check if user already has a quiz
    let quiz = await CompatibilityQuiz.findOne({ user: req.user.userId });

    if (!quiz) {
      quiz = new CompatibilityQuiz({
        user: req.user.userId,
        answers: []
      });
    }

    // Set validated answers
    quiz.answers = validatedAnswers;

    // Complete quiz and calculate scores
    await quiz.completeQuiz();

    // Update user's quiz completion status
    await User.findByIdAndUpdate(req.user.userId, {
      hasCompletedQuiz: true
    });

    res.json({
      success: true,
      message: 'Quiz completed successfully!',
      scores: quiz.scores,
      overallScore: quiz.overallScore
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting quiz'
    });
  }
});

// @route   GET /api/v1/compatibility/quiz/my-results
// @desc    Get user's quiz results
// @access  Private
router.get('/quiz/my-results', auth, async (req, res) => {
  try {
    const quiz = await CompatibilityQuiz.findOne({
      user: req.user.userId,
      isCompleted: true
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not completed yet'
      });
    }

    res.json({
      success: true,
      scores: quiz.scores,
      overallScore: quiz.overallScore,
      completedAt: quiz.completedAt
    });
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching quiz results'
    });
  }
});

// @route   PUT /api/v1/compatibility/quiz/retake
// @desc    Retake compatibility quiz
// @access  Private
router.put('/quiz/retake', auth, async (req, res) => {
  try {
    await CompatibilityQuiz.deleteMany({ user: req.user.userId });
    await User.findByIdAndUpdate(req.user.userId, {
      hasCompletedQuiz: false
    });

    res.json({
      success: true,
      message: 'Quiz reset successfully. You can now retake it.'
    });
  } catch (error) {
    console.error('Error resetting quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting quiz'
    });
  }
});

module.exports = router;
