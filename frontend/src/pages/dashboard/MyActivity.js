import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Visibility,
  Favorite,
  Message,
  Chat,
  TrendingUp
} from '@mui/icons-material';
import axios from 'axios';

const MyActivity = () => {
  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchActivityStats();
  }, [period]);

  const fetchActivityStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/analytics/my-activity?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setStats(response.data.stats);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch activity statistics');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}30`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" fontWeight={700} color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!stats) {
    return null;
  }

  const periodLabel = {
    day: 'Today',
    week: 'This Week',
    month: 'This Month',
    year: 'This Year'
  }[period] || 'This Week';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
            My Activity
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your engagement and interactions
          </Typography>
        </Box>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Time Period</InputLabel>
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            label="Time Period"
          >
            <MenuItem value="day">Today</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="year">This Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={`Profile Views - ${periodLabel}`}
            value={stats.profileViews || 0}
            icon={<Visibility sx={{ color: 'white', fontSize: 35 }} />}
            color="#667eea"
            subtitle="People who viewed your profile"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={`Likes Given - ${periodLabel}`}
            value={stats.likesGiven || 0}
            icon={<Favorite sx={{ color: 'white', fontSize: 35 }} />}
            color="#f093fb"
            subtitle="Profiles you liked"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={`Matches - ${periodLabel}`}
            value={stats.matches || 0}
            icon={<Favorite sx={{ color: 'white', fontSize: 35 }} />}
            color="#43e97b"
            subtitle="Mutual connections"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={`Messages Sent - ${periodLabel}`}
            value={stats.messagesSent || 0}
            icon={<Message sx={{ color: 'white', fontSize: 35 }} />}
            color="#4facfe"
            subtitle="Messages you sent"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title={`Conversations - ${periodLabel}`}
            value={stats.conversationsStarted || 0}
            icon={<Chat sx={{ color: 'white', fontSize: 35 }} />}
            color="#764ba2"
            subtitle="New conversations"
          />
        </Grid>
      </Grid>

      {/* Insights */}
      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Activity Insights
        </Typography>

        <Box sx={{ mt: 3 }}>
          {stats.profileViews > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" color="text.secondary">
                Your profile has been viewed <strong>{stats.profileViews}</strong> times {periodLabel.toLowerCase()}.
                {stats.profileViews > 10 ? ' Great job! Your profile is getting attention.' : ' Keep your profile updated to get more views.'}
              </Typography>
            </Box>
          )}

          {stats.matches > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" color="text.secondary">
                You've made <strong>{stats.matches}</strong> new {stats.matches === 1 ? 'match' : 'matches'} {periodLabel.toLowerCase()}.
                {stats.messagesSent === 0 && ' Start a conversation to get to know them better!'}
              </Typography>
            </Box>
          )}

          {stats.likesGiven > stats.matches * 2 && stats.matches > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" color="text.secondary">
                Tip: You've liked many profiles. Try being more selective to increase your match quality.
              </Typography>
            </Box>
          )}

          {stats.matches > 0 && stats.conversationsStarted === 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" color="warning.main">
                You have matches but haven't started any conversations yet. Break the ice with a friendly message!
              </Typography>
            </Box>
          )}

          {stats.profileViews === 0 && stats.likesGiven === 0 && stats.matches === 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" color="text.secondary">
                No activity yet {periodLabel.toLowerCase()}. Start exploring profiles to connect with potential matches!
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default MyActivity;
