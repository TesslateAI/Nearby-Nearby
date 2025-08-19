import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from '@mantine/form';
import {
  TextInput, Button, Group, Box, Title, Select, Textarea, Paper, SimpleGrid,
  Divider, Text, Radio, Switch, Stack, Checkbox, Stepper, Accordion, Alert, MultiSelect,
  NumberInput, FileInput, ActionIcon
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import api from '../utils/api';
import { 
  LISTING_TYPES, BUSINESS_STATUS_OPTIONS, EVENT_STATUS_OPTIONS, IDEAL_FOR_OPTIONS, 
  getStatusOptions, getFieldsForListingType, IDEAL_FOR_KEY_OPTIONS,
  PARKING_OPTIONS, PAYMENT_METHODS, KEY_FACILITIES, ALCOHOL_OPTIONS,
  WHEELCHAIR_OPTIONS, SMOKING_OPTIONS, COAT_CHECK_OPTIONS, WIFI_OPTIONS,
  DRONE_USAGE_OPTIONS, PET_OPTIONS, PUBLIC_TOILET_OPTIONS, VENDOR_TYPES,
  PRICE_RANGE_OPTIONS, DISCOUNT_TYPES, GIFT_CARD_OPTIONS, YOUTH_AMENITIES,
  BUSINESS_AMENITIES, ENTERTAINMENT_OPTIONS
} from '../utils/constants';
import {
  PLAYGROUND_TYPES, PLAYGROUND_SURFACES, NATURAL_FEATURES, OUTDOOR_TYPES,
  THINGS_TO_DO, HUNTING_TYPES, FISHING_TYPES, LICENSE_TYPES,
  TRAIL_DIFFICULTIES, TRAIL_ROUTE_TYPES, TRAIL_SURFACES, TRAIL_CONDITIONS,
  TRAIL_EXPERIENCES, HUNTING_FISHING_OPTIONS, FISHING_OPTIONS
} from '../utils/outdoorConstants';
import { notifications } from '@mantine/notifications';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { CategorySelector } from './CategorySelector';
import DynamicAttributeForm from './DynamicAttributeForm';

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
  listing_type: 'free',
  teaser_paragraph: '',
  description_long: '',
  description_short: '',
  status: 'Fully Open',
  status_message: '',
  is_verified: false,
  is_disaster_hub: false,
  dont_display_location: false,
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
  // Social media
  instagram_username: '',
  facebook_username: '',
  x_username: '',
  tiktok_username: '',
  linkedin_username: '',
  other_socials: {},
  // Location coordinates
  longitude: -79.17,
  latitude: 35.72,
  // Cost fields
  cost: '',
  pricing_details: '',
  ticket_link: '',
  // History and featured image
  history_paragraph: '',
  featured_image: '',
  // Main contact (internal)
  main_contact_name: '',
  main_contact_email: '',
  main_contact_phone: '',
  // Emergency contact (admin only)
  offsite_emergency_contact: '',
  emergency_protocols: '',
  // Ideal For Key Box
  ideal_for_key: [],
  // Parking
  parking_types: [],
  parking_locations: [],
  parking_notes: '',
  parking_photos: [],
  public_transit_info: '',
  expect_to_pay_parking: '',
  // Additional Info
  downloadable_maps: [],
  payment_methods: [],
  key_facilities: [],
  alcohol_options: [],
  wheelchair_accessible: [],
  wheelchair_details: '',
  smoking_options: [],
  smoking_details: '',
  wifi_options: [],
  drone_usage: '',
  drone_policy: '',
  pet_options: [],
  pet_policy: '',
  // Public Toilets
  public_toilets: [],
  toilet_locations: [],
  toilet_description: '',
  // Rentals
  available_for_rent: false,
  rental_info: '',
  rental_pricing: '',
  rental_link: '',
  rental_photos: [],
  // Additional Business Details
  price_range_per_person: '',
  pricing: '',
  discounts: [],
  gift_cards: '',
  youth_amenities: [],
  business_amenities: [],
  entertainment_options: [],
  // Menu & Online Booking
  menu_photos: [],
  menu_link: '',
  delivery_links: [],
  reservation_links: [],
  appointment_links: [],
  online_ordering_links: [],
  // Service Relationships
  service_locations: [],
  // Locally Found & Community
  locally_found_at: [],
  article_links: [],
  community_impact: '',
  organization_memberships: [],
  // JSONB fields
  photos: { featured: '', gallery: [] },
  hours: {},
  holiday_hours: {},
  amenities: {},
  ideal_for: [],
  contact_info: {},
  compliance: {},
  custom_fields: {},
  // Categories
  category_ids: [],
  // Business specific
  business: {
    price_range: null
  },
  // Park specific
  park: {
    drone_usage_policy: null
  },
  // Trail specific
  trail: {
    length_text: null,
    length_segments: [],
    difficulty: null,
    difficulty_description: null,
    route_type: null,
    trailhead_location: null,
    trailhead_entrance_photo: null,
    trailhead_exit_location: null,
    trailhead_exit_photo: null,
    trail_markings: null,
    trailhead_access_details: null,
    downloadable_trail_map: null,
    trail_surfaces: [],
    trail_conditions: [],
    trail_experiences: []
  },
  // Playground (All POIs)
  playground_available: false,
  playground_types: [],
  playground_surface_types: [],
  playground_notes: '',
  playground_photos: [],
  playground_location: null,
  // Parks & Trails Additional
  payphone_location: null,
  night_sky_viewing: '',
  natural_features: [],
  outdoor_types: [],
  things_to_do: [],
  birding_wildlife: '',
  // Hunting & Fishing
  hunting_fishing_allowed: 'no',
  hunting_types: [],
  fishing_allowed: 'no',
  fishing_types: [],
  licenses_required: [],
  hunting_fishing_info: '',
  // Memberships & Connections
  membership_passes: [],
  membership_details: '',
  associated_trails: [],
  camping_lodging: '',
  // Event specific
  event: {
    start_datetime: '',
    end_datetime: null,
    is_repeating: false,
    repeat_pattern: null,
    organizer_name: '',
    food_and_drink_info: '',
    coat_check_options: [],
    has_vendors: false,
    vendor_types: [],
    vendor_application_deadline: null,
    vendor_application_info: '',
    vendor_fee: '',
    vendor_requirements: '',
    vendor_poi_links: []
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
          if (!values.event?.start_datetime || values.event.start_datetime.trim() === '') {
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

      // Final validation (last step) - check all required fields
      let maxSteps = 10;
      if (values.poi_type === 'BUSINESS') maxSteps = 12;
      else if (values.poi_type === 'EVENT') maxSteps = 11;
      else if (values.poi_type === 'PARK' || values.poi_type === 'TRAIL') maxSteps = 11;
      
      if (activeStep === maxSteps) {
        if (!values.name.trim()) {
          errors.name = 'Name is required';
        } else if (values.name.trim().length < 2) {
          errors.name = 'Name must have at least 2 characters';
        }
        
        if (!values.latitude || !values.longitude) {
          errors.latitude = 'Location coordinates are required';
          errors.longitude = 'Location coordinates are required';
        }
        
        if (values.poi_type === 'EVENT' && (!values.event?.start_datetime || values.event.start_datetime.trim() === '')) {
          errors['event.start_datetime'] = 'Start date/time is required for events';
        }
      }

      return errors;
    },
  });

  const getMaxSteps = () => {
    if (form.values.poi_type === 'BUSINESS') return 12; // All steps including Menu & Community
    if (form.values.poi_type === 'EVENT') return 11; // All steps including Vendors
    if (form.values.poi_type === 'PARK' || form.values.poi_type === 'TRAIL') return 11; // All steps including Community
    return 10; // Default
  };

  const nextStep = () => {
    if (!form.validate().hasErrors) {
      setCompletedSteps(activeStep);
      const maxSteps = getMaxSteps();
      setActiveStep((current) => Math.min(maxSteps, current + 1));
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
            listing_type: poi.listing_type || 'free',
            teaser_paragraph: poi.teaser_paragraph || '',
            description_long: poi.description_long || '',
            description_short: poi.description_short || '',
            poi_type: poi.poi_type,
            status: poi.status,
            status_message: poi.status_message || '',
            is_verified: poi.is_verified,
            is_disaster_hub: poi.is_disaster_hub,
            dont_display_location: poi.dont_display_location || false,
            cost: poi.cost || '',
            pricing_details: poi.pricing_details || '',
            ticket_link: poi.ticket_link || '',
            address_full: poi.address_full || '',
            address_street: poi.address_street || '',
            address_city: poi.address_city || '',
            address_state: poi.address_state,
            address_zip: poi.address_zip || '',
            website_url: poi.website_url || '',
            phone_number: poi.phone_number || '',
            email: poi.email || '',
            photos: poi.photos || { featured: '', gallery: [] },
            hours: poi.hours || {},
            amenities: poi.amenities || {},
            ideal_for: poi.ideal_for || [],
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
            // Convert datetime objects to string format for datetime-local inputs
            const formatDateTimeForInput = (datetime) => {
              if (!datetime) return '';
              const date = new Date(datetime);
              return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
            };
            
            initial.event = {
              ...initial.event,
              ...poi.event,
              start_datetime: formatDateTimeForInput(poi.event.start_datetime),
              end_datetime: formatDateTimeForInput(poi.event.end_datetime),
              is_repeating: poi.event.is_repeating || false,
              repeat_pattern: poi.event.repeat_pattern || null
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
      // Convert datetime strings to ISO format for backend
      if (cleanValues.event.start_datetime && cleanValues.event.start_datetime.trim() !== '') {
        try {
          cleanValues.event.start_datetime = new Date(cleanValues.event.start_datetime).toISOString();
        } catch (error) {
          throw new Error('Invalid start date/time format');
        }
      }
      if (cleanValues.event.end_datetime && cleanValues.event.end_datetime.trim() !== '') {
        try {
          cleanValues.event.end_datetime = new Date(cleanValues.event.end_datetime).toISOString();
        } catch (error) {
          throw new Error('Invalid end date/time format');
        }
      }
    }

    // Ensure subtype data is included for the current POI type
    const payload = {
      name: cleanValues.name,
      poi_type: cleanValues.poi_type,
      listing_type: cleanValues.listing_type,
      teaser_paragraph: cleanValues.teaser_paragraph,
      description_long: cleanValues.description_long,
      description_short: cleanValues.description_short,
      status: cleanValues.status,
      status_message: cleanValues.status_message,
      is_verified: cleanValues.is_verified,
      is_disaster_hub: cleanValues.is_disaster_hub,
      dont_display_location: cleanValues.dont_display_location,
      cost: cleanValues.cost,
      pricing_details: cleanValues.pricing_details,
      ticket_link: cleanValues.ticket_link,
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
      ideal_for: cleanValues.ideal_for,
      contact_info: cleanValues.contact_info,
      compliance: cleanValues.compliance,
      custom_fields: cleanValues.custom_fields,
      category_ids: cleanValues.category_ids,
      location: {
        type: "Point",
        coordinates: [cleanValues.longitude, cleanValues.latitude]
      },
    };

    // Add subtype data based on POI type
    if (cleanValues.poi_type === 'BUSINESS') {
      payload.business = cleanValues.business || {};
    } else if (cleanValues.poi_type === 'PARK') {
      payload.park = cleanValues.park || {};
    } else if (cleanValues.poi_type === 'TRAIL') {
      payload.trail = cleanValues.trail || {};
    } else if (cleanValues.poi_type === 'EVENT') {
      // Ensure event object exists and has all fields
      payload.event = {
        start_datetime: cleanValues.event?.start_datetime || '',
        end_datetime: cleanValues.event?.end_datetime || null,
        is_repeating: cleanValues.event?.is_repeating || false,
        repeat_pattern: cleanValues.event?.repeat_pattern || null,
        organizer_name: cleanValues.event?.organizer_name || null,
        food_and_drink_info: cleanValues.event?.food_and_drink_info || null,
        coat_check_options: cleanValues.event?.coat_check_options || [],
        has_vendors: cleanValues.event?.has_vendors || false,
        vendor_types: cleanValues.event?.vendor_types || [],
        vendor_application_deadline: cleanValues.event?.vendor_application_deadline || null,
        vendor_application_info: cleanValues.event?.vendor_application_info || null,
        vendor_fee: cleanValues.event?.vendor_fee || null,
        vendor_requirements: cleanValues.event?.vendor_requirements || null,
        vendor_poi_links: cleanValues.event?.vendor_poi_links || []
      };
    }

    const apiCall = isEditing ? api.put(`/pois/${id}`, payload) : api.post('/pois/', payload);

    try {
      const response = await apiCall;
      if (response.ok) {
        notifications.show({ title: 'Success!', message: `POI "${cleanValues.name}" was ${isEditing ? 'updated' : 'created'}!`, color: 'green' });
        navigate('/');
      } else {
        // Get error details from response
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || `Failed to ${isEditing ? 'update' : 'create'} POI`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Submission error:', error);
      notifications.show({ 
        title: 'Submission Error', 
        message: error.message || `Failed to ${isEditing ? 'update' : 'create'} POI.`, 
        color: 'red' 
      });
    }
  };

  const currentPosition = [form.values.latitude, form.values.longitude];
  const isBusiness = form.values.poi_type === 'BUSINESS';
  const isPark = form.values.poi_type === 'PARK';
  const isTrail = form.values.poi_type === 'TRAIL';
  const isEvent = form.values.poi_type === 'EVENT';
  const isPaidListing = isBusiness && ['paid', 'paid_founding', 'sponsor', 'community_comped'].includes(form.values.listing_type);

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
            
            {/* Listing Type - Shows first for businesses */}
            <Select
              label="Listing Type"
              data={LISTING_TYPES}
              {...form.getInputProps('listing_type')}
              description={form.values.poi_type === 'BUSINESS' ? 'This determines which fields are available' : 'Listing type for tracking'}
            />
            
            {/* Event Date/Time - Moved to Core Info for Events */}
            {form.values.poi_type === 'EVENT' && (
              <>
                <SimpleGrid cols={2}>
                  <TextInput
                    withAsterisk
                    label="Event Start Date/Time"
                    type="datetime-local"
                    {...form.getInputProps('event.start_datetime')}
                  />
                  <TextInput
                    label="Event End Date/Time"
                    type="datetime-local"
                    {...form.getInputProps('event.end_datetime')}
                  />
                </SimpleGrid>
                <SimpleGrid cols={2}>
                  <Switch
                    label="This is a repeating event"
                    {...form.getInputProps('event.is_repeating', { type: 'checkbox' })}
                  />
                  {form.values.event?.is_repeating && (
                    <TextInput
                      label="Repeat Pattern"
                      placeholder="e.g., Every Thursday"
                      {...form.getInputProps('event.repeat_pattern')}
                    />
                  )}
                </SimpleGrid>
              </>
            )}
            
            {/* Teaser Paragraph - All POI Types */}
            <Textarea
              label="Teaser Paragraph"
              placeholder="A brief teaser (120 characters max)"
              {...form.getInputProps('teaser_paragraph')}
              maxRows={2}
              maxLength={120}
              description="120 character teaser for all listings"
            />
            
            {/* Description fields - conditional based on listing type */}
            {form.values.poi_type === 'BUSINESS' && form.values.listing_type === 'free' ? (
              <Textarea
                label="Short Description"
                placeholder="A brief summary for free listings"
                {...form.getInputProps('description_short')}
                minRows={2}
                maxLength={250}
                description="250 character limit for free business listings"
              />
            ) : (
              <Textarea
                label="Full Description"
                {...form.getInputProps('description_long')}
                minRows={4}
                description="Unlimited characters for paid listings"
              />
            )}
            
            {/* History Paragraph - Paid Businesses, Parks, and Trails */}
            {((form.values.poi_type === 'BUSINESS' && ['paid', 'paid_founding', 'sponsor', 'community_comped'].includes(form.values.listing_type)) ||
              (form.values.poi_type === 'PARK' || form.values.poi_type === 'TRAIL')) && (
              <Textarea
                label="History Paragraph"
                placeholder="Tell the story of this place..."
                {...form.getInputProps('history_paragraph')}
                minRows={3}
                description="Share the history for paid listings"
              />
            )}
            
            {/* Featured Image */}
            <TextInput
              label={form.values.poi_type === 'BUSINESS' && form.values.listing_type === 'free' ? 'Logo URL' : 'Featured Image URL'}
              placeholder="https://..."
              {...form.getInputProps('featured_image')}
              description={form.values.poi_type === 'BUSINESS' && form.values.listing_type === 'free' ? 
                'Logo image for free business listings' : 
                'Featured image for the listing'}
            />
            
            {/* Cost fields for Events, Parks, and Trails */}
            {['EVENT', 'PARK', 'TRAIL'].includes(form.values.poi_type) && (
              <>
                <SimpleGrid cols={3}>
                  <TextInput
                    label="Cost"
                    placeholder="e.g., $10 or $5-$15 or Free"
                    {...form.getInputProps('cost')}
                  />
                  {form.values.poi_type === 'EVENT' && (
                    <TextInput
                      label="Ticket Link"
                      placeholder="URL to buy tickets"
                      {...form.getInputProps('ticket_link')}
                    />
                  )}
                </SimpleGrid>
                <Textarea
                  label="Pricing Additional Details"
                  placeholder="e.g., Kids Under 2 are Free"
                  {...form.getInputProps('pricing_details')}
                  minRows={2}
                />
              </>
            )}
            
            <SimpleGrid cols={2}>
              <Select
                label="Status"
                data={getStatusOptions(form.values.poi_type)}
                {...form.getInputProps('status')}
              />
              <TextInput label="Status Message" placeholder="e.g., Closed for private event" maxLength={100} {...form.getInputProps('status_message')} />
            </SimpleGrid>
            
            <SimpleGrid cols={3}>
              <Switch label="Verified by Nearby Nearby" {...form.getInputProps('is_verified', { type: 'checkbox' })} />
              <Switch label="Disaster Hub" {...form.getInputProps('is_disaster_hub', { type: 'checkbox' })} />
              {form.values.poi_type === 'BUSINESS' && (
                <Switch label="Don't Display Location" {...form.getInputProps('dont_display_location', { type: 'checkbox' })} />
              )}
            </SimpleGrid>
          </Stack>
        </Stepper.Step>

        <Stepper.Step label="Categories & Ideal For" description="Categories & audience">
          <Stack mt="xl" p="md">
            {form.values.poi_type === 'BUSINESS' && form.values.listing_type === 'free' && (
              <Alert color="yellow" variant="light" mb="md">
                Free business listings can only select 1 category and up to 3 Ideal For Key options
              </Alert>
            )}
            
            <Divider my="md" label="Categories" />
            <CategorySelector 
              value={form.values.category_ids} 
              onChange={(ids) => {
                // Limit free business listings to 1 category
                if (form.values.poi_type === 'BUSINESS' && form.values.listing_type === 'free' && ids.length > 1) {
                  form.setFieldValue('category_ids', [ids[ids.length - 1]]);
                  notifications.show({
                    title: 'Category Limit',
                    message: 'Free business listings can only select 1 category',
                    color: 'yellow'
                  });
                } else {
                  form.setFieldValue('category_ids', ids);
                }
              }}
              poiType={form.values.poi_type}
            />
            
            {/* Ideal For - Not shown for free business listings */}
            {!(form.values.poi_type === 'BUSINESS' && form.values.listing_type === 'free') && (
              <>
                <Divider my="md" label="Ideal For" />
                <MultiSelect
                  label="Ideal For"
                  placeholder="Select all that apply"
                  data={IDEAL_FOR_OPTIONS}
                  searchable
                  clearable
                  maxDropdownHeight={400}
                  {...form.getInputProps('ideal_for')}
                  description="Select all audiences and settings this POI is ideal for"
                />
              </>
            )}
            
            {/* Ideal For Key Box - All listings get this */}
            <Divider my="md" label="Ideal For (Key Box)" />
            <Text size="sm" c="dimmed" mb="xs">
              {form.values.poi_type === 'BUSINESS' && form.values.listing_type === 'free' 
                ? 'Free listings can select up to 3 options for the key info box'
                : 'Select options for the key info box display'}
            </Text>
            <Checkbox.Group
              label="Select key ideal for options"
              {...form.getInputProps('ideal_for_key')}
              onChange={(values) => {
                // Limit free business listings to 3 options
                if (form.values.poi_type === 'BUSINESS' && form.values.listing_type === 'free' && values.length > 3) {
                  notifications.show({
                    title: 'Selection Limit',
                    message: 'Free business listings can only select up to 3 key options',
                    color: 'yellow'
                  });
                  return;
                }
                form.setFieldValue('ideal_for_key', values);
              }}
            >
              <SimpleGrid cols={2} mt="sm">
                {IDEAL_FOR_KEY_OPTIONS.map(option => (
                  <Checkbox 
                    key={option} 
                    value={option} 
                    label={option}
                    disabled={
                      form.values.poi_type === 'BUSINESS' && 
                      form.values.listing_type === 'free' && 
                      form.values.ideal_for_key?.length >= 3 && 
                      !form.values.ideal_for_key?.includes(option)
                    }
                  />
                ))}
              </SimpleGrid>
            </Checkbox.Group>

            {isBusiness && (
              <>
                <Divider my="md" label="Business Details" />
                <Select 
                  label="Price Range" 
                  placeholder="Select price range" 
                  data={['$', '$$', '$$$', '$$$$']} 
                  {...form.getInputProps('business.price_range')} 
                />
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
                <Alert color="blue" variant="light">
                  Event date/time and cost information are now in the Core Info section
                </Alert>
              </>
            )}
          </Stack>
        </Stepper.Step>

        <Stepper.Step label="Location & Parking" description="Address, map & parking">
          <Stack mt="xl" p="md">
            <Divider my="md" label="Location" />
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
            
            <Divider my="md" label="Parking Information" />
            <Checkbox.Group
              label="Select all parking types available"
              {...form.getInputProps('parking_types')}
            >
              <SimpleGrid cols={2} mt="sm">
                {PARKING_OPTIONS.map(option => (
                  <Checkbox key={option} value={option} label={option} />
                ))}
              </SimpleGrid>
            </Checkbox.Group>
            
            <Textarea 
              label="Parking Notes" 
              placeholder="Let people know where to park, especially if it's not at the venue itself..."
              {...form.getInputProps('parking_notes')}
              minRows={3}
            />
            
            <TextInput 
              label="Public Transit Information" 
              placeholder="Bus routes, subway stations, etc."
              {...form.getInputProps('public_transit_info')}
            />
            
            <Radio.Group
              label="Expect to pay for parking?"
              {...form.getInputProps('expect_to_pay_parking')}
            >
              <Group mt="xs">
                <Radio value="yes" label="Yes" />
                <Radio value="no" label="No" />
                <Radio value="sometimes" label="Sometimes" />
              </Group>
            </Radio.Group>
          </Stack>
        </Stepper.Step>

        <Stepper.Step label="Contact & Social" description="Contact info & social media">
          <Stack mt="xl" p="md">
            <Divider my="md" label="Contact Information" />
            <SimpleGrid cols={2}>
              <TextInput label="Website URL" {...form.getInputProps('website_url')} />
              <TextInput label="Phone Number" {...form.getInputProps('phone_number')} />
            </SimpleGrid>
            <TextInput label="Email" type="email" {...form.getInputProps('email')} />
            
            {/* Event Organizer Name - Events only */}
            {isEvent && (
              <TextInput 
                label="Event Organizer Name" 
                {...form.getInputProps('event.organizer_name')}
                description="Name of the person or organization running the event"
              />
            )}
            
            <Divider my="md" label="Social Media" />
            <Text size="sm" c="dimmed" mb="xs">Enter just the username - we'll handle the full URL</Text>
            <SimpleGrid cols={2}>
              <TextInput 
                label="Instagram" 
                placeholder="username" 
                {...form.getInputProps('instagram_username')}
                leftSection="@"
              />
              <TextInput 
                label="Facebook" 
                placeholder="pagename" 
                {...form.getInputProps('facebook_username')}
              />
              <TextInput 
                label="X (Twitter)" 
                placeholder="username" 
                {...form.getInputProps('x_username')}
                leftSection="@"
              />
              <TextInput 
                label="TikTok" 
                placeholder="username" 
                {...form.getInputProps('tiktok_username')}
                leftSection="@"
              />
              <TextInput 
                label="LinkedIn" 
                placeholder="company/pagename" 
                {...form.getInputProps('linkedin_username')}
              />
            </SimpleGrid>
          </Stack>
        </Stepper.Step>

        <Stepper.Step label="Main Contacts" description="Internal contact info">
          <Stack mt="xl" p="md">
            <Alert color="blue" variant="light" mb="md">
              This information is for internal use only and will not be displayed publicly
            </Alert>
            
            <Divider my="md" label="Main Contact Person" />
            <Text size="sm" c="dimmed" mb="xs">
              Primary contact for issues or questions about this listing
            </Text>
            <SimpleGrid cols={2}>
              <TextInput 
                label="Contact Name" 
                placeholder="John Doe"
                {...form.getInputProps('main_contact_name')}
              />
              <TextInput 
                label="Contact Email" 
                type="email"
                placeholder="contact@example.com"
                {...form.getInputProps('main_contact_email')}
              />
            </SimpleGrid>
            <TextInput 
              label="Contact Phone" 
              placeholder="(555) 123-4567"
              {...form.getInputProps('main_contact_phone')}
            />
            
            <Divider my="md" label="Emergency Information" />
            <Alert color="orange" variant="light" mb="md">
              Emergency contact information is admin-only and used for disaster response
            </Alert>
            <Textarea 
              label="Offsite Emergency Contact" 
              placeholder="Name, phone, email, and relationship of emergency contact..."
              {...form.getInputProps('offsite_emergency_contact')}
              minRows={3}
              description="Admin only - for disaster response and recovery"
            />
            <Textarea 
              label="Emergency Protocols" 
              placeholder="Special procedures or protocols for emergency situations..."
              {...form.getInputProps('emergency_protocols')}
              minRows={3}
              description="Admin only - emergency response procedures"
            />
          </Stack>
        </Stepper.Step>

        <Stepper.Step label="Business Details" description="Pricing, amenities & services">
          <Stack mt="xl" p="md">
            {isBusiness && (
              <>
                <Divider my="md" label="Pricing" />
                <Select
                  label="Average Price Range Per Person"
                  placeholder="Including tips and fees"
                  data={PRICE_RANGE_OPTIONS}
                  {...form.getInputProps('price_range_per_person')}
                />
              </>
            )}
            
            <TextInput
              label="Pricing Information"
              placeholder="Additional pricing details"
              {...form.getInputProps('pricing')}
            />
            
            <Divider my="md" label="Payment Methods" />
            <Checkbox.Group
              label="Accepted payment methods"
              {...form.getInputProps('payment_methods')}
            >
              <SimpleGrid cols={2} mt="sm">
                {PAYMENT_METHODS.map(method => (
                  <Checkbox key={method} value={method} label={method} />
                ))}
              </SimpleGrid>
            </Checkbox.Group>
            
            {(isBusiness || isPark || isTrail) && (
              <>
                <Divider my="md" label="Discounts" />
                <Text size="sm" c="dimmed" mb="xs">Standard everyday discounts (Valid ID required)</Text>
                <Checkbox.Group
                  label="Available discounts"
                  {...form.getInputProps('discounts')}
                >
                  <SimpleGrid cols={2} mt="sm">
                    {DISCOUNT_TYPES.map(discount => (
                      <Checkbox key={discount} value={discount} label={discount} />
                    ))}
                  </SimpleGrid>
                </Checkbox.Group>
                
                <Select
                  label="Gift Cards"
                  data={GIFT_CARD_OPTIONS}
                  {...form.getInputProps('gift_cards')}
                />
              </>
            )}
            
            {isBusiness && (
              <>
                <Divider my="md" label="Youth Amenities" />
                <Checkbox.Group
                  label="Child-friendly features"
                  {...form.getInputProps('youth_amenities')}
                >
                  <SimpleGrid cols={2} mt="sm">
                    {YOUTH_AMENITIES.map(amenity => (
                      <Checkbox key={amenity} value={amenity} label={amenity} />
                    ))}
                  </SimpleGrid>
                </Checkbox.Group>
                
                <Divider my="md" label="Business Amenities & Services" />
                <Checkbox.Group
                  label="Available services"
                  {...form.getInputProps('business_amenities')}
                >
                  <SimpleGrid cols={2} mt="sm">
                    {BUSINESS_AMENITIES.map(amenity => (
                      <Checkbox key={amenity} value={amenity} label={amenity} />
                    ))}
                  </SimpleGrid>
                </Checkbox.Group>
              </>
            )}
            
            {(isBusiness || isPark || isTrail) && (
              <>
                <Divider my="md" label="Entertainment" />
                <Checkbox.Group
                  label="Entertainment options"
                  {...form.getInputProps('entertainment_options')}
                >
                  <SimpleGrid cols={2} mt="sm">
                    {ENTERTAINMENT_OPTIONS.map(option => (
                      <Checkbox key={option} value={option} label={option} />
                    ))}
                  </SimpleGrid>
                </Checkbox.Group>
              </>
            )}
          </Stack>
        </Stepper.Step>

        {isBusiness && (
          <Stepper.Step label="Menu & Booking" description="Online presence">
            <Stack mt="xl" p="md">
              <Divider my="md" label="Menu" />
              <TextInput
                label="Menu Link"
                placeholder="https://..."
                {...form.getInputProps('menu_link')}
              />
              <Text size="sm" c="dimmed">Upload menu photos or provide link to online menu</Text>
              
              <Divider my="md" label="Online Services" />
              
              <Text size="sm" fw={500} mb="xs">Delivery Services</Text>
              {(form.values.delivery_links || []).map((link, index) => (
                <Group key={index} mb="xs">
                  <TextInput
                    style={{ flex: 1 }}
                    placeholder="Delivery service link"
                    value={link}
                    onChange={(e) => {
                      const newLinks = [...(form.values.delivery_links || [])];
                      newLinks[index] = e.target.value;
                      form.setFieldValue('delivery_links', newLinks);
                    }}
                  />
                  <ActionIcon color="red" onClick={() => {
                    const newLinks = form.values.delivery_links.filter((_, i) => i !== index);
                    form.setFieldValue('delivery_links', newLinks);
                  }}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              ))}
              <Button
                variant="light"
                leftSection={<IconPlus size={16} />}
                onClick={() => form.setFieldValue('delivery_links', [...(form.values.delivery_links || []), ''])}
                size="sm"
              >
                Add Delivery Service
              </Button>
              
              <Text size="sm" fw={500} mb="xs" mt="md">Reservation Links</Text>
              {(form.values.reservation_links || []).map((link, index) => (
                <Group key={index} mb="xs">
                  <TextInput
                    style={{ flex: 1 }}
                    placeholder="Reservation link"
                    value={link}
                    onChange={(e) => {
                      const newLinks = [...(form.values.reservation_links || [])];
                      newLinks[index] = e.target.value;
                      form.setFieldValue('reservation_links', newLinks);
                    }}
                  />
                  <ActionIcon color="red" onClick={() => {
                    const newLinks = form.values.reservation_links.filter((_, i) => i !== index);
                    form.setFieldValue('reservation_links', newLinks);
                  }}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              ))}
              <Button
                variant="light"
                leftSection={<IconPlus size={16} />}
                onClick={() => form.setFieldValue('reservation_links', [...(form.values.reservation_links || []), ''])}
                size="sm"
              >
                Add Reservation Link
              </Button>
              
              <Text size="sm" fw={500} mb="xs" mt="md">Appointment Scheduling</Text>
              {(form.values.appointment_links || []).map((link, index) => (
                <Group key={index} mb="xs">
                  <TextInput
                    style={{ flex: 1 }}
                    placeholder="Appointment scheduling link"
                    value={link}
                    onChange={(e) => {
                      const newLinks = [...(form.values.appointment_links || [])];
                      newLinks[index] = e.target.value;
                      form.setFieldValue('appointment_links', newLinks);
                    }}
                  />
                  <ActionIcon color="red" onClick={() => {
                    const newLinks = form.values.appointment_links.filter((_, i) => i !== index);
                    form.setFieldValue('appointment_links', newLinks);
                  }}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              ))}
              <Button
                variant="light"
                leftSection={<IconPlus size={16} />}
                onClick={() => form.setFieldValue('appointment_links', [...(form.values.appointment_links || []), ''])}
                size="sm"
              >
                Add Appointment Link
              </Button>
              
              <Text size="sm" fw={500} mb="xs" mt="md">Online Ordering</Text>
              <Text size="xs" c="dimmed" mb="xs">For shipping, pickup, or pre-orders at farmers markets</Text>
              {(form.values.online_ordering_links || []).map((link, index) => (
                <Group key={index} mb="xs">
                  <TextInput
                    style={{ flex: 1 }}
                    placeholder="Online ordering link"
                    value={link}
                    onChange={(e) => {
                      const newLinks = [...(form.values.online_ordering_links || [])];
                      newLinks[index] = e.target.value;
                      form.setFieldValue('online_ordering_links', newLinks);
                    }}
                  />
                  <ActionIcon color="red" onClick={() => {
                    const newLinks = form.values.online_ordering_links.filter((_, i) => i !== index);
                    form.setFieldValue('online_ordering_links', newLinks);
                  }}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              ))}
              <Button
                variant="light"
                leftSection={<IconPlus size={16} />}
                onClick={() => form.setFieldValue('online_ordering_links', [...(form.values.online_ordering_links || []), ''])}
                size="sm"
              >
                Add Online Ordering Link
              </Button>
            </Stack>
          </Stepper.Step>
        )}

        <Stepper.Step label="Additional Info" description="Facilities & accessibility">
          <Stack mt="xl" p="md">
            
            {(isEvent || isPark || isTrail) && (
              <>
                <Divider my="md" label="Key Facilities" />
                <Checkbox.Group
                  label="Available facilities"
                  {...form.getInputProps('key_facilities')}
                >
                  <SimpleGrid cols={2} mt="sm">
                    {KEY_FACILITIES.map(facility => (
                      <Checkbox key={facility} value={facility} label={facility} />
                    ))}
                  </SimpleGrid>
                </Checkbox.Group>
                
                {isEvent && (
                  <>
                    <Textarea 
                      label="Food and Drink Information" 
                      placeholder="Will there be food, drinks to purchase? What kind?"
                      {...form.getInputProps('event.food_and_drink_info')}
                      minRows={2}
                    />
                  </>
                )}
              </>
            )}
            
            <Divider my="md" label="Alcohol" />
            <Checkbox.Group
              label="Alcohol availability"
              {...form.getInputProps('alcohol_options')}
            >
              <SimpleGrid cols={2} mt="sm">
                {ALCOHOL_OPTIONS.map(option => (
                  <Checkbox key={option} value={option} label={option} />
                ))}
              </SimpleGrid>
            </Checkbox.Group>
            
            <Divider my="md" label="Accessibility" />
            <Checkbox.Group
              label="Wheelchair Accessible"
              {...form.getInputProps('wheelchair_accessible')}
            >
              <Group mt="xs">
                {WHEELCHAIR_OPTIONS.map(option => (
                  <Checkbox key={option} value={option} label={option} />
                ))}
              </Group>
            </Checkbox.Group>
            <Textarea 
              label="Wheelchair Accessibility Details" 
              placeholder="Additional accessibility information..."
              {...form.getInputProps('wheelchair_details')}
              minRows={2}
            />
            
            <Divider my="md" label="Smoking" />
            <Checkbox.Group
              label="Smoking policy"
              {...form.getInputProps('smoking_options')}
            >
              <Group mt="xs">
                {SMOKING_OPTIONS.map(option => (
                  <Checkbox key={option} value={option} label={option} />
                ))}
              </Group>
            </Checkbox.Group>
            {form.values.smoking_options?.includes('Yes') && (
              <Textarea 
                label="Smoking Details" 
                placeholder="Where can attendees find smoking areas?"
                {...form.getInputProps('smoking_details')}
                minRows={2}
              />
            )}
            
            {isEvent && (
              <>
                <Divider my="md" label="Event Amenities" />
                <Checkbox.Group
                  label="Coat Check"
                  {...form.getInputProps('event.coat_check_options')}
                >
                  <Group mt="xs">
                    {COAT_CHECK_OPTIONS.map(option => (
                      <Checkbox key={option} value={option} label={option} />
                    ))}
                  </Group>
                </Checkbox.Group>
                
                <Checkbox.Group
                  label="WiFi"
                  {...form.getInputProps('wifi_options')}
                >
                  <Group mt="xs">
                    {WIFI_OPTIONS.map(option => (
                      <Checkbox key={option} value={option} label={option} />
                    ))}
                  </Group>
                </Checkbox.Group>
              </>
            )}
            
            {(isEvent || isPark || isTrail) && (
              <>
                <Divider my="md" label="Drone Usage" />
                <Radio.Group
                  label="Drone policy"
                  {...form.getInputProps('drone_usage')}
                >
                  <Stack mt="xs">
                    {DRONE_USAGE_OPTIONS.map(option => (
                      <Radio key={option} value={option} label={option} />
                    ))}
                  </Stack>
                </Radio.Group>
                {form.values.drone_usage && (
                  <Textarea 
                    label="Drone Policy Details" 
                    placeholder="Link to policy or additional information"
                    {...form.getInputProps('drone_policy')}
                    minRows={2}
                  />
                )}
              </>
            )}
            
            <Divider my="md" label="Pets" />
            <Checkbox.Group
              label="Pet policy"
              {...form.getInputProps('pet_options')}
            >
              <SimpleGrid cols={2} mt="sm">
                {PET_OPTIONS.map(option => (
                  <Checkbox key={option} value={option} label={option} />
                ))}
              </SimpleGrid>
            </Checkbox.Group>
            <Textarea 
              label="Pet Policy Details" 
              placeholder="Any additional pet policies..."
              {...form.getInputProps('pet_policy')}
              minRows={2}
            />
          </Stack>
        </Stepper.Step>

        <Stepper.Step label="Toilets & Rentals" description="Public facilities & rental info">
          <Stack mt="xl" p="md">
            <Divider my="md" label="Public Toilets" />
            <Checkbox.Group
              label="Public toilet facilities"
              {...form.getInputProps('public_toilets')}
            >
              <SimpleGrid cols={2} mt="sm">
                {PUBLIC_TOILET_OPTIONS.map(option => (
                  <Checkbox key={option} value={option} label={option} />
                ))}
              </SimpleGrid>
            </Checkbox.Group>
            <Textarea 
              label="Public Toilet Description" 
              placeholder="Where can attendees find the public toilets? For paying customers only?"
              {...form.getInputProps('toilet_description')}
              minRows={2}
            />
            
            <Divider my="md" label="Rentals" />
            <Switch
              label="Available for rent"
              {...form.getInputProps('available_for_rent', { type: 'checkbox' })}
            />
            {form.values.available_for_rent && (
              <>
                <Textarea 
                  label="Rental Information" 
                  placeholder="What's available for rent?"
                  {...form.getInputProps('rental_info')}
                  minRows={3}
                />
                <Textarea 
                  label="Rental Pricing" 
                  placeholder="Pricing information for rentals"
                  {...form.getInputProps('rental_pricing')}
                  minRows={2}
                />
                <TextInput 
                  label="Rental Reservation Link" 
                  placeholder="https://..."
                  {...form.getInputProps('rental_link')}
                />
              </>
            )}
          </Stack>
        </Stepper.Step>

        {isEvent && (
          <Stepper.Step label="Vendors" description="Event vendor information">
            <Stack mt="xl" p="md">
              <Switch
                label="This event has outside vendors"
                {...form.getInputProps('event.has_vendors', { type: 'checkbox' })}
              />
              {form.values.event?.has_vendors && (
                <>
                  <Checkbox.Group
                    label="Vendor types present"
                    {...form.getInputProps('event.vendor_types')}
                  >
                    <SimpleGrid cols={2} mt="sm">
                      {VENDOR_TYPES.map(type => (
                        <Checkbox key={type.value} value={type.value} label={type.label} />
                      ))}
                    </SimpleGrid>
                  </Checkbox.Group>
                  
                  <TextInput
                    label="Vendor Application Deadline"
                    type="datetime-local"
                    {...form.getInputProps('event.vendor_application_deadline')}
                  />
                  
                  <Textarea 
                    label="How to Apply / Contact Info" 
                    placeholder="Application process or contact information"
                    {...form.getInputProps('event.vendor_application_info')}
                    minRows={3}
                  />
                  
                  <TextInput 
                    label="Vendor Fee" 
                    placeholder="e.g., $50 per booth"
                    {...form.getInputProps('event.vendor_fee')}
                  />
                  
                  <Textarea 
                    label="Booth Requirements or Restrictions" 
                    placeholder="Size limits, equipment requirements, etc."
                    {...form.getInputProps('event.vendor_requirements')}
                    minRows={3}
                  />
                </>
              )}
            </Stack>
          </Stepper.Step>
        )}

        <Stepper.Step label="Pets" description="Pet policies">
          <Stack mt="xl" p="md">
            <Divider my="md" label="Pet Policy" />
            <Checkbox.Group
              label="Pet accommodations"
              {...form.getInputProps('pet_options')}
            >
              <SimpleGrid cols={2} mt="sm">
                {PET_OPTIONS.map(option => (
                  <Checkbox key={option} value={option} label={option} />
                ))}
              </SimpleGrid>
            </Checkbox.Group>
            <Textarea 
              label="Pet Policy Details" 
              placeholder="Any additional pet policies or restrictions..."
              {...form.getInputProps('pet_policy')}
              minRows={2}
            />
          </Stack>
        </Stepper.Step>

        <Stepper.Step label="Playground" description="Playground information">
          <Stack mt="xl" p="md">
            <Switch
              label="Playground Available"
              {...form.getInputProps('playground_available', { type: 'checkbox' })}
            />
            
            {form.values.playground_available && (
              <>
                <Divider my="md" label="Playground Types" />
                <Checkbox.Group
                  label="Select all that apply"
                  {...form.getInputProps('playground_types')}
                >
                  <SimpleGrid cols={2} mt="sm">
                    {PLAYGROUND_TYPES.map(type => (
                      <Checkbox key={type} value={type} label={type} />
                    ))}
                  </SimpleGrid>
                </Checkbox.Group>
                
                <Divider my="md" label="Playground Surface Type" />
                <Checkbox.Group
                  label="Surface materials"
                  {...form.getInputProps('playground_surface_types')}
                >
                  <SimpleGrid cols={2} mt="sm">
                    {PLAYGROUND_SURFACES.map(surface => (
                      <Checkbox key={surface} value={surface} label={surface} />
                    ))}
                  </SimpleGrid>
                </Checkbox.Group>
                
                <Textarea
                  label="Playground Notes"
                  placeholder="Additional information about the playground..."
                  {...form.getInputProps('playground_notes')}
                  minRows={3}
                />
                
                <Text size="sm" c="dimmed">Playground photos and location coordinates will be available in the next update</Text>
              </>
            )}
          </Stack>
        </Stepper.Step>

        {(isPark || isTrail) && (
          <Stepper.Step label="Outdoor Features" description="Natural & recreational">
            <Stack mt="xl" p="md">
              <Divider my="md" label="Natural Features" />
              <Checkbox.Group
                label="Select all natural features present"
                {...form.getInputProps('natural_features')}
              >
                <SimpleGrid cols={3} mt="sm">
                  {NATURAL_FEATURES.map(feature => (
                    <Checkbox key={feature} value={feature} label={feature} />
                  ))}
                </SimpleGrid>
              </Checkbox.Group>
              
              <Divider my="md" label="Outdoor Types" />
              <Checkbox.Group
                label="Type of outdoor space"
                {...form.getInputProps('outdoor_types')}
              >
                <SimpleGrid cols={2} mt="sm">
                  {OUTDOOR_TYPES.map(type => (
                    <Checkbox key={type} value={type} label={type} />
                  ))}
                </SimpleGrid>
              </Checkbox.Group>
              
              <Divider my="md" label="Things to Do" />
              <Checkbox.Group
                label="Available activities"
                {...form.getInputProps('things_to_do')}
              >
                <SimpleGrid cols={3} mt="sm">
                  {THINGS_TO_DO.map(activity => (
                    <Checkbox key={activity} value={activity} label={activity} />
                  ))}
                </SimpleGrid>
              </Checkbox.Group>
              
              <Textarea
                label="Night Sky Viewing"
                placeholder="Information about stargazing opportunities..."
                {...form.getInputProps('night_sky_viewing')}
                minRows={2}
              />
              
              <Textarea
                label="Birding and Wildlife"
                placeholder="Information about bird watching and wildlife viewing..."
                {...form.getInputProps('birding_wildlife')}
                minRows={2}
              />
            </Stack>
          </Stepper.Step>
        )}

        {(isPark || isTrail) && (
          <Stepper.Step label="Hunting & Fishing" description="Game & fishing info">
            <Stack mt="xl" p="md">
              <Radio.Group
                label="Do you allow hunting?"
                {...form.getInputProps('hunting_fishing_allowed')}
              >
                <Stack mt="xs">
                  {HUNTING_FISHING_OPTIONS.map(option => (
                    <Radio key={option.value} value={option.value} label={option.label} />
                  ))}
                </Stack>
              </Radio.Group>
              
              {(form.values.hunting_fishing_allowed === 'seasonal' || form.values.hunting_fishing_allowed === 'year_round') && (
                <>
                  <Divider my="md" label="Hunting Types Allowed" />
                  <Checkbox.Group
                    label="What types of hunting are allowed?"
                    {...form.getInputProps('hunting_types')}
                  >
                    <SimpleGrid cols={2} mt="sm">
                      {HUNTING_TYPES.map(type => (
                        <Checkbox key={type} value={type} label={type} />
                      ))}
                    </SimpleGrid>
                  </Checkbox.Group>
                </>
              )}
              
              <Radio.Group
                label="Do you allow fishing on this property?"
                {...form.getInputProps('fishing_allowed')}
              >
                <Stack mt="xs">
                  {FISHING_OPTIONS.map(option => (
                    <Radio key={option.value} value={option.value} label={option.label} />
                  ))}
                </Stack>
              </Radio.Group>
              
              {form.values.fishing_allowed !== 'no' && (
                <>
                  <Divider my="md" label="Fishing Types" />
                  <Checkbox.Group
                    label="What types of fishing are common or allowed?"
                    {...form.getInputProps('fishing_types')}
                  >
                    <SimpleGrid cols={2} mt="sm">
                      {FISHING_TYPES.map(type => (
                        <Checkbox key={type} value={type} label={type} />
                      ))}
                    </SimpleGrid>
                  </Checkbox.Group>
                </>
              )}
              
              {(form.values.hunting_fishing_allowed !== 'no' || form.values.fishing_allowed !== 'no') && (
                <>
                  <Divider my="md" label="Licenses & Permits" />
                  <Checkbox.Group
                    label="Required licenses or permits"
                    {...form.getInputProps('licenses_required')}
                  >
                    <SimpleGrid cols={2} mt="sm">
                      {LICENSE_TYPES.map(license => (
                        <Checkbox key={license} value={license} label={license} />
                      ))}
                    </SimpleGrid>
                  </Checkbox.Group>
                  
                  <Textarea
                    label="Additional Hunting & Fishing Information"
                    placeholder="Season dates, bag limits, special regulations..."
                    {...form.getInputProps('hunting_fishing_info')}
                    minRows={3}
                  />
                </>
              )}
            </Stack>
          </Stepper.Step>
        )}

        {isTrail && (
          <Stepper.Step label="Trail Details" description="Specific trail information">
            <Stack mt="xl" p="md">
              <SimpleGrid cols={2}>
                <TextInput 
                  label="Total Trail Length" 
                  placeholder="e.g., 2.5 miles" 
                  {...form.getInputProps('trail.length_text')} 
                />
                <Select 
                  label="Route Type" 
                  placeholder="Select route type" 
                  data={TRAIL_ROUTE_TYPES} 
                  {...form.getInputProps('trail.route_type')} 
                />
              </SimpleGrid>
              
              <Select 
                label="Difficulty" 
                placeholder="Select difficulty" 
                data={TRAIL_DIFFICULTIES.map(d => ({ value: d.value, label: d.label }))} 
                {...form.getInputProps('trail.difficulty')}
                onChange={(value) => {
                  form.setFieldValue('trail.difficulty', value);
                  const difficultyInfo = TRAIL_DIFFICULTIES.find(d => d.value === value);
                  if (difficultyInfo) {
                    form.setFieldValue('trail.difficulty_description', difficultyInfo.description);
                  }
                }}
              />
              {form.values.trail?.difficulty && (
                <Alert color="blue" variant="light">
                  {TRAIL_DIFFICULTIES.find(d => d.value === form.values.trail.difficulty)?.description}
                </Alert>
              )}
              
              <Divider my="md" label="Trail Surface" />
              <Stack>
                {Object.entries(TRAIL_SURFACES).map(([category, surfaces]) => (
                  <div key={category}>
                    <Text size="sm" fw={500} mb="xs">{category} Surfaces</Text>
                    <Checkbox.Group
                      {...form.getInputProps('trail.trail_surfaces')}
                    >
                      <SimpleGrid cols={3} mb="md">
                        {surfaces.map(surface => (
                          <Checkbox key={surface} value={surface} label={surface} />
                        ))}
                      </SimpleGrid>
                    </Checkbox.Group>
                  </div>
                ))}
              </Stack>
              
              <Divider my="md" label="Trail Conditions" />
              <Checkbox.Group
                label="Select any applicable conditions"
                {...form.getInputProps('trail.trail_conditions')}
              >
                <SimpleGrid cols={2} mt="sm">
                  {TRAIL_CONDITIONS.map(condition => (
                    <Checkbox key={condition} value={condition} label={condition} />
                  ))}
                </SimpleGrid>
              </Checkbox.Group>
              
              <Divider my="md" label="Trail Experience" />
              <Checkbox.Group
                label="What experiences does this trail offer?"
                {...form.getInputProps('trail.trail_experiences')}
              >
                <SimpleGrid cols={3} mt="sm">
                  {TRAIL_EXPERIENCES.map(experience => (
                    <Checkbox key={experience} value={experience} label={experience} />
                  ))}
                </SimpleGrid>
              </Checkbox.Group>
              
              <Divider my="md" label="Trailhead Information" />
              <Textarea
                label="Trail Markings & Symbols"
                placeholder="Describe blazes, signs, or markers..."
                {...form.getInputProps('trail.trail_markings')}
                minRows={2}
              />
              <Textarea
                label="Trailhead Access Details"
                placeholder="Parking, entry points, accessibility..."
                {...form.getInputProps('trail.trailhead_access_details')}
                minRows={2}
              />
              
              <Text size="sm" c="dimmed" mt="md">
                Trailhead photos, maps, and location coordinates will be available in the next update
              </Text>
            </Stack>
          </Stepper.Step>
        )}

        {(isPark || isTrail) && (
          <Stepper.Step label="Memberships" description="Passes & connections">
            <Stack mt="xl" p="md">
              <Divider my="md" label="Membership & Passes" />
              <Textarea
                label="Membership Details"
                placeholder="Information about park passes, memberships, reciprocal agreements..."
                {...form.getInputProps('membership_details')}
                minRows={3}
              />
              
              <Divider my="md" label="Camping & Lodging" />
              <Textarea
                label="Camping & Lodging Information"
                placeholder="Available camping sites, lodging options, reservation info..."
                {...form.getInputProps('camping_lodging')}
                minRows={3}
              />
              
              <Alert color="blue" variant="light" mt="md">
                Linking to other parks, trails, and organizations will be available in the next update
              </Alert>
            </Stack>
          </Stepper.Step>
        )}

        {(isBusiness || isPark || isTrail) && (
          <Stepper.Step label="Community" description="Local connections">
            <Stack mt="xl" p="md">
              {isBusiness && (
                <>
                  <Divider my="md" label="Community Impact" />
                  <Textarea
                    label="Community Involvement"
                    placeholder="Supporting local food drives, sponsoring sports teams, etc."
                    {...form.getInputProps('community_impact')}
                    minRows={3}
                  />
                </>
              )}
              
              <Divider my="md" label="Article Links" />
              <Text size="sm" c="dimmed" mb="xs">Links to articles or blog posts about your business</Text>
              {(form.values.article_links || []).map((article, index) => (
                <Group key={index} mb="xs">
                  <TextInput
                    style={{ flex: 1 }}
                    placeholder="Article title"
                    value={article.title || ''}
                    onChange={(e) => {
                      const newLinks = [...(form.values.article_links || [])];
                      newLinks[index] = { ...newLinks[index], title: e.target.value };
                      form.setFieldValue('article_links', newLinks);
                    }}
                  />
                  <TextInput
                    style={{ flex: 2 }}
                    placeholder="Article URL"
                    value={article.url || ''}
                    onChange={(e) => {
                      const newLinks = [...(form.values.article_links || [])];
                      newLinks[index] = { ...newLinks[index], url: e.target.value };
                      form.setFieldValue('article_links', newLinks);
                    }}
                  />
                  <ActionIcon color="red" onClick={() => {
                    const newLinks = form.values.article_links.filter((_, i) => i !== index);
                    form.setFieldValue('article_links', newLinks);
                  }}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              ))}
              <Button
                variant="light"
                leftSection={<IconPlus size={16} />}
                onClick={() => form.setFieldValue('article_links', [...(form.values.article_links || []), { title: '', url: '' }])}
                size="sm"
              >
                Add Article Link
              </Button>
              
              {/* Service Locations - where this business provides services */}
              {isBusiness && (
                <>
                  <Divider my="md" label="Service Locations" />
                  <Text size="sm" c="dimmed">Parks, trails, or venues where you provide services (catering, tours, rentals, etc.)</Text>
                  {/* This would be a POI selector component */}
                  <Alert color="blue" variant="light" mt="sm">
                    Service location linking will be available in the next update
                  </Alert>
                </>
              )}
              
              {/* Locally Found At - where products are sold */}
              {isBusiness && (
                <>
                  <Divider my="md" label="Locally Found" />
                  <Text size="sm" c="dimmed">Other businesses where your products are sold</Text>
                  {/* This would be a POI selector component */}
                  <Alert color="blue" variant="light" mt="sm">
                    Product location linking will be available in the next update
                  </Alert>
                </>
              )}
              
              {/* Organization Memberships */}
              {isBusiness && (
                <>
                  <Divider my="md" label="Organizations" />
                  <Text size="sm" c="dimmed">Business associations, chambers, rotary clubs, etc.</Text>
                  {/* This would be a POI selector with external link option */}
                  <Alert color="blue" variant="light" mt="sm">
                    Organization linking will be available in the next update
                  </Alert>
                </>
              )}
            </Stack>
          </Stepper.Step>
        )}

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




          </Stack>
        </Stepper.Step>


      </Stepper>

      {activeStep === getMaxSteps() && (
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
                  {form.values.status_message && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Status Message:</Text>
                      <Text size="sm" fw={500} style={{ maxWidth: '200px' }}>{form.values.status_message}</Text>
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
                        <Text size="sm" c="dimmed">Listing Type:</Text>
                        <Text size="sm" fw={500}>{form.values.listing_type}</Text>
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
                      {form.values.event.cost_text && (
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Cost:</Text>
                          <Text size="sm" fw={500}>{form.values.event.cost_text}</Text>
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
                      {form.values.trail.route_type && (
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Route Type:</Text>
                          <Text size="sm" fw={500}>{form.values.trail.route_type}</Text>
                        </Group>
                      )}
                    </>
                  )}
                  {form.values.poi_type === 'PARK' && form.values.park && (
                    <>
                      {form.values.park.drone_usage_policy && (
                        <Group justify="space-between">
                          <Text size="sm" c="dimmed">Drone Policy:</Text>
                          <Text size="sm" fw={500}>{form.values.park.drone_usage_policy}</Text>
                        </Group>
                      )}
                    </>
                  )}
                </Stack>
              </Paper>
            </SimpleGrid>

            {/* Additional Information */}
            {(form.values.description_long || form.values.photos?.featured) && (
              <Paper p="md" withBorder radius="sm">
                <Text size="sm" fw={600} c="teal.7" mb="xs">📝 Additional Information</Text>
                <Stack spacing="xs">
                  {form.values.description_long && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Full Description:</Text>
                      <Text size="sm" fw={500} style={{ maxWidth: '300px' }}>{form.values.description_long}</Text>
                    </Group>
                  )}
                  {form.values.photos?.featured && (
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Featured Photo:</Text>
                      <Text size="sm" fw={500} style={{ maxWidth: '200px' }}>{form.values.photos.featured}</Text>
                    </Group>
                  )}
                </Stack>
              </Paper>
            )}

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

            <Alert color="blue" variant="light" mt="md">
              <Text size="sm">
                <strong>Tip:</strong> After saving this POI, you can manage relationships with other POIs 
                from the main POI list using the link icon (🔗) in the actions column.
              </Text>
            </Alert>
            

          </Stack>
        </Paper>
      )}

      <Group justify="center" mt="xl">
        <Button variant="default" onClick={prevStep} disabled={activeStep === 0}>Back</Button>
        <Button onClick={nextStep} disabled={activeStep === getMaxSteps()}>Next</Button>
        {activeStep === getMaxSteps() && <Button onClick={form.onSubmit(handleSubmit)} disabled={Object.keys(form.errors).length > 0}>Submit</Button>}
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