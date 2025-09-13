import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  Stack,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  FavoriteRounded,
  EmailRounded,
  PhoneRounded,
  LocationOnRounded,
  Facebook,
  Twitter,
  Instagram
} from '@mui/icons-material';

const Footer = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'Success Stories', href: '/success-stories' },
      { label: 'Blog', href: '/blog' }
    ],
    support: [
      { label: 'Help Center', href: '/help' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Safety Tips', href: '/safety' },
      { label: 'Report Issue', href: '/report' }
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Islamic Guidelines', href: '/guidelines' },
      { label: 'Cookie Policy', href: '/cookies' }
    ]
  };

  return (
    <Box
      component="footer"
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        color: 'white',
        py: 6,
        mt: 'auto'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Brand Section */}
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <FavoriteRounded sx={{ fontSize: 28 }} />
                <Typography
                  variant="h5"
                  component="div"
                  sx={{
                    fontFamily: 'Amiri, serif',
                    fontWeight: 700
                  }}
                >
                  Islamic Dating
                </Typography>
              </Stack>
              
              <Typography
                variant="body2"
                sx={{
                  opacity: 0.9,
                  lineHeight: 1.6,
                  mb: 3,
                  maxWidth: '300px'
                }}
              >
                Connecting hearts through Islamic values. Find your perfect match 
                while maintaining the principles of our beautiful faith.
              </Typography>

              {/* Contact Info */}
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <EmailRounded sx={{ fontSize: 16, opacity: 0.8 }} />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    support@islamicdating.com
                  </Typography>
                </Stack>
                
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PhoneRounded sx={{ fontSize: 16, opacity: 0.8 }} />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    +65 1234 5678
                  </Typography>
                </Stack>
                
                <Stack direction="row" alignItems="center" spacing={1}>
                  <LocationOnRounded sx={{ fontSize: 16, opacity: 0.8 }} />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Singapore
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Grid>

          {/* Links Sections */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={4}>
              {/* Company Links */}
              <Grid item xs={6} sm={4}>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: 'Amiri, serif',
                    fontWeight: 600,
                    mb: 2
                  }}
                >
                  Company
                </Typography>
                <Stack spacing={1}>
                  {footerLinks.company.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      color="inherit"
                      underline="hover"
                      sx={{
                        opacity: 0.8,
                        fontSize: '0.875rem',
                        '&:hover': {
                          opacity: 1
                        }
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </Stack>
              </Grid>

              {/* Support Links */}
              <Grid item xs={6} sm={4}>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: 'Amiri, serif',
                    fontWeight: 600,
                    mb: 2
                  }}
                >
                  Support
                </Typography>
                <Stack spacing={1}>
                  {footerLinks.support.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      color="inherit"
                      underline="hover"
                      sx={{
                        opacity: 0.8,
                        fontSize: '0.875rem',
                        '&:hover': {
                          opacity: 1
                        }
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </Stack>
              </Grid>

              {/* Legal Links */}
              <Grid item xs={12} sm={4}>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: 'Amiri, serif',
                    fontWeight: 600,
                    mb: 2
                  }}
                >
                  Legal
                </Typography>
                <Stack spacing={1}>
                  {footerLinks.legal.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      color="inherit"
                      underline="hover"
                      sx={{
                        opacity: 0.8,
                        fontSize: '0.875rem',
                        '&:hover': {
                          opacity: 1
                        }
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: alpha('#ffffff', 0.2) }} />

        {/* Bottom Section */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography
              variant="body2"
              sx={{
                opacity: 0.8,
                textAlign: { xs: 'center', md: 'left' }
              }}
            >
              © {currentYear} Islamic Dating. All rights reserved. Made with{' '}
              <FavoriteRounded sx={{ fontSize: 14, mx: 0.5, verticalAlign: 'middle' }} />{' '}
              for the Muslim community.
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Stack
              direction="row"
              spacing={2}
              justifyContent={{ xs: 'center', md: 'flex-end' }}
            >
              <Link
                href="#"
                color="inherit"
                sx={{
                  opacity: 0.8,
                  '&:hover': {
                    opacity: 1,
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <Facebook />
              </Link>
              
              <Link
                href="#"
                color="inherit"
                sx={{
                  opacity: 0.8,
                  '&:hover': {
                    opacity: 1,
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <Twitter />
              </Link>
              
              <Link
                href="#"
                color="inherit"
                sx={{
                  opacity: 0.8,
                  '&:hover': {
                    opacity: 1,
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <Instagram />
              </Link>
            </Stack>
          </Grid>
        </Grid>

        {/* Islamic Quote */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'Amiri, serif',
              fontStyle: 'italic',
              opacity: 0.9,
              fontSize: '0.95rem'
            }}
          >
            "And among His signs is that He created for you mates from among yourselves, 
            that you may dwell in tranquility with them, and He has put love and mercy between your hearts."
          </Typography>
          <Typography
            variant="caption"
            sx={{
              opacity: 0.7,
              mt: 1,
              display: 'block'
            }}
          >
            - Quran 30:21
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;