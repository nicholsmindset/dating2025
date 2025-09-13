import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HomeRounded, ArrowBackRounded } from '@mui/icons-material';

const MotionBox = motion(Box);

const NotFound = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        py: 4
      }}
    >
      <Container maxWidth="md">
        <MotionBox
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          sx={{ textAlign: 'center' }}
        >
          {/* 404 Number */}
          <MotionBox
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, type: 'spring', stiffness: 100 }}
            sx={{ mb: 4 }}
          >
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '6rem', md: '8rem' },
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                fontFamily: 'Amiri, serif'
              }}
            >
              404
            </Typography>
          </MotionBox>

          {/* Error Message */}
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            sx={{ mb: 4 }}
          >
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontFamily: 'Amiri, serif',
                fontWeight: 600,
                mb: 2,
                color: 'text.primary',
                fontSize: { xs: '1.8rem', md: '2.5rem' }
              }}
            >
              Page Not Found
            </Typography>
            
            <Typography
              variant="h6"
              sx={{
                color: 'text.secondary',
                mb: 4,
                maxWidth: '500px',
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              The page you're looking for doesn't exist or has been moved. 
              Let's get you back on the right path.
            </Typography>
          </MotionBox>

          {/* Illustration */}
          <MotionBox
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            sx={{ mb: 6 }}
          >
            <Box
              sx={{
                width: { xs: 200, md: 300 },
                height: { xs: 200, md: 300 },
                mx: 'auto',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '80%',
                  height: '80%',
                  borderRadius: '50%',
                  border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                }
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: '3rem', md: '4rem' },
                  color: theme.palette.primary.main,
                  opacity: 0.7
                }}
              >
                🕌
              </Typography>
            </Box>
          </MotionBox>

          {/* Action Buttons */}
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
              alignItems="center"
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<HomeRounded />}
                onClick={() => navigate('/')}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  minWidth: '160px'
                }}
              >
                Go Home
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<ArrowBackRounded />}
                onClick={() => navigate(-1)}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  minWidth: '160px'
                }}
              >
                Go Back
              </Button>
            </Stack>
          </MotionBox>

          {/* Help Text */}
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            sx={{ mt: 6 }}
          >
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontStyle: 'italic'
              }}
            >
              If you believe this is an error, please contact our support team.
            </Typography>
          </MotionBox>
        </MotionBox>
      </Container>
    </Box>
  );
};

export default NotFound;