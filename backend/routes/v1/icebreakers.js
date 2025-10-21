const express = require('express');
const { auth } = require('../../middleware/auth');

const router = express.Router();

// Islamic-themed icebreaker questions
const icebreakers = [
  {
    id: 1,
    category: 'religious',
    question: "What is your favorite Surah from the Quran and why?",
    icon: 'book'
  },
  {
    id: 2,
    category: 'religious',
    question: 'Which Islamic scholar or speaker inspires you the most?',
    icon: 'scholar'
  },
  {
    id: 3,
    category: 'family',
    question: 'What role does family play in your life?',
    icon: 'family'
  },
  {
    id: 4,
    category: 'family',
    question: 'What is your favorite family tradition?',
    icon: 'tradition'
  },
  {
    id: 5,
    category: 'lifestyle',
    question: 'How do you balance work and personal life?',
    icon: 'balance'
  }
];

// @route   GET /api/v1/icebreakers
// @desc    Get random icebreaker questions
// @access  Private
router.get('/', auth, (req, res) => {
  try {
    const { count = 5, category } = req.query;

    let filtered = icebreakers;
    if (category) {
      filtered = icebreakers.filter(q => q.category === category);
    }

    // Get random icebreakers
    const shuffled = filtered.sort(() => 0.5 - Math.random());
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

// @route   GET /api/v1/icebreakers/for-user/:userId
// @desc    Get personalized icebreakers for a specific user
// @access  Private
router.get('/for-user/:userId', auth, async (req, res) => {
  try {
    // For now, return random icebreakers
    // In future, can personalize based on user's profile
    const shuffled = icebreakers.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);

    res.json({
      success: true,
      icebreakers: selected
    });
  } catch (error) {
    console.error('Error fetching personalized icebreakers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching icebreakers'
    });
  }
});

module.exports = router;
