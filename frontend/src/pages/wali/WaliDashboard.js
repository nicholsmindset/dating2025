import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Person,
  Chat,
  Favorite,
  Visibility,
  CheckCircle,
  Pending,
  SupervisorAccount,
  LocationOn,
  CalendarToday
} from '@mui/icons-material';
import { useWali } from '../../contexts/WaliContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const WaliDashboard = () => {
  const { wali, isAuthenticated, loading: waliLoading } = useWali();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!waliLoading && !isAuthenticated) {
      navigate('/wali/login');
    }
  }, [isAuthenticated, waliLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/wali/dashboard');
      setDashboardData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch dashboard error:', error);
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const handleApproveChat = async (chatId) => {
    try {
      await axios.post(`/api/wali/chats/${chatId}/approve`);
      toast.success('Conversation approved!');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      toast.error('Failed to approve conversation');
    }
  };

  const handleRejectChat = async (chatId) => {
    try {
      await axios.post(`/api/wali/chats/${chatId}/reject`);
      toast.success('Conversation rejected');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      toast.error('Failed to reject conversation');
    }
  };

  if (loading || waliLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Container>
        <Alert severity="error">Failed to load dashboard data</Alert>
      </Container>
    );
  }

  const { ward, recentChats, pendingApproval, stats } = dashboardData;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          <SupervisorAccount sx={{ mr: 1, verticalAlign: 'middle' }} />
          Wali Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Guardian oversight for {ward?.firstName} {ward?.lastName}
        </Typography>
      </Box>

      {/* Ward Profile Card */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar
              src={ward?.profilePhoto}
              sx={{ width: 80, height: 80, border: '3px solid white' }}
            >
              {ward?.firstName?.[0]}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
              {ward?.firstName} {ward?.lastName}
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                icon={<CalendarToday />}
                label={`${ward?.age} years old`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
              <Chip
                icon={<LocationOn />}
                label={`${ward?.location?.city}, ${ward?.location?.country}`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
              <Chip
                label={ward?.maritalStatus?.replace('_', ' ')}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
              <Chip
                label={ward?.religiousLevel}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Likes
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats?.totalLikes || 0}
                  </Typography>
                </Box>
                <Favorite sx={{ fontSize: 40, color: '#f50057' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Profile Views
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats?.totalProfileViews || 0}
                  </Typography>
                </Box>
                <Visibility sx={{ fontSize: 40, color: '#2196f3' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Active Chats
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats?.activeChats || 0}
                  </Typography>
                </Box>
                <Chat sx={{ fontSize: 40, color: '#4caf50' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Pending Approval
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {stats?.pendingApproval || 0}
                  </Typography>
                </Box>
                <Pending sx={{ fontSize: 40, color: '#ff9800' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pending Approval Section */}
      {pendingApproval && pendingApproval.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            <Pending sx={{ mr: 1, verticalAlign: 'middle', color: 'warning.main' }} />
            Conversations Pending Your Approval
          </Typography>
          <List>
            {pendingApproval.map((chat, index) => {
              const otherUser = chat.participants?.find(p => p._id !== ward?.id);
              return (
                <React.Fragment key={chat._id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    sx={{
                      bgcolor: '#fff8e1',
                      borderRadius: 1,
                      my: 1
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar src={otherUser?.profilePhoto}>
                        {otherUser?.firstName?.[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${otherUser?.firstName} ${otherUser?.lastName}`}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {otherUser?.age} years • {otherUser?.location?.city}
                          </Typography>
                          <Chip
                            label="Pending Approval"
                            size="small"
                            color="warning"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<CheckCircle />}
                        onClick={() => handleApproveChat(chat._id)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleRejectChat(chat._id)}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/wali/chats/${chat._id}`)}
                      >
                        View
                      </Button>
                    </Box>
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        </Paper>
      )}

      {/* Recent Chats */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          <Chat sx={{ mr: 1, verticalAlign: 'middle' }} />
          Recent Conversations
        </Typography>
        {recentChats && recentChats.length > 0 ? (
          <List>
            {recentChats.map((chat, index) => {
              const otherUser = chat.participants?.find(p => p._id !== ward?.id);
              const isApproved = chat.waliSupervision?.isApproved;
              return (
                <React.Fragment key={chat._id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar src={otherUser?.profilePhoto}>
                        {otherUser?.firstName?.[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${otherUser?.firstName} ${otherUser?.lastName}`}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {chat.lastMessage?.content || 'No messages yet'}
                          </Typography>
                          <Chip
                            label={isApproved ? 'Approved' : 'Pending'}
                            size="small"
                            color={isApproved ? 'success' : 'warning'}
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      }
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/wali/chats/${chat._id}`)}
                    >
                      View Chat
                    </Button>
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        ) : (
          <Alert severity="info">No active conversations yet</Alert>
        )}
      </Paper>
    </Container>
  );
};

export default WaliDashboard;
