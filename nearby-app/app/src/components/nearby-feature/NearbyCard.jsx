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

// Amenity icon components — nn-templates custom filled SVGs
const RestroomIcon = () => (
  <svg width="19" height="19" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" style={{fillRule:'evenodd',clipRule:'evenodd',strokeLinejoin:'round',strokeMiterlimit:2}}>
    <g transform="matrix(0.0107514,0,0,0.0107514,-0.628472,-0.311391)">
      <path d="M600,28.963C613.972,28.963 624.951,39.941 624.951,53.914L624.951,1120.14C624.951,1134.12 613.972,1145.1 600,1145.1C586.028,1145.1 575.049,1134.12 575.049,1120.14L575.049,53.914C575.049,39.941 586.028,28.963 600,28.963ZM1111.63,705.722L1095.33,705.722L1101.98,745.287C1105.31,763.619 1100.32,781.952 1088.26,796.126C1076.58,810.284 1059.09,818.222 1040.75,818.222L1034.95,818.221L1034.95,1018.28C1034.95,1032.25 1023.97,1043.23 1010,1043.23L860.001,1043.23C853.573,1043.23 848.047,1040.46 843.103,1036.02C838.028,1031.45 835.425,1024.88 835.425,1018.28L835.424,818.222L829.626,818.222C810.904,818.222 793.813,810.274 781.748,796.129C770.12,782.009 765.099,763.669 768.006,745.396L774.671,705.722L758.376,705.722C738.838,705.722 720.961,697.001 708.897,681.631C696.824,666.623 693.022,647.037 697.606,628.285L739.614,459.881C755.32,398.63 810.304,355.826 873.126,355.826L997.626,355.826C1060.46,355.826 1115.06,398.625 1130.77,459.881L1172.78,628.316C1177.34,647.064 1173.19,666.208 1161.13,681.597C1149.07,696.989 1131.18,705.722 1111.63,705.722ZM859.965,768.321C866.32,768.321 872.39,771.888 877.279,776.287C882.354,780.855 884.956,787.424 884.956,794.021L884.956,994.081L985.055,994.082L985.055,794.021C985.055,780.049 996.037,769.071 1010.01,769.071L1040.75,769.071C1044.49,769.071 1047.69,767.262 1050.28,764.48C1052.49,761.396 1053.49,757.837 1052.99,754.026L1022.65,572.736C1020.16,558.791 1029.57,546.286 1043.02,543.796C1057.03,541.294 1070.01,550.855 1072,564.252L1087.26,655.821L1112,655.821C1116.05,655.821 1119.58,654.053 1122.13,651.057C1124.4,647.952 1125,643.818 1123.97,639.456L1081.99,471.164C1072.19,432.296 1037.17,404.977 997.256,404.977L872.756,404.977C832.471,404.977 797.801,431.962 787.636,471.195L745.634,639.571C744.642,643.294 745.671,647.294 747.871,650.298C750.426,653.299 753.962,655.071 758.008,655.071L782.753,655.071L798.024,563.447C800.514,550 813.044,540.555 826.99,543.046C840.448,545.538 849.845,558.567 847.371,571.92L816.996,753.42L816.961,753.612C816.231,757.262 817.161,760.924 819.594,763.6L819.966,764.051C822.154,766.969 825.611,768.321 829.258,768.321L859.965,768.321ZM935.056,330.712C879.883,330.712 835.105,285.934 835.105,230.761C835.105,175.589 879.883,130.811 935.056,130.811C990.228,130.811 1035.01,175.589 1035.01,230.761C1035.01,285.934 990.228,330.712 935.056,330.712ZM935.056,180.712C907.362,180.712 885.006,203.067 885.006,230.761C885.006,258.455 907.362,280.811 935.056,280.811C962.75,280.811 985.105,258.455 985.105,230.761C985.105,203.067 962.75,180.712 935.056,180.712ZM270.916,330.712C215.743,330.712 170.965,285.934 170.965,230.761C170.965,175.589 215.743,130.811 270.916,130.811C326.088,130.811 370.866,175.589 370.866,230.761C370.866,285.934 326.088,330.712 270.916,330.712ZM270.916,180.712C243.222,180.712 220.866,203.067 220.866,230.761C220.866,258.455 243.222,280.811 270.916,280.811C298.609,280.811 320.965,258.455 320.965,230.761C320.965,203.067 298.609,180.712 270.916,180.712ZM345.906,355.831C421.71,355.831 483.356,417.497 483.356,493.291L483.356,643.291C483.356,677.847 455.462,705.742 420.906,705.742L405.457,705.742L374.197,987.821C370.865,1019.48 344.229,1043.25 312.156,1043.25L229.281,1043.25C197.623,1043.25 170.571,1019.48 167.243,987.854L135.98,705.742L120.906,705.742C86.349,705.742 58.455,677.847 58.455,643.291L58.455,493.291C58.455,417.487 120.122,355.831 195.916,355.831L345.906,355.831ZM312.162,993.346C318.729,993.346 323.997,988.253 324.758,981.94L358.465,679.327L358.465,568.291C358.465,554.319 369.443,543.341 383.416,543.341C397.388,543.341 408.366,554.319 408.366,568.291L408.366,655.841L420.913,655.841C427.939,655.841 433.463,650.319 433.465,643.293L433.465,493.296C433.465,444.969 394.243,405.747 345.916,405.747L195.916,405.747C147.588,405.747 108.366,444.969 108.366,493.296L108.366,643.296C108.366,650.324 113.889,655.846 120.917,655.846L133.465,655.846L133.465,568.296C133.465,554.289 144.033,543.346 158.041,543.346C172.013,543.346 182.991,554.324 182.991,568.296L182.991,679.703L216.698,982.315C217.455,988.597 222.757,993.346 229.292,993.346L245.965,993.346L245.965,755.806C245.965,741.834 256.943,730.856 270.916,730.856C284.888,730.856 295.866,741.834 295.866,755.806L295.866,993.346L312.162,993.346Z" style={{fill:'rgb(86,37,86)'}} />
    </g>
  </svg>
);

