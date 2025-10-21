import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

/**
 * SEO Component
 * Manages meta tags, Open Graph, Twitter Cards, and structured data
 */

const SEO = ({
  title = 'Islamic Dating Platform - Halal Marriage',
  description = 'Find your perfect match the halal way. AI-powered Islamic dating platform with guardian oversight, verified profiles, and intelligent matchmaking.',
  keywords = 'islamic dating, halal marriage, muslim matrimony, islamic matchmaking, muslim singles, halal relationship, islamic marriage, muslim dating app',
  image = '/og-image.jpg',
  type = 'website',
  author = 'Islamic Dating Platform',
  publishedTime = null,
  modifiedTime = null,
  article = false,
  noindex = false,
  canonicalUrl = null,
  structuredData = null
}) => {
  const location = useLocation();
  const siteUrl = process.env.REACT_APP_SITE_URL || 'https://islamicdating.com';
  const fullUrl = canonicalUrl || `${siteUrl}${location.pathname}`;
  const fullTitle = title.includes('Islamic Dating') ? title : `${title} | Islamic Dating Platform`;
  const ogImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

  // Default structured data for organization
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Islamic Dating Platform",
    "description": "AI-powered halal marriage platform connecting Muslims worldwide",
    "url": siteUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Islamic Dating Platform",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo512.png`
      }
    }
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Islamic Dating Platform" />
      <meta property="og:locale" content="en_US" />

      {/* Article specific OG tags */}
      {article && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {article && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {article && (
        <>
          <meta property="article:author" content={author} />
          <meta property="article:section" content="Islamic Marriage" />
          <meta property="article:tag" content="Islamic Dating" />
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:creator" content="@IslamicDating" />
      <meta name="twitter:site" content="@IslamicDating" />

      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#2E7D32" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="Islamic Dating" />

      {/* Language */}
      <meta httpEquiv="content-language" content="en" />

      {/* Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      <meta name="format-detection" content="telephone=no" />

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData || defaultStructuredData)}
      </script>

      {/* Alternate Languages (if applicable) */}
      <link rel="alternate" hrefLang="en" href={fullUrl} />
      <link rel="alternate" hrefLang="ar" href={`${siteUrl}/ar${location.pathname}`} />
      <link rel="alternate" hrefLang="ur" href={`${siteUrl}/ur${location.pathname}`} />
      <link rel="alternate" hrefLang="x-default" href={fullUrl} />
    </Helmet>
  );
};

export default SEO;

/**
 * Pre-configured SEO components for common pages
 */

export const HomeSEO = () => (
  <SEO
    title="Islamic Dating Platform - Find Your Halal Match with AI"
    description="Join thousands of Muslims finding their life partner the halal way. AI-powered matchmaking, guardian oversight, verified profiles, and Islamic values at the core."
    keywords="islamic dating, halal marriage, muslim matrimony, islamic matchmaking, muslim singles, halal dating app, islamic marriage app, muslim dating site"
    structuredData={{
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Islamic Dating Platform",
      "description": "AI-powered halal marriage platform",
      "url": process.env.REACT_APP_SITE_URL || 'https://islamicdating.com',
      "applicationCategory": "SocialNetworking",
      "operatingSystem": "Web, iOS, Android",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Free basic membership with premium options"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": "1247",
        "bestRating": "5",
        "worstRating": "1"
      }
    }}
  />
);

export const DashboardSEO = () => (
  <SEO
    title="Dashboard - Your Match Recommendations"
    description="View your personalized match recommendations powered by AI. Browse profiles, check compatibility scores, and find your perfect halal match."
    noindex={true}
  />
);

export const ChatSEO = () => (
  <SEO
    title="Messages - Chat with Your Matches"
    description="Real-time messaging with your matches. Secure, private conversations with guardian oversight when needed."
    noindex={true}
  />
);

export const SearchSEO = () => (
  <SEO
    title="Advanced Search - Find Your Perfect Match"
    description="Search for your ideal partner with 20+ filter criteria including age, location, religious level, education, and more."
    noindex={true}
  />
);

export const SubscriptionSEO = () => (
  <SEO
    title="Subscription Plans - Upgrade Your Experience"
    description="Choose from Free, Premium, or VIP plans. Get unlimited matches, advanced search, and priority support."
    structuredData={{
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Islamic Dating Premium Subscription",
      "description": "Premium subscription for Islamic Dating Platform",
      "offers": [
        {
          "@type": "Offer",
          "name": "Free Plan",
          "price": "0",
          "priceCurrency": "USD",
          "description": "10 profile views per month, 5 likes per day"
        },
        {
          "@type": "Offer",
          "name": "Premium Plan",
          "price": "23",
          "priceCurrency": "SGD",
          "description": "Unlimited views, unlimited likes, advanced search"
        },
        {
          "@type": "Offer",
          "name": "VIP Plan",
          "price": "47",
          "priceCurrency": "SGD",
          "description": "All premium features plus priority support and profile boost"
        }
      ]
    }}
  />
);

export const ProfileSEO = ({ userName, userBio, userPhoto }) => (
  <SEO
    title={`${userName}'s Profile`}
    description={userBio || `View ${userName}'s profile on Islamic Dating Platform. Connect for halal marriage.`}
    image={userPhoto}
    noindex={true}
    structuredData={{
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "mainEntity": {
        "@type": "Person",
        "name": userName,
        "description": userBio,
        "image": userPhoto
      }
    }}
  />
);

export const LoginSEO = () => (
  <SEO
    title="Login - Access Your Account"
    description="Login to your Islamic Dating account to view matches, send messages, and find your halal partner."
    noindex={true}
  />
);

export const RegisterSEO = () => (
  <SEO
    title="Register - Join Islamic Dating Platform"
    description="Create your free account and start your journey to find a halal match. Join thousands of Muslims finding their life partner."
    keywords="islamic dating signup, muslim matrimony registration, halal marriage register, islamic dating join"
  />
);
