import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from '@mantine/form';
import {
  TextInput, Button, Group, Box, Title, Select, Textarea, Paper, SimpleGrid,
  Divider, Text, Radio, Switch, Stack, Checkbox, Stepper,
} from '@mantine/core';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { CategorySelector } from './CategorySelector';

const API_URL = import.meta.env.VITE_API_BASE_URL;

// --- Map Component Logic ---
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}
function DraggableMarker({ position, onPositionChange }) {
  const map = useMap();
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });
  const handleDragEnd = (event) => {
    const marker = event.target;
    if (marker != null) {
      onPositionChange(marker.getLatLng());
    }
  };
  return <Marker draggable={true} eventHandlers={{ dragend: handleDragEnd }} position={position} />;
}
// --- End Map Component Logic ---

const emptyInitialValues = {
  // Core POI Info
  name: '', poi_type: 'business', description: '', summary: '',
  status: 'Fully Open', status_message: '', is_verified: false, featured_image_url: '',
  // Location
  address_line1: '', city: '', state_abbr: 'NC', postal_code: '',
  longitude: -79.17, latitude: 35.72,
  use_coordinates_for_map: false, entry_notes: '', entrance_photo_url: '',
  // Business Specific
  listing_type: 'free', contact_name: '', contact_email: '', contact_phone: '',
  is_service_business: false, price_range: '',
  // Categories
  category_ids: [],
  // Attributes (for JSONB)
  attributes: {
    photo_gallery: ['','','','','','','','',''],
    website: '', email: '', phone: '',
    social_links: { instagram: '', facebook: '', x: '', tiktok: '', linkedin: '', other: ''},
    payment_methods: [],
    pets: [],
    parking: [],
    amenities_services: [],
    discounts: [],
  },
};

function POIForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [activeStep, setActiveStep] = useState(0);

  const form = useForm({
    initialValues: emptyInitialValues,
    validate: (values) => {
      if (activeStep === 0) {
        return {
          name: values.name.trim().length < 2 ? 'Name must have at least 2 characters' : null,
        };
      }
      if (activeStep === 3) {
          return {
              'attributes.email': values.attributes.email && !/^\S+@\S+$/.test(values.attributes.email) ? 'Invalid public email' : null,
              contact_email: values.contact_email && !/^\S+@\S+$/.test(values.contact_email) ? 'Invalid contact email' : null,
          }
      }
      return {};
    },
  });

  const nextStep = () =>
    setActiveStep((current) => {
      if (form.validate().hasErrors) {
        return current;
      }
      return current < 4 ? current + 1 : current;
    });

  const prevStep = () => setActiveStep((current) => (current > 0 ? current - 1 : current));

  useEffect(() => {
    if (isEditing) {
      axios.get(`${API_URL}/api/pois/${id}`)
        .then(response => {
          const poi = response.data;
          const initial = {
            ...emptyInitialValues, // Start with a full empty structure
            name: poi.name || '',
            description: poi.description || '',
            summary: poi.summary || '',
            poi_type: poi.poi_type || 'business',
            status: poi.status || 'Fully Open',
            status_message: poi.status_message || '',
            is_verified: poi.is_verified || false,
            featured_image_url: poi.featured_image_url || '',
            address_line1: poi.location?.address_line1 || '',
            city: poi.location?.city || '',
            state_abbr: poi.location?.state_abbr || 'NC',
            postal_code: poi.location?.postal_code || '',
            longitude: poi.location?.coordinates?.coordinates[0] ?? -79.17,
            latitude: poi.location?.coordinates?.coordinates[1] ?? 35.72,
            use_coordinates_for_map: poi.location?.use_coordinates_for_map || false,
            entry_notes: poi.location?.entry_notes || '',
            entrance_photo_url: poi.location?.entrance_photo_url || '',
            price_range: poi.business?.price_range || '',
            listing_type: poi.business?.listing_type || 'free',
            contact_name: poi.business?.contact_name || '',
            contact_email: poi.business?.contact_email || '',
            contact_phone: poi.business?.contact_phone || '',
            is_service_business: poi.business?.is_service_business || false,
            attributes: { ...emptyInitialValues.attributes, ...(poi.business?.attributes || {}) },
            category_ids: poi.categories?.map(c => c.id) || [],
          }
          form.setValues(initial);
          form.setInitialValues(initial); // Also set initial values for reset
        })
        .catch(error => {
          notifications.show({ title: 'Error', message: 'Failed to fetch POI data.', color: 'red' });
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing]);

  const handleSubmit = async (values) => {
    // For editing, we use `exclude_unset=True` on the backend, but the frontend form state is complete,
    // so we build the payload from the latest values.
    const payload = {
        name: values.name,
        description: values.description,
        poi_type: values.poi_type,
        status: values.status,
        summary: values.summary,
        status_message: values.status_message,
        is_verified: values.is_verified,
        featured_image_url: values.featured_image_url,
        category_ids: values.category_ids,
        location: {
            address_line1: values.address_line1,
            city: values.city,
            state_abbr: values.state_abbr,
            postal_code: values.postal_code,
            coordinates: { type: "Point", coordinates: [values.longitude, values.latitude] },
            use_coordinates_for_map: values.use_coordinates_for_map,
            entry_notes: values.entry_notes,
            entrance_photo_url: values.entrance_photo_url,
        },
        business: values.poi_type === 'business' ? {
            listing_type: values.listing_type,
            price_range: values.price_range,
            contact_name: values.contact_name,
            contact_email: values.contact_email,
            contact_phone: values.contact_phone,
            is_service_business: values.is_service_business,
            attributes: values.attributes,
        } : null
    };

    const apiCall = isEditing 
        ? axios.put(`${API_URL}/api/pois/${id}`, payload)
        : axios.post(`${API_URL}/api/pois/`, payload);

    try {
        await apiCall;
        notifications.show({
            title: 'Success!',
            message: `POI "${values.name}" was ${isEditing ? 'updated' : 'created'}!`,
            color: 'green'
        });
        navigate('/');
    } catch (error) {
        const errorMessage = error.response?.data?.detail ? JSON.stringify(error.response.data.detail) : `Failed to ${isEditing ? 'update' : 'create'} POI.`;
        notifications.show({ title: 'Submission Error', message: errorMessage, color: 'red', autoClose: 7000 });
    }
  };
  
  const currentPosition = [form.values.latitude, form.values.longitude];
  const handlePositionChange = (latlng) => {
    form.setFieldValue('latitude', latlng.lat);
    form.setFieldValue('longitude', latlng.lng);
  };

  const isPaidListing = ['paid', 'paid_founding', 'sponsor'].includes(form.values.listing_type);

  return (
    <Paper maw={1000} mx="auto">
      <Title order={2} c="deep-purple.7" mb="xl">
        {isEditing ? `Editing: ${form.values.name || 'POI'}` : 'Create New Point of Interest'}
      </Title>

      <Stepper active={activeStep} onStepClick={setActiveStep} breakpoint="sm" allowNextStepsSelect={false}>
        <Stepper.Step label="Core Info" description="Basic details">
            <Stack mt="xl">
                <TextInput withAsterisk label="POI Name/Title" {...form.getInputProps('name')} />
                <Select label="POI Type" withAsterisk data={['business', 'outdoors', 'event']} {...form.getInputProps('poi_type')} />
                <Textarea label="Description" placeholder="A brief description of the place" {...form.getInputProps('description')} minRows={3} maxLength={isPaidListing ? undefined : 200} description={isPaidListing ? 'Unlimited characters' : '200 character limit'} />
                {isPaidListing && <Textarea label="SEO Summary" placeholder="A short, search-friendly summary" {...form.getInputProps('summary')} minRows={2} maxLength={200} description="200 characters for SEO."/>}
            </Stack>
        </Stepper.Step>
        <Stepper.Step label="Status" description="Listing type & status">
            <Stack mt="xl">
                <Radio.Group label="Listing Type" withAsterisk {...form.getInputProps('listing_type')}>
                    <Group mt="xs"><Radio value="free" label="Free" /><Radio value="paid" label="Paid" /><Radio value="paid_founding" label="Founding" /><Radio value="sponsor" label="Sponsor" /></Group>
                </Radio.Group>
                <Select label="Status" data={['Fully Open', 'Partly Open', 'Temporary Hour Changes', 'Temporarily Closed', 'Call Ahead', 'Permanently Closed', 'Warning', 'Limited Capacity', 'Coming Soon', 'Under Development', 'Alert']} {...form.getInputProps('status')} />
                <TextInput label="Status Message" placeholder="e.g., Closed for private event" maxLength={80} {...form.getInputProps('status_message')} />
                <Switch label="This listing is verified by Nearby Nearby" {...form.getInputProps('is_verified', { type: 'checkbox' })} />
                <Checkbox label="This is a service-based business (no public physical location)" {...form.getInputProps('is_service_business', { type: 'checkbox' })} />
            </Stack>
        </Stepper.Step>
        <Stepper.Step label="Location" description="Address & map pin">
            <Stack mt="xl">
                <Text c="dimmed" size="sm">Click on the map or drag the marker to set the precise location.</Text>
                <Box style={{ height: '300px', width: '100%' }} mb="md">
                    <MapContainer center={currentPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <ChangeView center={currentPosition} zoom={13} />
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <DraggableMarker position={currentPosition} onPositionChange={handlePositionChange} />
                    </MapContainer>
                </Box>
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <TextInput withAsterisk label="Latitude" readOnly {...form.getInputProps('latitude')} />
                    <TextInput withAsterisk label="Longitude" readOnly {...form.getInputProps('longitude')} />
                </SimpleGrid>
                <Switch label="Use Lat/Long for map pin instead of address" {...form.getInputProps('use_coordinates_for_map', { type: 'checkbox' })} description="Check this if the address is inaccurate." mt="sm"/>
                <TextInput label="Address" placeholder="123 Main St" {...form.getInputProps('address_line1')} />
                <Textarea label="Business Entry Notes" placeholder="e.g., Second floor, suite #204" {...form.getInputProps('entry_notes')} mt="sm"/>
            </Stack>
        </Stepper.Step>
        <Stepper.Step label="Contact & Media" description="Links and images">
            <Stack mt="xl">
                <Divider label="Internal Contact Info" />
                <SimpleGrid cols={3}>
                    <TextInput label="Contact Name" {...form.getInputProps('contact_name')} />
                    <TextInput label="Contact Email" {...form.getInputProps('contact_email')} />
                    <TextInput label="Contact Phone" {...form.getInputProps('contact_phone')} />
                </SimpleGrid>
                <Divider label="Public Contact & Links" mt="md" />
                 <SimpleGrid cols={2}>
                    <TextInput label="Public Phone" {...form.getInputProps('attributes.phone')} />
                    <TextInput label="Public Email" {...form.getInputProps('attributes.email')} />
                    <TextInput label="Website" {...form.getInputProps('attributes.website')} />
                    <TextInput label="Featured Image URL" {...form.getInputProps('featured_image_url')} />
                </SimpleGrid>
                {isPaidListing && <>
                    <Divider label="Social Media (Usernames)" mt="md" />
                    <SimpleGrid cols={2}>
                        <TextInput label="Instagram" {...form.getInputProps('attributes.social_links.instagram')} />
                        <TextInput label="Facebook" {...form.getInputProps('attributes.social_links.facebook')} />
                    </SimpleGrid>
                    <Divider label="Photo Gallery (up to 9 URLs)" mt="md" />
                     <SimpleGrid cols={3}>
                        {Array.from({ length: 9 }).map((_, index) => (
                            <TextInput key={index} placeholder={`Image URL ${index + 1}`} {...form.getInputProps(`attributes.photo_gallery.${index}`)} />
                        ))}
                    </SimpleGrid>
                </>}
            </Stack>
        </Stepper.Step>
        <Stepper.Completed>
            <Title order={4} my="lg">Final Review</Title>
            <Text>You've entered all the information. Please click the button below to {isEditing ? 'update' : 'create'} the POI.</Text>
        </Stepper.Completed>
      </Stepper>
      
      <Group justify="center" mt="xl">
        {activeStep > 0 && <Button variant="default" onClick={prevStep}>Back</Button>}
        {activeStep < 4 && <Button onClick={nextStep}>Next step</Button>}
        {activeStep === 4 && <Button color="green" size="md" onClick={() => handleSubmit(form.values)}>{isEditing ? 'Update POI' : 'Create POI'}</Button>}
      </Group>
    </Paper>
  );
}

export default POIForm;