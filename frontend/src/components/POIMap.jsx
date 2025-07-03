import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import { Drawer, Title, Text, Button, Stack, Badge, Paper, Loader, Group, Accordion, List, SimpleGrid, ThemeIcon, Box, Divider, Card, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPencil, IconCheck, IconLink, IconPhone, IconMail, IconMapPin, IconArrowRight, IconSearch, IconBuilding, IconTree, IconRoute, IconCalendar } from '@tabler/icons-react';
import L from 'leaflet';

// Fix for default Leaflet icon path issue with bundlers like Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Add custom CSS for tooltips and markers
const customStyles = `
  .custom-tooltip {
    background: white !important;
    border: 1px solid #e5e7eb !important;
    border-radius: 6px !important;
    color: #374151 !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    font-size: 12px !important;
    padding: 6px 10px !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
    white-space: nowrap !important;
    max-width: 250px !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
  
  .custom-tooltip::before {
    border-top-color: white !important;
  }
  
  .custom-marker {
    background: transparent !important;
    border: none !important;
  }
  
  .custom-marker div {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .custom-marker:hover div {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
  }
`;

// Inject custom styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = customStyles;
  document.head.appendChild(styleElement);
}

// Custom icon configuration for different POI types
const createCustomIcon = (type, color) => {
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

// Get icon symbol for each POI type
const getIconSymbol = (type) => {
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
const getPoiColor = (type) => {
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

// Legend data
const legendData = [
  { type: 'BUSINESS', label: 'Business', color: '#3B82F6', icon: '🏢' },
  { type: 'PARK', label: 'Park', color: '#10B981', icon: '🌳' },
  { type: 'TRAIL', label: 'Trail', color: '#F59E0B', icon: '🥾' },
  { type: 'EVENT', label: 'Event', color: '#EF4444', icon: '📅' },
  { type: 'OUTDOORS', label: 'Outdoors', color: '#10B981', icon: '🌳' },
];

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
                const response = await api.get(`/pois/${poiId}/nearby`);
                const data = await response.json();
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

// Legend component
const MapLegend = () => (
  <Paper
    style={{
      position: 'absolute',
      bottom: 20,
      left: 20,
      zIndex: 1000,
      padding: '8px',
      backgroundColor: 'white',
      borderRadius: '6px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      minWidth: '140px'
    }}
    withBorder
  >
    <Text size="sm" fw={600} mb={4}>POI Types</Text>
    <Stack gap={4}>
      {legendData.map((item) => (
        <Group key={item.type} gap={6} wrap="nowrap">
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: item.color,
              border: '2px solid white',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '9px',
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            {item.icon}
          </div>
          <Text size="xs" style={{ flex: 1 }}>{item.label}</Text>
        </Group>
      ))}
    </Stack>
  </Paper>
);

function POIMap() {
  const [pois, setPois] = useState([]);
  const [filteredPois, setFilteredPois] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPois = async () => {
      try {
        console.log('Fetching POIs...');
        const response = await api.get('/pois/?limit=1000');
        const data = await response.json();
        console.log('Fetched POIs:', data.length);
        console.log('Sample POI:', data[0]);
        setPois(data);
        setFilteredPois(data);
      } catch (error) {
        console.error('Error fetching POIs:', error);
        notifications.show({ title: 'Error fetching data', message: 'Could not load points of interest for the map.', color: 'red' });
      } finally {
        setLoading(false);
      }
    };
    fetchPois();
  }, []);

  // Filter POIs based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPois(pois);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = pois.filter(poi => {
      const nameMatch = poi.name?.toLowerCase().includes(query);
      const descriptionMatch = poi.description?.toLowerCase().includes(query);
      const categoryMatch = poi.categories?.some(cat => 
        cat.name?.toLowerCase().includes(query)
      );
      const addressMatch = poi.location?.address_line1?.toLowerCase().includes(query) ||
                          poi.location?.city?.toLowerCase().includes(query);
      
      return nameMatch || descriptionMatch || categoryMatch || addressMatch;
    });
    
    setFilteredPois(filtered);
  }, [searchQuery, pois]);

  const handleMarkerClick = async (poi) => {
    setLoading(true);
    setDrawerOpen(true);
    try {
        const response = await api.get(`/pois/${poi.id}`);
        const data = await response.json();
        setSelectedPoi(data);
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

  // Create tooltip content for a POI
  const createTooltipContent = (poi) => {
    const { name, poi_type, status, location } = poi;
    const address = location?.address_line1 ? `${location.address_line1}, ${location.city}` : location?.city || 'Address not available';
    
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 200px;">
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #1f2937;">${name}</div>
        <div style="font-size: 12px; color: #6b7280; margin-bottom: 2px;">${poi_type}</div>
        <div style="font-size: 11px; color: #9ca3af; margin-bottom: 2px;">${status}</div>
        <div style="font-size: 11px; color: #9ca3af;">${address}</div>
      </div>
    `;
  };

  // Create simple tooltip text for POI
  const createTooltipText = (poi) => {
    const { name, poi_type, status, location } = poi;
    const address = location?.city || 'Address not available';
    // Handle enum format like "POIType.BUSINESS" or just "BUSINESS"
    const typeStr = poi_type?.includes('.') ? poi_type.split('.')[1] : poi_type;
    return `${name} (${typeStr}) - ${status} - ${address}`;
  };

  return (
    <>
      <Paper style={{ height: '85vh', width: '100%' }} withBorder radius="md" p={0} shadow="sm">
        <Box p="md" style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, maxWidth: '400px', width: '100%' }}>
          <TextInput
            placeholder="Search POIs..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            styles={{
              input: {
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              },
              rightSection: {
                width: 'auto',
                paddingRight: '4px'
              }
            }}
          />
          {searchQuery && (
            <Text size="xs" c="dimmed" mt={4} ta="center">
              Showing {filteredPois.length} of {pois.length} POIs
            </Text>
          )}
        </Box>
        
        {loading && pois.length === 0 ? (
          <Box style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stack align="center" spacing="md">
              <Loader size="lg" />
              <Text>Loading map data...</Text>
            </Stack>
          </Box>
        ) : (
          <>
            <MapContainer 
              center={[35.7, -79.1]} 
              zoom={9} 
              scrollWheelZoom={true} 
              style={{ height: "100%", width: "100%", borderRadius: 'var(--mantine-radius-md)' }}
              key={filteredPois.length} // Force re-render when POIs change
            >
              <TileLayer 
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
              />
              {filteredPois.map(poi => {
                const coords = poi.location?.coordinates;
                if (!coords || coords.length !== 2) {
                  console.log('Skipping POI due to invalid coordinates:', poi.name, coords);
                  return null;
                }
                const position = [coords[1], coords[0]]; 
                const poiType = poi.poi_type || 'business';
                const iconColor = getPoiColor(poiType);
                const customIcon = createCustomIcon(poiType, iconColor);
                
                console.log('Rendering marker for:', poi.name, 'at position:', position, 'type:', poiType);

                return (
                  <Marker 
                    key={poi.id} 
                    position={position} 
                    icon={customIcon}
                    eventHandlers={{ click: () => handleMarkerClick(poi) }}
                  >
                    <Tooltip 
                      permanent={false}
                      direction="top"
                      offset={[0, -8]}
                      opacity={0.9}
                      className="custom-tooltip"
                    >
                      {createTooltipText(poi)}
                    </Tooltip>
                  </Marker>
                );
              })}
            </MapContainer>
            
            <MapLegend />
          </>
        )}
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