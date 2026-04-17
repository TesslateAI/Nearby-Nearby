import { forwardRef } from 'react';
import { getDisplayableLocation } from '../../utils/getDisplayableLocation';
import { isPaidTier } from '../../utils/poiTier';
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

// Build the template-style hours line: "Open now - Until 9:00 PM" / "Closed - Opens 8:00 AM" / "Closed today"
// When `selectedDate` is set, we don't try to compute "now" — just show the day's hours.
function getStatusLine(hours, selectedDate) {
  if (!hours || typeof hours !== 'object') return null;
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const refDate = selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date();
  const dayName = days[refDate.getDay()];
  const reg = hours.regular && typeof hours.regular === 'object' ? hours.regular : null;
  if (!reg) return getHoursForDay(hours, dayName);

  const today = reg[dayName] || reg[dayName.charAt(0).toUpperCase() + dayName.slice(1)];
  if (!today) return null;
  if (today.status === 'closed' || today.status === 'Closed') return 'Closed today';

  const periods = Array.isArray(today.periods) ? today.periods : [];
  if (today.status !== 'open' || periods.length === 0) return null;

  // For a future date, just show the first period range — "now" doesn't apply.
  if (selectedDate) {
    const p = periods[0];
    if (p.open?.time && p.close?.time) return `${formatTime(p.open.time)} - ${formatTime(p.close.time)}`;
    return null;
  }

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const toMins = (t) => {
    if (!t) return null;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  for (const p of periods) {
    const openM = toMins(p.open?.time);
    const closeM = toMins(p.close?.time);
    if (openM == null || closeM == null) continue;
    if (nowMins >= openM && nowMins < closeM) {
      return `Open now - Until ${formatTime(p.close.time)}`;
    }
  }
  // Not open right now — surface next open slot today, otherwise generic "Closed".
  for (const p of periods) {
    const openM = toMins(p.open?.time);
    if (openM != null && nowMins < openM) {
      return `Closed - Opens ${formatTime(p.open.time)}`;
    }
  }
  return 'Closed';
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

// Amenity icon components — nn-templates custom filled SVGs
export const RestroomIcon = () => (
  <svg width="19" height="19" viewBox="0 0 15 15" xmlns="http://www.w3.org/2000/svg" style={{fillRule:'evenodd',clipRule:'evenodd',strokeLinejoin:'round',strokeMiterlimit:2}}>
    <g transform="matrix(0.0194034,0,0,0.0194034,-4.14708,-4.14471)">
      <path d="M824.29,409.92C770.524,409.92 726.837,365.858 726.837,311.764C726.837,257.623 770.525,213.608 824.29,213.608C878.055,213.608 921.743,257.67 921.743,311.764C921.743,365.905 878.055,409.92 824.29,409.92ZM824.29,249.61C790.446,249.61 762.837,277.454 762.837,311.766C762.837,346.078 790.446,373.922 824.29,373.922C858.134,373.922 885.743,346.078 885.743,311.766C885.743,277.454 858.134,249.61 824.29,249.61ZM898.587,975.61L750.037,975.61C740.1,975.61 732.037,967.548 732.037,957.61L732.037,760.55L680.334,760.55C670.397,760.55 662.334,752.487 662.334,742.55L662.334,525C662.334,477.844 700.725,439.453 747.881,439.453L900.641,439.453C947.797,439.453 986.188,477.844 986.188,525L986.188,742.55C986.188,752.487 978.126,760.55 968.188,760.55L916.485,760.55L916.485,957.61C916.485,967.547 908.423,975.61 898.485,975.61L898.587,975.61ZM768.037,939.61L880.587,939.61L880.587,742.55C880.587,732.612 888.65,724.55 898.587,724.55L950.29,724.55L950.29,525C950.29,497.625 928.071,475.453 900.743,475.453L747.983,475.453C720.608,475.453 698.436,497.672 698.436,525L698.436,724.55L750.139,724.55C760.076,724.55 768.139,732.612 768.139,742.55L768.139,939.61L768.037,939.61ZM389.567,409.92C335.801,409.92 292.114,365.858 292.114,311.764C292.114,257.623 335.802,213.608 389.567,213.608C443.332,213.608 487.02,257.67 487.02,311.764C487.02,365.905 443.332,409.92 389.567,409.92ZM389.567,249.61C355.723,249.61 328.114,277.454 328.114,311.766C328.114,346.078 355.723,373.922 389.567,373.922C423.411,373.922 451.02,346.078 451.02,311.766C451.02,277.454 423.411,249.61 389.567,249.61ZM429.645,986.67L334.583,986.67C325.114,986.67 317.192,979.357 316.583,969.889L302.802,760.729L231.646,760.729C226.115,760.729 220.865,758.198 217.49,753.791C214.115,749.338 212.943,743.713 214.256,738.322L269.709,520.772C284.1,469.069 315.084,439.631 354.787,439.631L424.256,439.631C466.865,439.631 495.412,466.865 509.334,520.772L564.787,738.322C566.24,743.713 565.021,749.478 561.552,753.791C558.083,758.104 552.927,760.729 547.396,760.729L461.334,760.729L447.553,969.889C446.944,979.358 439.022,986.67 429.553,986.67L429.645,986.67ZM351.411,950.67L412.864,950.67L426.645,741.51C427.254,732.041 435.176,724.729 444.645,724.729L524.333,724.729L474.552,529.589C462.177,481.73 441.318,475.448 424.396,475.448L354.927,475.448C323.239,475.448 309.224,513.51 304.63,529.917L254.942,724.677L319.723,724.677C329.192,724.677 337.114,731.989 337.723,741.458L351.504,950.618L351.411,950.67Z" style={{fill:'rgb(86,37,86)',fillRule:'nonzero'}} />
    </g>
  </svg>
);

export const WheelchairIcon = () => (
  <svg width="19" height="19" viewBox="0 0 16 15" xmlns="http://www.w3.org/2000/svg" style={{fillRule:'evenodd',clipRule:'evenodd',strokeLinejoin:'round',strokeMiterlimit:2}}>
    <g transform="matrix(0.0181731,0,0,0.0181731,-2.99945,-3.67413)">
      <path d="M1012.5,839.684C1025.06,839.684 1035.33,849.966 1035.33,862.52C1035.33,875.074 1025.06,885.346 1012.5,885.346L936.755,885.346C928.744,885.346 921.21,880.964 917.089,874.098L815.845,704.978C813.195,700.551 808.415,697.841 803.255,697.841L599.995,697.841C587.441,697.841 577.169,687.569 577.169,675.015L577.169,450.015C577.169,437.461 587.441,427.189 599.995,427.189L862.495,427.189C875.049,427.189 885.321,437.461 885.321,450.015C885.321,462.569 875.049,472.841 862.495,472.841L637.495,472.841C629.391,472.841 622.821,479.411 622.821,487.515L622.821,637.885C622.821,645.989 629.391,652.559 637.495,652.559L824.343,652.559C832.388,652.831 839.777,656.908 843.918,663.81L945.168,832.55C947.82,836.969 952.596,839.674 957.75,839.674L1012.5,839.684ZM418.378,525.389C417.783,525.426 417.188,525.465 416.594,525.507C416.589,525.334 416.586,525.158 416.586,524.981C416.586,524.225 417.285,524.499 418.378,525.389ZM431.26,510.316C309.541,510.316 210.326,609.526 210.326,731.24C210.326,852.959 309.557,952.174 431.26,952.174C520.856,952.174 600.803,898.723 634.952,816.364C639.751,804.708 653.272,799.279 664.928,804.078C676.584,808.878 681.99,822.407 677.191,834.063C636.324,933.918 539.653,998.221 431.635,998.221C284.475,998.221 165.049,878.795 165.049,731.635C165.049,584.475 284.475,465.049 431.635,465.049C438.484,465.049 445.34,465.416 451.828,465.777C464.287,466.456 473.781,477.352 472.875,489.811L472.858,490.076C472.196,502.22 462.311,511.856 449.832,511.188L449.294,511.149C443.539,510.376 437.401,510.316 431.26,510.316ZM660.326,262.5C660.326,295.831 633.331,322.826 600,322.826C566.669,322.826 539.674,295.831 539.674,262.5C539.674,229.169 566.669,202.174 600,202.174C633.331,202.174 660.326,229.169 660.326,262.5Z" style={{fill:'rgb(86,37,86)'}} />
    </g>
  </svg>
);

export const WifiIcon = () => (
  <svg width="19" height="19" viewBox="0 0 20 15" xmlns="http://www.w3.org/2000/svg" style={{fillRule:'evenodd',clipRule:'evenodd',strokeLinejoin:'round',strokeMiterlimit:2}}>
    <g transform="matrix(0.0183176,0,0,0.0183176,-1.03009,-3.69054)">
      <path d="M99.348,459.02C75.999,482.369 40.525,446.904 63.874,423.555C359.98,127.449 840.057,127.448 1136.13,423.554C1159.48,446.904 1124.02,482.369 1100.67,459.02C824.144,182.495 375.852,182.495 99.348,459.02ZM557.25,980.846C533.67,957.226 533.65,918.95 557.268,895.361C595.227,857.402 660.422,884.392 660.422,938.068C660.422,991.343 595.55,1018.92 557.316,980.734L557.25,980.846ZM421.053,780.769C397.703,804.119 362.235,768.653 385.584,745.304C504,626.888 695.968,626.888 814.383,745.304C837.733,768.653 802.268,804.118 778.919,780.769C680.109,681.91 519.867,681.909 421.053,780.769ZM260.233,619.899C236.88,643.253 201.374,607.79 224.725,584.435C432.003,377.198 768.029,377.197 975.265,584.434C998.615,607.783 963.15,643.248 939.801,619.898C752.147,432.214 447.867,432.214 260.233,619.899Z" style={{fill:'rgb(86,37,86)'}} />
    </g>
  </svg>
);

export const PetIcon = () => (
  <svg width="19" height="19" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" style={{fillRule:'evenodd',clipRule:'evenodd',strokeLinejoin:'round',strokeMiterlimit:2}}>
    <g transform="matrix(0.0114137,0,0,0.0113986,-0.847809,-0.846194)">
      <path d="M601.917,529.969C633.438,529.969 665.369,544.113 697.74,571.206C744.67,610.064 784.929,669.036 815.061,721.835C868.594,815.534 909.553,923.952 909.553,974.29C909.553,1037.61 878.104,1082.61 818.702,1104.49C766.329,1123.77 696.122,1125.32 628.733,1125.69L574.36,1125.69C506.97,1125.33 436.763,1123.77 384.403,1104.5C324.988,1082.61 293.539,1037.61 293.539,974.29C293.539,923.952 334.498,815.534 388.031,721.835C418.162,669.036 458.422,610.064 505.352,571.206C537.723,544.113 569.654,529.969 601.175,529.969L601.917,529.969ZM371.577,905.676C371.555,905.738 371.534,905.799 371.513,905.861L367.585,899.755L366.904,901.219L370.928,907.575C370.727,908.164 370.529,908.751 370.332,909.336C369.177,908.94 368.156,908.191 367.43,907.17C366.322,905.613 366.036,903.615 366.663,901.809C355.068,935.221 349.108,961.482 349.108,974.47C349.108,994.982 352.863,1011.78 363.251,1025.5C373.344,1038.82 390.07,1049.65 418.07,1056.99C450.636,1065.52 500.12,1069.81 574.589,1070.15L628.503,1070.15C702.972,1069.81 752.456,1065.52 785.022,1056.99C813.022,1049.65 829.748,1038.82 839.841,1025.5C850.229,1011.78 853.984,994.982 853.984,974.47C853.984,961.482 848.024,935.221 836.429,901.809L836.033,902.366L835.996,901.522L836.188,901.219L835.506,899.756L835.207,899.182C834.337,897.721 833.589,896.16 832.98,894.508C806.795,822.857 767.375,746.261 727.737,689.431C696.712,645.059 665.361,613.25 639.133,597.78C625.596,589.848 612.908,585.987 601.928,585.891L601.607,585.875L601.195,585.866L599.086,585.905C588.594,586.435 576.661,590.337 563.959,597.78C537.731,613.25 506.38,645.059 475.355,689.431C435.717,746.261 396.297,822.857 370.096,894.552C369.502,896.163 368.754,897.722 367.885,899.182L371.577,905.676Z" style={{fill:'rgb(86,37,86)'}} />
    </g>
  </svg>
);

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
  if (hasAmenity(poi.wheelchair_accessible)) amenities.push({ icon: <WheelchairIcon />, title: 'Wheelchair Accessible', key: 'wheelchair' });
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

  // Status line — "Open now - Until 9:00 PM" / "Closed today" / etc. Events use their own date row.
  const statusLine = !isEvent ? getStatusLine(poi.hours, selectedDate) : null;

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
