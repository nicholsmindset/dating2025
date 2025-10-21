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
  Alert,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  People,
  Favorite,
  Message,
  VerifiedUser,
  Stars,
  Timeline,
  Assessment
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';

const Analytics = () => {
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b'];

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/analytics/dashboard?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAnalytics(response.data.dashboard);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}30`
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!analytics) {
    return null;
  }

  const { platform, retention, features, matchSuccess } = analytics;

  // Prepare chart data
  const genderData = platform.demographics?.gender?.map(item => ({
    name: item._id === 'male' ? 'Male' : 'Female',
    value: item.count
  })) || [];

  const religiousData = platform.demographics?.religiousLevel?.map(item => ({
    name: item._id,
    value: item.count
  })) || [];

  const ageData = platform.demographics?.age?.map((item, index) => ({
    name: `${item._id}`,
    users: item.count
  })) || [];

  const countryData = platform.demographics?.topCountries?.slice(0, 5).map(item => ({
    name: item._id,
    users: item.count
  })) || [];

  const featureData = features ? [
    { name: 'Profile Photos', percentage: parseFloat(features.profilePhotos?.percentage || 0) },
    { name: 'Complete Bio', percentage: parseFloat(features.completeBio?.percentage || 0) },
    { name: 'Liked Profiles', percentage: parseFloat(features.liked?.percentage || 0) },
    { name: 'Saved Searches', percentage: parseFloat(features.savedSearches?.percentage || 0) },
    { name: 'With Wali', percentage: parseFloat(features.wali?.percentage || 0) },
    { name: 'Premium', percentage: parseFloat(features.premium?.percentage || 0) }
  ] : [];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
            Platform Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive insights and metrics
          </Typography>
        </Box>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Time Period</InputLabel>
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            label="Time Period"
          >
            <MenuItem value="day">Last 24 Hours</MenuItem>
            <MenuItem value="week">Last Week</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="year">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={platform.users?.total?.toLocaleString() || 0}
            icon={<People sx={{ color: 'white', fontSize: 30 }} />}
            color="#667eea"
            subtitle={`${platform.users?.verified || 0} verified`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Users"
            value={platform.users?.active?.toLocaleString() || 0}
            icon={<TrendingUp sx={{ color: 'white', fontSize: 30 }} />}
            color="#764ba2"
            subtitle={`${platform.users?.dailyActive || 0} daily`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Matches"
            value={platform.engagement?.totalMatches?.toLocaleString() || 0}
            icon={<Favorite sx={{ color: 'white', fontSize: 30 }} />}
            color="#f093fb"
            subtitle={`${matchSuccess?.conversationRate || '0%'} to chat`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Messages"
            value={platform.engagement?.totalMessages?.toLocaleString() || 0}
            icon={<Message sx={{ color: 'white', fontSize: 30 }} />}
            color="#4facfe"
            subtitle={`${platform.engagement?.totalConversations || 0} conversations`}
          />
        </Grid>
      </Grid>

      {/* User Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              User Statistics
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    New Users
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {platform.users?.new?.toLocaleString() || 0}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Premium Users
                  </Typography>
                  <Typography variant="h5" fontWeight={600} color="warning.main">
                    {platform.users?.premium?.toLocaleString() || 0}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Photo Verified
                  </Typography>
                  <Typography variant="h5" fontWeight={600} color="success.main">
                    {platform.users?.photoVerified?.toLocaleString() || 0}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Weekly Active
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {platform.users?.weeklyActive?.toLocaleString() || 0}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Match Success Metrics
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Match to Conversation Rate
                  </Typography>
                  <Typography variant="h4" fontWeight={600} color="primary.main">
                    {matchSuccess?.conversationRate || '0%'}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Avg. Time to First Message
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {matchSuccess?.avgHoursToFirstMessage ? `${matchSuccess.avgHoursToFirstMessage} hours` : 'N/A'}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Users with Matches
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {platform.engagement?.usersWithMatches?.toLocaleString() || 0}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={6}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Users with Messages
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {platform.engagement?.usersWithMessages?.toLocaleString() || 0}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Retention Metrics */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
          User Retention
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary" gutterBottom>
                1 Week Retention
              </Typography>
              <Typography variant="h3" fontWeight={700} color="primary.main">
                {retention?.week1 || '0'}%
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary" gutterBottom>
                2 Week Retention
              </Typography>
              <Typography variant="h3" fontWeight={700} color="secondary.main">
                {retention?.week2 || '0'}%
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary" gutterBottom>
                1 Month Retention
              </Typography>
              <Typography variant="h3" fontWeight={700} color="success.main">
                {retention?.month1 || '0'}%
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Gender Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Gender Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Religious Level Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Religious Level Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={religiousData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#667eea" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Feature Usage */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Feature Adoption Rate
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={featureData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="percentage" fill="#764ba2" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Top Countries */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Top Countries
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={countryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#f093fb" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Analytics;
