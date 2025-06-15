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
import { amenities, businessTypes, discounts, entertainment, idealFor, parking, payment, pets, publicToilets, smoking, alcohol, facilities, naturalFeatures, thingsToDo, outdoorTypes } from './fieldOptions';

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
  name: '', poi_type: 'business', description: '', summary: '',
  status: 'Fully Open', status_message: '', is_verified: false, featured_image_url: '',
  // Location
  address_line1: '', city: '', state_abbr: 'NC', postal_code: '',
  longitude: -79.17, latitude: 35.72,
  use_coordinates_for_map: false, entry_notes: '', entrance_photo_url: '',
  // Business Specific
  listing_type: 'free', contact_name: '', contact_email: '', contact_phone: '',
  is_service_business: false, 
  // Categories
  category_ids: [],
  // Attributes (for JSONB)
  attributes: {
    price_range: '',
    hours: { text: '' },
    photo_gallery: Array(9).fill(''),
    website: '', email: '', phone: '',
    social_links: { instagram: '', facebook: '', x: '', tiktok: '', linkedin: '', other: '', newsletter:'' },
    payment_methods: [], pets: [], pet_policy: '',
    wheelchair_accessible: '', wheelchair_details: '',
    ideal_for: [], ages: [], parking: [], parking_notes: '',
    public_toilets: [], smoking: [], entertainment: [], alcohol: [],
    rentals: { available: 'no', details: '' },
    gift_cards: 'no', discounts: [], youth_amenities: [], amenities_services: [],
    establishment_type: [],
    // Outdoors specific
    outdoor_type: [], trail_length_km: '', facilities: [], natural_features: [], things_to_do: [],
  },
};

