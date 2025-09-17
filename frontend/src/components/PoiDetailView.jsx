import { useState, useEffect } from 'react';
import { Title, Text, Button, Stack, Badge, Group, Accordion, List, SimpleGrid, ThemeIcon, Box, Card, Loader, Anchor } from '@mantine/core';
import { IconPencil, IconCheck, IconLink, IconPhone, IconMail, IconMapPin, IconBuilding, IconTag } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import RelationshipManager from './RelationshipManager';
import DOMPurify from 'dompurify';

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

// Helper for single text attributes (with potential HTML content)
const TextAttribute = ({ label, value }) => {
    if (!value) return null;

    return (
        <Box>
            <Text component="span" fw={500} size="sm">{label}:</Text>{' '}
            <HtmlContent content={value} size="sm" style={{ display: 'inline' }} />
        </Box>
    );
}

// Helper component to render HTML content safely
const HtmlContent = ({ content, ...props }) => {
    if (!content) return null;

    // Check if content looks like HTML (contains tags)
    const isHtml = /<[^>]*>/.test(content);

    if (isHtml) {
        const sanitizedHtml = DOMPurify.sanitize(content, {
            ALLOWED_TAGS: [
                'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a',
                'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
            ],
            ALLOWED_ATTR: ['href', 'target', 'rel'],
            ALLOW_DATA_ATTR: false,
        });

        return (
            <Text
                {...props}
                dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                style={{
                    '& p': { margin: 0, marginBottom: '0.5em' },
                    '& p:last-child': { marginBottom: 0 },
                    '& ul, & ol': { marginBottom: '0.5em', paddingLeft: '1.5em' },
                    '& li': { marginBottom: '0.25em' },
                    '& a': { color: 'var(--mantine-color-blue-6)', textDecoration: 'underline' },
                    ...props.style
                }}
            />
        );
    }

    // Fallback to plain text rendering
    return <Text {...props}>{content}</Text>;
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
                <Card 
                    withBorder 
                    p="sm" 
                    key={poi.id}
                    style={{ cursor: 'pointer', transition: 'transform 0.1s ease, box-shadow 0.1s ease' }}
                    component={Link}
                    to={`/poi/detail/${poi.id}`}
                    target="_blank"
                >
                    <Text fw={500}>{poi.name}</Text>
                    <Text size="xs" c="dimmed">{poi.address_full || poi.address_city}</Text>
                </Card>
            ))}
        </Stack>
    );
};

const RelatedPoiList = ({ poiId, poiName, poiType }) => {
    return (
        <RelationshipManager 
            poiId={poiId}
            poiName={poiName}
            poiType={poiType}
            readOnly={true}
            showManageButton={false}
        />
    );
};

