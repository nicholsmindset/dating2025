import React, { useEffect, useState } from 'react';
import {
  Snackbar,
  Alert,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  Favorite as FavoriteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { usePusher } from '../contexts/PusherContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationSystem = () => {
  const { notifications } = usePusher();
  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [latestNotification, setLatestNotification] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Count unread notifications
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);

    // Show snackbar for new notifications
    if (notifications.length > 0) {
      const latest = notifications[notifications.length - 1];
      if (!latest.read && latest !== latestNotification) {
        setLatestNotification(latest);
        setSnackbarOpen(true);
      }
    }
  }, [notifications, latestNotification]);

  const handleNotificationClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <MessageIcon color="primary" />;
      case 'like':
        return <FavoriteIcon color="error" />;
      case 'profile_view':
        return <VisibilityIcon color="info" />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case 'message':
        return `New message from ${notification.senderName}`;
      case 'like':
        return `${notification.senderName} liked your profile`;
      case 'profile_view':
        return `${notification.senderName} viewed your profile`;
      default:
        return notification.message || 'New notification';
    }
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleNotificationClick}
        sx={{ ml: 1 }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 350,
            maxHeight: 400,
            overflow: 'auto'
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Notifications
          </Typography>
        </Box>
        <Divider />
        
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </MenuItem>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.slice(-10).reverse().map((notification, index) => (
              <ListItem
                key={notification.id || index}
                sx={{
                  backgroundColor: notification.read ? 'transparent' : 'action.hover',
                  borderLeft: notification.read ? 'none' : '3px solid primary.main'
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'background.paper' }}>
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={getNotificationText(notification)}
                  secondary={formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: notification.read ? 'normal' : 'bold'
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption'
                  }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Menu>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="info"
          variant="filled"
          icon={latestNotification ? getNotificationIcon(latestNotification.type) : undefined}
        >
          {latestNotification ? getNotificationText(latestNotification) : ''}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NotificationSystem;