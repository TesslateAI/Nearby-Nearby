import { Star } from 'lucide-react';
import { sponsorLabel } from '../../utils/poiTier';
import './SponsorBadge.css';

/**
 * SponsorBadge — small gold-star chip shown in the POI header intro block
 * when poi.is_sponsor is true. Label formula lives in utils/poiTier.js.
 */
export default function SponsorBadge({ poi }) {
  if (!poi || !poi.is_sponsor) return null;
  const label = sponsorLabel(poi);
  if (!label) return null;
  return (
    <div className="poi_sponsor_chip" aria-label={label}>
      <Star className="poi_sponsor_chip_icon" size={18} strokeWidth={2} fill="currentColor" />
      <span className="poi_sponsor_chip_text">{label}</span>
    </div>
  );
}
