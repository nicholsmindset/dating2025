import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Create Auth Context
const AuthContext = createContext();

// Auth Actions
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOAD_USER: 'LOAD_USER',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERRORS: 'CLEAR_ERRORS'
};

// Initial State
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  error: null
};

// Auth Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    
    case AUTH_ACTIONS.LOGOUT:
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    
    case AUTH_ACTIONS.LOAD_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false
      };
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        loading: false
      };
    
    case AUTH_ACTIONS.CLEAR_ERRORS:
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

// Set up axios defaults
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on app start (one-time initialization from localStorage)
  useEffect(() => {
    if (state.token) {
      setAuthToken(state.token);
      loadUser();
    } else {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - should only run once on mount to load token from localStorage

  // Load user from token
  const loadUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      dispatch({
        type: AUTH_ACTIONS.LOAD_USER,
        payload: response.data.user
      });
    } catch (error) {
      console.error('Load user error:', error);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Register user
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });
    
    try {
      const response = await axios.post('/api/auth/register', userData);
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: {
          user: response.data.user,
          token: response.data.token
        }
      });
      
      setAuthToken(response.data.token);
      toast.success('Registration successful! Welcome to our Islamic community.');
      
      return { success: true, user: response.data.user };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMessage
      });
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Login user
  const login = async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: response.data.user,
          token: response.data.token
        }
      });
      
      setAuthToken(response.data.token);
      toast.success(`Welcome back, ${response.data.user.firstName}!`);
      
      return { success: true, user: response.data.user };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      setAuthToken(null);
      toast.info('You have been logged out successfully.');
    }
  };

  // Update user profile
  const updateUser = async (userData) => {
    try {
      const response = await axios.put('/api/users/profile', userData);
      
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: response.data.user
      });
      
      toast.success('Profile updated successfully!');
      return { success: true, user: response.data.user };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      toast.success('Password reset instructions sent to your email.');
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset email';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      const response = await axios.post('/api/auth/reset-password', { token, password });
      toast.success('Password reset successfully! Please login with your new password.');
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password reset failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Clear errors
  const clearErrors = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERRORS });
  };

  // Check if user has premium subscription
  const isPremiumUser = () => {
    return state.user?.subscription?.plan === 'premium' && 
           (!state.user?.subscription?.endDate || new Date() < new Date(state.user.subscription.endDate));
  };

  // Check if user can view more profiles
  const canViewProfiles = () => {
    if (isPremiumUser()) return true;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const lastResetDate = new Date(state.user?.subscription?.lastResetDate || 0);
    
    // Reset count if it's a new month
    if (lastResetDate.getMonth() !== currentMonth || lastResetDate.getFullYear() !== currentYear) {
      return true; // Will be reset on backend
    }
    
    return (state.user?.subscription?.profileViewsThisMonth || 0) < 10;
  };

  // Get remaining profile views for free users
  const getRemainingViews = () => {
    if (isPremiumUser()) return 'Unlimited';
    
    const viewsUsed = state.user?.subscription?.profileViewsThisMonth || 0;
    return Math.max(0, 10 - viewsUsed);
  };

  // Check if user is admin
  const isAdmin = () => {
    // This would be determined by backend, for now check email
    const adminEmails = ['admin@islamicdating.com', 'support@islamicdating.com'];
    return adminEmails.includes(state.user?.email);
  };

  const value = {
    // State
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    
    // Actions
    register,
    login,
    logout,
    updateUser,
    forgotPassword,
    resetPassword,
    clearErrors,
    loadUser,
    
    // Utility functions
    isPremiumUser,
    canViewProfiles,
    getRemainingViews,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;