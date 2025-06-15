import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Drawer, Title, Text, Button, Stack, Badge, Paper } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPencil } from '@tabler/icons-react';
import L from 'leaflet';

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Fix for default Leaflet icon path issue with bundlers like Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function POIMap() {
  const [pois, setPois] = useState([]);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPois = async () => {
      try {
        // Fetch a large number of POIs to display all on the map
        const response = await axios.get(`${API_URL}/api/pois/?limit=1000`);
        setPois(response.data);
      } catch (error) {
        notifications.show({
          title: 'Error fetching data',
          message: 'Could not load points of interest for the map.',
          color: 'red',
        });
        console.error("Error fetching POIs for map:", error);
      }
    };
    fetchPois();
  }, []);

  const handleMarkerClick = (poi) => {
    setSelectedPoi(poi);
  };

  const handleEditClick = () => {
    if (selectedPoi) {
      navigate(`/poi/${selectedPoi.id}/edit`);
    }
  };

  const renderPoiDetails = () => {
    if (!selectedPoi) return null;
    
    const { name, description, poi_type, location, business, outdoors, event } = selectedPoi;

    return (
        <Stack>
            <Title order={3}>{name}</Title>
            <Badge tt="capitalize">{poi_type}</Badge>
            <Text c="dimmed">{description || 'No description available.'}</Text>
            
            {location && (
                <Text size="sm" mt="md">
                    {location.address_line1}<br />
                    {location.city}, {location.state_abbr} {location.postal_code}
                </Text>
            )}

            {poi_type === 'business' && business && (
                <Text size="sm" fw={500} mt="sm">Price: {business.price_range || 'N/A'}</Text>
            )}

            {poi_type === 'outdoors' && outdoors && (
                <Text size="sm" fw={500} mt="sm">Trail Length: {outdoors.trail_length_km} km</Text>
            )}

            {poi_type === 'event' && event && (
                 <Text size="sm" fw={500} mt="sm">
                    Starts: {new Date(event.start_datetime).toLocaleString()}
                </Text>
            )}

            <Button onClick={handleEditClick} leftSection={<IconPencil size={16} />} mt="xl">
                Edit POI
            </Button>
        </Stack>
    );
  };

  return (
    <>
      <Paper style={{ height: '85vh', width: '100%' }} withBorder radius="md" p={0} shadow="sm">
        <MapContainer 
          center={[35.7, -79.1]} // A reasonable center for NC
          zoom={9} 
          scrollWheelZoom={true} 
          style={{ height: "100%", width: "100%", borderRadius: 'var(--mantine-radius-md)' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          {pois.map(poi => {
            const coords = poi.location?.coordinates?.coordinates;
            if (!coords || coords.length !== 2) return null;
            // Leaflet expects [latitude, longitude], API provides [longitude, latitude]
            const position = [coords[1], coords[0]]; 

            return (
              <Marker 
                key={poi.id} 
                position={position}
                eventHandlers={{
                  click: () => handleMarkerClick(poi),
                }}
              >
                  <Popup>{poi.name}</Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </Paper>
      
      <Drawer
        opened={!!selectedPoi}
        onClose={() => setSelectedPoi(null)}
        title={<Title order={4}>POI Details</Title>}
        position="right"
        padding="xl"
        size="lg"
        shadow="md"
      >
        {renderPoiDetails()}
      </Drawer>
    </>
  );
}

export default POIMap;