import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Title, Text, SimpleGrid, Paper, Group, Badge, Button, Image, Stack, Center, Accordion, Grid, Box, ActionIcon, Tooltip, Card, Skeleton, ThemeIcon } from '@mantine/core';
import { IconShare, IconHeart, IconMapPin, IconPhone, IconMail, IconWorldWww, IconCheck, IconArrowRight, IconCurrentLocation } from '@tabler/icons-react';
import api from '../utils/api';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

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


const DetailItem = ({ label, value }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;
    return <Box><Text size="sm" c="dimmed">{label}</Text><Text>{Array.isArray(value) ? value.join(', ') : value}</Text></Box>
}

const NearbyMap = ({ poi }) => {
    const [nearbyPois, setNearbyPois] = useState([]);
    useEffect(() => {
        if (poi) {
            api.get(`/pois/${poi.id}/nearby`)
                .then(response => response.json())
                .then(data => setNearbyPois(data))
                .catch(err => console.error("Failed to fetch nearby POIs", err));
        }
    }, [poi]);
    
    if(!poi) return null;
    const centerPosition = [poi.location.coordinates[1], poi.location.coordinates[0]];

    return (
        <Box>
            <MapContainer center={centerPosition} zoom={13} style={{ height: '400px', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {/* Current POI Marker */}
                <Marker position={centerPosition} icon={goldIcon}>
                    <Popup>{poi.name} (Current)</Popup>
                </Marker>
                {/* Nearby POI Markers */}
                {nearbyPois.map(p => (
                    <Marker key={p.id} position={[p.location.coordinates[1], p.location.coordinates[0]]}>
                        <Popup><Link to={`/poi/detail/${p.id}`}>{p.name}</Link></Popup>
                    </Marker>
                ))}
            </MapContainer>
             <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} mt="lg">
                {nearbyPois.map(p => (
                    <Card withBorder component={Link} to={`/poi/detail/${p.id}`} p="sm" key={p.id}>
                        <Text size="xs" fw={500} truncate="end">{p.name}</Text>
                        <Badge size="xs" color={p.status === 'Fully Open' ? 'green' : 'orange'}>{p.status}</Badge>
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
    
    const attributes = poi.business?.attributes || poi.outdoors?.attributes || {};
    const keyFeatures = [
        attributes.public_toilets?.includes('yes') ? 'Public Toilet' : null,
        attributes.wheelchair_accessible === 'yes' ? 'Wheelchair Friendly' : null,
        attributes.parking?.includes('street') ? 'Parking on Street' : null,
        attributes.parking?.includes('lot') ? 'Parking Lot' : null,
    ].filter(Boolean);

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
                        <Text c="dimmed">{poi.location.city}, Chatham County</Text>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                         <Group justify="flex-end">
                            {poi.is_verified && <Badge color="teal" leftSection={<IconCheck size={14}/>}>Verified</Badge>}
                            <Badge variant="light">{poi.status}</Badge>
                            <Tooltip label="Share"><ActionIcon variant="default" size="lg"><IconShare size={18}/></ActionIcon></Tooltip>
                            <Tooltip label="Favorite"><ActionIcon variant="default" size="lg"><IconHeart size={18}/></ActionIcon></Tooltip>
                        </Group>
                    </Grid.Col>
                </Grid>

                <Grid mt="lg" gutter="xl">
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Stack>
                            <DetailItem label="Location" value={`${poi.location.address_line1}, ${poi.location.city}, ${poi.location.state_abbr}`} />
                            <DetailItem label="Phone Number" value={attributes.phone} />
                            <DetailItem label="Website" value={attributes.website} />
                            <Group grow mt="sm">
                                <Button variant="light" leftSection={<IconCurrentLocation size={14}/>}>Nearby</Button>
                                <Button variant="light" leftSection={<IconPhone size={14}/>}>Call</Button>
                                <Button variant="light" leftSection={<IconWorldWww size={14}/>}>Website</Button>
                            </Group>
                        </Stack>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                         <Stack>
                            <DetailItem label="Category" value={poi.categories?.map(c => c.name).join(', ')} />
                            <DetailItem label="Good For" value={attributes.ideal_for} />
                            <DetailItem label="Key Features" value={keyFeatures} />
                         </Stack>
                    </Grid.Col>
                     <Grid.Col span={{ base: 12, md: 4 }}>
                         <Stack>
                            <DetailItem label="Cost" value={attributes.price_range} />
                            <DetailItem label="Pets" value={attributes.pets} />
                         </Stack>
                    </Grid.Col>
                </Grid>
                
                <Accordion chevronPosition="right" variant="separated" mt="xl">
                    <Accordion.Item value="about"><Accordion.Control>About + Hours</Accordion.Control>
                        <Accordion.Panel><Text>{poi.description}</Text><DetailItem label="Hours" value={attributes.hours?.text} /></Accordion.Panel>
                    </Accordion.Item>
                    <Accordion.Item value="parking"><Accordion.Control>Address + Parking</Accordion.Control>
                        <Accordion.Panel><DetailItem label="Parking Notes" value={attributes.parking_notes} /></Accordion.Panel>
                    </Accordion.Item>
                    <Accordion.Item value="contact"><Accordion.Control>Contact Information</Accordion.Control>
                        <Accordion.Panel><DetailItem label="Email" value={attributes.email} /></Accordion.Panel>
                    </Accordion.Item>
                    <Accordion.Item value="photos"><Accordion.Control>Photos</Accordion.Control>
                        <Accordion.Panel><SimpleGrid cols={3}>{attributes.photo_gallery?.filter(url=>url).map((url,i) => <Image key={i} src={url} radius="md"/>)}</SimpleGrid></Accordion.Panel>
                    </Accordion.Item>
                </Accordion>
                
                 <Box mt={60}>
                    <Center><Title order={3} c="dimmed">NEARBY</Title></Center>
                    <NearbyMap poi={poi} />
                </Box>
            </Container>
        </Box>
    );
};

export default PoiDetailPage;