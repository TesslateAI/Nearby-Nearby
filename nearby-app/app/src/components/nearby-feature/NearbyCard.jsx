import { forwardRef } from 'react';
import { Toilet, Wifi, PawPrint, Accessibility } from 'lucide-react';
import { getDisplayableLocation } from '../../utils/getDisplayableLocation';
import { isPaidTier } from '../../utils/poiTier';
import { getOpenCloseStatusLabel, getEffectiveHoursForDate, formatDayHours } from '../../utils/hoursUtils';
import AmenityPillStrip from '../details/AmenityPillStrip';
import './NearbyCard.css';

// Helper to convert meters to miles
function formatDistance(meters) {
  if (!meters || meters === 0) return '0 mi';
  const miles = meters / 1609.34;
  if (miles < 0.1) {
    return `${Math.round(miles * 5280)} ft`;
  }
  return `${miles.toFixed(1)} mi`;
}

// Get hours for a specific day
function getHoursForDay(hours, dayName) {
  if (!hours || typeof hours !== 'object') return null;

  // Check for hours.regular structure (new format)
  if (hours.regular && typeof hours.regular === 'object') {
    let todayHours = hours.regular[dayName] || hours.regular[dayName.charAt(0).toUpperCase() + dayName.slice(1)];

    if (todayHours) {
      if (todayHours.status === 'closed' || todayHours.status === 'Closed') {
        return 'Closed';
      }

      if (todayHours.status === 'open' && todayHours.periods && todayHours.periods.length > 0) {
        const firstPeriod = todayHours.periods[0];
        if (firstPeriod.open?.time && firstPeriod.close?.time) {
          const openTime = formatTime(firstPeriod.open.time);
          const closeTime = formatTime(firstPeriod.close.time);
          return `${openTime} - ${closeTime}`;
        }
      }
    }
  }

  // Fallback to old direct format
  let todayHours = hours[dayName] || hours[dayName.charAt(0).toUpperCase() + dayName.slice(1)];
  if (todayHours === 'Closed' || todayHours === 'closed') return 'Closed';
  if (typeof todayHours === 'string') return todayHours;

  return null;
}

// Build the contextual hours status line.
// When `selectedDate` is set (future date), just show the day's range — "now" doesn't apply.
// When no selectedDate, delegates to getOpenCloseStatusLabel for dawn/dusk-aware output.
function getStatusLine(hours, selectedDate, lat, lng) {
  if (!hours || typeof hours !== 'object') return null;

  // For a user-selected future date, show the day's hours range without "now" context.
  if (selectedDate) {
    const refDate = new Date(selectedDate + 'T12:00:00');
    const { hours: dayHours } = getEffectiveHoursForDate(hours, refDate);
    if (!dayHours) return null;
    const formatted = formatDayHours(dayHours);
    if (!formatted || formatted === 'Hours not set') return null;
    return formatted;
  }

  // Real-time path — use the single source of truth.
  const { label } = getOpenCloseStatusLabel(hours, new Date(), lat, lng);
  return label || null;
}

