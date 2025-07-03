import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from '@mantine/form';
import {
  TextInput, Button, Group, Box, Title, Select, Textarea, Paper, SimpleGrid,
  Divider, Text, Radio, Switch, Stack, Checkbox, Stepper, Accordion,
} from '@mantine/core';
import api from '../utils/api';
import { notifications } from '@mantine/notifications';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { CategorySelector } from './CategorySelector';
import DynamicAttributeForm from './DynamicAttributeForm';

const API_URL = import.meta.env.VITE_API_BASE_URL;

// --- Map Component Logic ---
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [center, zoom, map]);
  return null;
}
function DraggableMarker({ position, onPositionChange }) {
  const map = useMap();
  useMapEvents({ click(e) { onPositionChange(e.latlng); map.flyTo(e.latlng, map.getZoom()); } });
  const handleDragEnd = (event) => { if (event.target != null) { onPositionChange(event.target.getLatLng()); } };
  return <Marker draggable={true} eventHandlers={{ dragend: handleDragEnd }} position={position} />;
}
// --- End Map Component Logic ---

const emptyInitialValues = {
  // Core POI Info
  name: '',
  poi_type: 'BUSINESS',
  description_long: null,
  description_short: null,
  status: 'Fully Open',
  status_message: null,
  is_verified: false,
  is_disaster_hub: false,
  // Address fields
  address_full: null,
  address_street: null,
  address_city: null,
  address_state: 'NC',
  address_zip: null,
  // Contact info
  website_url: null,
  phone_number: null,
  email: null,
  // Location coordinates
  longitude: -79.17,
  latitude: 35.72,
  // JSONB fields
  photos: { featured: '', gallery: [] },
  hours: {},
  amenities: {},
  contact_info: {},
  compliance: {},
  custom_fields: {},
  // Categories
  category_ids: [],
  // Business specific
  business: {
    listing_tier: 'free',
    price_range: null
  },
  // Park specific
  park: {
    drone_usage_policy: null
  },
  // Trail specific
  trail: {
    length_text: null,
    difficulty: null,
    route_type: null
  },
  // Event specific
  event: {
    start_datetime: '',
    end_datetime: null,
    cost_text: null
  }
};

function POIForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(0);

  const form = useForm({
    initialValues: emptyInitialValues,
    validate: (values) => {
      const errors = {};

      // Step 0: Core Info validation
      if (activeStep === 0) {
        if (!values.name.trim()) {
          errors.name = 'Name is required';
        } else if (values.name.trim().length < 2) {
          errors.name = 'Name must have at least 2 characters';
        }
      }

      // Step 1: Categories validation
      if (activeStep === 1) {
        // Validate subtype-specific required fields
        if (values.poi_type === 'EVENT') {
          if (!values.event?.start_datetime) {
            errors['event.start_datetime'] = 'Start date/time is required for events';
          }
        }
      }

      // Step 2: Location validation
      if (activeStep === 2) {
        if (!values.latitude || !values.longitude) {
          errors.latitude = 'Location coordinates are required';
          errors.longitude = 'Location coordinates are required';
        }
      }

      // Final validation (step 5) - check all required fields
      if (activeStep === 5) {
        if (!values.name.trim()) {
          errors.name = 'Name is required';
        } else if (values.name.trim().length < 2) {
          errors.name = 'Name must have at least 2 characters';
        }
        
        if (!values.latitude || !values.longitude) {
          errors.latitude = 'Location coordinates are required';
          errors.longitude = 'Location coordinates are required';
        }
        
        if (values.poi_type === 'EVENT' && !values.event?.start_datetime) {
          errors['event.start_datetime'] = 'Start date/time is required for events';
        }
      }

      return errors;
    },
  });

  const nextStep = () => {
    if (!form.validate().hasErrors) {
      console.log('Current activeStep:', activeStep);
      console.log('Previous completedSteps:', completedSteps);
      setCompletedSteps(activeStep);
      setActiveStep((current) => Math.min(5, current + 1));
    }
  };
  const prevStep = () => setActiveStep((current) => Math.max(0, current - 1));

  useEffect(() => {
    if (isEditing) {
      api.get(`/pois/${id}`)
        .then(async response => {
          const poi = await response.json();
          const initial = { ...emptyInitialValues };

          // Populate top-level fields
          Object.assign(initial, {
            name: poi.name,
            description_long: poi.description_long || null,
            description_short: poi.description_short || null,
            poi_type: poi.poi_type,
            status: poi.status,
            status_message: poi.status_message || null,
            is_verified: poi.is_verified,
            is_disaster_hub: poi.is_disaster_hub,
            address_full: poi.address_full || null,
            address_street: poi.address_street || null,
            address_city: poi.address_city || null,
            address_state: poi.address_state,
            address_zip: poi.address_zip || null,
            website_url: poi.website_url || null,
            phone_number: poi.phone_number || null,
            email: poi.email || null,
            photos: poi.photos || { featured: '', gallery: [] },
            hours: poi.hours || {},
            amenities: poi.amenities || {},
            contact_info: poi.contact_info || {},
            compliance: poi.compliance || {},
            custom_fields: poi.custom_fields || {},
            category_ids: poi.categories?.map(c => c.id) || [],
          });

          // Populate location coordinates
          if (poi.location) {
            initial.longitude = poi.location.coordinates[0];
            initial.latitude = poi.location.coordinates[1];
          }

          // Populate subtype specific fields
          if (poi.poi_type === 'BUSINESS' && poi.business) {
            initial.business = {
              ...initial.business,
              ...poi.business,
              price_range: poi.business.price_range || null
            };
          } else if (poi.poi_type === 'PARK' && poi.park) {
            initial.park = {
              ...initial.park,
              ...poi.park,
              drone_usage_policy: poi.park.drone_usage_policy || null
            };
          } else if (poi.poi_type === 'TRAIL' && poi.trail) {
            initial.trail = {
              ...initial.trail,
              ...poi.trail,
              length_text: poi.trail.length_text || null,
              difficulty: poi.trail.difficulty || null,
              route_type: poi.trail.route_type || null
            };
          } else if (poi.poi_type === 'EVENT' && poi.event) {
            initial.event = {
              ...initial.event,
              ...poi.event,
              end_datetime: poi.event.end_datetime || null,
              cost_text: poi.event.cost_text || null
            };
          }

          form.setValues(initial);
          form.setInitialValues(initial);
        })
        .catch(error => notifications.show({ title: 'Error', message: 'Failed to fetch POI data.', color: 'red' }));
    }
  }, [id, isEditing]);

  const handleSubmit = async (values) => {
    // Clean up empty string values and convert them to null for optional fields
    const cleanValues = { ...values };

    // Clean business fields
    if (cleanValues.business) {
      if (cleanValues.business.price_range === '') {
        cleanValues.business.price_range = null;
      }
    }

    // Clean other optional string fields
    const optionalStringFields = [
      'description_long', 'description_short', 'status_message',
      'address_full', 'address_street', 'address_city', 'address_zip',
      'website_url', 'phone_number', 'email'
    ];

    optionalStringFields.forEach(field => {
      if (cleanValues[field] === '') {
        cleanValues[field] = null;
      }
    });

    // Clean subtype-specific fields
    if (cleanValues.park && cleanValues.park.drone_usage_policy === '') {
      cleanValues.park.drone_usage_policy = null;
    }

    if (cleanValues.trail) {
      if (cleanValues.trail.length_text === '') cleanValues.trail.length_text = null;
      if (cleanValues.trail.difficulty === '') cleanValues.trail.difficulty = null;
      if (cleanValues.trail.route_type === '') cleanValues.trail.route_type = null;
    }

    if (cleanValues.event) {
      if (cleanValues.event.cost_text === '') cleanValues.event.cost_text = null;
    }

    const payload = {
      name: cleanValues.name,
      poi_type: cleanValues.poi_type,
      description_long: cleanValues.description_long,
      description_short: cleanValues.description_short,
      status: cleanValues.status,
      status_message: cleanValues.status_message,
      is_verified: cleanValues.is_verified,
      is_disaster_hub: cleanValues.is_disaster_hub,
      address_full: cleanValues.address_full,
      address_street: cleanValues.address_street,
      address_city: cleanValues.address_city,
      address_state: cleanValues.address_state,
      address_zip: cleanValues.address_zip,
      website_url: cleanValues.website_url,
      phone_number: cleanValues.phone_number,
      email: cleanValues.email,
      photos: cleanValues.photos,
      hours: cleanValues.hours,
      amenities: cleanValues.amenities,
      contact_info: cleanValues.contact_info,
      compliance: cleanValues.compliance,
      custom_fields: cleanValues.custom_fields,
      category_ids: cleanValues.category_ids,
      location: {
        type: "Point",
        coordinates: [cleanValues.longitude, cleanValues.latitude]
      },
      business: cleanValues.poi_type === 'BUSINESS' ? cleanValues.business : null,
      park: cleanValues.poi_type === 'PARK' ? cleanValues.park : null,
      trail: cleanValues.poi_type === 'TRAIL' ? cleanValues.trail : null,
      event: cleanValues.poi_type === 'EVENT' ? cleanValues.event : null,
    };

    const apiCall = isEditing ? api.put(`/pois/${id}`, payload) : api.post('/pois/', payload);

    try {
      const response = await apiCall;
      if (response.ok) {
        notifications.show({ title: 'Success!', message: `POI "${cleanValues.name}" was ${isEditing ? 'updated' : 'created'}!`, color: 'green' });
        navigate('/');
      } else {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} POI`);
      }
    } catch (error) {
      notifications.show({ title: 'Submission Error', message: `Failed to ${isEditing ? 'update' : 'create'} POI.`, color: 'red' });
    }
  };

  const currentPosition = [form.values.latitude, form.values.longitude];
  const isBusiness = form.values.poi_type === 'BUSINESS';
  const isPark = form.values.poi_type === 'PARK';
  const isTrail = form.values.poi_type === 'TRAIL';
  const isEvent = form.values.poi_type === 'EVENT';
  const isPaidListing = isBusiness && ['paid', 'paid_founding', 'sponsor'].includes(form.values.business?.listing_tier);

  return (
    <Paper maw={1200} mx="auto">
      <Title order={2} c="deep-purple.7" mb="xl">{isEditing ? `Editing: ${form.values.name}` : 'Create New Point of Interest'}</Title>
      <Text size="sm" c="dimmed" mb="md">Fields marked with * are required</Text>

      <Stepper
        active={activeStep}
        completed={completedSteps}
        onStepClick={setActiveStep}
        breakpoint="sm"
        allowNextStepsSelect={false}
        size="sm"
        styles={{
          root: { marginBottom: 'xl' },
          step: { flex: 1, minWidth: 0 },
          stepLabel: { fontSize: '0.875rem' },
          stepDescription: { fontSize: '0.75rem' },
          separator: {
            width: '30px',
            borderStyle: 'solid',
            borderWidth: '2px',
            borderColor: 'var(--mantine-color-gray-4)',
            backgroundColor: 'transparent'
          },
          separatorActive: {
            borderColor: 'var(--mantine-color-deep-purple-6)'
          },
          separatorCompleted: {
            borderColor: 'var(--mantine-color-deep-purple-6)'
          }
        }}
      >
        <Stepper.Step label="Core Info" description="Basic details">
          <Stack mt="xl" p="md">
            <SimpleGrid cols={2}>
              <TextInput withAsterisk label="POI Name/Title" {...form.getInputProps('name')} />
              <Select withAsterisk label="POI Type" data={['BUSINESS', 'PARK', 'TRAIL', 'EVENT']} {...form.getInputProps('poi_type')} />
            </SimpleGrid>
            <Textarea label="Full Description" {...form.getInputProps('description_long')} minRows={4} maxLength={isBusiness && !isPaidListing ? 200 : undefined} description={isBusiness && !isPaidListing ? '200 character limit for free listings' : 'Unlimited characters'} />
            <Textarea label="Short Description" placeholder="A brief summary" {...form.getInputProps('description_short')} minRows={2} maxLength={250} description="250 character summary." />
            <SimpleGrid cols={2}>
              <Select label="Status" data={['Fully Open', 'Partly Open', 'Temporary Hour Changes', 'Temporarily Closed', 'Call Ahead', 'Permanently Closed', 'Warning', 'Limited Capacity', 'Coming Soon', 'Under Development', 'Alert']} {...form.getInputProps('status')} />
              <TextInput label="Status Message" placeholder="e.g., Closed for private event" maxLength={100} {...form.getInputProps('status_message')} />
            </SimpleGrid>
            <SimpleGrid cols={2}>
              <Switch label="This listing is verified by Nearby Nearby" {...form.getInputProps('is_verified', { type: 'checkbox' })} />
              <Switch label="This is a disaster hub" {...form.getInputProps('is_disaster_hub', { type: 'checkbox' })} />
            </SimpleGrid>
          </Stack>
        </Stepper.Step>

        <Stepper.Step label="Categories" description="Categories & type">
          <Stack mt="xl" p="md">
            <CategorySelector value={form.values.category_ids} onChange={(ids) => form.setFieldValue('category_ids', ids)} />

            {isBusiness && (
              <>
                <Divider my="md" label="Business Details" />
                <SimpleGrid cols={2}>
                  <Select label="Listing Tier" data={['free', 'paid', 'paid_founding', 'sponsor']} {...form.getInputProps('business.listing_tier')} />
                  <Select label="Price Range" placeholder="Select price range" data={['$', '$$', '$$$', '$$$$']} {...form.getInputProps('business.price_range')} />
                </SimpleGrid>
              </>
            )}

            {isPark && (
              <>
                <Divider my="md" label="Park Details" />
                <TextInput label="Drone Usage Policy" placeholder="e.g., Allowed with permit" {...form.getInputProps('park.drone_usage_policy')} />
              </>
            )}

            {isTrail && (
              <>
                <Divider my="md" label="Trail Details" />
                <SimpleGrid cols={3}>
                  <TextInput label="Length" placeholder="e.g., 2.5 miles" {...form.getInputProps('trail.length_text')} />
                  <Select label="Difficulty" placeholder="Select difficulty" data={['easy', 'moderate', 'difficult', 'expert']} {...form.getInputProps('trail.difficulty')} />
                  <Select label="Route Type" placeholder="Select route type" data={['loop', 'out_and_back', 'point_to_point']} {...form.getInputProps('trail.route_type')} />
                </SimpleGrid>
              </>
            )}

            {isEvent && (
              <>
                <Divider my="md" label="Event Details" />
                <SimpleGrid cols={2}>
                  <TextInput withAsterisk type="datetime-local" label="Start Date/Time" {...form.getInputProps('event.start_datetime')} />
                  <TextInput type="datetime-local" label="End Date/Time" {...form.getInputProps('event.end_datetime')} />
                </SimpleGrid>
                <TextInput label="Cost" placeholder="e.g., Free, $15, Donation suggested" {...form.getInputProps('event.cost_text')} />
              </>
            )}
          </Stack>
        </Stepper.Step>

        <Stepper.Step label="Location" description="Address & map">
          <Stack mt="xl" p="md">
            <Text size="sm" c="dimmed" mb="xs">Click on the map or drag the marker to set the location (required)</Text>
            <Box style={{ height: '300px', width: '100%' }} mb="md">
              <MapContainer center={currentPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
                <ChangeView center={currentPosition} zoom={13} />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <DraggableMarker position={currentPosition} onPositionChange={(latlng) => {
                  form.setFieldValue('latitude', latlng.lat);
                  form.setFieldValue('longitude', latlng.lng);
                }} />
              </MapContainer>
            </Box>

            <SimpleGrid cols={2}>
              <TextInput label="Street Address" {...form.getInputProps('address_street')} />
              <TextInput label="City" {...form.getInputProps('address_city')} />
            </SimpleGrid>
            <SimpleGrid cols={3}>
              <TextInput label="State" {...form.getInputProps('address_state')} />
              <TextInput label="ZIP Code" {...form.getInputProps('address_zip')} />
              <TextInput label="Full Address" {...form.getInputProps('address_full')} />
            </SimpleGrid>
            <SimpleGrid cols={2}>
              <TextInput withAsterisk label="Latitude" type="number" step="any" {...form.getInputProps('latitude')} />
              <TextInput withAsterisk label="Longitude" type="number" step="any" {...form.getInputProps('longitude')} />
            </SimpleGrid>
          </Stack>
        </Stepper.Step>

        <Stepper.Step label="Contact" description="Contact & hours">
          <Stack mt="xl" p="md">
            <SimpleGrid cols={2}>
              <TextInput label="Website URL" {...form.getInputProps('website_url')} />
              <TextInput label="Phone Number" {...form.getInputProps('phone_number')} />
            </SimpleGrid>
            <TextInput label="Email" type="email" {...form.getInputProps('email')} />

            <Divider my="md" label="Hours of Operation" />
            <Text size="sm" c="dimmed">Hours configuration will be added in a future update</Text>
          </Stack>
        </Stepper.Step>

        <Stepper.Step label="Attributes" description="Dynamic fields">
          <Stack mt="xl" p="md">
            <Divider my="md" label="Dynamic Attributes" />
            <DynamicAttributeForm
              poiType={form.values.poi_type}
              value={form.values.amenities}
              onChange={(value) => form.setFieldValue('amenities', value)}
            />

            <Divider my="md" label="Photos" />
            <TextInput label="Featured Image URL" {...form.getInputProps('photos.featured')} />

            <Divider my="md" label="Custom Fields" />
            <Text size="sm" c="dimmed">Custom fields will be added in a future update</Text>
          </Stack>
        </Stepper.Step>
      </Stepper>

      {activeStep === 5 && (
        <Paper p="xl" withBorder mt="xl" radius="md">
          <Stack spacing="lg">
            <Group>
              <Text size="xl" fw={700} c="deep-purple.7">Ready to Submit</Text>
              <Text size="sm" c="dimmed" style={{ flex: 1 }}>
                You are about to {isEditing ? 'update' : 'create'} a Point of Interest. Please review your information below.
              </Text>
            </Group>

            <SimpleGrid cols={2} spacing="lg">
              {/* Basic Information */}
              <Paper p="md" withBorder radius="sm">
                <Text size="sm" fw={600} c="blue.7" mb="xs">📋 Basic Information</Text>
                <Stack spacing="xs">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Name:</Text>
                    <Text size="sm" fw={500}>{form.values.name}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Type:</Text>
                    <Text size="sm" fw={500}>{form.values.poi_type}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Status:</Text>
                    <Text size="sm" fw={500}>{form.values.status}</Text>
                  </Group>
                  {form.values.description_short && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Summary:</Text>
                      <Text size="sm" fw={500} style={{ maxWidth: '200px' }}>{form.values.description_short}</Text>
                    </Group>
                  )}
                </Stack>
              </Paper>

              {/* Location Information */}
              <Paper p="md" withBorder radius="sm">
                <Text size="sm" fw={600} c="green.7" mb="xs">📍 Location</Text>
                <Stack spacing="xs">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Coordinates:</Text>
                    <Text size="sm" fw={500}>{form.values.latitude.toFixed(6)}, {form.values.longitude.toFixed(6)}</Text>
                  </Group>
                  {form.values.address_street && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Street:</Text>
                      <Text size="sm" fw={500}>{form.values.address_street}</Text>
                    </Group>
                  )}
                  {form.values.address_city && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">City:</Text>
                      <Text size="sm" fw={500}>{form.values.address_city}, {form.values.address_state}</Text>
                    </Group>
                  )}
                  {form.values.address_zip && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">ZIP:</Text>
                      <Text size="sm" fw={500}>{form.values.address_zip}</Text>
                    </Group>
                  )}
                </Stack>
              </Paper>

              {/* Contact Information */}
              <Paper p="md" withBorder radius="sm">
                <Text size="sm" fw={600} c="orange.7" mb="xs">📞 Contact</Text>
                <Stack spacing="xs">
                  {form.values.website_url && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Website:</Text>
                      <Text size="sm" fw={500} style={{ maxWidth: '150px' }}>{form.values.website_url}</Text>
                    </Group>
                  )}
                  {form.values.phone_number && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Phone:</Text>
                      <Text size="sm" fw={500}>{form.values.phone_number}</Text>
                    </Group>
                  )}
                  {form.values.email && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Email:</Text>
                      <Text size="sm" fw={500}>{form.values.email}</Text>
                    </Group>
                  )}
                </Stack>
              </Paper>

              {/* Categories & Type-Specific */}
              <Paper p="md" withBorder radius="sm">
                <Text size="sm" fw={600} c="purple.7" mb="xs">🏷️ Categories & Details</Text>
                <Stack spacing="xs">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">Categories:</Text>
                    <Text size="sm" fw={500}>{form.values.category_ids.length} selected</Text>
                  </Group>
                  {form.values.poi_type === 'BUSINESS' && form.values.business && (
                    <>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Listing Tier:</Text>
                        <Text size="sm" fw={500}>{form.values.business.listing_tier}</Text>
                      </Group>
                      {form.values.business.price_range && (
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Price Range:</Text>
                          <Text size="sm" fw={500}>{form.values.business.price_range}</Text>
                        </Group>
                      )}
                    </>
                  )}
                  {form.values.poi_type === 'EVENT' && form.values.event && (
                    <>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Start Date:</Text>
                        <Text size="sm" fw={500}>{form.values.event.start_datetime}</Text>
                      </Group>
                      {form.values.event.end_datetime && (
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">End Date:</Text>
                          <Text size="sm" fw={500}>{form.values.event.end_datetime}</Text>
                        </Group>
                      )}
                    </>
                  )}
                  {form.values.poi_type === 'TRAIL' && form.values.trail && (
                    <>
                      {form.values.trail.length_text && (
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Length:</Text>
                          <Text size="sm" fw={500}>{form.values.trail.length_text}</Text>
                        </Group>
                      )}
                      {form.values.trail.difficulty && (
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Difficulty:</Text>
                          <Text size="sm" fw={500}>{form.values.trail.difficulty}</Text>
                        </Group>
                      )}
                    </>
                  )}
                </Stack>
              </Paper>
            </SimpleGrid>

            {/* Flags and Verification */}
            <Paper p="md" withBorder radius="sm" bg="gray.0">
              <Text size="sm" fw={600} c="red.7" mb="xs">🏁 Flags & Verification</Text>
              <Group>
                <Group gap="xs">
                  <Text size="sm" c="dimmed">Verified:</Text>
                  <Text size="sm" fw={500}>
                    {form.values.is_verified ? "✓ Yes" : "✗ No"}
                  </Text>
                </Group>
                <Group gap="xs">
                  <Text size="sm" c="dimmed">Disaster Hub:</Text>
                  <Text size="sm" fw={500}>
                    {form.values.is_disaster_hub ? "✓ Yes" : "✗ No"}
                  </Text>
                </Group>
              </Group>
            </Paper>

            <Text size="sm" c="blue.6" fw={500} ta="center" mt="md">
              Click the "Submit" button below to {isEditing ? 'update' : 'create'} this POI.
            </Text>
          </Stack>
        </Paper>
      )}

      <Group justify="center" mt="xl">
        <Button variant="default" onClick={prevStep} disabled={activeStep === 0}>Back</Button>
        <Button onClick={nextStep} disabled={activeStep === 5}>Next</Button>
        {activeStep === 5 && <Button onClick={form.onSubmit(handleSubmit)} disabled={Object.keys(form.errors).length > 0}>Submit</Button>}
        {isEditing && (
          <Button 
            variant="outline" 
            color="red" 
            onClick={() => navigate('/')}
          >
            Cancel
          </Button>
        )}
      </Group>
    </Paper>
  );
}

export default POIForm;