const PoiDetailView = ({ poi, onEditClick }) => {
    const { 
        id, 
        name, 
        description_long, 
        description_short, 
        poi_type, 
        status, 
        status_message, 
        is_verified, 
        is_disaster_hub,
        address_full,
        address_street,
        address_city,
        address_state,
        address_zip,
        website_url,
        phone_number,
        email,
        photos,
        hours,
        amenities,
        contact_info,
        compliance,
        custom_fields,
        business,
        park,
        trail,
        event,
        categories,
        created_at,
        last_updated
    } = poi;
    
    if (!poi) return null;

    // Get the description (prefer long, fallback to short)
    const description = description_long || description_short;
    
    // Build full address
    const fullAddress = [address_street, address_city, address_state, address_zip].filter(Boolean).join(', ');
    const displayAddress = address_full || fullAddress;

    return (
        <Stack>
            <Group justify="space-between" align="center">
                <Group>
                    <Title order={3}>{name}</Title>
                    {is_verified && <ThemeIcon color="green" variant="light" radius="xl"><IconCheck size={16} /></ThemeIcon>}
                    {is_disaster_hub && <ThemeIcon color="red" variant="light" radius="xl"><IconBuilding size={16} /></ThemeIcon>}
                </Group>
                {onEditClick && (
                    <Button onClick={onEditClick} leftSection={<IconPencil size={16} />} size="sm" variant="light">
                        Edit POI
                    </Button>
                )}
            </Group>
            <Badge tt="capitalize" color="purple">{poi_type}</Badge>
            <Badge color={status === 'Fully Open' ? 'green' : 'orange'}>{status}</Badge>
            {status_message && <Text c="dimmed" size="sm">"{status_message}"</Text>}
            
            <Accordion 
                multiple 
                defaultValue={['general', 'contact', 'details']}
                styles={(theme) => ({
                    control: {
                        backgroundColor: theme.colors.gray[1],
                        border: 'none',
                        borderRadius: theme.radius.md,
                        marginBottom: 0,
                        '&:hover': {
                            backgroundColor: theme.colors.gray[2],
                        },
                        '&[data-active]': {
                            backgroundColor: theme.colors['deep-purple'][1],
                        },
                        '&:focus': {
                            outline: 'none',
                        },
                    },
                    content: {
                        backgroundColor: theme.colors.gray[0],
                        border: 'none',
                        paddingTop: theme.spacing.xs,
                        borderRadius: theme.radius.md,
                        marginTop: -theme.spacing.xs,
                    },
                    item: {
                        border: 'none',
                        backgroundColor: 'transparent',
                        marginBottom: theme.spacing.sm,
                        borderRadius: theme.radius.md,
                        overflow: 'hidden',
                    },
                })}
            >
                <Accordion.Item value="general">
                    <Accordion.Control>General Information</Accordion.Control>
                    <Accordion.Panel>
                        <Stack>
                            {description ? (
                                <HtmlContent content={description} />
                            ) : (
                                <Text c="dimmed">No description provided.</Text>
                            )}
                            {categories && categories.length > 0 ? (
                                <Text size="sm">
                                    <Text component="span" fw={500}>Categories:</Text> {categories.map(c => c.name).join(', ')}
                                </Text>
                            ) : (
                                <Text size="sm" c="dimmed">No categories assigned.</Text>
                            )}
                            {business?.price_range ? (
                                <Text size="sm">
                                    <Text component="span" fw={500}>Price Range:</Text> {business.price_range}
                                </Text>
                            ) : null}
                            {trail?.length_text ? (
                                <Text size="sm">
                                    <Text component="span" fw={500}>Length:</Text> {trail.length_text}
                                </Text>
                            ) : null}
                            {trail?.difficulty ? (
                                <Text size="sm">
                                    <Text component="span" fw={500}>Difficulty:</Text> {trail.difficulty}
                                </Text>
                            ) : null}
                            {trail?.route_type ? (
                                <Text size="sm">
                                    <Text component="span" fw={500}>Route Type:</Text> {trail.route_type}
                                </Text>
                            ) : null}
                            {park?.drone_usage_policy ? (
                                <Text size="sm">
                                    <Text component="span" fw={500}>Drone Policy:</Text> {park.drone_usage_policy}
                                </Text>
                            ) : null}
                            {event?.start_datetime ? (
                                <Text size="sm">
                                    <Text component="span" fw={500}>Event Start:</Text> {new Date(event.start_datetime).toLocaleString()}
                                </Text>
                            ) : null}
                            {event?.end_datetime ? (
                                <Text size="sm">
                                    <Text component="span" fw={500}>Event End:</Text> {new Date(event.end_datetime).toLocaleString()}
                                </Text>
                            ) : null}
                            {event?.cost_text ? (
                                <Text size="sm">
                                    <Text component="span" fw={500}>Cost:</Text> {event.cost_text}
                                </Text>
                            ) : null}
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item value="location">
                    <Accordion.Control>Location & Address</Accordion.Control>
                    <Accordion.Panel>
                        <Stack>
                            {displayAddress ? (
                                <Group wrap="nowrap" gap="xs">
                                    <IconMapPin size={16}/>
                                    <Text size="sm">{displayAddress}</Text>
                                </Group>
                            ) : (
                                <Text size="sm" c="dimmed">No address information available.</Text>
                            )}
                            {custom_fields && Object.keys(custom_fields).length > 0 ? (
                                <Box>
                                    <Text fw={500} size="sm" mb="xs">Additional Notes</Text>
                                    {Object.entries(custom_fields).map(([key, value]) => (
                                        <Box key={key} mb={4}>
                                            <Text component="span" fw={500} size="sm">{key}:</Text>{' '}
                                            <HtmlContent content={value} size="sm" style={{ display: 'inline' }} />
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                <Text size="sm" c="dimmed">No additional notes available.</Text>
                            )}
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item value="contact">
                    <Accordion.Control>Contact & Links</Accordion.Control>
                    <Accordion.Panel>
                        <Stack>
                            {phone_number ? (
                                <Group wrap="nowrap" gap="xs">
                                    <IconPhone size={16}/>
                                    <Text size="sm">{phone_number}</Text>
                                </Group>
                            ) : (
                                <Text size="sm" c="dimmed">No phone number available.</Text>
                            )}
                            {email ? (
                                <Group wrap="nowrap" gap="xs">
                                    <IconMail size={16}/>
                                    <Text size="sm">{email}</Text>
                                </Group>
                            ) : (
                                <Text size="sm" c="dimmed">No email address available.</Text>
                            )}
                            {website_url ? (
                                <Group wrap="nowrap" gap="xs">
                                    <IconLink size={16}/>
                                    <Text component="a" href={website_url} target="_blank" size="sm">{website_url}</Text>
                                </Group>
                            ) : (
                                <Text size="sm" c="dimmed">No website available.</Text>
                            )}
                            {contact_info && Object.keys(contact_info).length > 0 ? (
                                <Box>
                                    <Text fw={500} size="sm" mb="xs">Additional Contact Info</Text>
                                    {Object.entries(contact_info).map(([key, value]) => (
                                        <Box key={key} mb={4}>
                                            <Text component="span" fw={500} size="sm">{key}:</Text>{' '}
                                            {typeof value === 'object' ? (
                                                <Text component="span" size="sm">{JSON.stringify(value)}</Text>
                                            ) : (
                                                <HtmlContent content={value} size="sm" style={{ display: 'inline' }} />
                                            )}
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                <Text size="sm" c="dimmed">No additional contact information available.</Text>
                            )}
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item value="details">
                    <Accordion.Control>Amenities & Details</Accordion.Control>
                    <Accordion.Panel>
                        {((amenities && Object.keys(amenities).length > 0) || (compliance && Object.keys(compliance).length > 0)) ? (
                            <SimpleGrid cols={2} spacing="md">
                                {amenities && Object.keys(amenities).length > 0 && (
                                    Object.entries(amenities).map(([key, value]) => (
                                        <AttributeList key={key} title={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} data={Array.isArray(value) ? value : [value]} />
                                    ))
                                )}
                                {compliance && Object.keys(compliance).length > 0 && (
                                    <Box>
                                        <Text fw={500} size="sm" mb="xs">Compliance & Requirements</Text>
                                        {Object.entries(compliance).map(([key, value]) => (
                                            <Box key={key} mb={4}>
                                                <Text component="span" fw={500} size="sm">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</Text>{' '}
                                                {typeof value === 'boolean' ? (
                                                    <Text component="span" size="sm">{value ? 'Yes' : 'No'}</Text>
                                                ) : (
                                                    <HtmlContent content={value} size="sm" style={{ display: 'inline' }} />
                                                )}
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </SimpleGrid>
                        ) : (
                            <Text size="sm" c="dimmed">No amenities or compliance information available.</Text>
                        )}
                    </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item value="attributes">
                    <Accordion.Control leftSection={<IconTag size={16} />}>Attributes</Accordion.Control>
                    <Accordion.Panel>
                        <Stack>
                            {business && Object.keys(business).length > 0 && (
                                <Box>
                                    <Text fw={500} size="sm" mb="xs" c="deep-purple.7">Business Attributes</Text>
                                    {Object.entries(business).map(([key, value]) => (
                                        <Box key={key} mb={4}>
                                            <Text component="span" fw={500} size="sm">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</Text>{' '}
                                            {typeof value === 'boolean' ? (
                                                <Text component="span" size="sm">{value ? 'Yes' : 'No'}</Text>
                                            ) : (
                                                <HtmlContent content={value} size="sm" style={{ display: 'inline' }} />
                                            )}
                                        </Box>
                                    ))}
                                </Box>
                            )}
                            {park && Object.keys(park).length > 0 && (
                                <Box>
                                    <Text fw={500} size="sm" mb="xs" c="brand-green.7">Park Attributes</Text>
                                    {Object.entries(park).map(([key, value]) => (
                                        <Box key={key} mb={4}>
                                            <Text component="span" fw={500} size="sm">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</Text>{' '}
                                            {typeof value === 'boolean' ? (
                                                <Text component="span" size="sm">{value ? 'Yes' : 'No'}</Text>
                                            ) : (
                                                <HtmlContent content={value} size="sm" style={{ display: 'inline' }} />
                                            )}
                                        </Box>
                                    ))}
                                </Box>
                            )}
                            {trail && Object.keys(trail).length > 0 && (
                                <Box>
                                    <Text fw={500} size="sm" mb="xs" c="blue.7">Trail Attributes</Text>
                                    {Object.entries(trail).map(([key, value]) => (
                                        <Box key={key} mb={4}>
                                            <Text component="span" fw={500} size="sm">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</Text>{' '}
                                            {typeof value === 'boolean' ? (
                                                <Text component="span" size="sm">{value ? 'Yes' : 'No'}</Text>
                                            ) : (
                                                <HtmlContent content={value} size="sm" style={{ display: 'inline' }} />
                                            )}
                                        </Box>
                                    ))}
                                </Box>
                            )}
                            {event && Object.keys(event).length > 0 && (
                                <Box>
                                    <Text fw={500} size="sm" mb="xs" c="orange.7">Event Attributes</Text>
                                    {Object.entries(event).map(([key, value]) => (
                                        <Box key={key} mb={4}>
                                            <Text component="span" fw={500} size="sm">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</Text>{' '}
                                            {typeof value === 'boolean' ? (
                                                <Text component="span" size="sm">{value ? 'Yes' : 'No'}</Text>
                                            ) : (
                                                <HtmlContent content={value} size="sm" style={{ display: 'inline' }} />
                                            )}
                                        </Box>
                                    ))}
                                </Box>
                            )}
                            {(!business || Object.keys(business).length === 0) && 
                             (!park || Object.keys(park).length === 0) && 
                             (!trail || Object.keys(trail).length === 0) && 
                             (!event || Object.keys(event).length === 0) && (
                                <Text size="sm" c="dimmed">No specific attributes available for this POI type.</Text>
                            )}
                        </Stack>
                    </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item value="hours">
                    <Accordion.Control>Hours & Schedule</Accordion.Control>
                    <Accordion.Panel>
                        {hours && Object.keys(hours).length > 0 ? (
                            <Stack>
                                {Object.entries(hours).map(([day, schedule]) => (
                                    <Box key={day}>
                                        <Text fw={500} size="sm" tt="capitalize">{day}</Text>
                                        {Array.isArray(schedule) ? (
                                            schedule.map((period, index) => (
                                                <Text key={index} size="sm" c="dimmed">
                                                    {period.open} - {period.close}
                                                </Text>
                                            ))
                                        ) : (
                                            <Text size="sm" c="dimmed">{schedule}</Text>
                                        )}
                                    </Box>
                                ))}
                            </Stack>
                        ) : (
                            <Text size="sm" c="dimmed">No hours information available.</Text>
                        )}
                    </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item value="nearby">
                    <Accordion.Control>What's Nearby?</Accordion.Control>
                    <Accordion.Panel>
                        <NearbyPoiList poiId={id} />
                    </Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item value="related">
                    <Accordion.Control leftSection={<IconLink size={16} />}>Related POIs</Accordion.Control>
                    <Accordion.Panel>
                        <RelatedPoiList poiId={id} poiName={name} poiType={poi_type} />
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>
        </Stack>
    );
};

export default PoiDetailView; 