import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from '@mantine/form';
import {
  TextInput, Button, Group, Box, Title, Select, Textarea, Paper, SimpleGrid,
  Divider, Text, Radio, Switch, Stack, Checkbox, Stepper, Accordion,
} from '@mantine/core';
import axios from 'axios';
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
  description_long: '', 
  description_short: '',
  status: 'Fully Open', 
  status_message: '', 
  is_verified: false, 
  is_disaster_hub: false,
  // Address fields
  address_full: '', 
  address_street: '', 
  address_city: '', 
  address_state: 'NC', 
  address_zip: '',
  // Contact info
  website_url: '', 
  phone_number: '', 
  email: '',
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
    price_range: ''
  },
  // Park specific
  park: {
    drone_usage_policy: ''
  },
  // Trail specific
  trail: {
    length_text: '',
    difficulty: '',
    route_type: ''
  },
  // Event specific
  event: {
    start_datetime: '',
    end_datetime: '',
    cost_text: ''
  }
};

function POIForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [activeStep, setActiveStep] = useState(0);

  const form = useForm({
    initialValues: emptyInitialValues,
    validate: (values) => {
      if (activeStep === 0) return { name: values.name.trim().length < 2 ? 'Name must have at least 2 characters' : null };
      return {};
    },
  });

  const nextStep = () => setActiveStep((current) => (form.validate().hasErrors ? current : Math.min(5, current + 1)));
  const prevStep = () => setActiveStep((current) => Math.max(0, current - 1));

  useEffect(() => {
    if (isEditing) {
      axios.get(`${API_URL}/api/pois/${id}`)
        .then(response => {
          const poi = response.data;
          const initial = { ...emptyInitialValues };
          
          // Populate top-level fields
          Object.assign(initial, {
              name: poi.name, 
              description_long: poi.description_long, 
              description_short: poi.description_short, 
              poi_type: poi.poi_type,
              status: poi.status, 
              status_message: poi.status_message, 
              is_verified: poi.is_verified,
              is_disaster_hub: poi.is_disaster_hub,
              address_full: poi.address_full,
              address_street: poi.address_street,
              address_city: poi.address_city,
              address_state: poi.address_state,
              address_zip: poi.address_zip,
              website_url: poi.website_url,
              phone_number: poi.phone_number,
              email: poi.email,
              photos: poi.photos || { featured: '', gallery: [] },
              hours: poi.hours || {},
              amenities: poi.amenities || {},
              contact_info: poi.contact_info || {},
              compliance: poi.compliance || {},
              custom_fields: poi.custom_fields || {},
              category_ids: poi.categories?.map(c => c.id) || [],
          });

          // Populate location coordinates
          if(poi.location) {
              initial.longitude = poi.location.coordinates[0];
              initial.latitude = poi.location.coordinates[1];
          }

          // Populate subtype specific fields
          if (poi.poi_type === 'BUSINESS' && poi.business) {
              initial.business = { ...initial.business, ...poi.business };
          } else if (poi.poi_type === 'PARK' && poi.park) {
              initial.park = { ...initial.park, ...poi.park };
          } else if (poi.poi_type === 'TRAIL' && poi.trail) {
              initial.trail = { ...initial.trail, ...poi.trail };
          } else if (poi.poi_type === 'EVENT' && poi.event) {
              initial.event = { ...initial.event, ...poi.event };
          }
          
          form.setValues(initial);
          form.setInitialValues(initial);
        })
        .catch(error => notifications.show({ title: 'Error', message: 'Failed to fetch POI data.', color: 'red' }));
    }
  }, [id, isEditing]);

  const handleSubmit = async (values) => {
    const payload = {
        name: values.name, 
        poi_type: values.poi_type,
        description_long: values.description_long, 
        description_short: values.description_short,
        status: values.status, 
        status_message: values.status_message,
        is_verified: values.is_verified, 
        is_disaster_hub: values.is_disaster_hub,
        address_full: values.address_full,
        address_street: values.address_street,
        address_city: values.address_city,
        address_state: values.address_state,
        address_zip: values.address_zip,
        website_url: values.website_url,
        phone_number: values.phone_number,
        email: values.email,
        photos: values.photos,
        hours: values.hours,
        amenities: values.amenities,
        contact_info: values.contact_info,
        compliance: values.compliance,
        custom_fields: values.custom_fields,
        category_ids: values.category_ids,
        location: {
            type: "Point", 
            coordinates: [values.longitude, values.latitude]
        },
        business: values.poi_type === 'BUSINESS' ? values.business : null,
        park: values.poi_type === 'PARK' ? values.park : null,
        trail: values.poi_type === 'TRAIL' ? values.trail : null,
        event: values.poi_type === 'EVENT' ? values.event : null,
    };
    
    const apiCall = isEditing ? axios.put(`${API_URL}/api/pois/${id}`, payload) : axios.post(`${API_URL}/api/pois/`, payload);

    try {
        await apiCall;
        notifications.show({ title: 'Success!', message: `POI "${values.name}" was ${isEditing ? 'updated' : 'created'}!`, color: 'green' });
        navigate('/');
    } catch (error) {
        const errorMessage = error.response?.data?.detail ? JSON.stringify(error.response.data.detail) : `Failed to ${isEditing ? 'update' : 'create'} POI.`;
        notifications.show({ title: 'Submission Error', message: errorMessage, color: 'red' });
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

      <Stepper 
        active={activeStep} 
        onStepClick={setActiveStep} 
        breakpoint="sm" 
        allowNextStepsSelect={false}
        size="sm"
        styles={{
          root: { marginBottom: 'xl' },
          step: { flex: 1, minWidth: 0 },
          stepLabel: { fontSize: '0.875rem' },
          stepDescription: { fontSize: '0.75rem' }
        }}
      >
        <Stepper.Step label="Core Info" description="Basic details">
            <Stack mt="xl" p="md">
                <SimpleGrid cols={2}>
                    <TextInput withAsterisk label="POI Name/Title" {...form.getInputProps('name')} />
                    <Select label="POI Type" withAsterisk data={['BUSINESS', 'PARK', 'TRAIL', 'EVENT']} {...form.getInputProps('poi_type')} />
                </SimpleGrid>
                <Textarea label="Full Description" {...form.getInputProps('description_long')} minRows={4} maxLength={isBusiness && !isPaidListing ? 200 : undefined} description={isBusiness && !isPaidListing ? '200 character limit for free listings' : 'Unlimited characters'} />
                <Textarea label="Short Description" placeholder="A brief summary" {...form.getInputProps('description_short')} minRows={2} maxLength={250} description="250 character summary."/>
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
                            <Select label="Price Range" data={['$', '$$', '$$$', '$$$$']} {...form.getInputProps('business.price_range')} />
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
                            <Select label="Difficulty" data={['easy', 'moderate', 'difficult', 'expert']} {...form.getInputProps('trail.difficulty')} />
                            <Select label="Route Type" data={['loop', 'out_and_back', 'point_to_point']} {...form.getInputProps('trail.route_type')} />
                        </SimpleGrid>
                    </>
                )}
                
                {isEvent && (
                    <>
                        <Divider my="md" label="Event Details" />
                        <SimpleGrid cols={2}>
                            <TextInput type="datetime-local" label="Start Date/Time" {...form.getInputProps('event.start_datetime')} />
                            <TextInput type="datetime-local" label="End Date/Time" {...form.getInputProps('event.end_datetime')} />
                        </SimpleGrid>
                        <TextInput label="Cost" placeholder="e.g., Free, $15, Donation suggested" {...form.getInputProps('event.cost_text')} />
                    </>
                )}
            </Stack>
        </Stepper.Step>

        <Stepper.Step label="Location" description="Address & map">
            <Stack mt="xl" p="md">
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
                    <TextInput label="Latitude" type="number" step="any" {...form.getInputProps('latitude')} />
                    <TextInput label="Longitude" type="number" step="any" {...form.getInputProps('longitude')} />
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

      <Group justify="center" mt="xl">
        <Button variant="default" onClick={prevStep} disabled={activeStep === 0}>Back</Button>
        <Button onClick={nextStep} disabled={activeStep === 5}>Next</Button>
        {activeStep === 5 && <Button onClick={form.onSubmit(handleSubmit)}>Submit</Button>}
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