const CheckboxGroupField = ({ form, path, label, options }) => (
    <Checkbox.Group label={label} {...form.getInputProps(path)}>
        <Stack mt="xs">
            {options.map(option => <Checkbox key={option.value} {...option} />)}
        </Stack>
    </Checkbox.Group>
);

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
              name: poi.name, description: poi.description, summary: poi.summary, poi_type: poi.poi_type,
              status: poi.status, status_message: poi.status_message, is_verified: poi.is_verified,
              featured_image_url: poi.featured_image_url, category_ids: poi.categories?.map(c => c.id) || [],
          });

          // Populate location
          if(poi.location) Object.assign(initial, {
              ...poi.location,
              longitude: poi.location.coordinates.coordinates[0],
              latitude: poi.location.coordinates.coordinates[1],
          });

          // Populate business or outdoors specific fields
          if (poi.poi_type === 'business' && poi.business) {
              Object.assign(initial, poi.business);
              initial.attributes = { ...emptyInitialValues.attributes, ...poi.business.attributes };
          } else if (poi.poi_type === 'outdoors' && poi.outdoors) {
              initial.attributes = { ...emptyInitialValues.attributes, ...poi.outdoors.attributes };
          }
          
          form.setValues(initial);
          form.setInitialValues(initial);
        })
        .catch(error => notifications.show({ title: 'Error', message: 'Failed to fetch POI data.', color: 'red' }));
    }
  }, [id, isEditing]);

  const handleSubmit = async (values) => {
    const payload = {
        name: values.name, description: values.description, poi_type: values.poi_type,
        status: values.status, summary: values.summary, status_message: values.status_message,
        is_verified: values.is_verified, featured_image_url: values.featured_image_url,
        category_ids: values.category_ids,
        location: {
            address_line1: values.address_line1, city: values.city, state_abbr: values.state_abbr,
            postal_code: values.postal_code, coordinates: { type: "Point", coordinates: [values.longitude, values.latitude] },
            use_coordinates_for_map: values.use_coordinates_for_map, entry_notes: values.entry_notes,
            entrance_photo_url: values.entrance_photo_url,
        },
        business: values.poi_type === 'business' ? {
            listing_type: values.listing_type, contact_name: values.contact_name,
            contact_email: values.contact_email, contact_phone: values.contact_phone,
            is_service_business: values.is_service_business, attributes: values.attributes,
        } : null,
        outdoors: values.poi_type === 'outdoors' ? { attributes: values.attributes } : null,
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
  const isBusiness = form.values.poi_type === 'business';
  const isOutdoors = form.values.poi_type === 'outdoors';
  const isPaidListing = isBusiness && ['paid', 'paid_founding', 'sponsor'].includes(form.values.listing_type);

  return (
    <Paper maw={1200} mx="auto">
      <Title order={2} c="deep-purple.7" mb="xl">{isEditing ? `Editing: ${form.values.name}` : 'Create New Point of Interest'}</Title>

      <Stepper active={activeStep} onStepClick={setActiveStep} breakpoint="sm" allowNextStepsSelect={false}>
        <Stepper.Step label="Core Info" description="Basic details">
            <Stack mt="xl" p="md">
                <SimpleGrid cols={2}>
                    <TextInput withAsterisk label="POI Name/Title" {...form.getInputProps('name')} />
                    <Select label="POI Type" withAsterisk data={['business', 'outdoors', 'event']} {...form.getInputProps('poi_type')} />
                </SimpleGrid>
                <Textarea label="Full Description" {...form.getInputProps('description')} minRows={4} maxLength={isBusiness && !isPaidListing ? 200 : undefined} description={isBusiness && !isPaidListing ? '200 character limit for free listings' : 'Unlimited characters'} />
                {isBusiness && <Textarea label="SEO Summary" placeholder="A short, search-friendly summary" {...form.getInputProps('summary')} minRows={2} maxLength={200} description="200 character summary for SEO."/>}
                 <SimpleGrid cols={2}>
                    <Select label="Status" data={['Fully Open', 'Partly Open', 'Temporary Hour Changes', 'Temporarily Closed', 'Call Ahead', 'Permanently Closed', 'Warning', 'Limited Capacity', 'Coming Soon', 'Under Development', 'Alert']} {...form.getInputProps('status')} />
                    <TextInput label="Status Message" placeholder="e.g., Closed for private event" maxLength={80} {...form.getInputProps('status_message')} />
                </SimpleGrid>
                 <Switch label="This listing is verified by Nearby Nearby" {...form.getInputProps('is_verified', { type: 'checkbox' })} />
            </Stack>
        </Stepper.Step>
        
        <Stepper.Step label="Listing Type" description="Tiers & Categories">
            <Stack mt="xl" p="md">
                {isBusiness && <>
                    <Radio.Group label="Listing Type" withAsterisk {...form.getInputProps('listing_type')}><Group mt="xs"><Radio value="free" label="Free" /><Radio value="paid" label="Paid" /><Radio value="paid_founding" label="Founding" /><Radio value="sponsor" label="Sponsor" /></Group></Radio.Group>
                    <Checkbox label="This is a service-based business (no public physical location)" {...form.getInputProps('is_service_business', { type: 'checkbox' })} />
                    <Divider my="md" label="Business Categories" />
                    <CategorySelector value={form.values.category_ids} onChange={(ids) => form.setFieldValue('category_ids', ids)} />
                </>}
                 {isOutdoors && <>
                    <CheckboxGroupField form={form} path="attributes.outdoor_type" label="Park/Outdoor Categories" options={outdoorTypes} />
                 </>}
            </Stack>
        </Stepper.Step>

        <Stepper.Step label="Location" description="Address & map pin">
            <Stack mt="xl" p="md">
                <Box style={{ height: '300px', width: '100%' }} mb="md">
                    <MapContainer center={currentPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <ChangeView center={currentPosition} zoom={13} /><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><DraggableMarker position={currentPosition} onPositionChange={(latlng) => {form.setFieldValue('latitude', latlng.lat); form.setFieldValue('longitude', latlng.lng);}} />
                    </MapContainer>
                </Box>
                <SimpleGrid cols={2}><TextInput withAsterisk label="Latitude" readOnly {...form.getInputProps('latitude')} /><TextInput withAsterisk label="Longitude" readOnly {...form.getInputProps('longitude')} /></SimpleGrid>
                <Switch label="Use Lat/Long for map pin instead of address" {...form.getInputProps('use_coordinates_for_map', { type: 'checkbox' })} description="Check this if the address is inaccurate." mt="sm"/>
                <TextInput label="Address" placeholder="123 Main St" {...form.getInputProps('address_line1')} />
                <Textarea label="Entry Notes" placeholder="e.g., Second floor, suite #204" {...form.getInputProps('entry_notes')} mt="sm"/>
            </Stack>
        </Stepper.Step>
        
        <Stepper.Step label="Contact & Media" description="Links and images">
            <Stack mt="xl" p="md">
                <Accordion multiple defaultValue={['internal', 'public']}>
                    <Accordion.Item value="internal"><Accordion.Control>Internal Contact (Not Public)</Accordion.Control><Accordion.Panel>
                        <SimpleGrid cols={3}><TextInput label="Contact Name" {...form.getInputProps('contact_name')} /><TextInput label="Contact Email" {...form.getInputProps('contact_email')} /><TextInput label="Contact Phone" {...form.getInputProps('contact_phone')} /></SimpleGrid>
                    </Accordion.Panel></Accordion.Item>
                    <Accordion.Item value="public"><Accordion.Control>Public Contact & Website</Accordion.Control><Accordion.Panel>
                        <SimpleGrid cols={2}><TextInput label="Public Phone" {...form.getInputProps('attributes.phone')} /><TextInput label="Public Email" {...form.getInputProps('attributes.email')} /></SimpleGrid>
                        <TextInput mt="md" label="Website" {...form.getInputProps('attributes.website')} />
                        <TextInput mt="md" label="Newsletter Signup Link" {...form.getInputProps('attributes.social_links.newsletter')} />
                    </Accordion.Panel></Accordion.Item>
                    <Accordion.Item value="social"><Accordion.Control>Social Media (Usernames)</Accordion.Control><Accordion.Panel>
                        <SimpleGrid cols={3}><TextInput label="Instagram" {...form.getInputProps('attributes.social_links.instagram')} /><TextInput label="Facebook" {...form.getInputProps('attributes.social_links.facebook')} /><TextInput label="X (Twitter)" {...form.getInputProps('attributes.social_links.x')} /></SimpleGrid>
                        <SimpleGrid mt="sm" cols={3}><TextInput label="TikTok" {...form.getInputProps('attributes.social_links.tiktok')} /><TextInput label="LinkedIn" {...form.getInputProps('attributes.social_links.linkedin')} /><TextInput label="Other Social" {...form.getInputProps('attributes.social_links.other')} /></SimpleGrid>
                    </Accordion.Panel></Accordion.Item>
                    <Accordion.Item value="media"><Accordion.Control>Images</Accordion.Control><Accordion.Panel>
                        <TextInput label="Featured Image URL" {...form.getInputProps('featured_image_url')} />
                        <TextInput mt="md" label="Entrance Photo URL" {...form.getInputProps('entrance_photo_url')} />
                        {isPaidListing && <>
                            <Divider label="Photo Gallery (up to 9 URLs)" my="md" />
                            <SimpleGrid cols={3}>{Array.from({ length: 9 }).map((_, index) => <TextInput key={index} placeholder={`Image URL ${index + 1}`} {...form.getInputProps(`attributes.photo_gallery.${index}`)} />)}</SimpleGrid>
                        </>}
                    </Accordion.Panel></Accordion.Item>
                </Accordion>
            </Stack>
        </Stepper.Step>
        
        <Stepper.Step label="Details" description="Amenities & Features">
            <Stack mt="xl" p="md">
                {isBusiness && <Accordion multiple>
                    <Accordion.Item value="operations"><Accordion.Control>Operations</Accordion.Control><Accordion.Panel>
                        <SimpleGrid cols={2}><Select label="Price Range" data={['$', '$$', '$$$', '$$$$', '$$$$$']} {...form.getInputProps('attributes.price_range')} /><TextInput label="Hours of Operation" placeholder="e.g., M-F 9am-5pm" {...form.getInputProps('attributes.hours.text')} /></SimpleGrid>
                        <CheckboxGroupField form={form} path="attributes.establishment_type" label="Type of Establishment" options={businessTypes} />
                    </Accordion.Panel></Accordion.Item>
                    <Accordion.Item value="amenities"><Accordion.Control>Amenities</Accordion.Control><Accordion.Panel>
                        <SimpleGrid cols={3}><CheckboxGroupField form={form} path="attributes.amenities_services" label="General Amenities" options={amenities} /><CheckboxGroupField form={form} path="attributes.payment_methods" label="Payment Methods" options={payment} /><CheckboxGroupField form={form} path="attributes.parking" label="Parking" options={parking} /></SimpleGrid>
                    </Accordion.Panel></Accordion.Item>
                    <Accordion.Item value="policies"><Accordion.Control>Policies & Audience</Accordion.Control><Accordion.Panel>
                        <SimpleGrid cols={3}><CheckboxGroupField form={form} path="attributes.pets" label="Pets" options={pets} /><CheckboxGroupField form={form} path="attributes.public_toilets" label="Public Toilets" options={publicToilets} /><CheckboxGroupField form={form} path="attributes.smoking" label="Smoking" options={smoking} /></SimpleGrid>
                        <Textarea mt="md" label="Pet Policy Details" {...form.getInputProps('attributes.pet_policy')} />
                    </Accordion.Panel></Accordion.Item>
                    <Accordion.Item value="audience"><Accordion.Control>Ideal For</Accordion.Control><Accordion.Panel>
                        <CheckboxGroupField form={form} path="attributes.ideal_for" label="Ideal For" options={idealFor} />
                    </Accordion.Panel></Accordion.Item>
                    <Accordion.Item value="food"><Accordion.Control>Food, Drink & Entertainment</Accordion.Control><Accordion.Panel>
                        <SimpleGrid cols={2}><CheckboxGroupField form={form} path="attributes.entertainment" label="Entertainment" options={entertainment} /><CheckboxGroupField form={form} path="attributes.alcohol" label="Alcohol" options={alcohol} /></SimpleGrid>
                    </Accordion.Panel></Accordion.Item>
                </Accordion>}
                {isOutdoors && <Accordion multiple>
                    <Accordion.Item value="main"><Accordion.Control>Main Features</Accordion.Control><Accordion.Panel>
                        <TextInput label="Trail Length (km)" {...form.getInputProps('attributes.trail_length_km')} />
                    </Accordion.Panel></Accordion.Item>
                    <Accordion.Item value="facilities"><Accordion.Control>Facilities</Accordion.Control><Accordion.Panel>
                        <CheckboxGroupField form={form} path="attributes.facilities" label="Facilities" options={facilities} />
                    </Accordion.Panel></Accordion.Item>
                    <Accordion.Item value="natural"><Accordion.Control>Natural Features</Accordion.Control><Accordion.Panel>
                        <CheckboxGroupField form={form} path="attributes.natural_features" label="Natural Features" options={naturalFeatures} />
                    </Accordion.Panel></Accordion.Item>
                     <Accordion.Item value="activities"><Accordion.Control>Things to Do</Accordion.Control><Accordion.Panel>
                        <CheckboxGroupField form={form} path="attributes.things_to_do" label="Things to Do" options={thingsToDo} />
                    </Accordion.Panel></Accordion.Item>
                </Accordion>}
            </Stack>
        </Stepper.Step>
        
        <Stepper.Completed>
            <Title order={4} my="lg">Final Review</Title>
            <Text>You've entered all the information. Please click the button below to {isEditing ? 'update' : 'create'} the POI.</Text>
        </Stepper.Completed>
      </Stepper>
      
      <Group justify="center" mt="xl">
        {activeStep > 0 && <Button variant="default" onClick={prevStep}>Back</Button>}
        {activeStep < 5 && <Button onClick={nextStep}>Next step</Button>}
        {activeStep === 5 && <Button color="green" size="md" onClick={() => handleSubmit(form.values)}>{isEditing ? 'Update POI' : 'Create POI'}</Button>}
      </Group>
    </Paper>
  );
}

export default POIForm;