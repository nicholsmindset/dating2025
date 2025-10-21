import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Avatar,
  Typography,
  Grid,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  Divider,
  Alert,
  Backdrop,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Message as MessageIcon,
  Block as BlockIcon,
  Report as ReportIcon,
  Favorite as FavoriteIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Cake as CakeIcon,
  Height as HeightIcon,
  Security as SecurityIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { WithOnlineStatus } from '../../components/OnlineStatus';
import { ProfileSEO } from '../../components/common/SEO';
import Breadcrumbs from '../../components/common/Breadcrumbs';

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, token } = useAuth();
  const { startChat } = useChat();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportDialog, setReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [showBlurredImage, setShowBlurredImage] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      
      // Check if image should be blurred for free users
      setShowBlurredImage(response.data.profilePhotoBlurred || false);
    } catch (error) {
      console.error('Load profile error:', error);
      if (error.response?.status === 404) {
        toast.error('Profile not found');
        navigate('/dashboard');
      } else if (error.response?.status === 403) {
        toast.error(error.response.data.message);
        if (error.response.data.requiresPremium) {
          navigate('/subscription');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    try {
      const chatId = await startChat(userId);
      navigate(`/chat?chatId=${chatId}`);
    } catch (error) {
      // Error handled in context
    }
  };

  const handleBlock = async () => {
    try {
      await axios.post(`/api/users/${userId}/block`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsBlocked(true);
      toast.success('User blocked successfully');
    } catch (error) {
      toast.error('Failed to block user');
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    
    try {
      await axios.post(`/api/users/${userId}/report`, {
        reason: reportReason,
        description: reportDescription
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setReportDialog(false);
      setReportReason('');
      setReportDescription('');
      toast.success('User reported successfully');
    } catch (error) {
      toast.error('Failed to report user');
    }
  };

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const formatHeight = (height) => {
    if (!height) return 'Not specified';
    const feet = Math.floor(height / 12);
    const inches = height % 12;
    return `${feet}'${inches}"`;
  };

  if (loading) {
    return (
      <Backdrop open={true} sx={{ zIndex: 1000 }}>
        <CircularProgress color="primary" />
      </Backdrop>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Profile not found</Alert>
      </Container>
    );
  }

  return (
    <>
      <ProfileSEO
        userName={`${profile.firstName} ${profile.lastName}`}
        userBio={profile.bio}
        userPhoto={profile.profilePhoto}
      />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Breadcrumbs />
        <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ color: '#2E7D32', fontWeight: 'bold' }}>
            Profile
          </Typography>
        </Box>

        {/* Main Profile Card */}
        <Paper sx={{ p: 4, mb: 3 }}>
          <Grid container spacing={4}>
            {/* Profile Photo */}
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <WithOnlineStatus userId={profile._id}>
                    <Avatar
                      src={showBlurredImage ? undefined : profile.profilePhoto}
                      sx={{
                        width: 200,
                        height: 200,
                        mx: 'auto',
                        mb: 2,
                        bgcolor: '#2E7D32',
                        fontSize: '3rem',
                        filter: showBlurredImage ? 'blur(10px)' : 'none'
                      }}
                    >
                      {profile.firstName?.[0]}
                    </Avatar>
                  </WithOnlineStatus>
                  
                  {showBlurredImage && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <VisibilityOffIcon sx={{ fontSize: 40, color: 'white' }} />
                      <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
                        Premium Required
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                {profile.isOnline && (
                  <Chip
                    label="Online"
                    color="success"
                    size="small"
                    sx={{ mb: 2 }}
                  />
                )}
                
                {profile.wali && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                    <SecurityIcon sx={{ fontSize: 16, color: '#2E7D32' }} />
                    <Typography variant="caption" color="text.secondary">
                      Wali: {profile.wali.firstName} {profile.wali.lastName}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Basic Info */}
            <Grid item xs={12} md={8}>
              <Typography variant="h4" gutterBottom sx={{ color: '#2E7D32' }}>
                {profile.firstName} {profile.lastName}
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                {profile.dateOfBirth && (
                  <Chip
                    icon={<CakeIcon />}
                    label={`${calculateAge(profile.dateOfBirth)} years old`}
                    variant="outlined"
                  />
                )}
                
                {profile.location?.city && (
                  <Chip
                    icon={<LocationIcon />}
                    label={`${profile.location.city}, ${profile.location.country}`}
                    variant="outlined"
                  />
                )}
                
                {profile.height && (
                  <Chip
                    icon={<HeightIcon />}
                    label={formatHeight(profile.height)}
                    variant="outlined"
                  />
                )}
                
                <Chip
                  label={profile.maritalStatus}
                  color="primary"
                  variant="outlined"
                />
                
                <Chip
                  label={profile.religiousLevel}
                  color="secondary"
                  variant="outlined"
                />
              </Box>
              
              {profile.bio && (
                <Typography variant="body1" paragraph sx={{ mb: 3 }}>
                  {profile.bio}
                </Typography>
              )}
              
              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<MessageIcon />}
                  onClick={handleStartChat}
                  sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
                  disabled={isBlocked}
                >
                  Send Message
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<ReportIcon />}
                  onClick={() => setReportDialog(true)}
                  color="warning"
                >
                  Report
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<BlockIcon />}
                  onClick={handleBlock}
                  color="error"
                  disabled={isBlocked}
                >
                  {isBlocked ? 'Blocked' : 'Block'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Detailed Information */}
        <Grid container spacing={3}>
          {/* Personal Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#2E7D32' }}>
                  Personal Information
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {profile.education && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SchoolIcon color="action" />
                      <Typography variant="body2">
                        <strong>Education:</strong> {profile.education}
                      </Typography>
                    </Box>
                  )}
                  
                  {profile.occupation && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WorkIcon color="action" />
                      <Typography variant="body2">
                        <strong>Occupation:</strong> {profile.occupation}
                      </Typography>
                    </Box>
                  )}
                  
                  {profile.income && (
                    <Typography variant="body2">
                      <strong>Income:</strong> {profile.income}
                    </Typography>
                  )}
                  
                  {profile.languagesSpoken?.length > 0 && (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Languages:</strong>
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {profile.languagesSpoken.map((language, index) => (
                          <Chip key={index} label={language} size="small" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Religious Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#2E7D32' }}>
                  Religious Information
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="body2">
                    <strong>Religious Level:</strong> {profile.religiousLevel}
                  </Typography>
                  
                  {profile.prayerFrequency && (
                    <Typography variant="body2">
                      <strong>Prayer Frequency:</strong> {profile.prayerFrequency}
                    </Typography>
                  )}
                  
                  {profile.hijabPreference && (
                    <Typography variant="body2">
                      <strong>Hijab Preference:</strong> {profile.hijabPreference}
                    </Typography>
                  )}
                  
                  {profile.dietaryPreferences?.length > 0 && (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Dietary Preferences:</strong>
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {profile.dietaryPreferences.map((pref, index) => (
                          <Chip key={index} label={pref} size="small" color="secondary" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Interests & Hobbies */}
          {(profile.interests?.length > 0 || profile.hobbies?.length > 0) && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: '#2E7D32' }}>
                    Interests & Hobbies
                  </Typography>
                  
                  {profile.interests?.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Interests:</strong>
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {profile.interests.map((interest, index) => (
                          <Chip key={index} label={interest} size="small" color="primary" />
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {profile.hobbies?.length > 0 && (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Hobbies:</strong>
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {profile.hobbies.map((hobby, index) => (
                          <Chip key={index} label={hobby} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {/* Upgrade Notice for Free Users */}
        {showBlurredImage && (
          <Alert 
            severity="info" 
            sx={{ mt: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => navigate('/subscription')}
              >
                Upgrade
              </Button>
            }
          >
            Upgrade to premium to view unblurred photos and access unlimited profiles!
          </Alert>
        )}
      </motion.div>

      {/* Report Dialog */}
      <Dialog open={reportDialog} onClose={() => setReportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Report User</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Reason"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            margin="normal"
            required
            select
            SelectProps={{ native: true }}
          >
            <option value="">Select a reason</option>
            <option value="inappropriate_content">Inappropriate Content</option>
            <option value="fake_profile">Fake Profile</option>
            <option value="harassment">Harassment</option>
            <option value="spam">Spam</option>
            <option value="other">Other</option>
          </TextField>
          
          <TextField
            fullWidth
            label="Description (optional)"
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleReport} 
            variant="contained" 
            color="error"
            disabled={!reportReason}
          >
            Report
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    </>
  );
};

export default Profile;