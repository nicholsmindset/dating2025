import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Checkbox,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  Divider
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  LocationOn,
  Mosque,
  ArrowBack,
  ArrowForward
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { RegisterSEO } from '../../components/common/SEO';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const { register, isAuthenticated, loading, error, clearErrors } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when component mounts
  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  const steps = ['Basic Info', 'Islamic Profile', 'Location & Wali'];

  // Form validation schema
  const validationSchema = Yup.object({
    // Basic Info
    firstName: Yup.string()
      .min(2, 'First name must be at least 2 characters')
      .required('First name is required'),
    lastName: Yup.string()
      .min(2, 'Last name must be at least 2 characters')
      .required('Last name is required'),
    email: Yup.string()
      .email('Please enter a valid email address')
      .required('Email is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Please confirm your password'),
    dateOfBirth: Yup.date()
      .max(new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000), 'You must be at least 18 years old')
      .required('Date of birth is required'),
    gender: Yup.string()
      .oneOf(['male', 'female'], 'Please select your gender')
      .required('Gender is required'),
    
    // Islamic Profile
    maritalStatus: Yup.string()
      .oneOf(['never_married', 'widow', 'divorced', 'separated'], 'Please select your marital status')
      .required('Marital status is required'),
    religiousLevel: Yup.string()
      .oneOf(['practicing', 'moderate', 'learning'], 'Please select your religious level')
      .required('Religious level is required'),
    prayerFrequency: Yup.string()
      .oneOf(['5_times_daily', 'regularly', 'sometimes', 'rarely'], 'Please select prayer frequency')
      .required('Prayer frequency is required'),
    hijabWearing: Yup.string()
      .when('gender', (gender, schema) => {
        return gender === 'female' 
          ? schema.oneOf(['always', 'sometimes', 'no'], 'Please select hijab preference').required('Hijab preference is required')
          : schema.notRequired();
      }),
    
    // Location & Wali
    country: Yup.string()
      .required('Country is required'),
    city: Yup.string()
      .required('City is required'),
    hasWali: Yup.boolean(),
    waliName: Yup.string()
      .when('hasWali', (hasWali, schema) => {
        return hasWali === true 
          ? schema.required('Wali name is required')
          : schema.notRequired();
      }),
    waliRelation: Yup.string()
      .when('hasWali', (hasWali, schema) => {
        return hasWali === true 
          ? schema.oneOf(['father', 'brother', 'uncle', 'imam', 'other'], 'Please select wali relation').required('Wali relation is required')
          : schema.notRequired();
      }),
    waliContact: Yup.string()
      .when('hasWali', (hasWali, schema) => {
        return hasWali === true 
          ? schema.required('Wali contact is required')
          : schema.notRequired();
      }),
    waliEmail: Yup.string()
      .when('hasWali', (hasWali, schema) => {
        return hasWali === true 
          ? schema.email('Please enter a valid email').required('Wali email is required')
          : schema.notRequired();
      }),
    
    // Terms
    agreeToTerms: Yup.boolean()
      .oneOf([true], 'You must agree to the terms and conditions')
  });

  // Formik setup
  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      dateOfBirth: '',
      gender: '',
      maritalStatus: '',
      religiousLevel: '',
      prayerFrequency: '',
      hijabWearing: '',
      country: '',
      city: '',
      state: '',
      hasWali: false,
      waliName: '',
      waliRelation: '',
      waliContact: '',
      waliEmail: '',
      agreeToTerms: false
    },
    validationSchema,
    onSubmit: async (values) => {
      const userData = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        dateOfBirth: values.dateOfBirth,
        gender: values.gender,
        maritalStatus: values.maritalStatus,
        religiousLevel: values.religiousLevel,
        prayerFrequency: values.prayerFrequency,
        location: {
          country: values.country,
          city: values.city,
          state: values.state
        },
        wali: {
          hasWali: values.hasWali,
          waliName: values.waliName,
          waliRelation: values.waliRelation,
          waliContact: values.waliContact,
          waliEmail: values.waliEmail
        }
      };

      if (values.gender === 'female') {
        userData.hijabWearing = values.hijabWearing;
      }

      const result = await register(userData);
      if (result.success) {
        // Check if email verification is required
        if (result.requiresVerification) {
          // Show success message and stay on page - user will get email
          // The error state in useAuth will show the message
          // User can click "Resend Verification" link if needed
        } else {
          // If no verification required (old flow), navigate to onboarding
          navigate('/onboarding');
        }
      }
    }
  });

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const isStepValid = (step) => {
    switch (step) {
      case 0:
        return !formik.errors.firstName && !formik.errors.lastName && !formik.errors.email && 
               !formik.errors.password && !formik.errors.confirmPassword && !formik.errors.dateOfBirth && 
               !formik.errors.gender && formik.values.firstName && formik.values.lastName && 
               formik.values.email && formik.values.password && formik.values.confirmPassword && 
               formik.values.dateOfBirth && formik.values.gender;
      case 1:
        return !formik.errors.maritalStatus && !formik.errors.religiousLevel && !formik.errors.prayerFrequency && 
               !formik.errors.hijabWearing && formik.values.maritalStatus && formik.values.religiousLevel && 
               formik.values.prayerFrequency && (formik.values.gender !== 'female' || formik.values.hijabWearing);
      case 2:
        return !formik.errors.country && !formik.errors.city && !formik.errors.waliName && 
               !formik.errors.waliRelation && !formik.errors.waliContact && !formik.errors.waliEmail && 
               formik.values.country && formik.values.city && 
               (!formik.values.hasWali || (formik.values.waliName && formik.values.waliRelation && 
               formik.values.waliContact && formik.values.waliEmail));
      default:
        return false;
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="firstName"
                name="firstName"
                label="First Name"
                value={formik.values.firstName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                helperText={formik.touched.firstName && formik.errors.firstName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="lastName"
                name="lastName"
                label="Last Name"
                value={formik.values.lastName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                helperText={formik.touched.lastName && formik.errors.lastName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email Address"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="password"
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleTogglePassword} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="dateOfBirth"
                name="dateOfBirth"
                label="Date of Birth"
                type="date"
                value={formik.values.dateOfBirth}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.dateOfBirth && Boolean(formik.errors.dateOfBirth)}
                helperText={formik.touched.dateOfBirth && formik.errors.dateOfBirth}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={formik.touched.gender && Boolean(formik.errors.gender)}>
                <InputLabel>Gender</InputLabel>
                <Select
                  id="gender"
                  name="gender"
                  value={formik.values.gender}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  label="Gender"
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                </Select>
                {formik.touched.gender && formik.errors.gender && (
                  <FormHelperText>{formik.errors.gender}</FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={formik.touched.maritalStatus && Boolean(formik.errors.maritalStatus)}>
                <InputLabel>Marital Status</InputLabel>
                <Select
                  id="maritalStatus"
                  name="maritalStatus"
                  value={formik.values.maritalStatus}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  label="Marital Status"
                >
                  <MenuItem value="never_married">Never Married</MenuItem>
                  <MenuItem value="widow">Widow</MenuItem>
                  <MenuItem value="divorced">Divorced</MenuItem>
                  <MenuItem value="separated">Separated</MenuItem>
                </Select>
                {formik.touched.maritalStatus && formik.errors.maritalStatus && (
                  <FormHelperText>{formik.errors.maritalStatus}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={formik.touched.religiousLevel && Boolean(formik.errors.religiousLevel)}>
                <InputLabel>Religious Level</InputLabel>
                <Select
                  id="religiousLevel"
                  name="religiousLevel"
                  value={formik.values.religiousLevel}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  label="Religious Level"
                >
                  <MenuItem value="practicing">Practicing</MenuItem>
                  <MenuItem value="moderate">Moderate</MenuItem>
                  <MenuItem value="learning">Learning</MenuItem>
                </Select>
                {formik.touched.religiousLevel && formik.errors.religiousLevel && (
                  <FormHelperText>{formik.errors.religiousLevel}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={formik.touched.prayerFrequency && Boolean(formik.errors.prayerFrequency)}>
                <InputLabel>Prayer Frequency</InputLabel>
                <Select
                  id="prayerFrequency"
                  name="prayerFrequency"
                  value={formik.values.prayerFrequency}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  label="Prayer Frequency"
                >
                  <MenuItem value="5_times_daily">5 Times Daily</MenuItem>
                  <MenuItem value="regularly">Regularly</MenuItem>
                  <MenuItem value="sometimes">Sometimes</MenuItem>
                  <MenuItem value="rarely">Rarely</MenuItem>
                </Select>
                {formik.touched.prayerFrequency && formik.errors.prayerFrequency && (
                  <FormHelperText>{formik.errors.prayerFrequency}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            {formik.values.gender === 'female' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={formik.touched.hijabWearing && Boolean(formik.errors.hijabWearing)}>
                  <InputLabel>Hijab Wearing</InputLabel>
                  <Select
                    id="hijabWearing"
                    name="hijabWearing"
                    value={formik.values.hijabWearing}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label="Hijab Wearing"
                  >
                    <MenuItem value="always">Always</MenuItem>
                    <MenuItem value="sometimes">Sometimes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </Select>
                  {formik.touched.hijabWearing && formik.errors.hijabWearing && (
                    <FormHelperText>{formik.errors.hijabWearing}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            )}
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="country"
                name="country"
                label="Country"
                value={formik.values.country}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.country && Boolean(formik.errors.country)}
                helperText={formik.touched.country && formik.errors.country}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="city"
                name="city"
                label="City"
                value={formik.values.city}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.city && Boolean(formik.errors.city)}
                helperText={formik.touched.city && formik.errors.city}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="state"
                name="state"
                label="State/Province (Optional)"
                value={formik.values.state}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Wali Information (Islamic Guardian)
                </Typography>
              </Divider>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    id="hasWali"
                    name="hasWali"
                    checked={formik.values.hasWali}
                    onChange={formik.handleChange}
                    color="primary"
                  />
                }
                label="I have a Wali (Islamic guardian) who will oversee my marriage process"
              />
            </Grid>
            
            {formik.values.hasWali && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="waliName"
                    name="waliName"
                    label="Wali Name"
                    value={formik.values.waliName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.waliName && Boolean(formik.errors.waliName)}
                    helperText={formik.touched.waliName && formik.errors.waliName}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={formik.touched.waliRelation && Boolean(formik.errors.waliRelation)}>
                    <InputLabel>Wali Relation</InputLabel>
                    <Select
                      id="waliRelation"
                      name="waliRelation"
                      value={formik.values.waliRelation}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      label="Wali Relation"
                    >
                      <MenuItem value="father">Father</MenuItem>
                      <MenuItem value="brother">Brother</MenuItem>
                      <MenuItem value="uncle">Uncle</MenuItem>
                      <MenuItem value="imam">Imam</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                    {formik.touched.waliRelation && formik.errors.waliRelation && (
                      <FormHelperText>{formik.errors.waliRelation}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="waliContact"
                    name="waliContact"
                    label="Wali Phone Number"
                    value={formik.values.waliContact}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.waliContact && Boolean(formik.errors.waliContact)}
                    helperText={formik.touched.waliContact && formik.errors.waliContact}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="waliEmail"
                    name="waliEmail"
                    label="Wali Email"
                    type="email"
                    value={formik.values.waliEmail}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.waliEmail && Boolean(formik.errors.waliEmail)}
                    helperText={formik.touched.waliEmail && formik.errors.waliEmail}
                  />
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    id="agreeToTerms"
                    name="agreeToTerms"
                    checked={formik.values.agreeToTerms}
                    onChange={formik.handleChange}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    I agree to the{' '}
                    <Link to="/terms" style={{ color: '#2E7D32' }}>
                      Terms and Conditions
                    </Link>
                    {' '}and{' '}
                    <Link to="/privacy" style={{ color: '#2E7D32' }}>
                      Privacy Policy
                    </Link>
                  </Typography>
                }
              />
              {formik.touched.agreeToTerms && formik.errors.agreeToTerms && (
                <FormHelperText error>{formik.errors.agreeToTerms}</FormHelperText>
              )}
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <RegisterSEO />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
          }}
        >
          {/* Header */}
          <Box textAlign="center" mb={4}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mb: 2
              }}
            >
              <Mosque sx={{ fontSize: 40, color: 'primary.main', mr: 1 }} />
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #2E7D32, #4CAF50)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Join Halal Hearts
              </Typography>
            </Box>
            
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
              Create Your Islamic Profile
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Begin your journey towards finding a halal life partner
            </Typography>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={formik.handleSubmit}>
            {renderStepContent(activeStep)}

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ArrowBack />}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              
              <Box sx={{ flex: '1 1 auto' }} />
              
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || !formik.values.agreeToTerms}
                  sx={{
                    background: 'linear-gradient(45deg, #2E7D32, #4CAF50)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1B5E20, #2E7D32)'
                    }
                  }}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!isStepValid(activeStep)}
                  endIcon={<ArrowForward />}
                  sx={{
                    background: 'linear-gradient(45deg, #2E7D32, #4CAF50)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1B5E20, #2E7D32)'
                    }
                  }}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>

          {/* Login Link */}
          <Box textAlign="center" mt={4}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#2E7D32', textDecoration: 'none' }}>
                Sign In
              </Link>
            </Typography>
          </Box>
        </Paper>
      </motion.div>
      </Container>
    </>
  );
};

export default Register;