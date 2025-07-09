import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Title, Text, SimpleGrid, Paper, Group, Badge, Button, Image, Stack, Center, Accordion, Grid, Box, ActionIcon, Tooltip, Card, Skeleton, ThemeIcon, Divider } from '@mantine/core';
import { IconShare, IconHeart, IconMapPin, IconPhone, IconMail, IconWorldWww, IconCheck, IconArrowRight, IconCurrentLocation, IconClock, IconCar, IconInfoCircle, IconCamera, IconMap, IconBuilding, IconTree, IconRoute, IconCalendar, IconLink } from '@tabler/icons-react';
import api from '../utils/api';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Tooltip as LeafletTooltip } from 'react-leaflet';
import { createCustomIcon, getPoiColor, legendData, createTooltipText, getIconSymbol } from '../utils/mapUtils';
import RelationshipManager from '../components/RelationshipManager';

// Helper function to format distance
const formatDistance = (meters) => {
    if (!meters) return null;
    const miles = meters * 0.000621371; // Convert meters to miles
    if (miles < 1) {
        return `${(miles * 5280).toFixed(0)}ft`; // Convert to feet for distances less than 1 mile
    } else {
        return `${miles.toFixed(1)}mi`;
    }
};

// Fix for default Leaflet icon path issue with bundlers like Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});
const goldIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
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
  
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  .current-poi-marker div {
    animation: pulse 2s infinite;
  }
