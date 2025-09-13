import { useEffect, memo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Box, Skeleton } from '@mantine/core';

// Map helper components
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => { 
    map.setView(center, zoom); 
  }, [center, zoom, map]);
  return null;
}

function DraggableMarker({ position, onPositionChange }) {
  const map = useMap();
  
  useMapEvents({ 
    click(e) { 
      onPositionChange(e.latlng); 
      map.flyTo(e.latlng, map.getZoom()); 
    } 
  });
  
  const handleDragEnd = (event) => { 
    if (event.target != null) { 
      onPositionChange(event.target.getLatLng()); 
    } 
  };
  
  return (
    <Marker 
      draggable={true} 
      eventHandlers={{ dragend: handleDragEnd }} 
      position={position} 
    />
  );
}

// Main map component - memoized to prevent unnecessary re-renders
const LocationMap = memo(({ latitude, longitude, onLocationChange }) => {
  const currentPosition = [latitude || 35.72, longitude || -79.17];

  return (
    <Box h={400}>
      <MapContainer 
        center={currentPosition} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <DraggableMarker
          position={currentPosition}
          onPositionChange={(latlng) => {
            onLocationChange(latlng.lat, latlng.lng);
          }}
        />
        <ChangeView center={currentPosition} zoom={13} />
      </MapContainer>
    </Box>
  );
}, (prevProps, nextProps) => {
  // Only re-render if coordinates actually changed
  return prevProps.latitude === nextProps.latitude && 
         prevProps.longitude === nextProps.longitude;
});

LocationMap.displayName = 'LocationMap';

// Loading placeholder
export const LocationMapSkeleton = () => (
  <Skeleton height={400} radius="md" />
);

export default LocationMap;