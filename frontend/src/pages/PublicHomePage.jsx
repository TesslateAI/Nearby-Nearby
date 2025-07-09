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
    return (
        <Paper withBorder radius="md" p={0} component={Link} to={`/poi/detail/${poi.id}`} style={{ textDecoration: 'none' }}>
            <Image src={poi.featured_image_url || 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'} height={160} />
            <Stack p="md" spacing="xs">
                {poi.categories.length > 0 && <Group>{poi.categories.slice(0, 2).map(cat => <Badge key={cat.id} color="teal">{cat.name}</Badge>)}</Group>}
                <Title order={4}>{poi.name}</Title>
                <Group gap="xs"><IconMapPin size={14} /><Text size="sm">{poi.address_full || poi.address_city || 'Location'}</Text></Group>
                <Badge color={poi.status === 'Fully Open' ? 'green' : 'orange'} variant="light" size="sm">{poi.status}</Badge>
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
        if (search.trim().length < 3) {
            notifications.show({ title: 'Search too short', message: 'Please enter at least 3 characters to search.', color: 'yellow' });
            return;
        }
        setLoading(true);
        try {
            const response = await api.get(`/pois/search-by-location?q=${search}`);
            const data = await response.json();
            setPois(data);
            setSearchTitle(`Results near "${search}"`);
        } catch (error) {
            notifications.show({ title: 'Search Error', message: 'Could not perform search.', color: 'red' });
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