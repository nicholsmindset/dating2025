import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * SEO Component - Manages all meta tags, Open Graph, Twitter cards, and Schema markup
 *
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description
 * @param {string} props.keywords - SEO keywords
 * @param {string} props.canonicalUrl - Canonical URL for the page
 * @param {string} props.ogType - Open Graph type (default: 'website')
 * @param {string} props.ogImage - Open Graph image URL
 * @param {string} props.twitterCard - Twitter card type (default: 'summary_large_image')
 * @param {Object} props.schema - Schema.org structured data (JSON-LD)
 * @param {boolean} props.noindex - Whether to noindex the page (default: false)
 */
const SEO = ({
  title = 'Islamic Dating & Muslim Marriage | Halal Matchmaking Platform',
  description = 'Find your perfect halal match with our Islamic dating platform. Faith-centered matchmaking for Muslim singles seeking marriage.',
  keywords = 'islamic dating, muslim marriage, halal dating, muslim matchmaking, islamic matchmaking',
  canonicalUrl = 'https://islamicdating.com',
  ogType = 'website',
  ogImage = 'https://islamicdating.com/og-image.jpg',
  twitterCard = 'summary_large_image',
  schema = null,
  noindex = false,
  children
}) => {
  // Ensure title includes site name for branding
  const fullTitle = title.includes('Islamic Dating')
    ? title
    : `${title} | Islamic Dating Platform`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Islamic Dating Platform" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta property="twitter:card" content={twitterCard} />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />

      {/* Schema.org JSON-LD */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}

      {/* Additional custom meta tags */}
      {children}
    </Helmet>
  );
};

export default SEO;
