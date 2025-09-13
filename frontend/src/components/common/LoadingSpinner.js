import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const SpinnerContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '200px',
  gap: theme.spacing(2),
}));

const IslamicSpinner = styled(CircularProgress)(({ theme }) => ({
  color: theme.palette.primary.main,
  '& .MuiCircularProgress-circle': {
    strokeLinecap: 'round',
  },
}));

const LoadingSpinner = ({ 
  size = 40, 
  message = 'Loading...', 
  fullScreen = false,
  color = 'primary' 
}) => {
  const containerProps = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 9999,
    minHeight: '100vh'
  } : {};

  return (
    <SpinnerContainer sx={containerProps}>
      <IslamicSpinner 
        size={size} 
        color={color}
        thickness={4}
      />
      {message && (
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            fontFamily: 'Amiri, serif',
            textAlign: 'center',
            maxWidth: '200px'
          }}
        >
          {message}
        </Typography>
      )}
    </SpinnerContainer>
  );
};

export default LoadingSpinner;