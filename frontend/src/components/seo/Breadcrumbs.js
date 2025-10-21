import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Breadcrumbs as MuiBreadcrumbs, Typography, Box } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';

/**
 * Breadcrumbs Component - Shows navigation path with Schema.org markup
 *
 * @param {Object} props
 * @param {Array} props.customCrumbs - Custom breadcrumb items [{ label, path }]
 */
const Breadcrumbs = ({ customCrumbs }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Route name mapping for better display
  const routeNames = {
    dashboard: 'Dashboard',
    profile: 'Profile',
    chat: 'Messages',
    subscription: 'Subscription Plans',
    onboarding: 'Complete Profile',
    admin: 'Admin Dashboard',
    login: 'Login',
    register: 'Sign Up',
  };

  // Build breadcrumb items
  const breadcrumbItems = customCrumbs || [
    { label: 'Home', path: '/' },
    ...pathnames.map((name, index) => {
      const path = `/${pathnames.slice(0, index + 1).join('/')}`;
      const label = routeNames[name] || name.charAt(0).toUpperCase() + name.slice(1);
      return { label, path };
    })
  ];

  // Don't show breadcrumbs on homepage
  if (location.pathname === '/' && !customCrumbs) {
    return null;
  }

  // Build Schema.org BreadcrumbList
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": `https://islamicdating.com${item.path}`
    }))
  };

  return (
    <>
      {/* Schema.org Breadcrumb Markup */}
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>

      {/* Visual Breadcrumbs */}
      <Box
        sx={{
          py: 2,
          px: { xs: 2, sm: 3, md: 4 },
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <MuiBreadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
          sx={{
            fontSize: '0.875rem',
            '& .MuiBreadcrumbs-separator': {
              mx: 0.5
            }
          }}
        >
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            const isHome = item.path === '/';

            if (isLast) {
              return (
                <Typography
                  key={item.path}
                  color="text.primary"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: 600
                  }}
                >
                  {isHome && <HomeIcon sx={{ mr: 0.5, fontSize: '1.2rem' }} />}
                  {item.label}
                </Typography>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Typography
                  color="text.secondary"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    '&:hover': {
                      color: 'primary.main',
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {isHome && <HomeIcon sx={{ mr: 0.5, fontSize: '1.2rem' }} />}
                  {item.label}
                </Typography>
              </Link>
            );
          })}
        </MuiBreadcrumbs>
      </Box>
    </>
  );
};

export default Breadcrumbs;
