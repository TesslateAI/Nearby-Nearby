import L from 'leaflet';

// Get icon symbol for each POI type
export const getIconSymbol = (type) => {
  // Handle enum format like "POIType.BUSINESS" or just "BUSINESS"
  const typeStr = type?.includes('.') ? type.split('.')[1] : type;
  switch (typeStr?.toUpperCase()) {
    case 'BUSINESS': return '🏢';
    case 'PARK': return '🌳';
    case 'TRAIL': return '🥾';
    case 'EVENT': return '📅';
    case 'OUTDOORS': return '🌳';
    default: return '📍';
  }
};

// Color scheme for different POI types
export const getPoiColor = (type) => {
  // Handle enum format like "POIType.BUSINESS" or just "BUSINESS"
  const typeStr = type?.includes('.') ? type.split('.')[1] : type;
  switch (typeStr?.toUpperCase()) {
    case 'BUSINESS': return '#3B82F6'; // Blue
    case 'PARK': return '#10B981'; // Green
    case 'TRAIL': return '#F59E0B'; // Amber
    case 'EVENT': return '#EF4444'; // Red
    case 'OUTDOORS': return '#10B981'; // Green (same as park)
    default: return '#6B7280'; // Gray
  }
};

// Custom icon configuration for different POI types
export const createCustomIcon = (type, color) => {
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: bold;
      ">
        ${getIconSymbol(type)}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

// Legend data
export const legendData = [
  { type: 'BUSINESS', label: 'Business', color: '#3B82F6', icon: '🏢' },
  { type: 'PARK', label: 'Park', color: '#10B981', icon: '🌳' },
  { type: 'TRAIL', label: 'Trail', color: '#F59E0B', icon: '🥾' },
  { type: 'EVENT', label: 'Event', color: '#EF4444', icon: '📅' },
  { type: 'OUTDOORS', label: 'Outdoors', color: '#10B981', icon: '🌳' },
];

// Create tooltip text for POI
export const createTooltipText = (poi) => {
  const { name, poi_type, status, address_full, address_street, address_city, address_state, distance_meters } = poi;
  
  // Build address string
  const addressParts = [address_street, address_city, address_state].filter(Boolean);
  const address = address_full || addressParts.join(', ') || 'Address not available';
  
  // Handle enum format like "POIType.BUSINESS" or just "BUSINESS"
  const typeStr = poi_type?.includes('.') ? poi_type.split('.')[1] : poi_type;
  
  let tooltipText = `${name} (${typeStr}) - ${status}`;
  
  // Add distance if available
  if (distance_meters) {
    const miles = distance_meters * 0.000621371; // Convert meters to miles
    const distance = miles < 1 
      ? `${(miles * 5280).toFixed(0)}ft` 
      : `${miles.toFixed(1)}mi`;
    tooltipText += ` - ${distance}`;
  }
  
  return tooltipText;
}; 