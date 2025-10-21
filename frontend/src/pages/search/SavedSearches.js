import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Delete,
  Search,
  Edit,
  Bookmark,
  FilterList
} from '@mui/icons-material';
import { useSearch } from '../../contexts/SearchContext';
import { format } from 'date-fns';

const SavedSearches = () => {
  const navigate = useNavigate();
  const {
    savedSearches,
    loading,
    error,
    getSavedSearches,
    deleteSavedSearch,
    searchUsers
  } = useSearch();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSearch, setSelectedSearch] = useState(null);

  useEffect(() => {
    getSavedSearches();
  }, []);

  const handleRunSearch = async (search) => {
    const result = await searchUsers(search.filters, {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    if (result.success) {
      navigate('/search');
    }
  };

  const handleDeleteClick = (search) => {
    setSelectedSearch(search);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedSearch) {
      const result = await deleteSavedSearch(selectedSearch._id);
      if (result.success) {
        setDeleteDialogOpen(false);
        setSelectedSearch(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setSelectedSearch(null);
  };

  const formatFilterSummary = (filters) => {
    const summary = [];

    if (filters.ageMin && filters.ageMax) {
      summary.push(`Age: ${filters.ageMin}-${filters.ageMax}`);
    }

    if (filters.religiousLevel && filters.religiousLevel.length > 0) {
      summary.push(`Religious: ${filters.religiousLevel.join(', ')}`);
    }

    if (filters.maritalStatus && filters.maritalStatus.length > 0) {
      summary.push(`Marital: ${filters.maritalStatus.join(', ')}`);
    }

    if (filters.country) {
      summary.push(`Country: ${filters.country}`);
    }

    if (filters.city) {
      summary.push(`City: ${filters.city}`);
    }

    if (filters.education && filters.education.length > 0) {
      summary.push(`Education: ${filters.education.join(', ')}`);
    }

    if (filters.maxDistance) {
      summary.push(`Within ${filters.maxDistance} km`);
    }

    if (filters.photoVerifiedOnly) {
      summary.push('Photo Verified');
    }

    if (filters.verifiedOnly) {
      summary.push('Verified Users');
    }

    if (filters.onlineOnly) {
      summary.push('Online Now');
    }

    return summary;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          <Bookmark sx={{ mr: 1, verticalAlign: 'middle' }} />
          Saved Searches
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quickly access your frequently used search filters
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && savedSearches.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <FilterList sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No saved searches yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Save your search filters from the Advanced Search page for quick access later
          </Typography>
          <Button
            variant="contained"
            startIcon={<Search />}
            onClick={() => navigate('/search')}
          >
            Go to Advanced Search
          </Button>
        </Paper>
      )}

      {!loading && savedSearches.length > 0 && (
        <Paper>
          <List>
            {savedSearches.map((search, index) => (
              <React.Fragment key={search._id}>
                <ListItem
                  sx={{
                    py: 3,
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="h6" gutterBottom>
                        {search.name}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Created: {format(new Date(search.createdAt), 'MMM d, yyyy')}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                          {formatFilterSummary(search.filters).map((filter, idx) => (
                            <Chip
                              key={idx}
                              label={filter}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          ))}
                        </Box>

                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<Search />}
                            onClick={() => handleRunSearch(search)}
                          >
                            Run Search
                          </Button>
                        </Box>
                      </Box>
                    }
                  />

                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteClick(search)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>

                {index < savedSearches.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Delete Saved Search</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedSearch?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SavedSearches;
