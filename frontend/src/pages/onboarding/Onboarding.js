import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Stepper,
  Step,
  StepLabel,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  Avatar,
  IconButton,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  Slider,
  FormControlLabel,
  Switch,
  Divider
} from '@mui/material';
import {
  PhotoCamera,
  ArrowBack,
  ArrowForward,
  CheckCircle,
  School,
  Work,
  Height,
  FitnessCenter,
  Palette,
  Language,
  Favorite,
  LocationOn,
  Mosque
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Onboarding = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const steps = [
    'Profile Photo',
    'About You',
    'Education & Career',
    'Physical Attributes',
    'Interests & Preferences',
    'Partner Preferences'
  ];

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Form validation schema
  const validationSchema = Yup.object({
    bio: Yup.string()
      .min(50, 'Bio must be at least 50 characters')
      .max(500, 'Bio must not exceed 500 characters')
      .required('Bio is required'),
    occupation: Yup.string()
      .required('Occupation is required'),
    education: Yup.string()
      .required('Education level is required'),
    income: Yup.string(),
    height: Yup.number()
      .min(120, 'Height must be at least 120cm')
      .max(250, 'Height must not exceed 250cm')
      .required('Height is required'),
    bodyType: Yup.string()
      .required('Body type is required'),
    ethnicity: Yup.string()
      .required('Ethnicity is required'),
    languages: Yup.array()
      .min(1, 'Please select at least one language')
      .required('Languages are required'),
    interests: Yup.array()
      .min(3, 'Please select at least 3 interests')
      .required('Interests are required'),
    lookingFor: Yup.string()
      .required('Please specify what you are looking for'),
    ageRangeMin: Yup.number()
      .min(18, 'Minimum age must be at least 18')
      .required('Minimum age is required'),
    ageRangeMax: Yup.number()
      .min(Yup.ref('ageRangeMin'), 'Maximum age must be greater than minimum age')
      .required('Maximum age is required'),
    maxDistance: Yup.number()
      .min(1, 'Distance must be at least 1km')
      .max(10000, 'Distance must not exceed 10000km')
      .required('Maximum distance is required')
  });

  // Formik setup
  const formik = useFormik({
    initialValues: {
      bio: '',
      occupation: '',
      education: '',
      income: '',
      height: 170,
      bodyType: '',
      ethnicity: '',
      languages: [],
      interests: [],
      lookingFor: '',
      ageRangeMin: 25,
      ageRangeMax: 35,
      maxDistance: 50,
      wantChildren: false,
      hasChildren: false,
      smoking: 'never',
      drinking: 'never'
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const profileData = {
          ...values,
          profileImage: profileImage
        };

        const response = await axios.put('/api/users/profile', profileData);
        
        if (response.data.success) {
          updateUser(response.data.user);
          toast.success('Profile completed successfully!');
          navigate('/dashboard');
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to complete profile');
      }
    }
  });

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post('/api/upload/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setProfileImage(response.data.imageUrl);
        setImagePreview(URL.createObjectURL(file));
        toast.success('Image uploaded successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleInterestToggle = (interest) => {
    const currentInterests = formik.values.interests;
    const newInterests = currentInterests.includes(interest)
      ? currentInterests.filter(i => i !== interest)
      : [...currentInterests, interest];
    
    formik.setFieldValue('interests', newInterests);
  };

  const handleLanguageToggle = (language) => {
    const currentLanguages = formik.values.languages;
    const newLanguages = currentLanguages.includes(language)
      ? currentLanguages.filter(l => l !== language)
      : [...currentLanguages, language];
    
    formik.setFieldValue('languages', newLanguages);
  };

  const availableInterests = [
    'Reading Quran', 'Islamic Studies', 'Cooking', 'Travel', 'Photography',
    'Sports', 'Fitness', 'Art', 'Music', 'Movies', 'Nature', 'Volunteering',
    'Technology', 'Business', 'Fashion', 'Gardening', 'Writing', 'Learning',
    'Family Time', 'Community Service', 'Hiking', 'Swimming', 'Cycling'
  ];

  const availableLanguages = [
    'Arabic', 'English', 'Urdu', 'Turkish', 'Malay', 'Indonesian', 'French',
    'Spanish', 'German', 'Italian', 'Russian', 'Chinese', 'Japanese', 'Korean',
    'Hindi', 'Bengali', 'Persian', 'Swahili', 'Portuguese', 'Dutch'
  ];

  const isStepValid = (step) => {
    switch (step) {
      case 0:
        return profileImage !== null;
      case 1:
        return formik.values.bio && formik.values.bio.length >= 50;
      case 2:
        return formik.values.occupation && formik.values.education;
      case 3:
        return formik.values.height && formik.values.bodyType && formik.values.ethnicity;
      case 4:
        return formik.values.languages.length > 0 && formik.values.interests.length >= 3;
      case 5:
        return formik.values.lookingFor && formik.values.ageRangeMin && formik.values.ageRangeMax;
      default:
        return false;
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box textAlign="center">
            <Typography variant="h6" gutterBottom>
              Upload Your Profile Photo
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Choose a clear, recent photo that represents you well
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              <Avatar
                src={imagePreview}
                sx={{
                  width: 200,
                  height: 200,
                  mx: 'auto',
                  mb: 2,
                  border: '4px solid',
                  borderColor: 'primary.main'
                }}
              >
                <PhotoCamera sx={{ fontSize: 60 }} />
              </Avatar>
              
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="profile-image-upload"
                type="file"
                onChange={handleImageUpload}
              />
              
              <label htmlFor="profile-image-upload">
                <Button
                  variant="contained"
                  component="span"
                  disabled={uploading}
                  startIcon={<PhotoCamera />}
                  sx={{
                    background: 'linear-gradient(45deg, #2E7D32, #4CAF50)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1B5E20, #2E7D32)'
                    }
                  }}
                >
                  {uploading ? 'Uploading...' : 'Choose Photo'}
                </Button>
              </label>
            </Box>
            
            {uploading && <LinearProgress sx={{ mb: 2 }} />}
            
            <Alert severity="info">
              Your photo will be reviewed to ensure it meets our community guidelines
            </Alert>
          </Box>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Tell Us About Yourself
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                id="bio"
                name="bio"
                label="Bio"
                placeholder="Write a brief description about yourself, your values, and what makes you unique..."
                value={formik.values.bio}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.bio && Boolean(formik.errors.bio)}
                helperText={
                  formik.touched.bio && formik.errors.bio
                    ? formik.errors.bio
                    : `${formik.values.bio.length}/500 characters`
                }
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.hasChildren}
                    onChange={(e) => formik.setFieldValue('hasChildren', e.target.checked)}
                    color="primary"
                  />
                }
                label="I have children"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formik.values.wantChildren}
                    onChange={(e) => formik.setFieldValue('wantChildren', e.target.checked)}
                    color="primary"
                  />
                }
                label="I want children in the future"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Smoking</InputLabel>
                <Select
                  name="smoking"
                  value={formik.values.smoking}
                  onChange={formik.handleChange}
                  label="Smoking"
                >
                  <MenuItem value="never">Never</MenuItem>
                  <MenuItem value="occasionally">Occasionally</MenuItem>
                  <MenuItem value="regularly">Regularly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Drinking</InputLabel>
                <Select
                  name="drinking"
                  value={formik.values.drinking}
                  onChange={formik.handleChange}
                  label="Drinking"
                >
                  <MenuItem value="never">Never</MenuItem>
                  <MenuItem value="socially">Socially</MenuItem>
                  <MenuItem value="regularly">Regularly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Education & Career
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="occupation"
                name="occupation"
                label="Occupation"
                value={formik.values.occupation}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.occupation && Boolean(formik.errors.occupation)}
                helperText={formik.touched.occupation && formik.errors.occupation}
                InputProps={{
                  startAdornment: <Work sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={formik.touched.education && Boolean(formik.errors.education)}>
                <InputLabel>Education Level</InputLabel>
                <Select
                  name="education"
                  value={formik.values.education}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  label="Education Level"
                  startAdornment={<School sx={{ mr: 1, color: 'action.active' }} />}
                >
                  <MenuItem value="high_school">High School</MenuItem>
                  <MenuItem value="diploma">Diploma</MenuItem>
                  <MenuItem value="bachelor">Bachelor's Degree</MenuItem>
                  <MenuItem value="master">Master's Degree</MenuItem>
                  <MenuItem value="phd">PhD</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
                {formik.touched.education && formik.errors.education && (
                  <FormHelperText>{formik.errors.education}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Income Range (Optional)</InputLabel>
                <Select
                  name="income"
                  value={formik.values.income}
                  onChange={formik.handleChange}
                  label="Income Range (Optional)"
                >
                  <MenuItem value="">Prefer not to say</MenuItem>
                  <MenuItem value="under_30k">Under $30,000</MenuItem>
                  <MenuItem value="30k_50k">$30,000 - $50,000</MenuItem>
                  <MenuItem value="50k_75k">$50,000 - $75,000</MenuItem>
                  <MenuItem value="75k_100k">$75,000 - $100,000</MenuItem>
                  <MenuItem value="100k_150k">$100,000 - $150,000</MenuItem>
                  <MenuItem value="over_150k">Over $150,000</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Physical Attributes
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography gutterBottom>Height (cm)</Typography>
              <Slider
                name="height"
                value={formik.values.height}
                onChange={(e, value) => formik.setFieldValue('height', value)}
                min={120}
                max={250}
                valueLabelDisplay="on"
                marks={[
                  { value: 150, label: '150cm' },
                  { value: 170, label: '170cm' },
                  { value: 190, label: '190cm' }
                ]}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={formik.touched.bodyType && Boolean(formik.errors.bodyType)}>
                <InputLabel>Body Type</InputLabel>
                <Select
                  name="bodyType"
                  value={formik.values.bodyType}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  label="Body Type"
                >
                  <MenuItem value="slim">Slim</MenuItem>
                  <MenuItem value="athletic">Athletic</MenuItem>
                  <MenuItem value="average">Average</MenuItem>
                  <MenuItem value="curvy">Curvy</MenuItem>
                  <MenuItem value="plus_size">Plus Size</MenuItem>
                </Select>
                {formik.touched.bodyType && formik.errors.bodyType && (
                  <FormHelperText>{formik.errors.bodyType}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth error={formik.touched.ethnicity && Boolean(formik.errors.ethnicity)}>
                <InputLabel>Ethnicity</InputLabel>
                <Select
                  name="ethnicity"
                  value={formik.values.ethnicity}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  label="Ethnicity"
                >
                  <MenuItem value="arab">Arab</MenuItem>
                  <MenuItem value="south_asian">South Asian</MenuItem>
                  <MenuItem value="southeast_asian">Southeast Asian</MenuItem>
                  <MenuItem value="east_asian">East Asian</MenuItem>
                  <MenuItem value="african">African</MenuItem>
                  <MenuItem value="caucasian">Caucasian</MenuItem>
                  <MenuItem value="hispanic">Hispanic</MenuItem>
                  <MenuItem value="mixed">Mixed</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
                {formik.touched.ethnicity && formik.errors.ethnicity && (
                  <FormHelperText>{formik.errors.ethnicity}</FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>
        );

      case 4:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Languages & Interests
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Languages You Speak
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {availableLanguages.map((language) => (
                  <Chip
                    key={language}
                    label={language}
                    onClick={() => handleLanguageToggle(language)}
                    color={formik.values.languages.includes(language) ? 'primary' : 'default'}
                    variant={formik.values.languages.includes(language) ? 'filled' : 'outlined'}
                    icon={<Language />}
                  />
                ))}
              </Box>
              {formik.touched.languages && formik.errors.languages && (
                <Typography color="error" variant="caption">
                  {formik.errors.languages}
                </Typography>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Your Interests (Select at least 3)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availableInterests.map((interest) => (
                  <Chip
                    key={interest}
                    label={interest}
                    onClick={() => handleInterestToggle(interest)}
                    color={formik.values.interests.includes(interest) ? 'primary' : 'default'}
                    variant={formik.values.interests.includes(interest) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
              {formik.touched.interests && formik.errors.interests && (
                <Typography color="error" variant="caption">
                  {formik.errors.interests}
                </Typography>
              )}
            </Grid>
          </Grid>
        );

      case 5:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Partner Preferences
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth error={formik.touched.lookingFor && Boolean(formik.errors.lookingFor)}>
                <InputLabel>What are you looking for?</InputLabel>
                <Select
                  name="lookingFor"
                  value={formik.values.lookingFor}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  label="What are you looking for?"
                >
                  <MenuItem value="marriage">Marriage</MenuItem>
                  <MenuItem value="serious_relationship">Serious Relationship Leading to Marriage</MenuItem>
                  <MenuItem value="friendship">Islamic Friendship</MenuItem>
                </Select>
                {formik.touched.lookingFor && formik.errors.lookingFor && (
                  <FormHelperText>{formik.errors.lookingFor}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography gutterBottom>Age Range</Typography>
              <Box sx={{ px: 2 }}>
                <Slider
                  value={[formik.values.ageRangeMin, formik.values.ageRangeMax]}
                  onChange={(e, value) => {
                    formik.setFieldValue('ageRangeMin', value[0]);
                    formik.setFieldValue('ageRangeMax', value[1]);
                  }}
                  min={18}
                  max={80}
                  valueLabelDisplay="on"
                  marks={[
                    { value: 25, label: '25' },
                    { value: 35, label: '35' },
                    { value: 45, label: '45' }
                  ]}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography gutterBottom>Maximum Distance (km)</Typography>
              <Slider
                name="maxDistance"
                value={formik.values.maxDistance}
                onChange={(e, value) => formik.setFieldValue('maxDistance', value)}
                min={1}
                max={1000}
                valueLabelDisplay="on"
                marks={[
                  { value: 25, label: '25km' },
                  { value: 100, label: '100km' },
                  { value: 500, label: '500km' }
                ]}
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
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
                Complete Your Profile
              </Typography>
            </Box>
            
            <Typography variant="body1" color="text.secondary">
              Help us find your perfect halal match
            </Typography>
          </Box>

          {/* Progress */}
          <Box sx={{ mb: 4 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            <LinearProgress
              variant="determinate"
              value={(activeStep / (steps.length - 1)) * 100}
              sx={{ mt: 2, height: 8, borderRadius: 4 }}
            />
          </Box>

          {/* Form Content */}
          <Box component="form" onSubmit={formik.handleSubmit}>
            <Card sx={{ mb: 4, minHeight: 400 }}>
              <CardContent>
                {renderStepContent(activeStep)}
              </CardContent>
            </Card>

            {/* Navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<ArrowBack />}
              >
                Back
              </Button>
              
              <Box sx={{ flex: '1 1 auto' }} />
              
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!isStepValid(activeStep) || formik.isSubmitting}
                  startIcon={<CheckCircle />}
                  sx={{
                    background: 'linear-gradient(45deg, #2E7D32, #4CAF50)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1B5E20, #2E7D32)'
                    }
                  }}
                >
                  {formik.isSubmitting ? 'Completing...' : 'Complete Profile'}
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
        </Paper>
      </motion.div>
    </Container>
  );
};

export default Onboarding;