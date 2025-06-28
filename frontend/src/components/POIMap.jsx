import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Drawer, Title, Text, Button, Stack, Badge, Paper, Loader, Group, Accordion, List, SimpleGrid, ThemeIcon, Box, Divider, Card } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPencil, IconCheck, IconLink, IconPhone, IconMail, IconMapPin, IconArrowRight } from '@tabler/icons-react';
import L from 'leaflet';

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Fix for default Leaflet icon path issue with bundlers like Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


// Helper component to render a list from an array attribute
const AttributeList = ({ title, data }) => {
    if (!data || data.length === 0) return null;
    return (
        <Box>
            <Text fw={500} size="sm">{title}</Text>
            <List size="sm" withPadding>
                {data.map((item, index) => <List.Item key={index}>{item.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</List.Item>)}
            </List>
        </Box>
    );
};

// Helper for single text attributes
const TextAttribute = ({ label, value }) => {
    if (!value) return null;
    return <Text size="sm"><Text component="span" fw={500}>{label}:</Text> {value}</Text>;
}


const NearbyPoiList = ({ poiId }) => {
    const [nearby, setNearby] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!poiId) return;
        const fetchNearby = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(`${API_URL}/api/pois/${poiId}/nearby`);
                setNearby(data);
            } catch (error) {
                console.error("Failed to fetch nearby POIs", error);
            } finally {
                setLoading(false);
            }
        };
        fetchNearby();
    }, [poiId]);

    if (loading) return <Loader />;
    if (nearby.length === 0) return <Text size="sm" c="dimmed">No other POIs found within 5km.</Text>;

    return (
        <Stack>
            {nearby.map(poi => (
                <Card withBorder p="sm" key={poi.id}>
                    <Text fw={500}>{poi.name}</Text>
                    <Text size="xs" c="dimmed">{poi.location.address_line1}</Text>
                </Card>
            ))}
        </Stack>
    );
};


const PoiDetailView = ({ poi }) => {
    const { id, name, description, poi_type, status, status_message, is_verified, location, business, categories } = poi;
    
    if (!poi) return null;

    const attributes = business?.attributes || poi.outdoors?.attributes || {};

    return (
        <Stack>
            <Group>
                <Title order={3}>{name}</Title>
                {is_verified && <ThemeIcon color="green" variant="light" radius="xl"><IconCheck size={16} /></ThemeIcon>}
            </Group>
            <Badge tt="capitalize" color="purple">{poi_type}</Badge>
            <Badge color={status === 'Fully Open' ? 'green' : 'orange'}>{status}</Badge>
            {status_message && <Text c="dimmed" size="sm">"{status_message}"</Text>}
            
            <Accordion multiple defaultValue={['general', 'contact', 'nearby']}>
                <Accordion.Item value="general">
                    <Accordion.Control>General Information</Accordion.Control>
                    <Accordion.Panel>
                        <Stack>
                            <Text>{description || 'No description provided.'}</Text>
                            <TextAttribute label="Price Range" value={attributes?.price_range} />
                            {categories && categories.length > 0 && <Text size="sm"><Text component="span" fw={500}>Categories:</Text> {categories.map(c => c.name).join(', ')}</Text>}
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item value="location">
                    <Accordion.Control>Location & Address</Accordion.Control>
                    <Accordion.Panel>
                         <Stack>
                            <Group wrap="nowrap" gap="xs"><IconMapPin size={16}/><Text size="sm">{location?.address_line1}, {location?.city}</Text></Group>
                            <TextAttribute label="Entry Notes" value={location?.entry_notes} />
                            {location?.use_coordinates_for_map && <Badge color="red" variant='light'>Map pin is precise, address may be inexact.</Badge>}
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item value="contact">
                    <Accordion.Control>Contact & Links</Accordion.Control>
                    <Accordion.Panel>
                        <Stack>
                           {attributes.phone && <Group wrap="nowrap" gap="xs"><IconPhone size={16}/><Text size="sm">{attributes.phone}</Text></Group>}
                           {attributes.email && <Group wrap="nowrap" gap="xs"><IconMail size={16}/><Text size="sm">{attributes.email}</Text></Group>}
                           {attributes.website && <Group wrap="nowrap" gap="xs"><IconLink size={16}/><Text component="a" href={attributes.website} target="_blank" size="sm">{attributes.website}</Text></Group>}
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>
                 <Accordion.Item value="amenities">
                    <Accordion.Control>Amenities & Details</Accordion.Control>
                    <Accordion.Panel>
                        <SimpleGrid cols={2} spacing="md">
                            <AttributeList title="Payment Methods" data={attributes.payment_methods} />
                            <AttributeList title="Parking" data={attributes.parking} />
                            <AttributeList title="General Amenities" data={attributes.amenities_services} />
                             <AttributeList title="Facilities" data={attributes.facilities} />
                        </SimpleGrid>
                    </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item value="nearby">
                    <Accordion.Control>What's Nearby?</Accordion.Control>
                    <Accordion.Panel>
                       <NearbyPoiList poiId={id} />
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>
        </Stack>
    );
};


function POIMap() {
  const [pois, setPois] = useState([]);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPois = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/pois/?limit=1000`);
        console.log('Fetched POIs:', response.data.length);
        console.log('Sample POI:', response.data[0]);
        setPois(response.data);
      } catch (error) {
        notifications.show({ title: 'Error fetching data', message: 'Could not load points of interest for the map.', color: 'red' });
      }
    };
    fetchPois();
  }, []);

  const handleMarkerClick = async (poi) => {
    setLoading(true);
    setDrawerOpen(true);
    try {
        const response = await axios.get(`${API_URL}/api/pois/${poi.id}`);
        setSelectedPoi(response.data);
    } catch(e) {
        notifications.show({ title: 'Error', message: 'Could not fetch POI details.', color: 'red' });
        setDrawerOpen(false);
    } finally {
        setLoading(false);
    }
  };

  const handleEditClick = () => {
    if (selectedPoi) {
      navigate(`/poi/${selectedPoi.id}/edit`);
    }
  };
  
  const handleCloseDrawer = () => {
      setDrawerOpen(false);
      setSelectedPoi(null);
  }

  return (
    <>
      <Paper style={{ height: '85vh', width: '100%' }} withBorder radius="md" p={0} shadow="sm">
        <MapContainer center={[35.7, -79.1]} zoom={9} scrollWheelZoom={true} style={{ height: "100%", width: "100%", borderRadius: 'var(--mantine-radius-md)' }}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {pois.map(poi => {
            const coords = poi.location?.coordinates;
            if (!coords || coords.length !== 2) {
              console.log('Skipping POI due to invalid coordinates:', poi.name, coords);
              return null;
            }
            const position = [coords[1], coords[0]]; 
            console.log('Rendering marker for:', poi.name, 'at position:', position);

            return (
              <Marker key={poi.id} position={position} eventHandlers={{ click: () => handleMarkerClick(poi) }} >
                  <Popup>{poi.name}</Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </Paper>
      
      <Drawer opened={isDrawerOpen} onClose={handleCloseDrawer} title={<Title order={4}>POI Details</Title>} position="right" padding="xl" size="xl" shadow="md">
        {loading && <Group justify="center" mt="xl"><Loader /></Group>}
        {!loading && selectedPoi && (
            <>
                <PoiDetailView poi={selectedPoi} />
                <Button onClick={handleEditClick} leftSection={<IconPencil size={16} />} mt="xl" fullWidth>
                    Edit POI
                </Button>
            </>
        )}
      </Drawer>
    </>
  );
}

export default POIMap;