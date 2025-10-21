const express = require('express');
const { auth } = require('../../middleware/auth');

const router = express.Router();

// Islamic-themed icebreaker questions
const icebreakers = [
  {
    id: 1,
    category: 'religious',
    question: 'What's your favorite Surah from the Quran and why?',
    icon: '📖'
  },
  {
    id: 2,
    category: 'religious',
    question: 'Which Islamic scholar or speaker inspires you the most?',
    icon: '🎓'
  },
  {
    id: 3,
    category: 'family',
    question: 'What's your favorite family tradition?',
    icon: '👨‍👩‍👧‍👦'
  },
  {
    id: 4,
    category: 'interests',
    question: 'If you could travel to any Islamic historical site, where would it be?',
    icon: '🕌'
  },
  {
    id: 5,
    category: 'lifestyle',
    question: 'What's your ideal weekend activity?',
    icon: '🌟'
  },
  {
    id: 6,
    category: 'food',
    question: 'What's your favorite cuisine or dish?',
    icon: '🍽️'
  },
  {
    id: 7,
    category: 'religious',
    question: 'How do you usually spend Ramadan evenings?',
    icon: '🌙'
  },
  {
    id: 8,
    category: 'interests',
    question: 'What book are you currently reading or what's the last book you read?',
    icon: '📚'
  },
  {
    id: 9,
    category: 'family',
    question: 'What qualities did you learn from your parents that you'd want to pass on?',
    icon: '❤️'
  },
  {
    id: 10,
    category: 'lifestyle',
    question: 'Are you a morning person or a night owl?',
    icon: '☀️'
  },
  {
    id: 11,
    category: 'interests',
    question: 'What's a skill you'd love to learn?',
    icon: '🎯'
  },
  {
    id: 12,
    category: 'religious',
    question: 'What's your favorite aspect of being Muslim?',
    icon: '☪️'
  },
  {
    id: 13,
    category: 'family',
    question: 'What does an ideal family gathering look like to you?',
    icon: '🎉'
  },
  {
    id: 14,
    category: 'interests',
    question: 'If you could have dinner with any historical Islamic figure, who would it be?',
    icon: '🍴'
  },
  {
    id: 15,
    category: 'lifestyle',
    question: 'What's your go-to way to relax after a long day?',
    icon: '😌'
  },
  {
    id: 16,
    category: 'food',
    question: 'Can you cook? What's your signature dish?',
    icon: '👨‍🍳'
  },
  {
    id: 17,
    category: 'interests',
    question: 'What's something you're passionate about?',
    icon: '🔥'
  },
  {
    id: 18,
    category: 'religious',
    question: 'What's the most important Islamic value to you?',
    icon: '💎'
  },
  {
    id: 19,
    category: 'lifestyle',
    question: 'City life or countryside - which do you prefer?',
    icon: '🏙️'
  },
  {
    id: 20,
    category: 'family',
    question: 'What's your favorite childhood memory?',
    icon: '🎈'
  },
  {
    id: 21,
    category: 'interests',
    question: 'What's on your bucket list?',
    icon: '📝'
  },
  {
    id: 22,
    category: 'religious',
    question: 'What's your favorite Hadith and why does it resonate with you?',
    icon: '📜'
  },
  {
    id: 23,
    category: 'lifestyle',
    question: 'How do you stay active and healthy?',
    icon: '💪'
  },
  {
    id: 24,
    category: 'interests',
    question: 'What's the last thing that made you laugh out loud?',
    icon: '😂'
  },
  {
    id: 25,
    category: 'family',
    question: 'What role do you see yourself playing in your future family?',
    icon: '🏡'
  },
  {
    id: 26,
    category: 'religious',
    question: 'What Islamic goal are you currently working towards?',
    icon: '🎯'
  },
  {
    id: 27,
    category: 'interests',
    question: 'If you could learn any language, which would it be?',
    icon: '🗣️'
  },
  {
    id: 28,
    category: 'lifestyle',
    question: 'What's your favorite way to spend Eid?',
    icon: '🎊'
  },
  {
    id: 29,
    category: 'interests',
    question: 'What's something most people don't know about you?',
    icon: '🤔'
  },
  {
    id: 30,
    category: 'religious',
    question: 'How has your faith shaped who you are today?',
    icon: '✨'
  }
];

// @route   GET /api/v1/icebreakers
// @desc    Get random icebreaker questions
// @access  Private
router.get('/', auth, (req, res) => {
  try {
    const { category, count = 5 } = req.query;

    let filteredIcebreakers = icebreakers;

    if (category) {
      filteredIcebreakers = icebreakers.filter((ib) => ib.category === category);
    }

    // Get random icebreakers
    const shuffled = filteredIcebreakers.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, parseInt(count));

    res.json({
      success: true,
      icebreakers: selected
    });
  } catch (error) {
    console.error('Error fetching icebreakers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching icebreakers'
    });
  }
});

// @route   GET /api/v1/icebreakers/categories
// @desc    Get all icebreaker categories
// @access  Private
router.get('/categories', auth, (req, res) => {
  try {
    const categories = [...new Set(icebreakers.map((ib) => ib.category))];

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
});

// @route   GET /api/v1/icebreakers/for-user/:userId
// @desc    Get personalized icebreaker for specific user
// @access  Private
router.get('/for-user/:userId', auth, async (req, res) => {
  try {
    const User = require('../../models/User');
    const targetUser = await User.findById(req.params.userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get icebreakers that might be relevant based on user's profile
    let selectedIcebreakers = [];

    // If user has strong religious level, prioritize religious questions
    if (['practicing', 'moderate'].includes(targetUser.religiousLevel)) {
      selectedIcebreakers = icebreakers
        .filter((ib) => ib.category === 'religious')
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);
    }

    // Add some general interest questions
    const generalQuestions = icebreakers
      .filter((ib) => ib.category === 'interests')
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);

    selectedIcebreakers = [...selectedIcebreakers, ...generalQuestions];

    // Add one family question
    const familyQuestion = icebreakers
      .filter((ib) => ib.category === 'family')
      .sort(() => 0.5 - Math.random())
      .slice(0, 1);

    selectedIcebreakers = [...selectedIcebreakers, ...familyQuestion];

    res.json({
      success: true,
      icebreakers: selectedIcebreakers.slice(0, 5),
      targetUser: {
        name: targetUser.firstName,
        religiousLevel: targetUser.religiousLevel
      }
    });
  } catch (error) {
    console.error('Error fetching personalized icebreakers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching personalized icebreakers'
    });
  }
});

module.exports = router;
