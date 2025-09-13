import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Badge,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import NotificationSystem from '../NotificationSystem';

const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchor(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    handleMenuClose();
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleMenuClose();
  };

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Chat', path: '/chat', icon: <ChatIcon /> },
    { label: 'Subscription', path: '/subscription', icon: <PersonIcon /> },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ label: 'Admin', path: '/admin', icon: <AdminIcon /> });
  }

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        backgroundColor: 'rgba(46, 125, 50, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.1)'
      }}
    >
      <Toolbar>
        {/* Logo */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              flexGrow: 0, 
              cursor: 'pointer',
              fontFamily: '"Amiri", serif',
              fontWeight: 700,
              fontSize: '1.5rem',
              background: 'linear-gradient(45deg, #FFD700, #FFA000)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            onClick={() => navigate('/')}
          >
            ☪ Islamic Dating
          </Typography>
        </motion.div>

        <Box sx={{ flexGrow: 1 }} />

        {user ? (
          <>
            {/* Desktop Navigation */}
            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {menuItems.map((item) => (
                  <Button
                    key={item.path}
                    color="inherit"
                    startIcon={item.icon}
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      borderRadius: 2,
                      px: 2,
                      backgroundColor: isActive(item.path) ? 'rgba(255,255,255,0.1)' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)',
                      }
                    }}
                  >
                    {item.label}
                  </Button>
                ))}

                {/* Notifications */}
                <NotificationSystem />

                {/* Profile Menu */}
                <IconButton
                  onClick={handleProfileMenuOpen}
                  sx={{ ml: 1 }}
                >
                  <Avatar
                    src={user.profilePicture}
                    alt={user.name}
                    sx={{ width: 32, height: 32 }}
                  >
                    {user.name?.charAt(0)}
                  </Avatar>
                </IconButton>
              </Box>
            )}

            {/* Mobile Navigation */}
            {isMobile && (
              <>
                <Box>
                  <NotificationSystem />
                </Box>
                <IconButton
                  color="inherit"
                  onClick={handleMobileMenuOpen}
                >
                  <MenuIcon />
                </IconButton>
              </>
            )}
          </>
        ) : (
          /* Guest Navigation */
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              onClick={() => navigate('/login')}
              sx={{
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              Login
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/register')}
              sx={{
                backgroundColor: '#FFD700',
                color: '#000',
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: '#FFA000',
                }
              }}
            >
              Register
            </Button>
          </Box>
        )}
      </Toolbar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            minWidth: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }
        }}
      >
        <MenuItem onClick={() => handleNavigation('/profile/' + user?._id)}>
          <PersonIcon sx={{ mr: 2 }} />
          My Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 2 }} />
          Logout
        </MenuItem>
      </Menu>

      {/* Mobile Menu */}
      <Menu
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            minWidth: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }
        }}
      >
        {menuItems.map((item) => (
          <MenuItem
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            sx={{
              backgroundColor: isActive(item.path) ? 'rgba(46, 125, 50, 0.1)' : 'transparent',
            }}
          >
            {item.icon}
            <Typography sx={{ ml: 2 }}>{item.label}</Typography>
          </MenuItem>
        ))}
        <MenuItem onClick={() => handleNavigation('/profile/' + user?._id)}>
          <PersonIcon sx={{ mr: 2 }} />
          My Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 2 }} />
          Logout
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Navbar;