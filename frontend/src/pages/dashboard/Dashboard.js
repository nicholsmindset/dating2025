import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Fab,
  Badge,
  Tooltip,
  Paper,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Favorite,
  Close,
  Chat,
  LocationOn,
  School,
  Work,
  Height,
  Cake,
  Mosque,
  Star,
  Visibility,
  VisibilityOff,
  FilterList,
  Refresh
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [likedProfiles, setLikedProfiles] = useState([]);
  const [viewedProfiles, setViewedProfiles] = useState([]);
  const [subscriptionDialog, setSubscriptionDialog] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // Check if user has premium subscription
  const isPremium = user?.subscription?.plan === 'premium' && 
                   user?.subscription?.status === 'active';

  // Calculate remaining profile views for free users
  const remainingViews = isPremium ? 'Unlimited' : 
                        Math.max(0, 10 - (user?.profileViewsThisMonth || 0));

  useEffect(() => {
    fetchProfiles();
    fetchUserInteractions();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users/browse');
      
      if (response.data.success) {
        setProfiles(response.data.profiles);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInteractions = async () => {
    try {
      const [likesResponse, viewsResponse] = await Promise.all([
        axios.get('/api/users/liked-profiles'),
        axios.get('/api/users/viewed-profiles')
      ]);
      
      if (likesResponse.data.success) {
        setLikedProfiles(likesResponse.data.likedProfiles);
      }
      
      if (viewsResponse.data.success) {
        setViewedProfiles(viewsResponse.data.viewedProfiles);
      }
    } catch (error) {
      console.error('Failed to fetch user interactions:', error);
    }
  };

  const handleProfileView = async (profile) => {
    // Check if user can view more profiles
    if (!isPremium && remainingViews <= 0) {
      setSubscriptionDialog(true);
      return;
    }

    try {
      // Record profile view
      await axios.post(`/api/profiles/${profile._id}/view`);
      
      // Update user's view count
      const updatedUser = {
        ...user,
        profileViewsThisMonth: (user.profileViewsThisMonth || 0) + 1
      };
      updateUser(updatedUser);
      
      // Add to viewed profiles
      setViewedProfiles(prev => [...prev, profile._id]);
      
      // Open profile dialog
      setSelectedProfile(profile);
      setProfileDialogOpen(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to view profile');
    }
  };

  const handleLikeProfile = async (profileId) => {
    try {
      const response = await axios.post(`/api/profiles/${profileId}/like`);
      
      if (response.data.success) {
        setLikedProfiles(prev => [...prev, profileId]);
        
        if (response.data.match) {
          toast.success('🎉 It\'s a match! You can now start chatting.');
        } else {
          toast.success('Profile liked!');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to like profile');
    }
  };

  const handleStartChat = async (profileId) => {
    try {
      const response = await axios.post('/api/chat/start', {
        recipientId: profileId
      });

      if (response.data.chatId) {
        navigate(`/chat/${response.data.chatId}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start chat');
    }
  };

  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);
      const response = await axios.post('/api/subscription/create-portal-session');

      if (response.data.success && response.data.url) {
        // Open Stripe Customer Portal in new window
        window.open(response.data.url, '_blank');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to open billing portal');
    } finally {
      setPortalLoading(false);
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

  const isProfileBlurred = (profile) => {
    return !isPremium && !viewedProfiles.includes(profile._id);
  };

  const ProfileCard = ({ profile }) => {
    const isLiked = likedProfiles.includes(profile._id);
    const isBlurred = isProfileBlurred(profile);
    const age = calculateAge(profile.dateOfBirth);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 4
            },
            position: 'relative'
          }}
          onClick={() => handleProfileView(profile)}
        >
          {/* Premium Badge */}
          {profile.subscription?.plan === 'premium' && (
            <Chip
              icon={<Star />}
              label="Premium"
              color="warning"
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                zIndex: 2
              }}
            />
          )}

          {/* Profile Image */}
          <Box sx={{ position: 'relative' }}>
            <CardMedia
              component="img"
              height="300"
              image={profile.profileImage || '/default-avatar.png'}
              alt={profile.firstName}
              sx={{
                filter: isBlurred ? 'blur(8px)' : 'none',
                transition: 'filter 0.3s'
              }}
            />
            
            {/* Blur Overlay */}
            {isBlurred && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  color: 'white'
                }}
              >
                <Box textAlign="center">
                  <VisibilityOff sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="body2">
                    {isPremium ? 'Click to view' : 'Upgrade to view'}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Like Button */}
            <IconButton
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)'
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleLikeProfile(profile._id);
              }}
            >
              <Favorite
                sx={{
                  color: isLiked ? 'red' : 'grey.400'
                }}
              />
            </IconButton>
          </Box>

          {/* Profile Info */}
          <CardContent sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              {profile.firstName}, {age}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LocationOn sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {profile.location?.city}, {profile.location?.country}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Work sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {profile.occupation}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Mosque sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {profile.religiousLevel}
              </Typography>
            </Box>
            
            {/* Interests */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {profile.interests?.slice(0, 3).map((interest, index) => (
                <Chip
                  key={index}
                  label={interest}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
              {profile.interests?.length > 3 && (
                <Chip
                  label={`+${profile.interests.length - 3}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Discover Profiles
        </Typography>
        
        {/* Subscription Status */}
        <Paper sx={{ p: 2, mb: 3, backgroundColor: isPremium ? '#e8f5e8' : '#fff3e0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">
                {isPremium ? '✨ Premium Member' : '🆓 Free Plan'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isPremium
                  ? 'Unlimited profile views and full access'
                  : `${remainingViews} profile views remaining this month`
                }
              </Typography>
              {isPremium && user?.subscription?.endDate && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  Renews on {new Date(user.subscription.endDate).toLocaleDateString()}
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {!isPremium && (
                <Button
                  variant="contained"
                  color="warning"
                  onClick={() => navigate('/subscription')}
                >
                  Upgrade to Premium
                </Button>
              )}
              {isPremium && user?.subscription?.stripeCustomerId && (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  startIcon={portalLoading ? <CircularProgress size={16} /> : null}
                >
                  {portalLoading ? 'Loading...' : 'Manage Subscription'}
                </Button>
              )}
            </Box>
          </Box>

          {!isPremium && (
            <LinearProgress
              variant="determinate"
              value={(user?.profileViewsThisMonth || 0) / 10 * 100}
              sx={{ mt: 1, height: 6, borderRadius: 3 }}
            />
          )}
        </Paper>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          startIcon={<Refresh />}
          onClick={fetchProfiles}
          disabled={loading}
        >
          Refresh
        </Button>
        
        <Button
          startIcon={<FilterList />}
          onClick={() => navigate('/filters')}
        >
          Filters
        </Button>
      </Box>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <LinearProgress sx={{ width: '50%' }} />
        </Box>
      )}

      {/* Profiles Grid */}
      {!loading && (
        <AnimatePresence>
          <Grid container spacing={3}>
            {profiles.map((profile) => (
              <Grid item xs={12} sm={6} md={4} key={profile._id}>
                <ProfileCard profile={profile} />
              </Grid>
            ))}
          </Grid>
        </AnimatePresence>
      )}

      {/* No Profiles */}
      {!loading && profiles.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No profiles found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search filters or check back later
          </Typography>
        </Box>
      )}

      {/* Profile Detail Dialog */}
      <Dialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedProfile && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  {selectedProfile.firstName}, {calculateAge(selectedProfile.dateOfBirth)}
                </Typography>
                <IconButton onClick={() => setProfileDialogOpen(false)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <Grid container spacing={3}>
                {/* Profile Image */}
                <Grid item xs={12} md={4}>
                  <Avatar
                    src={selectedProfile.profileImage}
                    sx={{ width: '100%', height: 300, borderRadius: 2 }}
                    variant="rounded"
                  />
                </Grid>
                
                {/* Profile Details */}
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>
                    About {selectedProfile.firstName}
                  </Typography>
                  
                  <Typography variant="body1" paragraph>
                    {selectedProfile.bio}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {/* Basic Info */}
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Location
                      </Typography>
                      <Typography variant="body2">
                        {selectedProfile.location?.city}, {selectedProfile.location?.country}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Occupation
                      </Typography>
                      <Typography variant="body2">
                        {selectedProfile.occupation}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Education
                      </Typography>
                      <Typography variant="body2">
                        {selectedProfile.education}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Religious Level
                      </Typography>
                      <Typography variant="body2">
                        {selectedProfile.religiousLevel}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Height
                      </Typography>
                      <Typography variant="body2">
                        {selectedProfile.height} cm
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Marital Status
                      </Typography>
                      <Typography variant="body2">
                        {selectedProfile.maritalStatus}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  {/* Interests */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Interests
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedProfile.interests?.map((interest, index) => (
                        <Chip key={index} label={interest} size="small" />
                      ))}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions>
              <Button
                onClick={() => handleLikeProfile(selectedProfile._id)}
                startIcon={<Favorite />}
                disabled={likedProfiles.includes(selectedProfile._id)}
              >
                {likedProfiles.includes(selectedProfile._id) ? 'Liked' : 'Like'}
              </Button>
              
              <Button
                variant="contained"
                onClick={() => handleStartChat(selectedProfile._id)}
                startIcon={<Chat />}
                sx={{
                  background: 'linear-gradient(45deg, #2E7D32, #4CAF50)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1B5E20, #2E7D32)'
                  }
                }}
              >
                Start Chat
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Subscription Upgrade Dialog */}
      <Dialog
        open={subscriptionDialog}
        onClose={() => setSubscriptionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Upgrade to Premium
        </DialogTitle>
        
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            You've reached your monthly limit of 10 profile views.
          </Alert>
          
          <Typography variant="body1" paragraph>
            Upgrade to Premium for unlimited profile views, unblurred photos, and exclusive features!
          </Typography>
          
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h4" color="primary" gutterBottom>
              $23 SGD/month
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cancel anytime
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setSubscriptionDialog(false)}>
            Maybe Later
          </Button>
          
          <Button
            variant="contained"
            onClick={() => {
              setSubscriptionDialog(false);
              navigate('/subscription');
            }}
            sx={{
              background: 'linear-gradient(45deg, #2E7D32, #4CAF50)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1B5E20, #2E7D32)'
              }
            }}
          >
            Upgrade Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Chat Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          background: 'linear-gradient(45deg, #2E7D32, #4CAF50)',
          '&:hover': {
            background: 'linear-gradient(45deg, #1B5E20, #2E7D32)'
          }
        }}
        onClick={() => navigate('/chat')}
      >
        <Badge badgeContent={0} color="error">
          <Chat />
        </Badge>
      </Fab>
    </Container>
  );
};

export default Dashboard;