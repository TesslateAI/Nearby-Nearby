import { useEffect } from 'react';
import { Marker, useMap, useMapEvents } from 'react-leaflet';

export function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [center, zoom, map]);
  return null;
}

export function DraggableMarker({ position, onPositionChange }) {
  const map = useMap();
  useMapEvents({ click(e) { onPositionChange(e.latlng); map.flyTo(e.latlng, map.getZoom()); } });
  const handleDragEnd = (event) => { if (event.target != null) { onPositionChange(event.target.getLatLng()); } };
  return <Marker draggable={true} eventHandlers={{ dragend: handleDragEnd }} position={position} />;
}