import { memo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Box, Skeleton, Paper, Text, Group } from '@mantine/core';

// Map helper components
function DraggableMarker({ position, onPositionChange }) {
  const map = useMap();

  useMapEvents({
    click(e) {
      onPositionChange(e.latlng);
      // Don't recenter the map - let user keep their current view
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
  const currentPosition = [latitude || 35.720303, longitude || -79.177397];

  const handleMapInteraction = (e) => {
    // Stop all events from map from bubbling to parent form
    // This prevents zoom/pan/click from triggering form changes
    e.stopPropagation();
    // Prevent default to stop form submission
    if (e.target.closest('.leaflet-control-zoom') || e.target.tagName === 'A') {
      e.preventDefault();
    }
  };

  return (
    <Box
      onSubmit={(e) => {
        // Absolutely prevent any form submission from map
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
    >
      <Box
        h={400}
        onMouseDown={handleMapInteraction}
        onClick={handleMapInteraction}
        onPointerDown={handleMapInteraction}
        onTouchStart={handleMapInteraction}
        onSubmit={handleMapInteraction}
        style={{
          willChange: 'transform',
          transform: 'translateZ(0)',
          isolation: 'isolate'
        }}
      >
        <MapContainer
          center={currentPosition}
          zoom={17}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
          zoomControl={true}
          preferCanvas={true}
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
        </MapContainer>
      </Box>

      {/* Coordinate Display */}
      <Paper withBorder p="xs" mt="xs" bg="gray.0">
        <Group gap="md">
          <Text size="sm" fw={500}>
            Selected Coordinates:
          </Text>
          <Text size="sm" c="dimmed">
            Latitude: <Text component="span" fw={600} c="dark">{latitude ? latitude.toFixed(6) : 'Not set'}</Text>
          </Text>
          <Text size="sm" c="dimmed">
            Longitude: <Text component="span" fw={600} c="dark">{longitude ? longitude.toFixed(6) : 'Not set'}</Text>
          </Text>
        </Group>
      </Paper>
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