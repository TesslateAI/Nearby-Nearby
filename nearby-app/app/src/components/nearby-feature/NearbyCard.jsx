import { forwardRef } from 'react';
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

// Amenity icon components (SVG)
const RestroomIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5z"/>
    <circle cx="8" cy="8" r="1.5"/>
    <path d="M8 11v6M6 14h4"/>
    <circle cx="16" cy="8" r="1.5"/>
    <path d="M14 11h4v2h-1.5l-.5 4h-1l-.5-4H14v-2z"/>
  </svg>
);

const WheelchairIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="4" r="2"/>
    <path d="M14 14l3 6h3"/>
    <path d="M8 14h6l-1-4-5-1v4a1 1 0 001 1z"/>
    <circle cx="10" cy="18" r="3"/>
  </svg>
);

const WifiIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12.55a11 11 0 0114 0"/>
    <path d="M8.53 16.11a6 6 0 016.95 0"/>
    <circle cx="12" cy="20" r="1"/>
  </svg>
);

const PetIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="8" cy="5" rx="1.5" ry="2"/>
    <ellipse cx="16" cy="5" rx="1.5" ry="2"/>
    <ellipse cx="5" cy="10" rx="1.5" ry="2"/>
    <ellipse cx="19" cy="10" rx="1.5" ry="2"/>
    <path d="M12 18c4 0 6-2.5 6-5.5S14 7 12 7s-6 2.5-6 5.5 2 5.5 6 5.5z"/>
  </svg>
);

// Get amenity icons for a POI
function getAmenities(poi) {
  const amenities = [];

  // Public restrooms
  if (poi.public_toilets?.length > 0 && !poi.public_toilets.includes('No')) {
    amenities.push({ icon: <RestroomIcon />, title: 'Public Restrooms', key: 'restroom' });
  }

  // Wheelchair accessible
  if (poi.wheelchair_accessible?.length > 0 &&
      (poi.wheelchair_accessible.includes('Yes') ||
       poi.wheelchair_accessible.includes('Fully') ||
       poi.wheelchair_accessible.includes('Partially'))) {
    amenities.push({ icon: <WheelchairIcon />, title: 'Wheelchair Accessible', key: 'wheelchair' });
  }

  // WiFi
  if (poi.wifi_options?.length > 0 &&
      (poi.wifi_options.includes('Free WiFi') ||
       poi.wifi_options.includes('WiFi Available') ||
       poi.wifi_options.includes('Free'))) {
    amenities.push({ icon: <WifiIcon />, title: 'Free WiFi', key: 'wifi' });
  }

  // Pet friendly
  if (poi.pet_options?.length > 0 &&
      (poi.pet_options.includes('Pet Friendly') ||
       poi.pet_options.includes('Dogs Welcome') ||
       poi.pet_options.includes('Pets Allowed'))) {
    amenities.push({ icon: <PetIcon />, title: 'Pet Friendly', key: 'pet' });
  }

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

const NearbyCard = forwardRef(function NearbyCard({ poi, index, onDetailsClick, onDirectionsClick, isHighlighted, selectedDate }, ref) {
  const poiType = poi.poi_type?.toLowerCase();
  const isEvent = poiType === 'event';
  const isPark = poiType === 'park';
  const isTrail = poiType === 'trail';
  const isBusiness = poiType === 'business';

  // Get distance display
  const distance = formatDistance(poi.distance_meters);

  // Get hours display based on selected date or today
  const dayName = selectedDate ? getDayNameFromDate(selectedDate) : getCurrentDayName();
  const hoursDisplay = !isEvent ? getHoursForDay(poi.hours, dayName) : null;

  // Get primary category
  const primaryCategory = poi.main_category?.name ||
    (poi.categories?.find(c => c.is_main)?.category?.name) ||
    null;

  // Get amenities
  const amenities = getAmenities(poi);

  // Card class based on POI type
  const cardClass = `nearby-card nearby-card--${poiType} ${isHighlighted ? 'nearby-card--highlighted' : ''}`;

  return (
    <div className={cardClass} ref={ref}>
      {/* Number badge - centered */}
      <div className="nearby-card__number">{index + 1}</div>

      <div className="nearby-card__content">
        {/* Distance - above name, purple semi-bold */}
        <div className="nearby-card__distance">
          <span className="nearby-card__distance-value">{distance}</span>
          <span className="nearby-card__distance-label">away</span>
        </div>

        {/* POI Name */}
        <h3 className="nearby-card__name">{poi.name}</h3>

        {/* Primary Category */}
        {primaryCategory && (
          <div className="nearby-card__category">{primaryCategory}</div>
        )}

        {/* Hours - for non-events */}
        {hoursDisplay && (
          <div className="nearby-card__hours">
            {hoursDisplay === 'Closed' ? (
              <span className="nearby-card__hours--closed">Closed</span>
            ) : (
              <span className="nearby-card__hours--open">{hoursDisplay}</span>
            )}
          </div>
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

      {/* Action Buttons */}
      <div className="nearby-card__actions">
        <button
          onClick={() => onDirectionsClick(poi)}
          className="nearby-card__btn nearby-card__btn--directions"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
          Directions
        </button>
        <button
          onClick={onDetailsClick}
          className="nearby-card__btn nearby-card__btn--details"
        >
          Details
        </button>
      </div>
    </div>
  );
});

export default NearbyCard;
