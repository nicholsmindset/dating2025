import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const WaliContext = createContext();

const WALI_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  LOAD_WALI: 'LOAD_WALI',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  CLEAR_ERRORS: 'CLEAR_ERRORS'
};

const initialState = {
  wali: null,
  token: localStorage.getItem('waliToken'),
  isAuthenticated: false,
  loading: true,
  error: null
};

const waliReducer = (state, action) => {
  switch (action.type) {
    case WALI_ACTIONS.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null
      };

    case WALI_ACTIONS.LOGIN_SUCCESS:
      localStorage.setItem('waliToken', action.payload.token);
      return {
        ...state,
        wali: action.payload.wali,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };

    case WALI_ACTIONS.LOGIN_FAILURE:
      localStorage.removeItem('waliToken');
      return {
        ...state,
        wali: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };

    case WALI_ACTIONS.LOGOUT:
      localStorage.removeItem('waliToken');
      return {
        ...state,
        wali: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };

    case WALI_ACTIONS.LOAD_WALI:
      return {
        ...state,
        wali: action.payload,
        isAuthenticated: true,
        loading: false
      };

    case WALI_ACTIONS.UPDATE_SETTINGS:
      return {
        ...state,
        wali: { ...state.wali, ...action.payload },
        loading: false
      };

    case WALI_ACTIONS.CLEAR_ERRORS:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

const setWaliAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

export const WaliProvider = ({ children }) => {
  const [state, dispatch] = useReducer(waliReducer, initialState);

  useEffect(() => {
    if (state.token) {
      setWaliAuthToken(state.token);
      loadWali();
    } else {
      dispatch({ type: WALI_ACTIONS.LOGOUT });
    }
  }, []);

  const loadWali = async () => {
    try {
      const response = await axios.get('/api/wali/dashboard');
      dispatch({
        type: WALI_ACTIONS.LOAD_WALI,
        payload: response.data.ward
      });
    } catch (error) {
      console.error('Load wali error:', error);
      dispatch({ type: WALI_ACTIONS.LOGOUT });
    }
  };

  const login = async (email, password) => {
    dispatch({ type: WALI_ACTIONS.LOGIN_START });

    try {
      const response = await axios.post('/api/wali/login', { email, password });

      dispatch({
        type: WALI_ACTIONS.LOGIN_SUCCESS,
        payload: {
          wali: response.data.wali,
          token: response.data.token
        }
      });

      setWaliAuthToken(response.data.token);
      toast.success(`Welcome back, ${response.data.wali.name}!`);

      return { success: true, wali: response.data.wali };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';

      dispatch({
        type: WALI_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });

      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    dispatch({ type: WALI_ACTIONS.LOGOUT });
    setWaliAuthToken(null);
    toast.info('You have been logged out successfully.');
  };

  const updateSettings = async (settings) => {
    try {
      const response = await axios.put('/api/wali/settings', settings);

      dispatch({
        type: WALI_ACTIONS.UPDATE_SETTINGS,
        payload: response.data.wali
      });

      toast.success('Settings updated successfully!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Settings update failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const clearErrors = () => {
    dispatch({ type: WALI_ACTIONS.CLEAR_ERRORS });
  };

  const value = {
    wali: state.wali,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    login,
    logout,
    updateSettings,
    clearErrors,
    loadWali
  };

  return (
    <WaliContext.Provider value={value}>
      {children}
    </WaliContext.Provider>
  );
};

export const useWali = () => {
  const context = useContext(WaliContext);
  if (!context) {
    throw new Error('useWali must be used within a WaliProvider');
  }
  return context;
};

export default WaliContext;
