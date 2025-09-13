import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext();

const initialState = {
  subscription: null,
  loading: false,
  error: null,
  profileViewsRemaining: 0,
  hasActiveSubscription: false,
};

const subscriptionReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SUBSCRIPTION':
      return {
        ...state,
        subscription: action.payload,
        hasActiveSubscription: action.payload?.status === 'active',
        loading: false,
        error: null,
      };
    case 'SET_PROFILE_VIEWS':
      return {
        ...state,
        profileViewsRemaining: action.payload,
      };
    case 'DECREMENT_PROFILE_VIEWS':
      return {
        ...state,
        profileViewsRemaining: Math.max(0, state.profileViewsRemaining - 1),
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

export const SubscriptionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(subscriptionReducer, initialState);
  const { user, token } = useAuth();

  // Fetch subscription status
  const fetchSubscription = async () => {
    if (!token || !user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/subscription/status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      dispatch({ type: 'SET_SUBSCRIPTION', payload: response.data.subscription });
      dispatch({ type: 'SET_PROFILE_VIEWS', payload: response.data.profileViewsRemaining });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to fetch subscription' });
    }
  };

  // Create subscription
  const createSubscription = async (paymentMethodId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/subscription/create`,
        { paymentMethodId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        await fetchSubscription(); // Refresh subscription data
        return { success: true, subscription: response.data.subscription };
      }

      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Error creating subscription:', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to create subscription' });
      return { success: false, error: error.response?.data?.message || 'Failed to create subscription' };
    }
  };

  // Cancel subscription
  const cancelSubscription = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/subscription/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        await fetchSubscription(); // Refresh subscription data
        return { success: true };
      }

      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to cancel subscription' });
      return { success: false, error: error.response?.data?.message || 'Failed to cancel subscription' };
    }
  };

  // Check if user can view profile (for free users)
  const canViewProfile = () => {
    if (state.hasActiveSubscription) return true;
    return state.profileViewsRemaining > 0;
  };

  // Use a profile view (for free users)
  const useProfileView = () => {
    if (!state.hasActiveSubscription && state.profileViewsRemaining > 0) {
      dispatch({ type: 'DECREMENT_PROFILE_VIEWS' });
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Fetch subscription on mount and when user changes
  useEffect(() => {
    if (user && token) {
      fetchSubscription();
    }
  }, [user, token]);

  const value = {
    ...state,
    fetchSubscription,
    createSubscription,
    cancelSubscription,
    canViewProfile,
    useProfileView,
    clearError,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export default SubscriptionContext;