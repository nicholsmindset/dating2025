const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const {
  searchUsers,
  getSuggestedFilters,
  getPopularFilters
} = require('../services/searchService');

const router = express.Router();

// @route   POST /api/search
// @desc    Search for users with filters
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const filters = req.body.filters || {};
    const options = {
      page: parseInt(req.body.page) || 1,
      limit: parseInt(req.body.limit) || 20,
      sortBy: req.body.sortBy || 'createdAt',
      sortOrder: req.body.sortOrder || 'desc'
    };

    const result = await searchUsers(filters, req.user.userId, options);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform search'
    });
  }
});

// @route   GET /api/search/suggested-filters
// @desc    Get suggested filters based on user preferences
// @access  Private
router.get('/suggested-filters', auth, async (req, res) => {
  try {
    const result = await getSuggestedFilters(req.user.userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Get suggested filters error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suggested filters'
    });
  }
});

// @route   GET /api/search/popular-filters
// @desc    Get popular filter statistics
// @access  Private
router.get('/popular-filters', auth, async (req, res) => {
  try {
    const result = await getPopularFilters();

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Get popular filters error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get popular filters'
    });
  }
});

// @route   POST /api/search/save
// @desc    Save a search query
// @access  Private
router.post('/save', auth, async (req, res) => {
  try {
    const { name, filters } = req.body;

    if (!name || !filters) {
      return res.status(400).json({
        success: false,
        message: 'Search name and filters are required'
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize savedSearches if it doesn't exist
    if (!user.savedSearches) {
      user.savedSearches = [];
    }

    // Check if user already has maximum saved searches (limit to 10)
    if (user.savedSearches.length >= 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum number of saved searches reached (10)'
      });
    }

    // Check if search with same name already exists
    const existingSearch = user.savedSearches.find(s => s.name === name);
    if (existingSearch) {
      return res.status(400).json({
        success: false,
        message: 'A search with this name already exists'
      });
    }

    // Add the new saved search
    user.savedSearches.push({
      name,
      filters,
      createdAt: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: 'Search saved successfully',
      savedSearch: user.savedSearches[user.savedSearches.length - 1]
    });

  } catch (error) {
    console.error('Save search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save search'
    });
  }
});

// @route   GET /api/search/saved
// @desc    Get user's saved searches
// @access  Private
router.get('/saved', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('savedSearches');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      savedSearches: user.savedSearches || []
    });

  } catch (error) {
    console.error('Get saved searches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get saved searches'
    });
  }
});

// @route   DELETE /api/search/saved/:searchId
// @desc    Delete a saved search
// @access  Private
router.delete('/saved/:searchId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.savedSearches) {
      return res.status(404).json({
        success: false,
        message: 'No saved searches found'
      });
    }

    // Find and remove the saved search
    const searchIndex = user.savedSearches.findIndex(
      s => s._id.toString() === req.params.searchId
    );

    if (searchIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Saved search not found'
      });
    }

    user.savedSearches.splice(searchIndex, 1);
    await user.save();

    res.json({
      success: true,
      message: 'Saved search deleted successfully'
    });

  } catch (error) {
    console.error('Delete saved search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete saved search'
    });
  }
});

// @route   PUT /api/search/saved/:searchId
// @desc    Update a saved search
// @access  Private
router.put('/saved/:searchId', auth, async (req, res) => {
  try {
    const { name, filters } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.savedSearches) {
      return res.status(404).json({
        success: false,
        message: 'No saved searches found'
      });
    }

    // Find the saved search
    const savedSearch = user.savedSearches.id(req.params.searchId);

    if (!savedSearch) {
      return res.status(404).json({
        success: false,
        message: 'Saved search not found'
      });
    }

    // Update fields
    if (name) savedSearch.name = name;
    if (filters) savedSearch.filters = filters;
    savedSearch.updatedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'Saved search updated successfully',
      savedSearch
    });

  } catch (error) {
    console.error('Update saved search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update saved search'
    });
  }
});

// @route   GET /api/search/filter-options
// @desc    Get all available filter options
// @access  Private
router.get('/filter-options', auth, async (req, res) => {
  try {
    const filterOptions = {
      maritalStatus: ['never_married', 'widow', 'divorced', 'separated'],
      religiousLevel: ['practicing', 'moderate', 'learning'],
      prayerFrequency: ['5_times_daily', 'regularly', 'sometimes', 'rarely'],
      education: ['high_school', 'diploma', 'bachelor', 'master', 'phd', 'other'],
      hijabWearing: ['always', 'sometimes', 'no', 'not_applicable'],
      sortOptions: [
        { value: 'createdAt', label: 'Newest Members' },
        { value: 'lastSeen', label: 'Recently Active' },
        { value: 'age', label: 'Age' },
        { value: 'distance', label: 'Distance' }
      ]
    };

    // Get unique countries from database
    const countries = await User.distinct('location.country', { isActive: true });

    res.json({
      success: true,
      filterOptions: {
        ...filterOptions,
        countries: countries.filter(c => c) // Remove null values
      }
    });

  } catch (error) {
    console.error('Get filter options error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get filter options'
    });
  }
});

// @route   POST /api/search/quick
// @desc    Quick search by keyword (name, occupation, bio)
// @access  Private
router.post('/quick', auth, async (req, res) => {
  try {
    const { keyword, limit = 20 } = req.body;

    if (!keyword || keyword.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search keyword must be at least 2 characters'
      });
    }

    const currentUser = await User.findById(req.user.userId);

    const query = {
      _id: { $ne: req.user.userId },
      isActive: true,
      accountStatus: 'active',
      $or: [
        { firstName: { $regex: keyword, $options: 'i' } },
        { lastName: { $regex: keyword, $options: 'i' } },
        { occupation: { $regex: keyword, $options: 'i' } },
        { bio: { $regex: keyword, $options: 'i' } }
      ]
    };

    // Exclude blocked users
    if (currentUser && currentUser.blockedUsers && currentUser.blockedUsers.length > 0) {
      query._id.$nin = currentUser.blockedUsers;
    }

    // Exclude users who blocked current user
    query.blockedUsers = { $ne: req.user.userId };

    const users = await User.find(query)
      .select('-password -verificationToken -resetPasswordToken -resetPasswordExpire')
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      results: users,
      count: users.length
    });

  } catch (error) {
    console.error('Quick search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform quick search'
    });
  }
});

module.exports = router;
