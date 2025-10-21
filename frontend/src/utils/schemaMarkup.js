/**
 * Schema.org Structured Data Utilities
 * Generates JSON-LD markup for various page types
 */

/**
 * Generate Organization Schema
 */
export const generateOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Islamic Dating Platform",
  "url": "https://islamicdating.com",
  "logo": "https://islamicdating.com/logo.png",
  "description": "Faith-centered halal matchmaking platform for Muslim singles seeking marriage",
  "sameAs": [
    "https://facebook.com/islamicdating",
    "https://twitter.com/islamicdating",
    "https://instagram.com/islamicdating"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-XXX-XXX-XXXX",
    "contactType": "Customer Service",
    "email": "support@islamicdating.com",
    "areaServed": "Worldwide",
    "availableLanguage": ["English", "Arabic"]
  }
});

/**
 * Generate WebSite Schema
 */
export const generateWebsiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Islamic Dating Platform",
  "url": "https://islamicdating.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://islamicdating.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
});

/**
 * Generate Service Schema for Dating Service
 */
export const generateServiceSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Online Dating Service",
  "provider": {
    "@type": "Organization",
    "name": "Islamic Dating Platform"
  },
  "areaServed": "Worldwide",
  "audience": {
    "@type": "PeopleAudience",
    "suggestedMinAge": 18
  },
  "description": "Halal matchmaking service for Muslim singles seeking marriage with Islamic values and wali supervision"
});

/**
 * Generate Person Schema for User Profile
 * @param {Object} user - User data
 */
export const generatePersonSchema = (user) => {
  if (!user) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": `${user.firstName} ${user.lastName}`,
    "image": user.profilePhoto,
    "gender": user.gender === 'male' ? 'Male' : 'Female',
    "nationality": user.location?.country,
    "homeLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": user.location?.city,
        "addressCountry": user.location?.country
      }
    }
  };
};

/**
 * Generate Offer Schema for Subscription Plans
 * @param {Object} plan - Subscription plan data
 */
export const generateOfferSchema = (plan) => {
  if (!plan) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    "name": plan.displayName,
    "description": plan.description,
    "price": plan.price?.monthly?.amount / 100,
    "priceCurrency": "SGD",
    "availability": "https://schema.org/InStock",
    "url": `https://islamicdating.com/subscription#${plan.name}`,
    "seller": {
      "@type": "Organization",
      "name": "Islamic Dating Platform"
    },
    "priceSpecification": {
      "@type": "UnitPriceSpecification",
      "price": plan.price?.monthly?.amount / 100,
      "priceCurrency": "SGD",
      "billingDuration": "P1M"
    }
  };
};

/**
 * Generate Product Schema for Subscription Plans Page
 * @param {Array} plans - Array of subscription plans
 */
export const generateProductListSchema = (plans) => {
  if (!plans || !plans.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": plans.map((plan, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": plan.displayName,
        "description": plan.description,
        "offers": {
          "@type": "Offer",
          "price": plan.price?.monthly?.amount / 100,
          "priceCurrency": "SGD",
          "availability": "https://schema.org/InStock",
          "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
        }
      }
    }))
  };
};

/**
 * Generate FAQ Schema
 * @param {Array} faqs - Array of {question, answer} objects
 */
export const generateFAQSchema = (faqs) => {
  if (!faqs || !faqs.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
};

/**
 * Generate Article Schema
 * @param {Object} article - Article data
 */
export const generateArticleSchema = (article) => {
  if (!article) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.description,
    "image": article.image,
    "datePublished": article.publishedDate,
    "dateModified": article.modifiedDate || article.publishedDate,
    "author": {
      "@type": "Organization",
      "name": "Islamic Dating Platform"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Islamic Dating Platform",
      "logo": {
        "@type": "ImageObject",
        "url": "https://islamicdating.com/logo.png"
      }
    }
  };
};

/**
 * Generate Review Schema
 * @param {Array} reviews - Array of user reviews
 */
export const generateReviewSchema = (reviews) => {
  if (!reviews || !reviews.length) return null;

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Islamic Dating Platform",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": averageRating.toFixed(1),
      "reviewCount": reviews.length,
      "bestRating": 5,
      "worstRating": 1
    },
    "review": reviews.map(review => ({
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating,
        "bestRating": 5
      },
      "author": {
        "@type": "Person",
        "name": review.authorName
      },
      "reviewBody": review.text,
      "datePublished": review.date
    }))
  };
};

/**
 * Generate Local Business Schema
 */
export const generateLocalBusinessSchema = () => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Islamic Dating Platform",
  "image": "https://islamicdating.com/logo.png",
  "@id": "https://islamicdating.com",
  "url": "https://islamicdating.com",
  "telephone": "+1-XXX-XXX-XXXX",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main Street",
    "addressLocality": "Singapore",
    "postalCode": "123456",
    "addressCountry": "SG"
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ],
    "opens": "00:00",
    "closes": "23:59"
  }
});

/**
 * Generate BreadcrumbList Schema
 * @param {Array} breadcrumbs - Array of {name, url} objects
 */
export const generateBreadcrumbSchema = (breadcrumbs) => {
  if (!breadcrumbs || !breadcrumbs.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };
};

/**
 * Generate VideoObject Schema
 * @param {Object} video - Video data
 */
export const generateVideoSchema = (video) => {
  if (!video) return null;

  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": video.title,
    "description": video.description,
    "thumbnailUrl": video.thumbnail,
    "uploadDate": video.uploadDate,
    "duration": video.duration,
    "contentUrl": video.url,
    "embedUrl": video.embedUrl
  };
};

/**
 * Combine multiple schemas into a graph
 * @param {Array} schemas - Array of schema objects
 */
export const combineSchemas = (...schemas) => {
  const validSchemas = schemas.filter(schema => schema !== null && schema !== undefined);

  if (validSchemas.length === 0) return null;
  if (validSchemas.length === 1) return validSchemas[0];

  return {
    "@context": "https://schema.org",
    "@graph": validSchemas
  };
};
