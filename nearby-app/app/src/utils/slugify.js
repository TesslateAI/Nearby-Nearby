/**
 * Generate URL-friendly slug from POI name and city
 * @param {string} name - POI name
 * @param {string} city - City name (optional)
 * @returns {string} URL-friendly slug
 */
export function generateSlug(name, city = '') {
  let slug = name.toLowerCase();

  // Add city if provided
  if (city) {
    slug = `${slug} ${city}`;
  }

  // Remove special characters and replace spaces with hyphens
  slug = slug
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/[\s_]+/g, '-')   // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens

  return slug;
}

/**
 * Get SEO-friendly URL for a POI
 * @param {object} poi - POI object with id, name, poi_type, address_city, slug
 * @returns {string} SEO-friendly URL
 */
export function getPOIUrl(poi) {
  // If POI has a slug, use it
  if (poi.slug) {
    const typePrefix = getTypePrefix(poi.poi_type);
    return `/${typePrefix}/${poi.slug}`;
  }

  // Fallback to UUID
  return `/poi/${poi.id}`;
}

/**
 * Get URL prefix based on POI type
 * @param {string} poiType - POI type (BUSINESS, PARK, TRAIL, EVENT, etc.)
 * @returns {string} URL prefix
 */
export function getTypePrefix(poiType) {
  const typePrefixes = {
    'BUSINESS': 'places',
    'SERVICES': 'places',
    'PARK': 'parks',
    'TRAIL': 'trails',
    'EVENT': 'events',
    'YOUTH_ACTIVITIES': 'places',
    'JOBS': 'places',
    'VOLUNTEER_OPPORTUNITIES': 'places',
    'DISASTER_HUBS': 'places'
  };

  return typePrefixes[poiType] || 'places';
}

/**
 * Truncate text to a specified length for meta descriptions
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 155) {
  if (!text || text.length <= maxLength) return text;

  // Try to cut at a word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Check if a string is a valid UUID
 * @param {string} str - String to check
 * @returns {boolean} True if valid UUID
 */
export function isUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
