/**
 * POI tier and display utilities.
 *
 * PAID tier = listing_type ∈ {paid, paid_founding, community_comped} OR is_sponsor=true.
 * Everything else is FREE.
 */

const PAID_LISTING_TYPES = ['paid', 'paid_founding', 'community_comped'];

export function isPaidTier(poi) {
  if (!poi) return false;
  return poi.is_sponsor === true || PAID_LISTING_TYPES.includes(poi.listing_type);
}

/**
 * Produce the sponsor chip label per plan §2.2.
 *   platform → "Platform Sponsor"
 *   state    → "State Sponsor"
 *   county   → "{county} Sponsor"  (strips " County" suffix if present)
 *   town     → "{city} Sponsor"
 *   null/unknown → "Sponsor"
 */
export function sponsorLabel(poi) {
  if (!poi || !poi.is_sponsor) return null;
  const level = poi.sponsor_level;
  if (level === 'platform') return 'Platform Sponsor';
  if (level === 'state') return 'State Sponsor';
  if (level === 'county') {
    const county = (poi.address_county || '').replace(/\s+County$/i, '').trim();
    return county ? `${county} Sponsor` : 'Sponsor';
  }
  if (level === 'town') {
    const city = (poi.address_city || '').trim();
    return city ? `${city} Sponsor` : 'Sponsor';
  }
  return 'Sponsor';
}

/**
 * Fallback chain for detail-page hero image:
 *   1. First poi.images entry with image_size_variant === 'original'
 *   2. poi.featured_image
 *   3. poi.gallery_photos[0]
 *   4. null
 */
export function getHeroImageUrl(poi) {
  if (!poi) return null;
  if (Array.isArray(poi.images) && poi.images.length > 0) {
    const original = poi.images.find((img) => img && img.image_size_variant === 'original');
    if (original) {
      const url = original.url || original.storage_url || original.src;
      if (url) return url;
    }
  }
  if (poi.featured_image) {
    if (typeof poi.featured_image === 'string') return poi.featured_image;
    return poi.featured_image.url || poi.featured_image.storage_url || null;
  }
  if (Array.isArray(poi.gallery_photos) && poi.gallery_photos.length > 0) {
    const first = poi.gallery_photos[0];
    if (typeof first === 'string') return first;
    if (first) return first.url || first.storage_url || null;
  }
  return null;
}
