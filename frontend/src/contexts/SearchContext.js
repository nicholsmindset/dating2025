import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchResults, setSearchResults] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [suggestedFilters, setSuggestedFilters] = useState({});
  const [popularFilters, setPopularFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Get auth token
  const getToken = () => {
    const token = localStorage.getItem('token');
    return token;
  };

  // Search users
  const searchUsers = useCallback(async (filters, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      const response = await axios.post(
        `${API_URL}/search`,
        {
          filters,
          page: options.page || 1,
          limit: options.limit || 20,
          sortBy: options.sortBy || 'createdAt',
          sortOrder: options.sortOrder || 'desc'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSearchResults(response.data.users);
        setPagination(response.data.pagination);
        return { success: true, data: response.data };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to search users';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Quick search
  const quickSearch = useCallback(async (keyword, limit = 20) => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      const response = await axios.post(
        `${API_URL}/search/quick`,
        { keyword, limit },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSearchResults(response.data.results);
        return { success: true, data: response.data };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to perform quick search';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Get suggested filters
  const getSuggestedFilters = useCallback(async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/search/suggested-filters`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuggestedFilters(response.data.filters);
        return { success: true, filters: response.data.filters };
      }
    } catch (err) {
      console.error('Failed to get suggested filters:', err);
    }
  }, [API_URL]);

  // Get popular filters
  const getPopularFilters = useCallback(async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/search/popular-filters`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPopularFilters(response.data.data);
        return { success: true, data: response.data.data };
      }
    } catch (err) {
      console.error('Failed to get popular filters:', err);
    }
  }, [API_URL]);

  // Get filter options
  const getFilterOptions = useCallback(async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/search/filter-options`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setFilterOptions(response.data.filterOptions);
        return { success: true, options: response.data.filterOptions };
      }
    } catch (err) {
      console.error('Failed to get filter options:', err);
    }
  }, [API_URL]);

  // Save search
  const saveSearch = useCallback(async (name, filters) => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      const response = await axios.post(
        `${API_URL}/search/save`,
        { name, filters },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Refresh saved searches
        await getSavedSearches();
        return { success: true, data: response.data.savedSearch };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to save search';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Get saved searches
  const getSavedSearches = useCallback(async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/search/saved`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSavedSearches(response.data.savedSearches);
        return { success: true, data: response.data.savedSearches };
      }
    } catch (err) {
      console.error('Failed to get saved searches:', err);
    }
  }, [API_URL]);

  // Delete saved search
  const deleteSavedSearch = useCallback(async (searchId) => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      const response = await axios.delete(`${API_URL}/search/saved/${searchId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Refresh saved searches
        await getSavedSearches();
        return { success: true };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete saved search';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [API_URL, getSavedSearches]);

  // Update saved search
  const updateSavedSearch = useCallback(async (searchId, name, filters) => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      const response = await axios.put(
        `${API_URL}/search/saved/${searchId}`,
        { name, filters },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Refresh saved searches
        await getSavedSearches();
        return { success: true, data: response.data.savedSearch };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update saved search';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [API_URL, getSavedSearches]);

  // Clear search results
  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
    setPagination({});
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    searchResults,
    savedSearches,
    suggestedFilters,
    popularFilters,
    filterOptions,
    pagination,
    loading,
    error,
    searchUsers,
    quickSearch,
    getSuggestedFilters,
    getPopularFilters,
    getFilterOptions,
    saveSearch,
    getSavedSearches,
    deleteSavedSearch,
    updateSavedSearch,
    clearSearchResults,
    clearError
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};
