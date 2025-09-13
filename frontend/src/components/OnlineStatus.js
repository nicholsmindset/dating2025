import React from 'react';
import { Box, Chip, Avatar } from '@mui/material';
import { Circle as CircleIcon } from '@mui/icons-material';
import { usePusher } from '../contexts/PusherContext';

const OnlineStatus = ({ userId, variant = 'dot', showText = false, size = 'small' }) => {
  const { onlineUsers } = usePusher();
  const isOnline = onlineUsers.has(userId);

  if (variant === 'dot') {
    return (
      <Box
        sx={{
          position: 'relative',
          display: 'inline-block'
        }}
      >
        <Box
          sx={{
            width: size === 'small' ? 8 : 12,
            height: size === 'small' ? 8 : 12,
            borderRadius: '50%',
            backgroundColor: isOnline ? '#4caf50' : '#bdbdbd',
            border: '2px solid white',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
          }}
        />
      </Box>
    );
  }

  if (variant === 'badge') {
    return (
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        {/* This would wrap around an Avatar or other component */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: size === 'small' ? 12 : 16,
            height: size === 'small' ? 12 : 16,
            borderRadius: '50%',
            backgroundColor: isOnline ? '#4caf50' : '#bdbdbd',
            border: '2px solid white',
            zIndex: 1
          }}
        />
      </Box>
    );
  }

  if (variant === 'chip') {
    return (
      <Chip
        icon={<CircleIcon sx={{ color: isOnline ? '#4caf50' : '#bdbdbd' }} />}
        label={isOnline ? 'Online' : 'Offline'}
        size={size}
        variant="outlined"
        sx={{
          '& .MuiChip-icon': {
            fontSize: size === 'small' ? '0.75rem' : '1rem'
          }
        }}
      />
    );
  }

  if (variant === 'text') {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          fontSize: size === 'small' ? '0.75rem' : '0.875rem',
          color: 'text.secondary'
        }}
      >
        <CircleIcon
          sx={{
            fontSize: size === 'small' ? '0.5rem' : '0.75rem',
            color: isOnline ? '#4caf50' : '#bdbdbd'
          }}
        />
        {showText && (isOnline ? 'Online' : 'Offline')}
      </Box>
    );
  }

  return null;
};

// Higher-order component to wrap avatars with online status
export const WithOnlineStatus = ({ userId, children, badgeSize = 'small' }) => {
  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      {children}
      <OnlineStatus userId={userId} variant="badge" size={badgeSize} />
    </Box>
  );
};

export default OnlineStatus;