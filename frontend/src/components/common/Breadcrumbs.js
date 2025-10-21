import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Breadcrumbs as MuiBreadcrumbs, Typography, Box } from '@mui/material';
import { NavigateNext, Home } from '@mui/icons-material';

/**
 * Breadcrumbs Component
 * Provides hierarchical navigation for better UX and SEO
 */

const routeNameMap = {
  '': 'Home',
  'dashboard': 'Dashboard',
  'profile': 'Profile',
  'chat': 'Messages',
  'subscription': 'Subscription',
  'search': 'Search',
  'saved-searches': 'Saved Searches',
  'my-activity': 'My Activity',
  'onboarding': 'Onboarding',
  'admin': 'Admin',
  'login': 'Login',
  'register': 'Register',
  'verify-email': 'Verify Email',
  'forgot-password': 'Forgot Password',
  'reset-password': 'Reset Password',
  'resend-verification': 'Resend Verification',
  'wali': 'Guardian',
};

const Breadcrumbs = ({ customPaths = null }) => {
  const location = useLocation();

  // Don't show breadcrumbs on home page or auth pages
  const hideBreadcrumbsOn = ['/', '/login', '/register', '/verify-email', '/forgot-password', '/reset-password'];
  if (hideBreadcrumbsOn.includes(location.pathname)) {
    return null;
  }

  const pathnames = customPaths || location.pathname.split('/').filter((x) => x);

  return (
    <Box sx={{ mb: 2, mt: 1 }}>
      <MuiBreadcrumbs
        separator={<NavigateNext fontSize="small" />}
        aria-label="breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-separator': {
            color: 'text.secondary'
          }
        }}
      >
        {/* Home Link */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#2E7D32'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
        >
          <Home sx={{ mr: 0.5 }} fontSize="small" />
          <Typography variant="body2">Home</Typography>
        </Link>

        {/* Dynamic Path Links */}
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;

          // Get readable name for route
          const routeName = routeNameMap[value] || value.charAt(0).toUpperCase() + value.slice(1);

          return last ? (
            <Typography
              key={to}
              variant="body2"
              color="text.primary"
              sx={{ fontWeight: 600 }}
            >
              {routeName}
            </Typography>
          ) : (
            <Link
              key={to}
              to={to}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#2E7D32'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
            >
              <Typography variant="body2">{routeName}</Typography>
            </Link>
          );
        })}
      </MuiBreadcrumbs>

      {/* JSON-LD Structured Data for Breadcrumbs */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": window.location.origin
            },
            ...pathnames.map((value, index) => ({
              "@type": "ListItem",
              "position": index + 2,
              "name": routeNameMap[value] || value.charAt(0).toUpperCase() + value.slice(1),
              "item": `${window.location.origin}/${pathnames.slice(0, index + 1).join('/')}`
            }))
          ]
        })}
      </script>
    </Box>
  );
};

export default Breadcrumbs;
