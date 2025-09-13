import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FavoriteRounded,
  SecurityRounded,
  GroupsRounded,
  VerifiedUserRounded
} from '@mui/icons-material';

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const Home = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const features = [
    {
      icon: <FavoriteRounded sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Islamic Values',
      description: 'Find your life partner while maintaining Islamic principles and values'
    },
    {
      icon: <SecurityRounded sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Privacy & Safety',
      description: 'Your privacy is protected with advanced security measures and Islamic guidelines'
    },
    {
      icon: <GroupsRounded sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Family Involvement',
      description: 'Wali oversight and family involvement in the matrimonial process'
    },
    {
      icon: <VerifiedUserRounded sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Verified Profiles',
      description: 'All profiles are verified to ensure authenticity and serious intentions'
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <MotionBox
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontFamily: 'Amiri, serif',
                    fontWeight: 700,
                    mb: 3,
                    color: 'text.primary',
                    fontSize: { xs: '2.5rem', md: '3.5rem' }
                  }}
                >
                  Find Your
                  <Box component="span" sx={{ color: 'primary.main', display: 'block' }}>
                    Halal Match
                  </Box>
                </Typography>
                
                <Typography
                  variant="h6"
                  sx={{
                    mb: 4,
                    color: 'text.secondary',
                    lineHeight: 1.6,
                    maxWidth: '500px'
                  }}
                >
                  Connect with like-minded Muslims seeking marriage in accordance with Islamic principles. 
                  Start your journey towards a blessed union today.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/register')}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1.1rem'
                    }}
                  >
                    Start Your Journey
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/login')}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1.1rem'
                    }}
                  >
                    Sign In
                  </Button>
                </Stack>
              </MotionBox>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <MotionBox
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '400px'
                }}
              >
                <Box
                  sx={{
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.3)}`
                  }}
                >
                  <FavoriteRounded sx={{ fontSize: 120, color: 'white' }} />
                </Box>
              </MotionBox>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <MotionBox
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          sx={{ textAlign: 'center', mb: 6 }}
        >
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontFamily: 'Amiri, serif',
              fontWeight: 600,
              mb: 2,
              color: 'text.primary'
            }}
          >
            Why Choose Us?
          </Typography>
          
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              maxWidth: '600px',
              mx: 'auto'
            }}
          >
            We provide a safe, Islamic-compliant platform for Muslims to find their life partners
          </Typography>
        </MotionBox>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <MotionCard
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 3,
                  borderRadius: 3,
                  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
                  transition: 'all 0.3s ease'
                }}
              >
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{
                      fontFamily: 'Amiri, serif',
                      fontWeight: 600,
                      mb: 2,
                      color: 'text.primary'
                    }}
                  >
                    {feature.title}
                  </Typography>
                  
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      lineHeight: 1.6
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          py: 8,
          color: 'white'
        }}
      >
        <Container maxWidth="md">
          <MotionBox
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            sx={{ textAlign: 'center' }}
          >
            <Typography
              variant="h4"
              component="h2"
              sx={{
                fontFamily: 'Amiri, serif',
                fontWeight: 600,
                mb: 3
              }}
            >
              Ready to Begin Your Journey?
            </Typography>
            
            <Typography
              variant="h6"
              sx={{
                mb: 4,
                opacity: 0.9,
                maxWidth: '500px',
                mx: 'auto'
              }}
            >
              Join thousands of Muslims who have found their perfect match through our platform
            </Typography>

            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{
                backgroundColor: 'white',
                color: 'primary.main',
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem',
                '&:hover': {
                  backgroundColor: alpha('#ffffff', 0.9)
                }
              }}
            >
              Get Started Today
            </Button>
          </MotionBox>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;