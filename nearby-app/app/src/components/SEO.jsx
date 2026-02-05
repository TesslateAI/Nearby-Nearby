import PropTypes from 'prop-types';

/**
 * SEO Component for dynamic meta tags
 * Uses React 19's native document metadata support
 * Optimized for Facebook Open Graph and Twitter Cards
 */
function SEO({
  title,
  description,
  image,
  url,
  type = 'website',
  siteName = 'NearbyNearby',
  twitterCard = 'summary_large_image'
}) {
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const defaultDescription = 'Discover amazing places, events, trails, and businesses near you with NearbyNearby.';
  const metaDescription = description || defaultDescription;
  const defaultImage = 'https://nearbynearby.com/Logo.png';
  const metaImage = image || defaultImage;
  const canonicalUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  // React 19 natively hoists these to <head>
  return (
    <>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
    </>
  );
}

SEO.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  image: PropTypes.string,
  url: PropTypes.string,
  type: PropTypes.string,
  siteName: PropTypes.string,
  twitterCard: PropTypes.string,
};

export default SEO;
