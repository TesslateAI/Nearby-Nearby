import { getHeroImageUrl } from '../../utils/poiTier';
import './HeroBanner.css';

/**
 * HeroBanner — full-width hero image for POI detail pages.
 *
 * Returns null when no image is available (falls back to the existing
 * .page_header_poi_style_1 block the caller renders below).
 *
 * Note: hero is image-only; the title, category, and location continue
 * to render in the existing intro block, so getDisplayableLocation gating
 * is enforced where it already lives. No location info leaks via the hero.
 */
export default function HeroBanner({ poi }) {
  const url = getHeroImageUrl(poi);
  if (!url) return null;

  return (
    <header
      className="poi_hero_banner"
      role="img"
      aria-label={poi?.name ? `${poi.name} hero image` : 'POI hero image'}
      style={{ backgroundImage: `url("${url}")` }}
    >
      <div className="poi_hero_banner_overlay" aria-hidden="true" />
    </header>
  );
}
