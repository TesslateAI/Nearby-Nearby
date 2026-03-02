import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Map.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create a yellow/gold circle for current POI
const createCurrentIcon = () => {
  const svg = `<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="12" fill="#F4C542" stroke="white" stroke-width="3"/>
    <circle cx="16" cy="16" r="4" fill="white"/>
  </svg>`;
  const svgUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);

  return new L.Icon({
    iconUrl: svgUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

// Create numbered purple marker for nearby POIs
const createNumberedIcon = (number, isHighlighted = false) => {
  const bgColor = isHighlighted ? '#328170' : '#562556';
  const size = isHighlighted ? 40 : 32;
  const fontSize = isHighlighted ? 16 : 14;

  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${bgColor}" stroke="white" stroke-width="3"/>
    <text x="${size/2}" y="${size/2 + fontSize/3}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${fontSize}" font-weight="bold" fill="white">${number}</text>
  </svg>`;
  const svgUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);

  return new L.Icon({
    iconUrl: svgUrl,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2]
  });
};

// Component to auto-fit bounds so all markers are visible
function AutoFitBounds({ bounds, radiusMiles }) {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.length > 0 && map) {
      // Calculate maxZoom based on radius (for NearbySection) or default 15 (for Explore)
      let maxZoom = 15;
      if (radiusMiles) {
        if (radiusMiles <= 1) maxZoom = 18;
        else if (radiusMiles <= 3) maxZoom = 17;
        else if (radiusMiles <= 5) maxZoom = 16;
        else if (radiusMiles <= 10) maxZoom = 15;
        else maxZoom = 14;
      }

      try {
        if (bounds.length === 1) {
          // Single marker — center on it at a reasonable zoom
          map.setView(bounds[0], Math.min(maxZoom, 14));
        } else {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom });
        }
      } catch (e) {
        console.warn('Map fitBounds failed:', e.message);
      }
    }
  }, [bounds, radiusMiles, map]);

  return null;
}

function Map({ currentPOI, nearbyPOIs = [], radiusMiles, onMarkerClick, highlightedId }) {
  if (!currentPOI || !currentPOI.location) {
    return (
      <div className="map-placeholder">
        <p>No location data available</p>
      </div>
    );
  }

  const currentCoords = [
    currentPOI.location.coordinates[1], // latitude
    currentPOI.location.coordinates[0]  // longitude
  ];

  // Calculate bounds to fit all markers
  const allCoords = [currentCoords];
  nearbyPOIs.forEach(poi => {
    if (poi.location) {
      allCoords.push([
        poi.location.coordinates[1],
        poi.location.coordinates[0]
      ]);
    }
  });

  return (
    <div className="map-container">
      <MapContainer
        key={`${currentPOI?.id}-${nearbyPOIs.length}-${nearbyPOIs[nearbyPOIs.length - 1]?.id || ''}`}
        center={currentCoords}
        zoom={14}
        className="leaflet-map"
        scrollWheelZoom={true}
        maxZoom={20} // Allow much closer zoom
        minZoom={10}
      >
        {/* Carto Voyager - MapQuest-like warm colors */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />

        <AutoFitBounds bounds={allCoords} radiusMiles={radiusMiles} />

        {/* Current POI marker */}
        <Marker position={currentCoords} icon={createCurrentIcon()}>
          <Popup className="custom-popup">
            <div className="popup-content">
              <strong>{currentPOI.name}</strong>
              <p className="popup-label">Current Location</p>
            </div>
          </Popup>
        </Marker>

        {/* Nearby POI markers - PURPLE NUMBERED CIRCLES */}
        {nearbyPOIs.map((poi, index) => {
          if (!poi.location) return null;

          const coords = [
            poi.location.coordinates[1],
            poi.location.coordinates[0]
          ];

          const number = index + 1;
          const isHighlighted = highlightedId === poi.id;

          return (
            <Marker
              key={poi.id}
              position={coords}
              icon={createNumberedIcon(number, isHighlighted)}
              eventHandlers={{
                click: () => {
                  if (onMarkerClick) {
                    onMarkerClick(poi.id, index);
                  }
                }
              }}
            >
              <Popup className="custom-popup">
                <div className="popup-content">
                  <strong>{poi.name}</strong>
                  {poi.distance_meters && (
                    <p className="popup-distance">
                      {(poi.distance_meters / 1609.34).toFixed(1)} miles away
                    </p>
                  )}
                  {poi.address_city && (
                    <p className="popup-city">{poi.address_city}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default Map;