`;

// Inject custom styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = customStyles;
  document.head.appendChild(styleElement);
}


const DetailItem = ({ label, value, icon }) => {
    const hasValue = value && (Array.isArray(value) ? value.length > 0 : value.trim && value.trim() !== '');
    return (
        <Box>
            <Group gap="xs" mb={4}>
                {icon && <ThemeIcon size="sm" variant="light" color="gray"><icon.type {...icon.props} size={14} /></ThemeIcon>}
                <Text size="sm" c="dimmed" fw={500}>{label}</Text>
            </Group>
            <Text c={hasValue ? undefined : "dimmed"} fs={hasValue ? undefined : "italic"}>
                {hasValue ? (Array.isArray(value) ? value.join(', ') : value) : 'Not available'}
            </Text>
        </Box>
    )
}

const HoursDisplay = ({ hours }) => {
    if (!hours) return null;
    
    const formatHours = (hoursData) => {
        if (typeof hoursData === 'string') return hoursData;
        if (hoursData.text) return hoursData.text;
        
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        return days.map(day => {
            const dayHours = hoursData[day];
            if (!dayHours || dayHours.length === 0) return null;
            
            const formattedHours = dayHours.map(period => 
                `${period.open} - ${period.close}`
            ).join(', ');
            
            return `${day.charAt(0).toUpperCase() + day.slice(1)}: ${formattedHours}`;
        }).filter(Boolean).join('\n');
    };
    
    return <DetailItem label="Hours" value={formatHours(hours)} icon={{ type: IconClock, props: {} }} />
}

const MapLegend = () => (
    <div
        style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            zIndex: 1000,
            padding: '8px',
            backgroundColor: 'white',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            minWidth: '140px',
            border: '1px solid #e5e7eb'
        }}
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
    </div>
);

const NearbyMap = ({ poi }) => {
    const [nearbyPois, setNearbyPois] = useState([]);
    useEffect(() => {
        if (poi) {
            api.get(`/pois/${poi.id}/nearby?limit=6&distance_km=3.0`)
                .then(response => response.json())
                .then(data => setNearbyPois(data))
                .catch(err => console.error("Failed to fetch nearby POIs", err));
        }
    }, [poi]);
    
    if(!poi) return null;
    
    // Safety check for location coordinates
    if (!poi.location?.coordinates || poi.location.coordinates.length !== 2) {
        return (
            <Box>
                <Text c="dimmed" ta="center" py="xl">
                    Location data not available for this POI
                </Text>
            </Box>
        );
    }
    
    const centerPosition = [poi.location.coordinates[1], poi.location.coordinates[0]];

    return (
        <Box style={{ position: 'relative' }}>
            <MapContainer center={centerPosition} zoom={13} style={{ height: '400px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {/* Current POI Marker */}
                <Marker position={centerPosition} icon={L.divIcon({
                    html: `
                        <div style="
                            background: ${getPoiColor(poi.poi_type || 'business')};
                            width: 28px;
                            height: 28px;
                            border-radius: 50%;
                            border: 3px solid white;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-size: 13px;
                            font-weight: bold;
                        ">
                            ${getIconSymbol(poi.poi_type || 'business')}
                        </div>
                    `,
                    className: 'custom-marker current-poi-marker',
                    iconSize: [28, 28],
                    iconAnchor: [14, 14],
                    popupAnchor: [0, -14]
                })}>
                    <Popup>{poi.name} (Current)</Popup>
                    <LeafletTooltip 
                        permanent={false}
                        direction="top"
                        offset={[0, -8]}
                        opacity={0.9}
                        className="custom-tooltip"
                    >
                        {createTooltipText(poi)}
                    </LeafletTooltip>
                </Marker>
                {/* Nearby POI Markers */}
                {nearbyPois.map(p => {
                    const coords = p.location?.coordinates;
                    if (!coords || coords.length !== 2) return null;
                    const position = [coords[1], coords[0]];
                    const poiType = p.poi_type || 'business';
                    const iconColor = getPoiColor(poiType);
                    const customIcon = createCustomIcon(poiType, iconColor);
                    
                    return (
                        <Marker key={p.id} position={position} icon={customIcon}>
                            <Popup><Link to={`/poi/detail/${p.id}`}>{p.name}</Link></Popup>
                            <LeafletTooltip 
                                permanent={false}
                                direction="top"
                                offset={[0, -8]}
                                opacity={0.9}
                                className="custom-tooltip"
                            >
                                {createTooltipText(p)}
                            </LeafletTooltip>
                        </Marker>
                    );
                })}
                <MapLegend />
            </MapContainer>

            
            <SimpleGrid cols={{ base: 2, sm: 3, lg: 3 }} mt="lg">
                {nearbyPois.map(p => (
                    <Card withBorder component={Link} to={`/poi/detail/${p.id}`} p="sm" key={p.id}>
                        <Stack gap="xs">
                            <Text size="sm" fw={500} truncate="end">{p.name}</Text>
                            <Group gap="xs" justify="space-between">
                                <Badge size="xs" color={p.status === 'Fully Open' ? 'green' : 'orange'}>{p.status}</Badge>
                                {p.distance_meters && (
                                    <Text size="xs" c="dimmed">
                                        {formatDistance(p.distance_meters)}
                                    </Text>
                                )}
                            </Group>
                        </Stack>
                    </Card>
                ))}
            </SimpleGrid>
        </Box>
    )
}



const PoiDetailPage = () => {
    const { id } = useParams();
    const [poi, setPoi] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get(`/pois/${id}`)
            .then(response => response.json())
            .then(data => setPoi(data))
            .catch(err => console.error("Failed to fetch POI", err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return <Container mt="xl"><Skeleton height={50} /><SimpleGrid cols={2} mt="lg"><Skeleton height={300} /><Skeleton height={300} /></SimpleGrid></Container>
    }

    if (!poi) {
        return <Container><Center><Text>Point of Interest not found.</Text></Center></Container>;
    }
    
    // Extract data from different sources
    const attributes = poi.business?.attributes || poi.outdoors?.attributes || {};
    const amenities = poi.amenities || {};
    const contactInfo = poi.contact_info || {};
    const compliance = poi.compliance || {};
    const customFields = poi.custom_fields || {};
    
    const keyFeatures = [
        attributes.public_toilets?.includes('yes') ? 'Public Toilet' : null,
        attributes.wheelchair_accessible === 'yes' ? 'Wheelchair Friendly' : null,
        attributes.parking?.includes('street') ? 'Parking on Street' : null,
        attributes.parking?.includes('lot') ? 'Parking Lot' : null,
    ].filter(Boolean);

    // Get POI type specific data
    const getPoiTypeData = () => {
        switch (poi.poi_type) {
            case 'BUSINESS':
                return {
                    priceRange: poi.business?.price_range,
                    listingTier: poi.business?.listing_tier,
                };
            case 'TRAIL':
                return {
                    length: poi.trail?.length_text,
                    difficulty: poi.trail?.difficulty,
                    routeType: poi.trail?.route_type,
                };
            case 'PARK':
                return {
                    dronePolicy: poi.park?.drone_usage_policy,
                };
            case 'EVENT':
                return {
                    startTime: poi.event?.start_datetime,
                    endTime: poi.event?.end_datetime,
                    cost: poi.event?.cost_text,
                };
            default:
                return {};
        }
    };

    const poiTypeData = getPoiTypeData();

    return (
        <Box>
            <Paper shadow="xs" p="xs">
                 <Container>
                    <Group justify="space-between">
                         <Group component={Link} to="/launch" style={{textDecoration: 'none', color: 'inherit'}}>
                            <Image src="/vite.svg" h={30} />
                            <Title order={4}>Nearby Nearby</Title>
                         </Group>
                        <Button variant="outline" radius="xl">@Username</Button>
                    </Group>
                </Container>
            </Paper>
            <Container mt="lg">
                <Text size="sm" c="dimmed">STATUS: {poi.status} {poi.status_message && `- ${poi.status_message}`}</Text>
                <Grid mt="md">
                    <Grid.Col span={{ base: 12, md: 8 }}>
                        <Title>{poi.name}</Title>
                        <Text c="dimmed">{poi.address_city || 'Location not available'}, Chatham County</Text>
                        <Group mt="xs" gap="sm">
                            {poi.is_verified && <Badge color="teal" leftSection={<IconCheck size={14}/>}>Verified</Badge>}
                            <Badge variant="light">{poi.status}</Badge>
                        </Group>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                         <Group justify="flex-end">
                            <Tooltip label="Share"><ActionIcon variant="default" size="lg"><IconShare size={18}/></ActionIcon></Tooltip>
                            <Tooltip label="Favorite"><ActionIcon variant="default" size="lg"><IconHeart size={18}/></ActionIcon></Tooltip>
                        </Group>
                    </Grid.Col>
                </Grid>

                <Grid mt="lg" gutter="xl">
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Stack>
                            <DetailItem 
                                label="Location" 
                                value={
                                    poi.address_full || 
                                    (poi.address_street && poi.address_city && poi.address_state ? 
                                        `${poi.address_street}, ${poi.address_city}, ${poi.address_state}` : 
                                        null)
                                } 
                                icon={{ type: IconMapPin, props: {} }} 
                            />
                            <DetailItem label="Category" value={poi.categories?.map(c => c.name).join(', ')} icon={{ type: IconInfoCircle, props: {} }} />
                            <DetailItem label="Cost" value={poiTypeData.priceRange || poiTypeData.cost} icon={{ type: IconBuilding, props: {} }} />
                            <DetailItem label="Phone Number" value={poi.phone_number || attributes.phone} icon={{ type: IconPhone, props: {} }} />
                            <DetailItem label="Website" value={poi.website_url || attributes.website} icon={{ type: IconWorldWww, props: {} }} />
                            <DetailItem label="Good For" value={amenities.ideal_for} icon={{ type: IconCheck, props: {} }} />
                            <DetailItem label="Key Features" value={keyFeatures} icon={{ type: IconCheck, props: {} }} />
                            <DetailItem label="Pets" value={attributes.pets} icon={{ type: IconInfoCircle, props: {} }} />
                        </Stack>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 8 }}>
                        {poi.photos?.featured || poi.photos?.gallery?.length > 0 || attributes.photo_gallery?.length > 0 ? (
                            <SimpleGrid cols={2} gap="sm">
                                {poi.photos?.featured && (
                                    <Image 
                                        src={poi.photos.featured} 
                                        radius="md" 
                                        style={{ aspectRatio: '1', objectFit: 'cover' }}
                                    />
                                )}
                                {poi.photos?.gallery?.slice(0, 3).map((url, i) => (
                                    <Image 
                                        key={i} 
                                        src={url} 
                                        radius="md" 
                                        style={{ aspectRatio: '1', objectFit: 'cover' }}
                                    />
                                ))}
                                {attributes.photo_gallery?.slice(0, 2).map((url, i) => (
                                    <Image 
                                        key={`attr-${i}`} 
                                        src={url} 
                                        radius="md" 
                                        style={{ aspectRatio: '1', objectFit: 'cover' }}
                                    />
                                ))}
                            </SimpleGrid>
                        ) : (
                            <SimpleGrid cols={2} gap="sm">
                                {[1, 2, 3, 4].map((i) => (
                                    <Box 
                                        key={i}
                                        style={{ 
                                            aspectRatio: '1', 
                                            backgroundColor: 'var(--mantine-color-gray-2)', 
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <IconCamera size={24} color="var(--mantine-color-gray-5)" />
                                    </Box>
                                ))}
                            </SimpleGrid>
                        )}
                    </Grid.Col>
                </Grid>
                
                <Accordion 
                    chevronPosition="right" 
                    variant="filled" 
                    mt="xl"
                    styles={{
                        control: {
                            backgroundColor: 'var(--mantine-color-gray-1)',
                            color: 'var(--mantine-color-gray-8)',
                            borderRadius: '12px',
                            '&:hover': {
                                backgroundColor: 'var(--mantine-color-gray-2)',
                            },
                        },
                        item: {
                            border: 'none',
                            marginBottom: '8px',
                            borderRadius: '12px',
                        },
                        panel: {
                            backgroundColor: 'var(--mantine-color-gray-0)',
                            color: 'var(--mantine-color-gray-7)',
                            borderBottomLeftRadius: '12px',
                            borderBottomRightRadius: '12px',
                        },
                        content: {
                            backgroundColor: 'var(--mantine-color-gray-0)',
                            borderBottomLeftRadius: '12px',
                            borderBottomRightRadius: '12px',
                        }
                    }}
                >
                    <Accordion.Item value="about">
                        <Accordion.Control icon={<IconInfoCircle size={18} />}>
                            About & Description
                        </Accordion.Control>
                        <Accordion.Panel>
                            <Stack gap="md">
                                {poi.description_long && (
                                    <DetailItem label="Full Description" value={poi.description_long} />
                                )}
                                {poi.description_short && (
                                    <DetailItem label="Short Description" value={poi.description_short} />
                                )}
                                <HoursDisplay hours={poi.hours} />
                                {poiTypeData.length && (
                                    <DetailItem label="Length" value={poiTypeData.length} icon={{ type: IconRoute, props: {} }} />
                                )}
                                {poiTypeData.difficulty && (
                                    <DetailItem label="Difficulty" value={poiTypeData.difficulty} icon={{ type: IconRoute, props: {} }} />
                                )}
                                {poiTypeData.routeType && (
                                    <DetailItem label="Route Type" value={poiTypeData.routeType} icon={{ type: IconRoute, props: {} }} />
                                )}
                            </Stack>
                        </Accordion.Panel>
                    </Accordion.Item>
                    
                    <Accordion.Item value="contact">
                        <Accordion.Control icon={<IconPhone size={18} />}>
                            Contact Information
                        </Accordion.Control>
                        <Accordion.Panel>
                            <Stack gap="md">
                                <DetailItem label="Email" value={poi.email || attributes.email} icon={{ type: IconMail, props: {} }} />
                                <DetailItem label="Phone" value={poi.phone_number || attributes.phone} icon={{ type: IconPhone, props: {} }} />
                                <DetailItem label="Website" value={poi.website_url || attributes.website} icon={{ type: IconWorldWww, props: {} }} />
                                {contactInfo.best && (
                                    <DetailItem label="Best Contact" value={`${contactInfo.best.name} - ${contactInfo.best.phone}`} icon={{ type: IconPhone, props: {} }} />
                                )}
                                {contactInfo.emergency && (
                                    <DetailItem label="Emergency Contact" value={`${contactInfo.emergency.name} - ${contactInfo.emergency.phone}`} icon={{ type: IconPhone, props: {} }} />
                                )}
                            </Stack>
                        </Accordion.Panel>
                    </Accordion.Item>
                    
                    <Accordion.Item value="parking">
                        <Accordion.Control icon={<IconCar size={18} />}>
                            Address & Parking
                        </Accordion.Control>
                        <Accordion.Panel>
                            <Stack gap="md">
                                <DetailItem label="Full Address" value={poi.address_full} icon={{ type: IconMapPin, props: {} }} />
                                <DetailItem label="Street Address" value={poi.address_street} icon={{ type: IconMapPin, props: {} }} />
                                <DetailItem label="City" value={poi.address_city} icon={{ type: IconMapPin, props: {} }} />
                                <DetailItem label="State" value={poi.address_state} icon={{ type: IconMapPin, props: {} }} />
                                <DetailItem label="ZIP Code" value={poi.address_zip} icon={{ type: IconMapPin, props: {} }} />
                                <DetailItem label="Parking Options" value={attributes.parking} icon={{ type: IconCar, props: {} }} />
                                <DetailItem label="Parking Notes" value={attributes.parking_notes} icon={{ type: IconCar, props: {} }} />
                                <DetailItem label="Wheelchair Accessible" value={attributes.wheelchair_accessible} icon={{ type: IconInfoCircle, props: {} }} />
                            </Stack>
                        </Accordion.Panel>
                    </Accordion.Item>
                    
                    <Accordion.Item value="amenities">
                        <Accordion.Control icon={<IconCheck size={18} />}>
                            Amenities & Features
                        </Accordion.Control>
                        <Accordion.Panel>
                            <Stack gap="md">
                                <DetailItem label="Payment Methods" value={amenities.payment_methods} icon={{ type: IconInfoCircle, props: {} }} />
                                <DetailItem label="Ideal For" value={amenities.ideal_for} icon={{ type: IconCheck, props: {} }} />
                                <DetailItem label="Public Toilets" value={attributes.public_toilets} icon={{ type: IconInfoCircle, props: {} }} />
                                <DetailItem label="Pets Allowed" value={attributes.pets} icon={{ type: IconInfoCircle, props: {} }} />
                                {poiTypeData.dronePolicy && (
                                    <DetailItem label="Drone Policy" value={poiTypeData.dronePolicy} icon={{ type: IconTree, props: {} }} />
                                )}
                                {compliance.pre_approval_required && (
                                    <DetailItem label="Pre-approval Required" value="Yes" icon={{ type: IconInfoCircle, props: {} }} />
                                )}
                                {compliance.lead_time && (
                                    <DetailItem label="Lead Time" value={compliance.lead_time} icon={{ type: IconClock, props: {} }} />
                                )}
                            </Stack>
                        </Accordion.Panel>
                    </Accordion.Item>
                    
                    {poiTypeData.startTime && (
                        <Accordion.Item value="event">
                            <Accordion.Control icon={<IconCalendar size={18} />}>
                                Event Details
                            </Accordion.Control>
                            <Accordion.Panel>
                                <Stack gap="md">
                                    <DetailItem label="Start Time" value={new Date(poiTypeData.startTime).toLocaleString()} icon={{ type: IconCalendar, props: {} }} />
                                    {poiTypeData.endTime && (
                                        <DetailItem label="End Time" value={new Date(poiTypeData.endTime).toLocaleString()} icon={{ type: IconCalendar, props: {} }} />
                                    )}
                                    <DetailItem label="Cost" value={poiTypeData.cost} icon={{ type: IconBuilding, props: {} }} />
                                </Stack>
                            </Accordion.Panel>
                        </Accordion.Item>
                    )}
                    
                    <Accordion.Item value="photos">
                        <Accordion.Control icon={<IconCamera size={18} />}>
                            Photos & Gallery
                        </Accordion.Control>
                        <Accordion.Panel>
                            <Stack gap="md">
                                {poi.photos?.featured && (
                                    <Box>
                                        <Text size="sm" c="dimmed" mb="xs">Featured Photo</Text>
                                        <Image src={poi.photos.featured} radius="md" />
                                    </Box>
                                )}
                                {poi.photos?.gallery && poi.photos.gallery.length > 0 && (
                                    <Box>
                                        <Text size="sm" c="dimmed" mb="xs">Photo Gallery</Text>
                                        <SimpleGrid cols={3}>
                                            {poi.photos.gallery.map((url, i) => (
                                                <Image key={i} src={url} radius="md" />
                                            ))}
                                        </SimpleGrid>
                                    </Box>
                                )}
                                {attributes.photo_gallery && attributes.photo_gallery.length > 0 && (
                                    <Box>
                                        <Text size="sm" c="dimmed" mb="xs">Additional Photos</Text>
                                        <SimpleGrid cols={3}>
                                            {attributes.photo_gallery.filter(url => url).map((url, i) => (
                                                <Image key={i} src={url} radius="md" />
                                            ))}
                                        </SimpleGrid>
                                    </Box>
                                )}
                            </Stack>
                        </Accordion.Panel>
                    </Accordion.Item>
                    
                    {Object.keys(customFields).length > 0 && (
                        <Accordion.Item value="custom">
                            <Accordion.Control icon={<IconInfoCircle size={18} />}>
                                Additional Information
                            </Accordion.Control>
                            <Accordion.Panel>
                                <Stack gap="md">
                                    {Object.entries(customFields).map(([key, value]) => (
                                        <DetailItem key={key} label={key} value={value} />
                                    ))}
                                </Stack>
                            </Accordion.Panel>
                        </Accordion.Item>
                    )}
                    
                    <Accordion.Item value="related">
                        <Accordion.Control icon={<IconLink size={18} />}>
                            Related POIs
                        </Accordion.Control>
                        <Accordion.Panel>
                            <RelationshipManager 
                                poiId={poi.id} 
                                poiType={poi.poi_type} 
                                poiName={poi.name}
                                showManageButton={false}
                                readOnly={true}
                            />
                        </Accordion.Panel>
                    </Accordion.Item>
                </Accordion>
                
                 <Box mt={60}>
                    <Center><Title order={3} c="dimmed">NEARBY POINTS OF INTEREST</Title></Center>
                    <NearbyMap poi={poi} />
                </Box>
            </Container>
        </Box>
    );
};

export default PoiDetailPage;