import { useState, useEffect } from 'react';
import { Container, Title, Text, SimpleGrid, Paper, Group, Badge, Button, Image, Stack, Center, TextInput, Box, Card, Skeleton } from '@mantine/core';
import { IconArrowRight, IconMapPin, IconSearch, IconToolsKitchen2, IconTrees, IconDog, IconMask, IconBuildingCircus, IconHome2 } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import api from '../utils/api';
import { notifications } from '@mantine/notifications';
import { Link } from 'react-router-dom';

const categoryIcons = {
    'Food & Drinks': <IconToolsKitchen2 />, 'Parks & Recreation': <IconTrees />, 'Pet Friendly': <IconDog />,
    'Arts & Culture': <IconMask />, 'Events & Experiences': <IconBuildingCircus />, 'Travel & Staycation': <IconHome2 />,
    'Shopping': <IconHome2 />, 'Family & Community': <IconHome2 />,
};

const PoiCard = ({ poi }) => {
    const isEvent = poi.poi_type === 'event';
    
    // Handle different data structures (old vs new search API)
    const categories = poi.categories || [];
    const address = poi.address_city || poi.address_full || 'Location';
    const status = poi.status || 'Unknown';
    const relevanceScore = poi.relevance_score ? Math.round(poi.relevance_score * 100) : null;
    const distance = poi.distance_km ? `${poi.distance_km.toFixed(1)} km` : null;
    
    return (
        <Paper withBorder radius="md" p={0} component={Link} to={`/poi/detail/${poi.id}`} style={{ textDecoration: 'none' }}>
            <Image src={poi.featured_image_url || 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'} height={160} />
            <Stack p="md" spacing="xs">
                <Group justify="space-between">
                    {categories.length > 0 && (
                        <Group>
                            {categories.slice(0, 2).map(cat => (
                                <Badge key={cat.id || cat} color="teal" size="sm">
                                    {cat.name || cat}
                                </Badge>
                            ))}
                        </Group>
                    )}
                    {relevanceScore && (
                        <Badge color="blue" variant="light" size="sm">
                            {relevanceScore}% match
                        </Badge>
                    )}
                </Group>
                <Title order={4}>{poi.name}</Title>
                <Group gap="xs">
                    <IconMapPin size={14} />
                    <Text size="sm">{address}</Text>
                </Group>
                <Group justify="space-between">
                    <Badge color={status === 'ACTIVE' ? 'green' : 'orange'} variant="light" size="sm">
                        {status}
                    </Badge>
                    {distance && (
                        <Text size="xs" c="dimmed">
                            {distance} away
                        </Text>
                    )}
                </Group>
            </Stack>
        </Paper>
    );
};

const SearchResults = ({ results, title }) => (
    <Container size="lg" py="xl">
        <Title order={2} mb="lg">{title}</Title>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
            {results.map(poi => <PoiCard key={poi.id} poi={poi} />)}
        </SimpleGrid>
    </Container>
)

const LoadingState = () => (
     <Container size="lg" py="xl">
        <Title order={2} mb="lg"><Skeleton height={30} width={300} /></Title>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
            {Array.from({length: 4}).map((_, i) => <Skeleton key={i} height={300} />)}
        </SimpleGrid>
    </Container>
)


const PublicHomePage = () => {
    const [categories, setCategories] = useState([]);
    const [pois, setPois] = useState([]);
    const [searchTitle, setSearchTitle] = useState("Popular Nearby");
    const [loading, setLoading] = useState(true);

    const form = useForm({ initialValues: { search: '' } });

    useEffect(() => {
        // Fetch initial data
        const fetchData = async () => {
            try {
                const [poisResponse, categoriesResponse] = await Promise.all([
                    api.get('/pois/?limit=8'),
                    api.get('/categories/tree')
                ]);
                const poisData = await poisResponse.json();
                const categoriesData = await categoriesResponse.json();
                setPois(poisData);
                setCategories(categoriesData.slice(0, 6));
            } catch (error) {
                console.error('Error fetching initial data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSearch = async ({ search }) => {
        if (search.trim().length < 2) {
            notifications.show({ title: 'Search too short', message: 'Please enter at least 2 characters to search.', color: 'yellow' });
            return;
        }
        setLoading(true);
        try {
            // Use the new natural language search API
            // For demo purposes, using a default location (Chatham County, NC)
            const searchRequest = {
                query: search,
                user_location: [35.7796, -79.4194], // Chatham County, NC coordinates
                radius_km: 50,
                limit: 20
            };
            
            const response = await api.post('/search', searchRequest);
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                setPois(data.results);
                setSearchTitle(`Found ${data.total_results} results for "${search}"`);
                
                // Show search insights if available
                if (data.query_interpretation?.intent) {
                    const intent = data.query_interpretation.intent;
                    notifications.show({ 
                        title: 'Search Insights', 
                        message: `Detected intent: ${intent.intent} (confidence: ${Math.round(intent.confidence * 100)}%)`, 
                        color: 'blue' 
                    });
                }
            } else {
                setPois([]);
                setSearchTitle(`No results found for "${search}"`);
                notifications.show({ 
                    title: 'No Results', 
                    message: 'Try different keywords or expand your search area.', 
                    color: 'yellow' 
                });
            }
        } catch (error) {
            console.error('Search error:', error);
            notifications.show({ 
                title: 'Search Error', 
                message: 'Could not perform search. Please try again.', 
                color: 'red' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            {/* Hero Section */}
            <Box style={{ background: 'linear-gradient(to right, #6A1B9A, #9C27B0)', color: 'white' }} py={80}>
                <Container>
                    <Center><Stack align="center" gap="md">
                        <Title order={1} style={{ fontSize: '3rem' }}>Local is the new global!</Title>
                        <Text size="xl" ta="center">Discover local attractions, businesses, events, and hidden gems in your own county.</Text>
                         <form onSubmit={form.onSubmit(handleSearch)} style={{ width: '100%', maxWidth: '500px' }}>
                            <Group><TextInput {...form.getInputProps('search')} placeholder="Type a location to see what's nearby" leftSection={<IconSearch size={16} />} style={{ flexGrow: 1 }} size="lg" radius="xl" />
                                <Button type="submit" size="lg" radius="xl" color="teal" loading={loading}>Search</Button>
                            </Group>
                        </form>
                    </Stack></Center>
                </Container>
            </Box>
            
            {loading ? <LoadingState /> : <SearchResults results={pois} title={searchTitle} />}

            {/* Categories Section */}
            <Container size="lg" py="xl">
                <Title order={2} mb="lg">Explore you're nearby</Title>
                <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }}>
                    {categories.map(cat => (
                        <Paper withBorder p="md" key={cat.id} component={Link} to="#" style={{ textDecoration: 'none' }}>
                            <Group justify="space-between"><Stack gap="xs">
                                {categoryIcons[cat.name] || <IconHome2 />}
                                <Text fw={500}>{cat.name}</Text>
                                <Text size="sm" c="dimmed">{cat.pois?.length || Math.floor(Math.random() * 50) + 10} places</Text>
                            </Stack><IconArrowRight /></Group>
                        </Paper>
                    ))}
                </SimpleGrid>
            </Container>

             {/* In the Spotlight Section (Static) */}
            <Container size="lg" py="xl"><Title order={2} mb="lg">In the spotlight</Title>
                 <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>{Array.from({ length: 4 }).map((_, i) => (
                    <Paper withBorder p="md" key={i}><Center><Image src="/vite.svg" h={60} w="auto" /></Center><Text size="sm" c="dimmed" mt="md">April 30, 2025 • 10 min read</Text><Text fw={500} mt="xs">Top 10 Parks to Visit in Chatham</Text></Paper>
                 ))}</SimpleGrid>
            </Container>

            {/* Newsletter Section (Static) */}
            <Box bg="dark.6" c="white" py={60} mt="xl">
                <Container><Title order={2} ta="center" mb="lg">Join our vibrant community!</Title>
                    <Group justify="center"><TextInput placeholder="Enter your email here" size="lg" radius="xl" w={{ base: '100%', sm: 400 }} /><Button size="lg" radius="xl" color="yellow">Subscribe</Button></Group>
                </Container>
            </Box>
        </Box>
    );
};

export default PublicHomePage;