import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Chip,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
  Alert,
  Divider,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Pagination,
  CircularProgress
} from '@mui/material';
import {
  Search,
  FilterList,
  Save,
  Clear,
  Favorite,
  LocationOn,
  School,
  Work,
  Height,
  Language
} from '@mui/icons-material';
import { useSearch } from '../../contexts/SearchContext';
import { useAuth } from '../../contexts/AuthContext';

const AdvancedSearch = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    searchResults,
    pagination,
    loading,
    error,
    searchUsers,
    getSuggestedFilters,
    getFilterOptions,
    saveSearch,
    filterOptions
  } = useSearch();

  const [filters, setFilters] = useState({
    gender: user?.gender === 'male' ? 'female' : 'male',
    ageMin: 18,
    ageMax: 50,
    maritalStatus: [],
    religiousLevel: [],
    prayerFrequency: [],
    education: [],
    country: '',
    city: '',
    state: '',
    heightMin: null,
    heightMax: null,
    ethnicity: '',
    languages: [],
    occupation: '',
    photoVerifiedOnly: false,
    premiumOnly: false,
    hasPhoto: false,
    verifiedOnly: false,
    onlineOnly: false,
    maxDistance: null
  });

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);
  const [saveDialogName, setSaveDialogName] = useState('');

  useEffect(() => {
    getFilterOptions();
    loadSuggestedFilters();
  }, []);

  const loadSuggestedFilters = async () => {
    const result = await getSuggestedFilters();
    if (result?.success && result.filters) {
      setFilters(prev => ({
        ...prev,
        ...result.filters
      }));
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = async () => {
    const result = await searchUsers(filters, {
      page,
      limit: 20,
      sortBy,
      sortOrder
    });

    if (result.success) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleClearFilters = () => {
    setFilters({
      gender: user?.gender === 'male' ? 'female' : 'male',
      ageMin: 18,
      ageMax: 50,
      maritalStatus: [],
      religiousLevel: [],
      prayerFrequency: [],
      education: [],
      country: '',
      city: '',
      state: '',
      heightMin: null,
      heightMax: null,
      ethnicity: '',
      languages: [],
      occupation: '',
      photoVerifiedOnly: false,
      premiumOnly: false,
      hasPhoto: false,
      verifiedOnly: false,
      onlineOnly: false,
      maxDistance: null
    });
  };

  const handleSaveSearch = async () => {
    if (!saveDialogName.trim()) {
      return;
    }

    const result = await saveSearch(saveDialogName, filters);
    if (result.success) {
      setSaveDialogName('');
      alert('Search saved successfully!');
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    searchUsers(filters, {
      page: value,
      limit: 20,
      sortBy,
      sortOrder
    });
  };

  const getAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Advanced Search
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find your perfect match with comprehensive filters
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Filters Panel */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
                Filters
              </Typography>
              <IconButton size="small" onClick={() => setShowFilters(!showFilters)}>
                <FilterList />
              </IconButton>
            </Box>

            {showFilters && (
              <Box>
                {/* Age Range */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" gutterBottom fontWeight={600}>
                    Age Range: {filters.ageMin} - {filters.ageMax}
                  </Typography>
                  <Slider
                    value={[filters.ageMin, filters.ageMax]}
                    onChange={(e, newValue) => {
                      handleFilterChange('ageMin', newValue[0]);
                      handleFilterChange('ageMax', newValue[1]);
                    }}
                    valueLabelDisplay="auto"
                    min={18}
                    max={80}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Marital Status */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Marital Status</InputLabel>
                  <Select
                    multiple
                    value={filters.maritalStatus}
                    onChange={(e) => handleFilterChange('maritalStatus', e.target.value)}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value.replace('_', ' ')} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {filterOptions.maritalStatus?.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status.replace('_', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Religious Level */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Religious Level</InputLabel>
                  <Select
                    multiple
                    value={filters.religiousLevel}
                    onChange={(e) => handleFilterChange('religiousLevel', e.target.value)}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {filterOptions.religiousLevel?.map((level) => (
                      <MenuItem key={level} value={level}>
                        {level}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Prayer Frequency */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Prayer Frequency</InputLabel>
                  <Select
                    multiple
                    value={filters.prayerFrequency}
                    onChange={(e) => handleFilterChange('prayerFrequency', e.target.value)}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value.replace('_', ' ')} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {filterOptions.prayerFrequency?.map((freq) => (
                      <MenuItem key={freq} value={freq}>
                        {freq.replace('_', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Education */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Education</InputLabel>
                  <Select
                    multiple
                    value={filters.education}
                    onChange={(e) => handleFilterChange('education', e.target.value)}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value.replace('_', ' ')} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {filterOptions.education?.map((edu) => (
                      <MenuItem key={edu} value={edu}>
                        {edu.replace('_', ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Divider sx={{ my: 2 }} />

                {/* Location */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Country</InputLabel>
                  <Select
                    value={filters.country}
                    onChange={(e) => handleFilterChange('country', e.target.value)}
                  >
                    <MenuItem value="">Any</MenuItem>
                    {filterOptions.countries?.map((country) => (
                      <MenuItem key={country} value={country}>
                        {country}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="City"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Max Distance (km)"
                  type="number"
                  value={filters.maxDistance || ''}
                  onChange={(e) => handleFilterChange('maxDistance', parseInt(e.target.value) || null)}
                  sx={{ mb: 2 }}
                />

                <Divider sx={{ my: 2 }} />

                {/* Additional Filters */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.photoVerifiedOnly}
                      onChange={(e) => handleFilterChange('photoVerifiedOnly', e.target.checked)}
                    />
                  }
                  label="Photo Verified Only"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.verifiedOnly}
                      onChange={(e) => handleFilterChange('verifiedOnly', e.target.checked)}
                    />
                  }
                  label="Verified Users Only"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.hasPhoto}
                      onChange={(e) => handleFilterChange('hasPhoto', e.target.checked)}
                    />
                  }
                  label="Has Photo"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.onlineOnly}
                      onChange={(e) => handleFilterChange('onlineOnly', e.target.checked)}
                    />
                  }
                  label="Online Now"
                />

                <Divider sx={{ my: 3 }} />

                {/* Action Buttons */}
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Search />}
                  onClick={handleSearch}
                  disabled={loading}
                  sx={{ mb: 1 }}
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={handleClearFilters}
                  sx={{ mb: 1 }}
                >
                  Clear Filters
                </Button>

                {/* Save Search */}
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Save Search As..."
                    value={saveDialogName}
                    onChange={(e) => setSaveDialogName(e.target.value)}
                    sx={{ mb: 1 }}
                  />
                  <Button
                    fullWidth
                    size="small"
                    variant="outlined"
                    startIcon={<Save />}
                    onClick={handleSaveSearch}
                    disabled={!saveDialogName.trim()}
                  >
                    Save Search
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Results Panel */}
        <Grid item xs={12} md={9}>
          {/* Sort Options */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  {pagination.totalResults || 0} results found
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <MenuItem value="createdAt">Newest Members</MenuItem>
                    <MenuItem value="lastSeen">Recently Active</MenuItem>
                    <MenuItem value="age">Age</MenuItem>
                    <MenuItem value="distance">Distance</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Order</InputLabel>
                  <Select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  >
                    <MenuItem value="asc">Ascending</MenuItem>
                    <MenuItem value="desc">Descending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Loading State */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Search Results */}
          {!loading && searchResults.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No results found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try adjusting your filters to see more profiles
              </Typography>
            </Paper>
          )}

          {!loading && searchResults.length > 0 && (
            <>
              <Grid container spacing={3}>
                {searchResults.map((profile) => (
                  <Grid item xs={12} sm={6} md={4} key={profile._id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4
                        }
                      }}
                    >
                      <CardMedia
                        component="img"
                        height="200"
                        image={profile.profilePhoto || '/default-avatar.png'}
                        alt={profile.firstName}
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {profile.firstName}, {getAge(profile.dateOfBirth)}
                        </Typography>

                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOn fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {profile.location?.city}, {profile.location?.country}
                          </Typography>
                        </Box>

                        {profile.occupation && (
                          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Work fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {profile.occupation}
                            </Typography>
                          </Box>
                        )}

                        {profile.education && (
                          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <School fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {profile.education.replace('_', ' ')}
                            </Typography>
                          </Box>
                        )}

                        <Box sx={{ mt: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          <Chip label={profile.religiousLevel} size="small" color="primary" variant="outlined" />
                          <Chip label={profile.maritalStatus.replace('_', ' ')} size="small" variant="outlined" />
                          {profile.isPhotoVerified && (
                            <Chip label="Verified" size="small" color="success" />
                          )}
                          {profile.subscription?.plan === 'premium' && (
                            <Chip label="Premium" size="small" color="warning" />
                          )}
                        </Box>

                        {profile.distance && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            {profile.distance.toFixed(1)} km away
                          </Typography>
                        )}
                      </CardContent>

                      <CardActions sx={{ px: 2, pb: 2 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={() => navigate(`/profile/${profile._id}`)}
                        >
                          View Profile
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={pagination.totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdvancedSearch;