const WheelchairIcon = () => (
  <svg width="19" height="19" viewBox="0 0 16 15" xmlns="http://www.w3.org/2000/svg" style={{fillRule:'evenodd',clipRule:'evenodd',strokeLinejoin:'round',strokeMiterlimit:2}}>
    <g transform="matrix(0.0181731,0,0,0.0181731,-2.99945,-3.67413)">
      <path d="M1012.5,839.684C1025.06,839.684 1035.33,849.966 1035.33,862.52C1035.33,875.074 1025.06,885.346 1012.5,885.346L936.755,885.346C928.744,885.346 921.21,880.964 917.089,874.098L815.845,704.978C813.195,700.551 808.415,697.841 803.255,697.841L599.995,697.841C587.441,697.841 577.169,687.569 577.169,675.015L577.169,450.015C577.169,437.461 587.441,427.189 599.995,427.189L862.495,427.189C875.049,427.189 885.321,437.461 885.321,450.015C885.321,462.569 875.049,472.841 862.495,472.841L637.495,472.841C629.391,472.841 622.821,479.411 622.821,487.515L622.821,637.885C622.821,645.989 629.391,652.559 637.495,652.559L824.343,652.559C832.388,652.831 839.777,656.908 843.918,663.81L945.168,832.55C947.82,836.969 952.596,839.674 957.75,839.674L1012.5,839.684ZM418.378,525.389C417.783,525.426 417.188,525.465 416.594,525.507C416.589,525.334 416.586,525.158 416.586,524.981C416.586,524.225 417.285,524.499 418.378,525.389ZM431.26,510.316C309.541,510.316 210.326,609.526 210.326,731.24C210.326,852.959 309.557,952.174 431.26,952.174C520.856,952.174 600.803,898.723 634.952,816.364C639.751,804.708 653.272,799.279 664.928,804.078C676.584,808.878 681.99,822.407 677.191,834.063C636.324,933.918 539.653,998.221 431.635,998.221C284.475,998.221 165.049,878.795 165.049,731.635C165.049,584.475 284.475,465.049 431.635,465.049C438.484,465.049 445.34,465.416 451.828,465.777C464.287,466.456 473.781,477.352 472.875,489.811L472.858,490.076C472.196,502.22 462.311,511.856 449.832,511.188L449.294,511.149C443.539,510.376 437.401,510.316 431.26,510.316ZM660.326,262.5C660.326,295.831 633.331,322.826 600,322.826C566.669,322.826 539.674,295.831 539.674,262.5C539.674,229.169 566.669,202.174 600,202.174C633.331,202.174 660.326,229.169 660.326,262.5Z" style={{fill:'rgb(86,37,86)'}} />
    </g>
  </svg>
);

const WifiIcon = () => (
  <svg width="19" height="19" viewBox="0 0 20 15" xmlns="http://www.w3.org/2000/svg" style={{fillRule:'evenodd',clipRule:'evenodd',strokeLinejoin:'round',strokeMiterlimit:2}}>
    <g transform="matrix(0.0183176,0,0,0.0183176,-1.03009,-3.69054)">
      <path d="M99.348,459.02C75.999,482.369 40.525,446.904 63.874,423.555C359.98,127.449 840.057,127.448 1136.13,423.554C1159.48,446.904 1124.02,482.369 1100.67,459.02C824.144,182.495 375.852,182.495 99.348,459.02ZM557.25,980.846C533.67,957.226 533.65,918.95 557.268,895.361C595.227,857.402 660.422,884.392 660.422,938.068C660.422,991.343 595.55,1018.92 557.316,980.734L557.25,980.846ZM421.053,780.769C397.703,804.119 362.235,768.653 385.584,745.304C504,626.888 695.968,626.888 814.383,745.304C837.733,768.653 802.268,804.118 778.919,780.769C680.109,681.91 519.867,681.909 421.053,780.769ZM260.233,619.899C236.88,643.253 201.374,607.79 224.725,584.435C432.003,377.198 768.029,377.197 975.265,584.434C998.615,607.783 963.15,643.248 939.801,619.898C752.147,432.214 447.867,432.214 260.233,619.899Z" style={{fill:'rgb(86,37,86)'}} />
    </g>
  </svg>
);

