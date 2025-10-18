import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  IconButton,
  Avatar,
  Pagination,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Report as ReportIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Block as BlockIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { WithOnlineStatus } from '../../components/OnlineStatus';

const PREMIUM_STATUSES = ['active', 'trialing', 'past_due'];
const isPremiumSubscription = (subscription) => (
  subscription?.plan === 'premium' && PREMIUM_STATUSES.includes(subscription?.status)
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({});
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [settings, setSettings] = useState({});
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    status: '',
    gender: '',
    subscription: '',
    search: ''
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDialog, setUserDialog] = useState(false);
  const [reportDialog, setReportDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadDashboardData();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 1) {
      loadUsers();
    } else if (activeTab === 2) {
      loadReports();
    } else if (activeTab === 3) {
      loadAnalytics();
    } else if (activeTab === 4) {
      loadSettings();
    }
  }, [activeTab, pagination.current, filters]);

  const loadDashboardData = async () => {
    try {
      const response = await axios.get('/api/admin/dashboard');
      setDashboardStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.current,
        limit: 20,
        ...filters
      });
      const response = await axios.get(`/api/admin/users?${params}`);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadReports = async () => {
    try {
      const [userReports, chatReports] = await Promise.all([
        axios.get('/api/admin/reports/users'),
        axios.get('/api/admin/reports/chats')
      ]);
      setReports([
        ...userReports.data.reports.map(r => ({ ...r, type: 'user' })),
        ...chatReports.data.reports.map(r => ({ ...r, type: 'chat' }))
      ]);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const [subscriptions, activity] = await Promise.all([
        axios.get('/api/admin/analytics/subscriptions'),
        axios.get('/api/admin/analytics/activity')
      ]);
      setAnalytics({
        subscriptions: subscriptions.data,
        activity: activity.data
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await axios.get('/api/admin/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleUserAction = async (userId, action, reason = '') => {
    setActionLoading(true);
    try {
      if (action === 'delete') {
        await axios.delete(`/api/admin/users/${userId}`);
      } else {
        await axios.put(`/api/admin/users/${userId}/status`, {
          status: action,
          reason
        });
      }
      loadUsers();
      setUserDialog(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    }
    setActionLoading(false);
  };

  const handleReportAction = async (reportId, action, adminNotes = '') => {
    setActionLoading(true);
    try {
      const endpoint = selectedReport.type === 'user' 
        ? `/api/admin/reports/users/${selectedReport._id}/${reportId}`
        : `/api/admin/reports/chats/${selectedReport._id}/${reportId}`;
      
      await axios.put(endpoint, {
        action,
        adminNotes
      });
      
      loadReports();
      setReportDialog(false);
      setSelectedReport(null);
    } catch (error) {
      console.error('Error handling report:', error);
    }
    setActionLoading(false);
  };

  const updateSettings = async (newSettings) => {
    try {
      await axios.put('/api/admin/settings', newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'warning';
      case 'banned': return 'error';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} sx={{ color: '#2E7D32' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom sx={{ color: '#2E7D32', fontWeight: 'bold' }}>
          Admin Dashboard
        </Typography>

        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<DashboardIcon />} label="Overview" />
          <Tab icon={<PeopleIcon />} label="Users" />
          <Tab icon={<ReportIcon />} label="Reports" />
          <Tab icon={<AnalyticsIcon />} label="Analytics" />
          <Tab icon={<SettingsIcon />} label="Settings" />
        </Tabs>

        {/* Overview Tab */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="white" gutterBottom>
                        Total Users
                      </Typography>
                      <Typography variant="h4" color="white">
                        {dashboardStats.totalUsers || 0}
                      </Typography>
                    </Box>
                    <PeopleIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #FF8F00 0%, #FFC107 100%)' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="white" gutterBottom>
                        Premium Users
                      </Typography>
                      <Typography variant="h4" color="white">
                        {dashboardStats.premiumUsers || 0}
                      </Typography>
                    </Box>
                    <MoneyIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #1976D2 0%, #2196F3 100%)' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="white" gutterBottom>
                        Active Chats
                      </Typography>
                      <Typography variant="h4" color="white">
                        {dashboardStats.totalChats || 0}
                      </Typography>
                    </Box>
                    <TrendingUpIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #D32F2F 0%, #F44336 100%)' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="white" gutterBottom>
                        Reports
                      </Typography>
                      <Typography variant="h4" color="white">
                        {dashboardStats.recentReports || 0}
                      </Typography>
                    </Box>
                    <WarningIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Gender Distribution
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Male Users: {dashboardStats.genderDistribution?.male || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Female Users: {dashboardStats.genderDistribution?.female || 0}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Revenue Overview
                  </Typography>
                  <Typography variant="h4" color="primary" sx={{ mt: 1 }}>
                    ${dashboardStats.monthlyRevenue || 0} SGD
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monthly Revenue
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Users Tab */}
        {activeTab === 1 && (
          <Box>
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                size="small"
                sx={{ minWidth: 200 }}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                  <MenuItem value="banned">Banned</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={filters.gender}
                  onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Subscription</InputLabel>
                <Select
                  value={filters.subscription}
                  onChange={(e) => setFilters({ ...filters, subscription: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="premium">Premium</MenuItem>
                  <MenuItem value="free">Free</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Subscription</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <WithOnlineStatus userId={user._id}>
                            <Avatar src={user.profilePhoto} />
                          </WithOnlineStatus>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {user.firstName} {user.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.gender}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.accountStatus}
                          color={getStatusColor(user.accountStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={isPremiumSubscription(user.subscription) ? 'Premium' : 'Free'}
                          color={isPremiumSubscription(user.subscription) ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => {
                            setSelectedUser(user);
                            setUserDialog(true);
                          }}
                          size="small"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleUserAction(user._id, 'suspended', 'Admin action')}
                          size="small"
                          color="warning"
                        >
                          <BlockIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleUserAction(user._id, 'delete')}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={pagination.pages}
                page={pagination.current}
                onChange={(e, page) => setPagination({ ...pagination, current: page })}
                color="primary"
              />
            </Box>
          </Box>
        )}

        {/* Reports Tab */}
        {activeTab === 2 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Reported Item</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Reported By</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={`${report.type}-${report._id}`}>
                    <TableCell>
                      <Chip
                        label={report.type}
                        color={report.type === 'user' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {report.type === 'user' 
                        ? `${report.firstName} ${report.lastName}`
                        : 'Chat Conversation'
                      }
                    </TableCell>
                    <TableCell>{report.reports?.[0]?.reason || 'N/A'}</TableCell>
                    <TableCell>
                      {report.reports?.[0]?.reportedBy?.firstName || 'Anonymous'}
                    </TableCell>
                    <TableCell>
                      {new Date(report.reports?.[0]?.reportedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.reports?.[0]?.status || 'pending'}
                        color={report.reports?.[0]?.status === 'resolved' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => {
                          setSelectedReport(report);
                          setReportDialog(true);
                        }}
                        size="small"
                        variant="outlined"
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Analytics Tab */}
        {activeTab === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Subscription Analytics
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Total Premium: {analytics.subscriptions?.totalPremium || 0}
                    </Typography>
                    <Typography variant="body2">
                      New This Period: {analytics.subscriptions?.newPremiumThisPeriod || 0}
                    </Typography>
                    <Typography variant="body2">
                      Cancelled: {analytics.subscriptions?.cancelledThisPeriod || 0}
                    </Typography>
                    <Typography variant="body2">
                      Conversion Rate: {analytics.subscriptions?.conversionRate?.toFixed(1) || 0}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    User Activity
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Daily Active: {analytics.activity?.dailyActiveUsers || 0}
                    </Typography>
                    <Typography variant="body2">
                      Weekly Active: {analytics.activity?.weeklyActiveUsers || 0}
                    </Typography>
                    <Typography variant="body2">
                      New Registrations: {analytics.activity?.newRegistrations || 0}
                    </Typography>
                    <Typography variant="body2">
                      Total Messages: {analytics.activity?.totalMessages || 0}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Settings Tab */}
        {activeTab === 4 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Settings
              </Typography>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Subscription Price (SGD)"
                    type="number"
                    value={settings.subscriptionPrice || 23}
                    onChange={(e) => setSettings({ ...settings, subscriptionPrice: parseInt(e.target.value) })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Free User Profile Limit"
                    type="number"
                    value={settings.freeUserProfileLimit || 10}
                    onChange={(e) => setSettings({ ...settings, freeUserProfileLimit: parseInt(e.target.value) })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.registrationEnabled || true}
                        onChange={(e) => setSettings({ ...settings, registrationEnabled: e.target.checked })}
                      />
                    }
                    label="Registration Enabled"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.chatEnabled || true}
                        onChange={(e) => setSettings({ ...settings, chatEnabled: e.target.checked })}
                      />
                    }
                    label="Chat Enabled"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.waliSupervisionRequired || false}
                        onChange={(e) => setSettings({ ...settings, waliSupervisionRequired: e.target.checked })}
                      />
                    }
                    label="Wali Supervision Required (Global)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    onClick={() => updateSettings(settings)}
                    sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
                  >
                    Save Settings
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* User Details Dialog */}
        <Dialog open={userDialog} onClose={() => setUserDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>User Details</DialogTitle>
          <DialogContent>
            {selectedUser && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Name:</strong> {selectedUser.firstName} {selectedUser.lastName}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Email:</strong> {selectedUser.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Status:</strong> {selectedUser.accountStatus}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Gender:</strong> {selectedUser.gender}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Subscription:</strong> {isPremiumSubscription(selectedUser.subscription) ? 'Premium' : 'Free'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Joined:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</Typography>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUserDialog(false)}>Close</Button>
            <Button
              onClick={() => handleUserAction(selectedUser?._id, 'suspended', 'Admin review')}
              color="warning"
              disabled={actionLoading}
            >
              Suspend
            </Button>
            <Button
              onClick={() => handleUserAction(selectedUser?._id, 'banned', 'Policy violation')}
              color="error"
              disabled={actionLoading}
            >
              Ban
            </Button>
          </DialogActions>
        </Dialog>

        {/* Report Review Dialog */}
        <Dialog open={reportDialog} onClose={() => setReportDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Review Report</DialogTitle>
          <DialogContent>
            {selectedReport && (
              <Box>
                <Typography variant="body2" gutterBottom>
                  <strong>Type:</strong> {selectedReport.type}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Reason:</strong> {selectedReport.reports?.[0]?.reason}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Description:</strong> {selectedReport.reports?.[0]?.description}
                </Typography>
                <TextField
                  label="Admin Notes"
                  multiline
                  rows={3}
                  fullWidth
                  sx={{ mt: 2 }}
                  id="admin-notes"
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReportDialog(false)}>Cancel</Button>
            <Button
              onClick={() => {
                const notes = document.getElementById('admin-notes').value;
                handleReportAction(selectedReport?.reports?.[0]?._id, 'dismissed', notes);
              }}
              disabled={actionLoading}
            >
              Dismiss
            </Button>
            <Button
              onClick={() => {
                const notes = document.getElementById('admin-notes').value;
                handleReportAction(selectedReport?.reports?.[0]?._id, 'resolved', notes);
              }}
              color="primary"
              disabled={actionLoading}
            >
              Resolve
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

export default AdminDashboard;