// Format 24h time to 12h
function formatTime(time24) {
  if (!time24) return '';
  const [hourStr, minStr] = time24.split(':');
  let hour = parseInt(hourStr);
  const period = hour >= 12 ? 'PM' : 'AM';
  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minStr} ${period}`;
}

// Get current day name
function getCurrentDayName() {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
}

// Get day name from date string
function getDayNameFromDate(dateStr) {
  if (!dateStr) return getCurrentDayName();
  const date = new Date(dateStr + 'T12:00:00');
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

// Amenity icon components — Lucide icons (swapped from custom SVGs 2026-05-29)
export const RestroomIcon = () => <Toilet size={19} color="rgb(86,37,86)" strokeWidth={1.5} />;
export const WheelchairIcon = () => <Accessibility size={19} color="rgb(86,37,86)" strokeWidth={1.5} />;
export const WifiIcon = () => <Wifi size={19} color="rgb(86,37,86)" strokeWidth={1.5} />;
export const PetIcon = () => <PawPrint size={19} color="rgb(86,37,86)" strokeWidth={1.5} />;

// Treat any non-empty list whose entries aren't outright "No"-style denials as
// presence of that amenity. The admin schema uses many vocabularies
// ("Dog Friendly", "Accessible Bathrooms", "Free WiFi", etc.) and a strict
// allowlist of literals reliably misses real data.
function hasAmenity(values) {
  if (!Array.isArray(values) || values.length === 0) return false;
  const negatives = new Set(['no', 'none', 'not available', 'unavailable']);
  return values.some((v) => {
    const s = String(v || '').trim().toLowerCase();
    return s && !negatives.has(s);
  });
}

// Get amenity icons for a POI
function getAmenities(poi) {
  const amenities = [];
  if (hasAmenity(poi.public_toilets))        amenities.push({ icon: <RestroomIcon />,  title: 'Public Restrooms',     key: 'restroom' });
  // wheelchair amenity icon removed — wheelchair_accessible column dropped (Issue #45 PR2 Migration B)
  if (hasAmenity(poi.wifi_options))          amenities.push({ icon: <WifiIcon />,       title: 'WiFi Available',        key: 'wifi' });
  if (hasAmenity(poi.pet_options))           amenities.push({ icon: <PetIcon />,        title: 'Pet Friendly',          key: 'pet' });
  return amenities;
}

// Format event date
function formatEventDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

const NearbyCard = forwardRef(function NearbyCard({ poi, index, totalCount = 0, onDetailsClick, onDirectionsClick, isHighlighted, selectedDate }, ref) {
  const poiType = poi.poi_type?.toLowerCase();
  const isEvent = poiType === 'event';
  const isPark = poiType === 'park';
  const isTrail = poiType === 'trail';
  const isBusiness = poiType === 'business';

  // Get distance display
  const distance = formatDistance(poi.distance_meters);

  // Coordinates for dawn/dusk-aware status (GeoJSON order: [lng, lat])
  const _poiCoords = poi?.location?.coordinates;
  const _poiLat = Array.isArray(_poiCoords) ? _poiCoords[1] : null;
  const _poiLng = Array.isArray(_poiCoords) ? _poiCoords[0] : null;

  // Status line — "Open until 8:00 PM" / "Closed · Opens 9am" / etc. Events use their own date row.
  const statusLine = !isEvent ? getStatusLine(poi.hours, selectedDate, _poiLat, _poiLng) : null;

  // City, ST line ("Pittsboro, NC")
  const city = poi.address_city;
  const stateAbbr = poi.address_state;
  const cityLine = [city, stateAbbr].filter((s) => s && String(s).trim()).join(', ');

  // Get primary category — falls back through main_category, the joined categories array,
  // and finally the first plain `categories` entry the API returns for nearby results.
  const primaryCategory = poi.main_category?.name ||
    poi.categories?.find(c => c.is_main)?.category?.name ||
    poi.categories?.[0]?.category?.name ||
    poi.categories?.[0]?.name ||
    null;

  // Get amenities
  const amenities = getAmenities(poi);

  // Card class based on POI type
  const cardClass = `nearby-card nearby-card--${poiType} ${isHighlighted ? 'nearby-card--highlighted' : ''}`;

  // Location display gating - hide exact location for POIs that opt out
  const displayLoc = getDisplayableLocation(poi);

  // Paid-tier listing cards get the yellow quick-facts pad + amenity pills
  const paid = isPaidTier(poi);

  // Build per-type quick-facts rows (omit empty values).
  const buildQuickFacts = () => {
    const fmtList = (v) => (Array.isArray(v) && v.length > 0 ? v.join(', ') : (v || null));
    if (isBusiness) {
      return [
        { label: 'Price Range', value: poi.business?.price_range || poi.price_range || null },
        { label: 'Good For', value: fmtList(poi.ideal_for?.age_group || poi.ideal_for) },
        { label: 'Pets', value: fmtList(poi.pet_options) },
      ];
    }
    if (isEvent) {
      return [
        { label: 'Cost', value: poi.event?.cost || poi.cost || null },
        { label: 'At-A-Glance', value: poi.description_short || null },
        { label: 'Pets', value: fmtList(poi.pet_options) },
      ];
    }
    if (isTrail) {
      const rows = [
        { label: 'Cost', value: poi.trail?.cost || poi.cost || null },
        { label: 'At-A-Glance', value: poi.description_short || null },
        { label: 'Pets', value: fmtList(poi.pet_options) },
      ];
      if (poi.trail?.payphone) rows.push({ label: 'PayPhone', value: poi.trail.payphone });
      return rows;
    }
    if (isPark) {
      return [
        { label: 'Cost', value: poi.park?.cost || poi.cost || null },
        { label: 'At-A-Glance', value: poi.description_short || null },
        { label: 'Pets', value: fmtList(poi.pet_options) },
      ];
    }
    return [];
  };

  const quickFacts = paid
    ? buildQuickFacts().filter((r) => r.value != null && r.value !== '')
    : [];

  // Stop card-level navigation when interacting with inner controls (buttons, links, badge).
  const stop = (e) => e.stopPropagation();
  const handleCardKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onDetailsClick?.();
    }
  };

  return (
    <div
      className={`${cardClass} nearby-card--clickable`}
      ref={ref}
      role="link"
      tabIndex={0}
      onClick={onDetailsClick}
      onKeyDown={handleCardKey}
      aria-label={`View details for ${poi.name}`}
    >
      {/* Number badge - centered; hidden when only 1 result */}
      {totalCount > 1 && (
        <button
          type="button"
          className="nearby-card__number"
          onClick={(e) => { stop(e); onDetailsClick?.(); }}
          aria-label={`View details for ${poi.name}`}
        >
          {index + 1}
        </button>
      )}

      <div className="nearby-card__content">
        {/* Distance — .one_search_map_result_distance */}
        <div className="nearby-card__distance">
          <span className="nearby-card__distance-value">{distance}</span>
          <span className="nearby-card__distance-label"> from point of interest</span>
        </div>

        {/* POI Name */}
        <h3 className={`nearby-card__name ${isEvent && poi.event?.event_status === 'Canceled' ? 'nearby-card__name--canceled' : ''}`}>
          {poi.name}
        </h3>

        {/* City, ST — .one_search_map_single_city */}
        {cityLine && (
          <div className="nearby-card__city">{cityLine}</div>
        )}

        {/* Event status badge for non-Scheduled events */}
        {isEvent && poi.event?.event_status && poi.event.event_status !== 'Scheduled' && (
          <span className={`nearby-card__status-badge nearby-card__status-badge--${poi.event.event_status.toLowerCase().replace(/\s+/g, '-')}`}>
            {poi.event.event_status}
          </span>
        )}

        {/* Past event badge for Scheduled events whose date has passed */}
        {isEvent && poi.event?.start_datetime && new Date(poi.event.start_datetime) < new Date() && poi.event?.event_status === 'Scheduled' && (
          <span className="nearby-card__status-badge nearby-card__status-badge--past">Past</span>
        )}

        {/* Hours status line — "Open now - Until 9:00 PM" */}
        {statusLine && (
          <div className="nearby-card__hours">
            {statusLine.startsWith('Open') ? (
              <span className="nearby-card__hours--open">{statusLine}</span>
            ) : (
              <span className="nearby-card__hours--closed">{statusLine}</span>
            )}
          </div>
        )}

        {/* Primary Category */}
        {primaryCategory && (
          <div className="nearby-card__category">{primaryCategory}</div>
        )}

        {/* Event-specific: Date */}
        {isEvent && poi.event?.start_datetime && (
          <div className="nearby-card__event-date">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>{formatEventDate(poi.event.start_datetime)}</span>
          </div>
        )}

        {/* Type + Amenities Group */}
        <div className="nearby-card__type-amenities-group">
          {/* Park-specific: Park type */}
          {isPark && poi.park_type && (
            <div className="nearby-card__park-type">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span>{poi.park_type}</span>
            </div>
          )}

          {/* Trail-specific: Length and difficulty */}
          {isTrail && (
            <div className="nearby-card__trail-info">
              {poi.trail?.length_miles && (
                <span className="nearby-card__trail-length">
                  {poi.trail.length_miles} mi
                </span>
              )}
              {poi.trail?.difficulty && (
                <span className={`nearby-card__trail-difficulty nearby-card__trail-difficulty--${poi.trail.difficulty.toLowerCase()}`}>
                  {poi.trail.difficulty}
                </span>
              )}
            </div>
          )}

          {/* Amenity Icons */}
          {amenities.length > 0 && (
            <div className="nearby-card__amenities">
              {amenities.map(amenity => (
                <span
                  key={amenity.key}
                  className="nearby-card__amenity"
                  title={amenity.title}
                >
                  {amenity.icon}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Paid-tier quick facts (yellow-bordered mini-QuickFacts) */}
        {paid && quickFacts.length > 0 && (
          <div className="nearby-card__quick-facts">
            {quickFacts.map(({ label, value }) => (
              <div className="nearby-card__quick-facts-row" key={label}>
                <div className="nearby-card__quick-facts-label">{label}</div>
                <div className="nearby-card__quick-facts-value">{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Paid-tier amenity pill strip (horizontal scroll within card) */}
        {paid && (
          <div className="nearby-card__amenity-strip-wrap">
            <AmenityPillStrip poi={poi} />
          </div>
        )}
      </div>

      {/* Action Buttons — nn-templates btn_outline_teal btn_poi_button_1 */}
      <div className="nearby-card__actions" onClick={stop}>
        {!displayLoc.hideExact && (
        <button
          type="button"
          onClick={(e) => { stop(e); onDirectionsClick(poi); }}
          className="nearby-card__btn nearby-card__btn--directions"
        >
          <svg className="poi_button_icon" width="12" height="12" viewBox="0 0 13 12" xmlns="http://www.w3.org/2000/svg" style={{fillRule:'evenodd',clipRule:'evenodd',strokeLinejoin:'round',strokeMiterlimit:2}}>
            <g transform="matrix(1,0,0,1,-139.876,-2032.55)">
              <path d="M151.847,2033.51L146.797,2044.07C146.676,2044.32 146.411,2044.47 146.133,2044.45C145.854,2044.42 145.622,2044.22 145.551,2043.95L144.49,2039.93L140.387,2038.95C140.112,2038.88 139.909,2038.65 139.879,2038.37C139.85,2038.09 140.001,2037.82 140.256,2037.7L150.96,2032.62C151.215,2032.49 151.518,2032.55 151.718,2032.75C151.917,2032.95 151.969,2033.25 151.847,2033.51ZM149.833,2034.63L142.534,2038.1L145.188,2038.73C145.427,2038.79 145.615,2038.97 145.678,2039.21L146.377,2041.86L149.833,2034.63Z" />
            </g>
          </svg>
          <span className="poi_button_title">Directions</span>
        </button>
        )}
        <button
          type="button"
          onClick={(e) => { stop(e); onDetailsClick?.(); }}
          className="nearby-card__btn nearby-card__btn--details"
        >
          Details
        </button>
      </div>
    </div>
  );
});

export default NearbyCard;