const PetIcon = () => (
  <svg width="19" height="19" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" style={{fillRule:'evenodd',clipRule:'evenodd',strokeLinejoin:'round',strokeMiterlimit:2}}>
    <g transform="matrix(0.0114137,0,0,0.0113986,-0.847809,-0.846194)">
      <path d="M601.917,529.969C633.438,529.969 665.369,544.113 697.74,571.206C744.67,610.064 784.929,669.036 815.061,721.835C868.594,815.534 909.553,923.952 909.553,974.29C909.553,1037.61 878.104,1082.61 818.702,1104.49C766.329,1123.77 696.122,1125.32 628.733,1125.69L574.36,1125.69C506.97,1125.33 436.763,1123.77 384.403,1104.5C324.988,1082.61 293.539,1037.61 293.539,974.29C293.539,923.952 334.498,815.534 388.031,721.835C418.162,669.036 458.422,610.064 505.352,571.206C537.723,544.113 569.654,529.969 601.175,529.969L601.917,529.969ZM371.577,905.676C371.555,905.738 371.534,905.799 371.513,905.861L367.585,899.755L366.904,901.219L370.928,907.575C370.727,908.164 370.529,908.751 370.332,909.336C369.177,908.94 368.156,908.191 367.43,907.17C366.322,905.613 366.036,903.615 366.663,901.809C355.068,935.221 349.108,961.482 349.108,974.47C349.108,994.982 352.863,1011.78 363.251,1025.5C373.344,1038.82 390.07,1049.65 418.07,1056.99C450.636,1065.52 500.12,1069.81 574.589,1070.15L628.503,1070.15C702.972,1069.81 752.456,1065.52 785.022,1056.99C813.022,1049.65 829.748,1038.82 839.841,1025.5C850.229,1011.78 853.984,994.982 853.984,974.47C853.984,961.482 848.024,935.221 836.429,901.809L836.033,902.366L835.996,901.522L836.188,901.219L835.506,899.756L835.207,899.182C834.337,897.721 833.589,896.16 832.98,894.508C806.795,822.857 767.375,746.261 727.737,689.431C696.712,645.059 665.361,613.25 639.133,597.78C625.596,589.848 612.908,585.987 601.928,585.891L601.607,585.875L601.195,585.866L599.086,585.905C588.594,586.435 576.661,590.337 563.959,597.78C537.731,613.25 506.38,645.059 475.355,689.431C435.717,746.261 396.297,822.857 370.096,894.552C369.502,896.163 368.754,897.722 367.885,899.182L371.577,905.676Z" style={{fill:'rgb(86,37,86)'}} />
    </g>
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
        {/* Distance — .one_search_map_result_distance */}
        <div className="nearby-card__distance">
          <span className="nearby-card__distance-value">{distance}</span>
          <span className="nearby-card__distance-label"> from point of interest</span>
        </div>

        {/* POI Name */}
        <h3 className={`nearby-card__name ${isEvent && poi.event?.event_status === 'Canceled' ? 'nearby-card__name--canceled' : ''}`}>
          {poi.name}
        </h3>

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
      </div>

      {/* Action Buttons — nn-templates btn_outline_teal btn_poi_button_1 */}
      <div className="nearby-card__actions">
        <button
          type="button"
          onClick={() => onDirectionsClick(poi)}
          className="nearby-card__btn nearby-card__btn--directions"
        >
          <svg className="poi_button_icon" width="12" height="12" viewBox="0 0 13 12" xmlns="http://www.w3.org/2000/svg" style={{fillRule:'evenodd',clipRule:'evenodd',strokeLinejoin:'round',strokeMiterlimit:2}}>
            <g transform="matrix(1,0,0,1,-139.876,-2032.55)">
              <path d="M151.847,2033.51L146.797,2044.07C146.676,2044.32 146.411,2044.47 146.133,2044.45C145.854,2044.42 145.622,2044.22 145.551,2043.95L144.49,2039.93L140.387,2038.95C140.112,2038.88 139.909,2038.65 139.879,2038.37C139.85,2038.09 140.001,2037.82 140.256,2037.7L150.96,2032.62C151.215,2032.49 151.518,2032.55 151.718,2032.75C151.917,2032.95 151.969,2033.25 151.847,2033.51ZM149.833,2034.63L142.534,2038.1L145.188,2038.73C145.427,2038.79 145.615,2038.97 145.678,2039.21L146.377,2041.86L149.833,2034.63Z" />
            </g>
          </svg>
          <span className="poi_button_title">Directions</span>
        </button>
        <button
          type="button"
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
