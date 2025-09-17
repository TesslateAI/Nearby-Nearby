import { useEffect, useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from '@mantine/form';
import {
  TextInput, Button, Group, Box, Title, Select, Textarea, SimpleGrid,
  Divider, Text, Radio, Switch, Stack, Checkbox, Accordion, Alert, MultiSelect,
  NumberInput, ActionIcon, Card, Container, ScrollArea, Affix, Progress,
  Badge, Transition, rem
} from '@mantine/core';
import RichTextEditor from './RichTextEditor';
import { DateTimePicker } from '@mantine/dates';
import { IconPlus, IconTrash, IconChevronUp } from '@tabler/icons-react';
import { useWindowScroll } from '@mantine/hooks';
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
import { MainCategorySelector } from './MainCategorySelector';
import { SecondaryCategoriesSelector } from './SecondaryCategoriesSelector';
import { IdealForSelector } from './IdealForSelector';
import DynamicAttributeForm from './DynamicAttributeForm';
import HoursSelector from './HoursSelector';
import { 
  addLink, removeLink, updateLink, 
  addParkingLocation, removeParkingLocation, updateParkingLocation 
} from '../utils/fieldHelpers';

// Lazy load the map component to improve performance
const LocationMap = lazy(() => import('./LocationMap'));
import { LocationMapSkeleton } from './LocationMap';

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
  publication_status: 'draft',
  dont_display_location: false,
  // Address fields
  address_full: '',
  address_street: '',
  address_city: '',
  address_state: 'NC',
  address_zip: '',
  address_county: '',
  // Front door coordinates
  front_door_latitude: null,
  front_door_longitude: null,
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
  expect_to_pay_parking: 'no',
  // Additional Info
  downloadable_maps: [],
  payment_methods: [],
  key_facilities: [],
  alcohol_available: 'no',
  alcohol_options: [],
  wheelchair_accessible: [],
  wheelchair_details: '',
  smoking_options: [],
  smoking_details: '',
  wifi_options: [],
  drone_usage: '',
  drone_policy: '',
  pets_allowed: 'no',
  pet_options: [],
  pet_policy: '',
  // Public Toilets
  public_toilets_available: 'no',
  public_toilets: [],
  toilet_locations: [],
  toilet_description: '',
  toilet_latitude: null,
  toilet_longitude: null,
  toilet_photos: '',
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
  gift_cards: 'no',
  youth_amenities: [],
  business_amenities: [],
  entertainment_options: [],
  // Menu & Online Booking (Business only)
  menu_photos: [],
  menu_link: '',
  delivery_links: [],
  reservation_links: [],
  appointment_links: [],
  online_ordering_links: [],
  // Gallery photos
  gallery_photos: [],
  // Business Entry
  business_entry_notes: '',
  business_entry_photo: '',
  // Hours enhancements
  appointment_booking_url: '',
  hours_but_appointment_required: false,
  // Service Relationships
  service_locations: [],
  // Locally Found & Community
  locally_found_at: [],
  article_links: [],
  community_impact: '',
  organization_memberships: [],
  // Business subtype
  business: {
    price_range: ''
  },
  // Park subtype
  park: {
    drone_usage_policy: ''
  },
  // Trail subtype
  trail: {
    length_text: '',
    length_segments: [],
    difficulty: null,
    difficulty_description: null,
    route_type: null,
    trailhead_location: null,
    trailhead_entrance_photo: '',
    trailhead_exit_location: null,
    trailhead_exit_photo: '',
    trail_markings: '',
    trailhead_access_details: '',
    downloadable_trail_map: '',
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
  },
  // Other fields
  photos: { featured: null, gallery: [] },
  hours: {},
  holiday_hours: {},
  amenities: {},
  ideal_for: [],
  contact_info: {},
  compliance: {},
  custom_fields: {},
  main_category_id: null,
  category_ids: []
};

export default function POIForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [scroll, scrollTo] = useWindowScroll();
  const [loading, setLoading] = useState(false);
  const [renderError, setRenderError] = useState(null);

  const form = useForm({
    initialValues: emptyInitialValues,
    validate: {
      name: (value) => (!value ? 'Name is required' : null),
      poi_type: (value) => (!value ? 'POI type is required' : null),
      latitude: (value) => (value === null || value === undefined ? 'Location is required' : null),
      longitude: (value) => (value === null || value === undefined ? 'Location is required' : null),
      address_city: (value) => (!value ? 'City is required' : null),
      address_state: (value) => (!value ? 'State is required' : null),
      main_category_id: (value) => (!value ? 'Main category is required' : null),
      category_ids: (value, values) => {
        // Business POIs don't need secondary categories, only main category
        if (values?.poi_type === 'BUSINESS') {
          return null;
        }
        const fieldConfig = getFieldsForListingType(values?.listing_type, values?.poi_type);
        const maxCategories = fieldConfig?.maxCategories || 3;
        return value?.length === 0 ? 'At least one category is required' :
               value?.length > maxCategories ? `Maximum ${maxCategories} categories allowed` : null;
      },
      'event.start_datetime': (value, values) => {
        if (values?.poi_type === 'EVENT' && !value) {
          return 'Start date/time is required for events';
        }
        return null;
      }
    }
  });

  // Load POI data if editing
  useEffect(() => {
    if (isEditing) {
      const fetchPOI = async () => {
        try {
          const response = await api.get(`/pois/${id}`);

          // Check if response is ok
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const poi = await response.json();
          console.log('Fetched POI data:', poi); // Debug log

          // Transform the data to match form structure
          const formData = {
            ...emptyInitialValues,
            ...poi,
            longitude: poi.location?.coordinates?.[0] || emptyInitialValues.longitude,
            latitude: poi.location?.coordinates?.[1] || emptyInitialValues.latitude,
            category_ids: poi.categories ? poi.categories.map(c => c.id) : [],
            business: poi.business || emptyInitialValues.business,
            park: poi.park || emptyInitialValues.park,
            trail: poi.trail || emptyInitialValues.trail,
            event: poi.event || emptyInitialValues.event
          };

          // Ensure all array fields are arrays, not null
          const arrayFields = [
            'ideal_for', 'ideal_for_key', 'parking_types', 'payment_methods', 'key_facilities',
            'alcohol_options', 'wheelchair_accessible', 'smoking_options', 'wifi_options',
            'pet_options', 'public_toilets', 'youth_amenities', 'business_amenities',
            'entertainment_options', 'natural_features', 'outdoor_types', 'things_to_do',
            'hunting_types', 'fishing_types', 'licenses_required', 'playground_types',
            'playground_surface_types', 'downloadable_maps', 'parking_locations',
            'toilet_locations', 'rental_photos', 'menu_photos', 'delivery_links',
            'reservation_links', 'appointment_links', 'online_ordering_links',
            'service_locations', 'locally_found_at', 'article_links',
            'organization_memberships', 'parking_photos'
          ];

          arrayFields.forEach(field => {
            if (formData[field] === null || formData[field] === undefined || !Array.isArray(formData[field])) {
              formData[field] = emptyInitialValues[field] || [];
            }
          });

          // Handle nested array fields more thoroughly
          if (formData.trail) {
            const trailArrayFields = ['trail_surfaces', 'trail_conditions', 'trail_experiences'];
            trailArrayFields.forEach(field => {
              if (formData.trail[field] === null || formData.trail[field] === undefined || !Array.isArray(formData.trail[field])) {
                formData.trail[field] = [];
              }
            });
          }

          if (formData.event) {
            const eventArrayFields = ['vendor_types', 'coat_check_options'];
            eventArrayFields.forEach(field => {
              if (formData.event[field] === null || formData.event[field] === undefined || !Array.isArray(formData.event[field])) {
                formData.event[field] = [];
              }
            });
          }

          // Handle hours field specially
          if (!formData.hours || formData.hours === null) {
            formData.hours = emptyInitialValues.hours || {};
          }

          // Handle all string/text fields - convert null to empty string or undefined
          const stringFields = [
            'name', 'teaser_paragraph', 'description_long', 'description_short', 'status_message',
            'address_full', 'address_street', 'address_city', 'address_zip', 'website_url',
            'phone_number', 'email', 'instagram_username', 'facebook_username', 'x_username',
            'tiktok_username', 'linkedin_username', 'main_contact_name', 'main_contact_email',
            'main_contact_phone', 'offsite_emergency_contact', 'emergency_protocols',
            'cost', 'pricing_details', 'ticket_link', 'history_paragraph', 'featured_image',
            'parking_notes', 'public_transit_info', 'wheelchair_details', 'smoking_details',
            'drone_usage', 'drone_policy', 'pet_policy', 'toilet_description', 'rental_info',
            'rental_pricing', 'rental_link', 'price_range_per_person', 'pricing', 'gift_cards',
            'menu_link', 'community_impact', 'night_sky_viewing', 'birding_wildlife',
            'hunting_fishing_info', 'membership_details', 'camping_lodging', 'playground_notes',
            'pets_allowed', 'alcohol_available', 'public_toilets_available', 'toilet_photos'
          ];

          stringFields.forEach(field => {
            if (formData[field] === null) {
              formData[field] = '';
            }
          });

          // Handle nested string fields
          if (formData.trail) {
            const trailStringFields = [
              'length_text', 'difficulty', 'difficulty_description', 'route_type',
              'trail_markings', 'trailhead_access_details', 'downloadable_trail_map'
            ];
            trailStringFields.forEach(field => {
              if (formData.trail[field] === null) {
                formData.trail[field] = '';
              }
            });
          }

          if (formData.event) {
            const eventStringFields = [
              'organizer_name', 'food_and_drink_info', 'vendor_fee',
              'vendor_application_info', 'vendor_requirements'
            ];
            eventStringFields.forEach(field => {
              if (formData.event[field] === null) {
                formData.event[field] = '';
              }
            });
          }

          console.log('Form data after transformation:', formData); // Debug log

          // Set form values with error handling
          try {
            form.setValues(formData);
            console.log('Form values set successfully');
          } catch (formError) {
            console.error('Error setting form values:', formError);
            throw new Error(`Form validation error: ${formError.message}`);
          }
        } catch (error) {
          console.error('Error loading POI:', error); // Debug log
          notifications.show({
            title: 'Error',
            message: `Failed to load POI data: ${error.message}`,
            color: 'red'
          });
        }
      };
      fetchPOI();
    }
  }, [id, isEditing]);

  const handleSubmit = async (values, publicationStatus = 'published') => {
    setLoading(true);

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

    // Prepare the payload
    const payload = {
      ...cleanValues,
      publication_status: publicationStatus, // Set the publication status
      location: {
        type: 'Point',
        coordinates: [cleanValues.longitude, cleanValues.latitude]
      }
    };

    // Remove fields not needed in payload
    delete payload.longitude;
    delete payload.latitude;

    // Only include the subtype data relevant to the POI type
    if (payload.poi_type !== 'BUSINESS') delete payload.business;
    if (payload.poi_type !== 'PARK') delete payload.park;
    if (payload.poi_type !== 'TRAIL') delete payload.trail;
    if (payload.poi_type !== 'EVENT') delete payload.event;

    try {
      if (isEditing) {
        await api.put(`/pois/${id}`, payload);
        notifications.show({ 
          title: 'Success', 
          message: 'POI updated successfully!', 
          color: 'green' 
        });
      } else {
        await api.post('/pois/', payload);
        notifications.show({ 
          title: 'Success', 
          message: 'POI created successfully!', 
          color: 'green' 
        });
      }
      navigate('/pois');
    } catch (error) {
      console.error('Error:', error);
      notifications.show({ 
        title: 'Error', 
        message: error.message || `Failed to ${isEditing ? 'update' : 'create'} POI.`, 
        color: 'red' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this POI?')) return;

    try {
      await api.delete(`/pois/${id}`);
      notifications.show({
        title: 'Success',
        message: 'POI deleted successfully!',
        color: 'green'
      });
      navigate('/pois');
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to delete POI',
        color: 'red'
      });
    }
  };

  // Helper function to get checkbox group props with null safety
  const getCheckboxGroupProps = (fieldPath) => {
    const inputProps = form.getInputProps(fieldPath);
    return {
      ...inputProps,
      value: inputProps.value || []
    };
  };

  // Memoize computed values to prevent unnecessary recalculations
  const isBusiness = useMemo(() => form.values.poi_type === 'BUSINESS', [form.values.poi_type]);
  const isPark = useMemo(() => form.values.poi_type === 'PARK', [form.values.poi_type]);
  const isTrail = useMemo(() => form.values.poi_type === 'TRAIL', [form.values.poi_type]);
  const isEvent = useMemo(() => form.values.poi_type === 'EVENT', [form.values.poi_type]);
  const isPaidListing = useMemo(() => 
    isBusiness && ['paid', 'paid_founding', 'sponsor', 'community_comped'].includes(form.values.listing_type),
    [isBusiness, form.values.listing_type]
  );
  const isFreeListing = useMemo(() => 
    form.values.listing_type === 'free',
    [form.values.listing_type]
  );

  // Early return for render errors
  if (renderError) {
    return (
      <Container size="xl" px={{ base: 'xs', sm: 'md', lg: 'xl' }}>
        <Stack spacing="xl" pb={100}>
          <Alert color="red" title="Render Error">
            <Text>An error occurred while rendering the form: {renderError.message}</Text>
            <Button onClick={() => setRenderError(null)} mt="md">Try Again</Button>
            <Button onClick={() => navigate('/pois')} mt="md" ml="sm">Back to POIs</Button>
          </Alert>
        </Stack>
      </Container>
    );
  }

  try {
    return (
      <Container size="xl" px={{ base: 'xs', sm: 'md', lg: 'xl' }}>
        <Stack spacing="xl" pb={100}>
        <Box>
          <Title order={2} c="deep-purple.7" mb="md">
            {isEditing ? `Editing: ${form.values.name}` : 'Create New Point of Interest'}
          </Title>
          <Text size="sm" c="dimmed">Fields marked with * are required</Text>
        </Box>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Accordion 
            defaultValue={['core', 'categories', 'location', 'hours']}
            multiple
            variant="separated"
          >
            {/* Core Information Section */}
            <Accordion.Item value="core">
              <Accordion.Control>
                <Group>
                  <Text fw={600}>Core Information</Text>
                  <Badge size="sm" variant="light">Required</Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack>
                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <Select
                      label="POI Type"
                      placeholder="Select POI Type"
                      data={[
                        { value: 'BUSINESS', label: 'Business' },
                        { value: 'PARK', label: 'Park' },
                        { value: 'TRAIL', label: 'Trail' },
                        { value: 'EVENT', label: 'Event' }
                      ]}
                      {...form.getInputProps('poi_type')}
                      withAsterisk
                    />
                    <Select
                      label="Listing Type"
                      placeholder="Select Listing Type"
                      data={LISTING_TYPES}
                      {...form.getInputProps('listing_type')}
                    />
                  </SimpleGrid>

                  <TextInput
                    label="Name"
                    placeholder="Enter POI name"
                    {...form.getInputProps('name')}
                    withAsterisk
                  />

                  <RichTextEditor
                    label="Teaser Paragraph"
                    placeholder="Brief 120 character description"
                    maxLength={120}
                    value={form.values.teaser_paragraph || ''}
                    onChange={(html) => form.setFieldValue('teaser_paragraph', html)}
                    error={form.errors.teaser_paragraph}
                    minRows={2}
                  />

                  {isBusiness && form.values.listing_type === 'free' ? (
                    <RichTextEditor
                      label="Short Description"
                      placeholder="Brief description (max 250 characters)"
                      maxLength={250}
                      value={form.values.description_short || ''}
                      onChange={(html) => form.setFieldValue('description_short', html)}
                      error={form.errors.description_short}
                      minRows={3}
                    />
                  ) : (
                    <RichTextEditor
                      label="Long Description"
                      placeholder="Detailed description"
                      value={form.values.description_long || ''}
                      onChange={(html) => form.setFieldValue('description_long', html)}
                      error={form.errors.description_long}
                      minRows={4}
                    />
                  )}

                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <Select
                      label="Status"
                      placeholder="Select status"
                      data={getStatusOptions(form.values.poi_type)}
                      {...form.getInputProps('status')}
                    />
                    <TextInput
                      label="Status Message"
                      placeholder="Additional status info (max 100 chars)"
                      maxLength={100}
                      {...form.getInputProps('status_message')}
                    />
                  </SimpleGrid>

                  <SimpleGrid cols={{ base: 1, sm: 3 }}>
                    <Switch
                      label="Verified"
                      {...form.getInputProps('is_verified', { type: 'checkbox' })}
                    />
                    <Switch
                      label="Disaster Hub"
                      {...form.getInputProps('is_disaster_hub', { type: 'checkbox' })}
                    />
                    {isBusiness && (
                      <Switch
                        label="Don't Display Location"
                        {...form.getInputProps('dont_display_location', { type: 'checkbox' })}
                      />
                    )}
                  </SimpleGrid>

                  {isEvent && (
                    <>
                      <Divider my="md" label="Event Details" />
                      <SimpleGrid cols={{ base: 1, sm: 2 }}>
                        <DateTimePicker
                          label="Start Date & Time"
                          placeholder="Select start date and time"
                          {...form.getInputProps('event.start_datetime')}
                          withAsterisk
                        />
                        <DateTimePicker
                          label="End Date & Time"
                          placeholder="Select end date and time"
                          {...form.getInputProps('event.end_datetime')}
                        />
                      </SimpleGrid>
                      <TextInput
                        label="Organizer Name"
                        placeholder="Name of event organizer"
                        {...form.getInputProps('event.organizer_name')}
                      />
                      <Switch
                        label="Repeating Event"
                        {...form.getInputProps('event.is_repeating', { type: 'checkbox' })}
                      />
                    </>
                  )}

                  {(isEvent || isPark || isTrail) && (
                    <>
                      <Divider my="md" label="Cost Information" />
                      <SimpleGrid cols={{ base: 1, sm: 2 }}>
                        <TextInput
                          label="Cost"
                          placeholder="e.g., $10 or $0-$50 or 0 (for free)"
                          {...form.getInputProps('cost')}
                        />
                        {isEvent && (
                          <TextInput
                            label="Ticket Link"
                            placeholder="URL to purchase tickets"
                            {...form.getInputProps('ticket_link')}
                          />
                        )}
                      </SimpleGrid>
                      <RichTextEditor
                        label="Pricing Details"
                        placeholder="Additional pricing info (e.g., Kids under 2 are free)"
                        value={form.values.pricing_details || ''}
                        onChange={(html) => form.setFieldValue('pricing_details', html)}
                        error={form.errors.pricing_details}
                        minRows={3}
                      />
                    </>
                  )}

                  {(isPaidListing || isPark || isTrail) && (
                    <>
                      <Divider my="md" label="History" />
                      <RichTextEditor
                        label="History Paragraph"
                        placeholder="Brief history or background"
                        value={form.values.history_paragraph || ''}
                        onChange={(html) => form.setFieldValue('history_paragraph', html)}
                        error={form.errors.history_paragraph}
                        minRows={3}
                      />
                    </>
                  )}

                  <TextInput
                    label={isBusiness && isFreeListing ? "Logo" : "Featured Image"}
                    placeholder={isBusiness && isFreeListing ? "URL to business logo" : "URL to featured image"}
                    {...form.getInputProps('featured_image')}
                    description="Upload image instead of URL"
                  />
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Categories & Ideal For Section */}
            <Accordion.Item value="categories">
              <Accordion.Control>
                <Group>
                  <Text fw={600}>Categories & Target Audience</Text>
                  <Badge size="sm" variant="light">Required</Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack>
                  {form.values.poi_type === 'BUSINESS' && form.values.listing_type === 'free' && (
                    <Alert color="blue" variant="light" mb="md">
                      Free business listings are limited to 1 category and 3 ideal-for options
                    </Alert>
                  )}
                  
                  <MainCategorySelector
                    value={form.values.main_category_id}
                    onChange={(value) => form.setFieldValue('main_category_id', value)}
                    poiType={form.values.poi_type}
                    error={form.errors.main_category_id}
                  />
                  
                  {/* Only show secondary categories for non-Business POIs */}
                  {form.values.poi_type !== 'BUSINESS' && (
                    <SecondaryCategoriesSelector
                      value={form.values.category_ids || []}
                      onChange={(value) => form.setFieldValue('category_ids', value)}
                      poiType={form.values.poi_type}
                      mainCategoryId={form.values.main_category_id}
                      maxValues={getFieldsForListingType(form.values.listing_type, form.values.poi_type)?.maxCategories}
                      error={form.errors.category_ids}
                    />
                  )}

                  {/* Ideal For */}
                  <Divider my="md" label="Target Audience" />
                  
                  {/* Key Ideal For - Only for paid listings */}
                  {isPaidListing && (
                    <Stack mb="md">
                      <Title order={5}>Key Ideal For</Title>
                      <Text size="sm" c="dimmed">
                        Select up to 3 primary audiences (these will be prominently displayed)
                      </Text>
                      <SimpleGrid cols={{ base: 1, sm: 2 }}>
                        {IDEAL_FOR_KEY_OPTIONS.map((option) => (
                          <Checkbox
                            key={option}
                            label={option}
                            checked={(form.values.ideal_for_key || []).includes(option)}
                            onChange={(event) => {
                              const checked = event.currentTarget.checked;
                              if (checked && (form.values.ideal_for_key?.length || 0) < 3) {
                                form.setFieldValue('ideal_for_key', [...(form.values.ideal_for_key || []), option]);
                              } else if (!checked) {
                                form.setFieldValue('ideal_for_key', (form.values.ideal_for_key || []).filter(v => v !== option));
                              }
                            }}
                            disabled={
                              form.values.ideal_for_key?.length >= 3 &&
                              !(form.values.ideal_for_key || []).includes(option)
                            }
                          />
                        ))}
                      </SimpleGrid>
                      <Text size="xs" c="dimmed">
                        {form.values.ideal_for_key?.length || 0} / 3 selected
                      </Text>
                    </Stack>
                  )}

                  {/* Full Ideal For */}
                  <Stack>
                    <Title order={5}>Ideal For</Title>
                    <Text size="sm" c="dimmed">
                      Select all audiences that would enjoy this {form.values.poi_type?.toLowerCase() || 'POI'}
                    </Text>
                    <IdealForSelector
                      value={form.values.ideal_for || []}
                      onChange={(value) => form.setFieldValue('ideal_for', value)}
                      keyIdealFor={form.values.ideal_for_key || []}
                      maxSelections={isFreeListing ? 5 : undefined}
                      showAll={!isFreeListing}
                    />
                    {isFreeListing && (
                      <Text size="xs" c="dimmed" mt="xs">
                        Free listings can select up to 5 ideal audiences
                      </Text>
                    )}
                  </Stack>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Location & Parking Section */}
            <Accordion.Item value="location">
              <Accordion.Control>
                <Group>
                  <Text fw={600}>Location & Parking</Text>
                  <Badge size="sm" variant="light">Required</Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack>
                  <Suspense fallback={<LocationMapSkeleton />}>
                    <LocationMap
                      latitude={form.values.latitude}
                      longitude={form.values.longitude}
                      onLocationChange={(lat, lng) => {
                        form.setFieldValue('latitude', lat);
                        form.setFieldValue('longitude', lng);
                      }}
                    />
                  </Suspense>

                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <TextInput
                      label="Street Address"
                      placeholder="123 Main St"
                      {...form.getInputProps('address_street')}
                    />
                    <TextInput
                      label="Address Line 2 (Suite, Unit, etc.)"
                      placeholder="Suite 100, Unit B, etc."
                      {...form.getInputProps('address_full')}
                    />
                  </SimpleGrid>

                  <SimpleGrid cols={{ base: 1, sm: 4 }}>
                    <TextInput
                      label="City"
                      placeholder="City name"
                      {...form.getInputProps('address_city')}
                      withAsterisk
                    />
                    <TextInput
                      label="County"
                      placeholder="County name"
                      {...form.getInputProps('address_county')}
                    />
                    <Select
                      label="State"
                      placeholder="Select state"
                      data={['NC', 'SC', 'VA', 'GA', 'TN']}
                      {...form.getInputProps('address_state')}
                      withAsterisk
                    />
                    <TextInput
                      label="ZIP Code"
                      placeholder="12345"
                      {...form.getInputProps('address_zip')}
                    />
                  </SimpleGrid>

                  <Divider my="md" label="Coordinates" />
                  <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <NumberInput
                      label="Front Door Latitude"
                      placeholder="35.7128"
                      precision={6}
                      {...form.getInputProps('front_door_latitude')}
                    />
                    <NumberInput
                      label="Front Door Longitude"
                      placeholder="-79.0064"
                      precision={6}
                      {...form.getInputProps('front_door_longitude')}
                    />
                  </SimpleGrid>
                  <Button
                    size="xs"
                    variant="light"
                    onClick={() => {
                      form.setFieldValue('front_door_latitude', form.values.latitude);
                      form.setFieldValue('front_door_longitude', form.values.longitude);
                    }}
                  >
                    Use Map Pin for Lat/Long
                  </Button>

                  <Divider my="md" label="Parking Information" />
                  
                  <Checkbox.Group
                    label="Parking Types Available"
                    {...getCheckboxGroupProps('parking_types')}
                  >
                    <SimpleGrid cols={{ base: 2, sm: 3 }}>
                      {PARKING_OPTIONS.map(type => (
                        <Checkbox key={type} value={type} label={type} />
                      ))}
                    </SimpleGrid>
                  </Checkbox.Group>

                  {!isFreeListing && (
                    <>
                      <Textarea
                        label="Parking Notes"
                        placeholder="Additional parking information"
                        {...form.getInputProps('parking_notes')}
                      />

                      <Textarea
                        label="Public Transit Information"
                        placeholder="Bus routes, train stations, etc."
                        {...form.getInputProps('public_transit_info')}
                      />

                      <Radio.Group
                        label="Expect to Pay for Parking?"
                        {...form.getInputProps('expect_to_pay_parking')}
                      >
                        <Stack mt="xs">
                          <Radio value="yes" label="Yes" />
                          <Radio value="no" label="No" />
                          <Radio value="sometimes" label="Sometimes" />
                        </Stack>
                      </Radio.Group>
                    </>
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Hours of Operation Section */}
            <Accordion.Item value="hours">
              <Accordion.Control>
                <Text fw={600}>Hours of Operation</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack>
                  <HoursSelector
                    value={form.values.hours}
                    onChange={(value) => form.setFieldValue('hours', value)}
                    poiType={form.values.poi_type}
                  />
                  {isBusiness && (
                    <>
                      <Divider my="md" label="Appointment Booking" />
                      <TextInput
                        label="Appointment Booking URL"
                        placeholder="https://calendly.com/your-business"
                        {...form.getInputProps('appointment_booking_url')}
                        description="Link for customers to book appointments (for 'By Appointment Only' businesses)"
                      />
                      {!isFreeListing && (
                        <Checkbox
                          label="Hours are set, but appointments are still required"
                          {...form.getInputProps('hours_but_appointment_required', { type: 'checkbox' })}
                          description="Check this if you have regular hours but customers still need to make appointments"
                        />
                      )}
                    </>
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Contact & Social Media Section */}
            <Accordion.Item value="contact">
              <Accordion.Control>
                <Text fw={600}>Contact & Social Media</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack>
                  <SimpleGrid cols={{ base: 1, sm: 3 }}>
                    <TextInput
                      label="Website"
                      placeholder="https://example.com"
                      {...form.getInputProps('website_url')}
                    />
                    <TextInput
                      label="Phone Number"
                      placeholder="(555) 123-4567"
                      {...form.getInputProps('phone_number')}
                    />
                    <TextInput
                      label="Email"
                      placeholder="contact@example.com"
                      {...form.getInputProps('email')}
                    />
                  </SimpleGrid>

                  <Divider my="md" label="Social Media Usernames" />
                  <Text size="sm" c="dimmed">Enter just the username (not the full URL)</Text>
                  {isFreeListing && (
                    <Alert color="blue" variant="light" mt="xs">
                      For free accounts, these links are for internal use only and will not be displayed publicly. This helps us tag the correct business on social media.
                    </Alert>
                  )}
                  
                  <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                    <TextInput
                      label="Instagram"
                      placeholder="@username"
                      {...form.getInputProps('instagram_username')}
                    />
                    <TextInput
                      label="Facebook"
                      placeholder="pagename"
                      {...form.getInputProps('facebook_username')}
                    />
                    <TextInput
                      label="X (Twitter)"
                      placeholder="@username"
                      {...form.getInputProps('x_username')}
                    />
                    <TextInput
                      label="TikTok"
                      placeholder="@username"
                      {...form.getInputProps('tiktok_username')}
                    />
                    <TextInput
                      label="LinkedIn"
                      placeholder="company-name"
                      {...form.getInputProps('linkedin_username')}
                    />
                  </SimpleGrid>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Internal Contacts Section */}
            <Accordion.Item value="internal">
              <Accordion.Control>
                <Text fw={600}>Internal Contact Information</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack>
                  <Alert color="blue" variant="light" mb="md">
                    This information is for internal use only and will not be displayed publicly
                  </Alert>
                  
                  <Divider my="md" label="Main Contact" />
                  <SimpleGrid cols={{ base: 1, sm: 3 }}>
                    <TextInput
                      label="Name"
                      placeholder="Contact person name"
                      {...form.getInputProps('main_contact_name')}
                    />
                    <TextInput
                      label="Email"
                      placeholder="contact@example.com"
                      {...form.getInputProps('main_contact_email')}
                    />
                    <TextInput
                      label="Phone"
                      placeholder="(555) 123-4567"
                      {...form.getInputProps('main_contact_phone')}
                    />
                  </SimpleGrid>

                  <Divider my="md" label="Emergency Contact (Admin Only)" />
                  <Alert color="orange" variant="light" mb="md">
                    For disaster response coordination - admin access only
                  </Alert>
                  
                  <Textarea
                    label="Off-site Emergency Contact"
                    placeholder="Emergency contact information"
                    {...form.getInputProps('offsite_emergency_contact')}
                  />
                  
                  <Textarea
                    label="Emergency Protocols"
                    placeholder="Emergency procedures and protocols"
                    minRows={3}
                    {...form.getInputProps('emergency_protocols')}
                  />
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Business Details Section */}
            {isBusiness && (
              <Accordion.Item value="business">
                <Accordion.Control>
                  <Text fw={600}>Business Details</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack>
                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                      <Select
                        label="Price Range per Person"
                        placeholder="Select price range"
                        data={PRICE_RANGE_OPTIONS}
                        {...form.getInputProps('price_range_per_person')}
                      />
                      {!isFreeListing && (
                        <Select
                          label="Gift Cards Available?"
                          data={GIFT_CARD_OPTIONS}
                          {...form.getInputProps('gift_cards')}
                        />
                      )}
                    </SimpleGrid>

                    <TextInput
                      label="General Pricing"
                      placeholder="e.g., Average meal $15-25"
                      {...form.getInputProps('pricing')}
                    />

                    {!isFreeListing && (
                      <>
                        <Divider my="md" label="Discounts Offered" />
                        <Text size="sm" c="dimmed">
                          Do you offer an everyday discount for service members or community members, separate from seasonal or day-specific promotions?
                        </Text>
                        <Checkbox.Group {...getCheckboxGroupProps('discounts')}>
                          <SimpleGrid cols={{ base: 2, sm: 3 }}>
                            {DISCOUNT_TYPES.map(discount => (
                              <Checkbox key={discount} value={discount} label={discount} />
                            ))}
                          </SimpleGrid>
                        </Checkbox.Group>

                        <Divider my="md" label="Youth Amenities" />
                        <Checkbox.Group {...getCheckboxGroupProps('youth_amenities')}>
                          <SimpleGrid cols={{ base: 2, sm: 3 }}>
                            {YOUTH_AMENITIES.map(amenity => (
                              <Checkbox key={amenity} value={amenity} label={amenity} />
                            ))}
                          </SimpleGrid>
                        </Checkbox.Group>

                        <Divider my="md" label="Business Amenities" />
                        <Checkbox.Group {...getCheckboxGroupProps('business_amenities')}>
                          <SimpleGrid cols={{ base: 2, sm: 3 }}>
                            {BUSINESS_AMENITIES.map(amenity => (
                              <Checkbox key={amenity} value={amenity} label={amenity} />
                            ))}
                          </SimpleGrid>
                        </Checkbox.Group>

                        <Divider my="md" label="Entertainment Options" />
                        <Checkbox.Group {...getCheckboxGroupProps('entertainment_options')}>
                          <SimpleGrid cols={{ base: 2, sm: 3 }}>
                            {ENTERTAINMENT_OPTIONS.map(option => (
                              <Checkbox key={option} value={option} label={option} />
                            ))}
                          </SimpleGrid>
                        </Checkbox.Group>
                      </>
                    )}
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            )}

            {/* Menu & Online Booking Section */}
            {isBusiness && !isFreeListing && (
              <Accordion.Item value="menu">
                <Accordion.Control>
                  <Text fw={600}>Menu & Online Booking</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack>
                    <TextInput
                      label="Menu Link"
                      placeholder="https://example.com/menu"
                      {...form.getInputProps('menu_link')}
                    />

                    <Divider my="md" label="Menu Photos" />
                    <Text size="sm" c="dimmed">Upload photos of your menu</Text>
                    <TextInput
                      label="Menu Photos"
                      placeholder="URLs to menu photos (comma-separated)"
                      {...form.getInputProps('menu_photos')}
                    />

                    <Divider my="md" label="Delivery Services" />
                    {(form.values.delivery_links || []).map((link, index) => (
                      <Group key={index}>
                        <TextInput
                          style={{ flex: 1 }}
                          placeholder="Delivery service URL"
                          value={link}
                          onChange={(e) => updateLink(form, 'delivery_links', index, e.target.value)}
                        />
                        <ActionIcon color="red" onClick={() => removeLink(form, 'delivery_links', index)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    ))}
                    <Button
                      variant="light"
                      leftSection={<IconPlus size={16} />}
                      onClick={() => addLink(form, 'delivery_links', '')}
                    >
                      Add Delivery Link
                    </Button>

                    <Divider my="md" label="Reservation Systems" />
                    {(form.values.reservation_links || []).map((link, index) => (
                      <Group key={index}>
                        <TextInput
                          style={{ flex: 1 }}
                          placeholder="Reservation system URL"
                          value={link}
                          onChange={(e) => updateLink(form, 'reservation_links', index, e.target.value)}
                        />
                        <ActionIcon color="red" onClick={() => removeLink(form, 'reservation_links', index)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    ))}
                    <Button
                      variant="light"
                      leftSection={<IconPlus size={16} />}
                      onClick={() => addLink(form, 'reservation_links', '')}
                    >
                      Add Reservation Link
                    </Button>

                    <Divider my="md" label="Online Ordering" />
                    {(form.values.online_ordering_links || []).map((link, index) => (
                      <Group key={index}>
                        <TextInput
                          style={{ flex: 1 }}
                          placeholder="Online ordering URL"
                          value={link}
                          onChange={(e) => updateLink(form, 'online_ordering_links', index, e.target.value)}
                        />
                        <ActionIcon color="red" onClick={() => removeLink(form, 'online_ordering_links', index)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    ))}
                    <Button
                      variant="light"
                      leftSection={<IconPlus size={16} />}
                      onClick={() => addLink(form, 'online_ordering_links', '')}
                    >
                      Add Ordering Link
                    </Button>

                    <Divider my="md" label="Appointment Scheduling" />
                    {(form.values.appointment_links || []).map((link, index) => (
                      <Group key={index}>
                        <TextInput
                          style={{ flex: 1 }}
                          placeholder="Appointment scheduling URL"
                          value={link}
                          onChange={(e) => updateLink(form, 'appointment_links', index, e.target.value)}
                        />
                        <ActionIcon color="red" onClick={() => removeLink(form, 'appointment_links', index)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    ))}
                    <Button
                      variant="light"
                      leftSection={<IconPlus size={16} />}
                      onClick={() => addLink(form, 'appointment_links', '')}
                    >
                      Add Appointment Link
                    </Button>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            )}

            {/* Gallery Section - PAID Business only */}
            {isBusiness && !isFreeListing && (
              <Accordion.Item value="gallery">
                <Accordion.Control>
                  <Text fw={600}>Gallery</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack>
                    <Text size="sm" c="dimmed">Upload extra photos to showcase your business</Text>
                    <TextInput
                      label="Gallery Photos"
                      placeholder="URLs to extra photos (comma-separated)"
                      {...form.getInputProps('gallery_photos')}
                    />
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            )}

            {/* Location & Parking Entry Details - PAID Business only */}
            {isBusiness && !isFreeListing && (
              <Accordion.Item value="business-entry">
                <Accordion.Control>
                  <Text fw={600}>Business Entry Details</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack>
                    <RichTextEditor
                      label="Business Entry Notes"
                      placeholder="Describe how to enter your business, special instructions, etc."
                      value={form.values.business_entry_notes || ''}
                      onChange={(html) => form.setFieldValue('business_entry_notes', html)}
                      error={form.errors.business_entry_notes}
                      minRows={3}
                    />
                    <TextInput
                      label="Entry Photo"
                      placeholder="URL to photo of business entrance"
                      {...form.getInputProps('business_entry_photo')}
                    />
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            )}

            {/* Facilities & Accessibility Section */}
            {(!isBusiness || !isFreeListing) && (
              <Accordion.Item value="facilities">
              <Accordion.Control>
                <Text fw={600}>Facilities & Accessibility</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack>
                  {(isEvent || isPark || isTrail) && (
                    <>
                      <Divider my="md" label="Key Facilities" />
                      <Checkbox.Group {...getCheckboxGroupProps('key_facilities')}>
                        <SimpleGrid cols={{ base: 2, sm: 3 }}>
                          {KEY_FACILITIES.map(facility => (
                            <Checkbox key={facility} value={facility} label={facility} />
                          ))}
                        </SimpleGrid>
                      </Checkbox.Group>
                    </>
                  )}

                  <Divider my="md" label="Payment Methods" />
                  <Checkbox.Group {...getCheckboxGroupProps('payment_methods')}>
                    <SimpleGrid cols={{ base: 2, sm: 3 }}>
                      {PAYMENT_METHODS.map(method => (
                        <Checkbox key={method} value={method} label={method} />
                      ))}
                    </SimpleGrid>
                  </Checkbox.Group>

                  <Divider my="md" label="Alcohol Availability" />
                  <Radio.Group
                    label="Is alcohol available?"
                    value={form.values.alcohol_available || 'no'}
                    onChange={(value) => {
                      form.setFieldValue('alcohol_available', value);
                      // Clear alcohol options when "No" is selected
                      if (value === 'no') {
                        form.setFieldValue('alcohol_options', []);
                      }
                    }}
                  >
                    <Stack mt="xs">
                      <Radio value="yes" label="Yes" />
                      <Radio value="no" label="No" />
                    </Stack>
                  </Radio.Group>

                  {form.values.alcohol_available === 'yes' && (
                    <>
                      <Checkbox.Group
                        label="Alcohol Options"
                        {...getCheckboxGroupProps('alcohol_options')}
                      >
                        <SimpleGrid cols={{ base: 2, sm: 3 }}>
                          {ALCOHOL_OPTIONS.filter(option => !['Yes', 'No Alcohol Allowed'].includes(option)).map(option => (
                            <Checkbox key={option} value={option} label={option} />
                          ))}
                        </SimpleGrid>
                      </Checkbox.Group>
                    </>
                  )}

                  <Divider my="md" label="Wheelchair Accessibility" />
                  <Checkbox.Group {...getCheckboxGroupProps('wheelchair_accessible')}>
                    <SimpleGrid cols={{ base: 2, sm: 3 }}>
                      {WHEELCHAIR_OPTIONS.map(option => (
                        <Checkbox key={option} value={option} label={option} />
                      ))}
                    </SimpleGrid>
                  </Checkbox.Group>
                  <Textarea
                    label="Additional Accessibility Details"
                    placeholder="Describe accessibility features"
                    {...form.getInputProps('wheelchair_details')}
                  />

                  <Divider my="md" label="Smoking Policy" />
                  <Checkbox.Group {...getCheckboxGroupProps('smoking_options')}>
                    <SimpleGrid cols={{ base: 2, sm: 3 }}>
                      {SMOKING_OPTIONS.map(option => (
                        <Checkbox key={option} value={option} label={option} />
                      ))}
                    </SimpleGrid>
                  </Checkbox.Group>
                  <Textarea
                    label="Smoking Policy Details"
                    placeholder="Additional smoking policy information"
                    {...form.getInputProps('smoking_details')}
                  />

                  {isEvent && (
                    <>
                      <Divider my="md" label="Event Amenities" />
                      <Checkbox.Group
                        label="WiFi Options"
                        {...getCheckboxGroupProps('wifi_options')}
                      >
                        <SimpleGrid cols={{ base: 2, sm: 3 }}>
                          {WIFI_OPTIONS.map(option => (
                            <Checkbox key={option} value={option} label={option} />
                          ))}
                        </SimpleGrid>
                      </Checkbox.Group>

                      <Checkbox.Group
                        label="Coat Check Options"
                        {...getCheckboxGroupProps('event.coat_check_options')}
                      >
                        <SimpleGrid cols={{ base: 2, sm: 3 }}>
                          {COAT_CHECK_OPTIONS.map(option => (
                            <Checkbox key={option} value={option} label={option} />
                          ))}
                        </SimpleGrid>
                      </Checkbox.Group>

                      <RichTextEditor
                        label="Food & Drink Information"
                        placeholder="What food and drink options are available?"
                        value={form.values.event?.food_and_drink_info || ''}
                        onChange={(html) => form.setFieldValue('event.food_and_drink_info', html)}
                        error={form.errors['event.food_and_drink_info']}
                        minRows={3}
                      />
                    </>
                  )}

                  {(isEvent || isPark || isTrail) && (
                    <>
                      <Divider my="md" label="Drone Policy" />
                      <Select
                        label="Drone Usage"
                        placeholder="Select drone policy"
                        data={DRONE_USAGE_OPTIONS}
                        {...form.getInputProps('drone_usage')}
                      />
                      <Textarea
                        label="Drone Policy Details"
                        placeholder="Additional drone policy information"
                        {...form.getInputProps('drone_policy')}
                      />
                    </>
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
            )}

            {/* Public Amenities Section */}
            {(!isBusiness || !isFreeListing) && (
              <Accordion.Item value="amenities">
              <Accordion.Control>
                <Text fw={600}>Public Amenities</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack>
                  <Divider my="md" label="Public Toilets" />
                  <Radio.Group
                    label="Are public toilets available?"
                    value={form.values.public_toilets_available || 'no'}
                    onChange={(value) => {
                      form.setFieldValue('public_toilets_available', value);
                      // Clear public toilet fields when "No" is selected
                      if (value === 'no') {
                        form.setFieldValue('public_toilets', []);
                        form.setFieldValue('toilet_description', '');
                        form.setFieldValue('toilet_locations', []);
                      }
                    }}
                  >
                    <Stack mt="xs">
                      <Radio value="yes" label="Yes" />
                      <Radio value="no" label="No" />
                    </Stack>
                  </Radio.Group>

                  {form.values.public_toilets_available === 'yes' && (
                    <>
                      <Checkbox.Group
                        label="Public Toilet Options"
                        {...getCheckboxGroupProps('public_toilets')}
                      >
                        <SimpleGrid cols={{ base: 2, sm: 3 }}>
                          {PUBLIC_TOILET_OPTIONS.filter(option => !['Yes', 'No'].includes(option)).map(option => (
                            <Checkbox key={option} value={option} label={option} />
                          ))}
                        </SimpleGrid>
                      </Checkbox.Group>

                      <Textarea
                        label="Toilet Description"
                        placeholder="e.g., For paying customers only, Location details"
                        {...form.getInputProps('toilet_description')}
                      />

                      <SimpleGrid cols={{ base: 1, sm: 2 }}>
                        <NumberInput
                          label="Toilet Latitude"
                          placeholder="e.g., 35.7128"
                          precision={6}
                          {...form.getInputProps('toilet_latitude')}
                        />
                        <NumberInput
                          label="Toilet Longitude"
                          placeholder="e.g., -79.0064"
                          precision={6}
                          {...form.getInputProps('toilet_longitude')}
                        />
                      </SimpleGrid>

                      <TextInput
                        label="Toilet Photos"
                        placeholder="URLs to toilet photos (comma-separated)"
                        {...form.getInputProps('toilet_photos')}
                      />
                    </>
                  )}

                  <Divider my="md" label="Rental Information" />
                  <Switch
                    label="Available for Rent"
                    {...form.getInputProps('available_for_rent', { type: 'checkbox' })}
                  />
                  {form.values.available_for_rent && (
                    <>
                      <Textarea
                        label="Rental Information"
                        placeholder="What's available for rent?"
                        {...form.getInputProps('rental_info')}
                      />
                      <SimpleGrid cols={{ base: 1, sm: 2 }}>
                        <TextInput
                          label="Rental Pricing"
                          placeholder="Pricing information"
                          {...form.getInputProps('rental_pricing')}
                        />
                        <TextInput
                          label="Rental Link"
                          placeholder="Link to rental information"
                          {...form.getInputProps('rental_link')}
                        />
                      </SimpleGrid>
                    </>
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
            )}

            {/* Event Vendors Section */}
            {isEvent && (
              <Accordion.Item value="vendors">
                <Accordion.Control>
                  <Text fw={600}>Event Vendors</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack>
                    <Switch
                      label="Has Vendors"
                      {...form.getInputProps('event.has_vendors', { type: 'checkbox' })}
                    />
                    {form.values.event.has_vendors && (
                      <>
                        <Checkbox.Group
                          label="Vendor Types"
                          {...getCheckboxGroupProps('event.vendor_types')}
                        >
                          <SimpleGrid cols={{ base: 2, sm: 3 }}>
                            {VENDOR_TYPES.map(type => (
                              <Checkbox 
                                key={typeof type === 'object' ? type.value : type} 
                                value={typeof type === 'object' ? type.value : type} 
                                label={typeof type === 'object' ? type.label : type} 
                              />
                            ))}
                          </SimpleGrid>
                        </Checkbox.Group>

                        <DateTimePicker
                          label="Vendor Application Deadline"
                          placeholder="Select deadline"
                          {...form.getInputProps('event.vendor_application_deadline')}
                        />

                        <RichTextEditor
                          label="Vendor Application Information"
                          placeholder="How to apply to be a vendor"
                          value={form.values.event?.vendor_application_info || ''}
                          onChange={(html) => form.setFieldValue('event.vendor_application_info', html)}
                          error={form.errors['event.vendor_application_info']}
                          minRows={3}
                        />

                        <TextInput
                          label="Vendor Fee"
                          placeholder="Cost to be a vendor"
                          {...form.getInputProps('event.vendor_fee')}
                        />

                        <Textarea
                          label="Vendor Requirements"
                          placeholder="Requirements for vendors"
                          {...form.getInputProps('event.vendor_requirements')}
                        />
                      </>
                    )}
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            )}

            {/* Pet Policy Section */}
            <Accordion.Item value="pets">
              <Accordion.Control>
                <Text fw={600}>Pet Policy</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack>
                  <Radio.Group
                    label="Are pets allowed?"
                    value={form.values.pets_allowed || 'no'}
                    onChange={(value) => {
                      form.setFieldValue('pets_allowed', value);
                      // Clear pet options when "No" is selected
                      if (value === 'no') {
                        form.setFieldValue('pet_options', []);
                        form.setFieldValue('pet_policy', '');
                      }
                    }}
                  >
                    <Stack mt="xs">
                      <Radio value="yes" label="Yes" />
                      <Radio value="no" label="No" />
                    </Stack>
                  </Radio.Group>

                  {form.values.pets_allowed === 'yes' && (
                    <>
                      <Divider my="md" label="Pet Policy Details" />
                      <Checkbox.Group
                        label="Pet Policy Options"
                        {...getCheckboxGroupProps('pet_options')}
                      >
                        <SimpleGrid cols={{ base: 2, sm: 3 }}>
                          {PET_OPTIONS.filter(option => !['Allowed', 'Not Allowed'].includes(option)).map(option => (
                            <Checkbox key={option} value={option} label={option} />
                          ))}
                        </SimpleGrid>
                      </Checkbox.Group>
                      <Textarea
                        label="Additional Pet Policy Information"
                        placeholder="Additional pet policy information"
                        {...form.getInputProps('pet_policy')}
                      />
                    </>
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Playground Section */}
            {(!isBusiness || !isFreeListing) && (
              <Accordion.Item value="playground">
              <Accordion.Control>
                <Text fw={600}>Playground Information</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack>
                  <Switch
                    label="Playground Available"
                    {...form.getInputProps('playground_available', { type: 'checkbox' })}
                  />
                  
                  {form.values.playground_available && (
                    <>
                      <Divider my="md" label="Playground Types" />
                      <Checkbox.Group {...getCheckboxGroupProps('playground_types')}>
                        <SimpleGrid cols={{ base: 1, sm: 2 }}>
                          {PLAYGROUND_TYPES.map(type => (
                            <Checkbox key={type} value={type} label={type} />
                          ))}
                        </SimpleGrid>
                      </Checkbox.Group>
                      
                      <Divider my="md" label="Playground Surface Type" />
                      <Checkbox.Group {...getCheckboxGroupProps('playground_surface_types')}>
                        <SimpleGrid cols={{ base: 2, sm: 3 }}>
                          {PLAYGROUND_SURFACES.map(surface => (
                            <Checkbox key={surface} value={surface} label={surface} />
                          ))}
                        </SimpleGrid>
                      </Checkbox.Group>
                      
                      <Textarea
                        label="Playground Notes"
                        placeholder="Additional playground information"
                        {...form.getInputProps('playground_notes')}
                      />
                    </>
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
            )}

            {/* Outdoor Features Section */}
            {(isPark || isTrail) && (
              <Accordion.Item value="outdoor">
                <Accordion.Control>
                  <Text fw={600}>Outdoor Features</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack>
                    <Divider my="md" label="Natural Features" />
                    <Checkbox.Group {...getCheckboxGroupProps('natural_features')}>
                      <SimpleGrid cols={{ base: 2, sm: 3 }}>
                        {NATURAL_FEATURES.map(feature => (
                          <Checkbox key={feature} value={feature} label={feature} />
                        ))}
                      </SimpleGrid>
                    </Checkbox.Group>
                    
                    <Divider my="md" label="Outdoor Types" />
                    <Checkbox.Group {...getCheckboxGroupProps('outdoor_types')}>
                      <SimpleGrid cols={{ base: 2, sm: 3 }}>
                        {OUTDOOR_TYPES.map(type => (
                          <Checkbox key={type} value={type} label={type} />
                        ))}
                      </SimpleGrid>
                    </Checkbox.Group>
                    
                    <Divider my="md" label="Things to Do" />
                    <Checkbox.Group {...getCheckboxGroupProps('things_to_do')}>
                      <SimpleGrid cols={{ base: 2, sm: 3 }}>
                        {THINGS_TO_DO.map(activity => (
                          <Checkbox key={activity} value={activity} label={activity} />
                        ))}
                      </SimpleGrid>
                    </Checkbox.Group>
                    
                    <RichTextEditor
                      label="Night Sky Viewing"
                      placeholder="Information about stargazing opportunities"
                      value={form.values.night_sky_viewing || ''}
                      onChange={(html) => form.setFieldValue('night_sky_viewing', html)}
                      error={form.errors.night_sky_viewing}
                      minRows={3}
                    />
                    
                    <RichTextEditor
                      label="Birding & Wildlife"
                      placeholder="Notable species and viewing information"
                      value={form.values.birding_wildlife || ''}
                      onChange={(html) => form.setFieldValue('birding_wildlife', html)}
                      error={form.errors.birding_wildlife}
                      minRows={3}
                    />
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            )}

            {/* Hunting & Fishing Section */}
            {(isPark || isTrail) && (
              <Accordion.Item value="hunting">
                <Accordion.Control>
                  <Text fw={600}>Hunting & Fishing</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack>
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
                        <Checkbox.Group {...getCheckboxGroupProps('hunting_types')}>
                          <SimpleGrid cols={{ base: 2, sm: 3 }}>
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
                    
                    {(form.values.fishing_allowed !== 'no') && (
                      <>
                        <Divider my="md" label="Fishing Types" />
                        <Checkbox.Group {...getCheckboxGroupProps('fishing_types')}>
                          <SimpleGrid cols={{ base: 2, sm: 3 }}>
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
                        <Checkbox.Group {...getCheckboxGroupProps('licenses_required')}>
                          <SimpleGrid cols={{ base: 2, sm: 3 }}>
                            {LICENSE_TYPES.map(license => (
                              <Checkbox key={license} value={license} label={license} />
                            ))}
                          </SimpleGrid>
                        </Checkbox.Group>
                        
                        <RichTextEditor
                          label="Additional Hunting & Fishing Information"
                          placeholder="Season dates, bag limits, special regulations..."
                          value={form.values.hunting_fishing_info || ''}
                          onChange={(html) => form.setFieldValue('hunting_fishing_info', html)}
                          error={form.errors.hunting_fishing_info}
                          minRows={3}
                        />
                      </>
                    )}
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            )}

            {/* Trail Details Section */}
            {isTrail && (
              <Accordion.Item value="trail">
                <Accordion.Control>
                  <Text fw={600}>Trail Details</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack>
                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                      <TextInput
                        label="Trail Length"
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
                    <Stack spacing="md">
                      {Object.entries(TRAIL_SURFACES).map(([category, surfaces]) => (
                        <div key={category}>
                          <Text fw={500} size="sm" mb="xs">{category}</Text>
                          <Checkbox.Group
                            {...getCheckboxGroupProps('trail.trail_surfaces')}
                          >
                            <SimpleGrid cols={{ base: 2, sm: 3 }}>
                              {surfaces.map(surface => (
                                <Checkbox key={surface} value={surface} label={surface} />
                              ))}
                            </SimpleGrid>
                          </Checkbox.Group>
                        </div>
                      ))}
                    </Stack>
                    
                    <Divider my="md" label="Trail Conditions" />
                    <Checkbox.Group {...getCheckboxGroupProps('trail.trail_conditions')}>
                      <SimpleGrid cols={{ base: 1, sm: 2 }}>
                        {TRAIL_CONDITIONS.map(condition => (
                          <Checkbox key={condition} value={condition} label={condition} />
                        ))}
                      </SimpleGrid>
                    </Checkbox.Group>
                    
                    <Divider my="md" label="Trail Experiences" />
                    <Checkbox.Group {...getCheckboxGroupProps('trail.trail_experiences')}>
                      <SimpleGrid cols={{ base: 2, sm: 3 }}>
                        {TRAIL_EXPERIENCES.map(experience => (
                          <Checkbox key={experience} value={experience} label={experience} />
                        ))}
                      </SimpleGrid>
                    </Checkbox.Group>
                    
                    <Textarea
                      label="Trail Markings"
                      placeholder="Describe trail markers and wayfinding"
                      {...form.getInputProps('trail.trail_markings')}
                    />
                    
                    <Textarea
                      label="Trailhead Access Details"
                      placeholder="Parking, access points, facilities at trailhead"
                      {...form.getInputProps('trail.trailhead_access_details')}
                    />
                    
                    <TextInput
                      label="Downloadable Trail Map"
                      placeholder="URL to trail map PDF"
                      {...form.getInputProps('trail.downloadable_trail_map')}
                    />
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            )}

            {/* Memberships & Connections Section */}
            {(isPark || isTrail) && (
              <Accordion.Item value="memberships">
                <Accordion.Control>
                  <Text fw={600}>Memberships & Connections</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack>
                    <Alert color="blue" variant="light">
                      Use this section to indicate if this location shares memberships with other parks/trails
                    </Alert>
                    
                    <RichTextEditor
                      label="Membership & Pass Details"
                      placeholder="Information about shared passes or membership programs"
                      value={form.values.membership_details || ''}
                      onChange={(html) => form.setFieldValue('membership_details', html)}
                      error={form.errors.membership_details}
                      minRows={3}
                    />
                    
                    <Textarea
                      label="Camping & Lodging"
                      placeholder="Available camping or lodging options"
                      {...form.getInputProps('camping_lodging')}
                    />
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            )}

            {/* Community Connections Section */}
            {(isBusiness || isPark || isTrail) && (
              <Accordion.Item value="community">
                <Accordion.Control>
                  <Text fw={600}>Community Connections</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack>
                    {isBusiness && (
                      <>
                        <Alert color="blue" variant="light">
                          Connect your business to other POIs where you provide services or sell products
                        </Alert>
                        
                        <Text size="sm" fw={500}>Service Locations</Text>
                        <Text size="xs" c="dimmed">
                          Select POIs where this business provides services (e.g., food truck at events)
                        </Text>
                        
                        <Text size="sm" fw={500} mt="md">Locally Found At</Text>
                        <Text size="xs" c="dimmed">
                          Select POIs where this business's products are sold
                        </Text>
                      </>
                    )}
                    
                    <RichTextEditor
                      label="Community Impact"
                      placeholder="How does this contribute to the local community?"
                      value={form.values.community_impact || ''}
                      onChange={(html) => form.setFieldValue('community_impact', html)}
                      error={form.errors.community_impact}
                      minRows={3}
                    />
                    
                    <Divider my="md" label="Article Links" />
                    {(form.values.article_links || []).map((link, index) => (
                      <Group key={index}>
                        <TextInput
                          style={{ flex: 1 }}
                          placeholder="Article or blog post URL"
                          value={link}
                          onChange={(e) => updateLink(form, 'article_links', index, e.target.value)}
                        />
                        <ActionIcon color="red" onClick={() => removeLink(form, 'article_links', index)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    ))}
                    <Button
                      variant="light"
                      leftSection={<IconPlus size={16} />}
                      onClick={() => addLink(form, 'article_links', '')}
                    >
                      Add Article Link
                    </Button>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            )}

            {/* Corporate Compliance Section */}
            <Accordion.Item value="compliance">
              <Accordion.Control>
                <Text fw={600}>Corporate Compliance</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack>
                  <Alert color="blue" variant="light" mb="md">
                    This information is for internal use only and will not be displayed publicly
                  </Alert>

                  <RichTextEditor
                    label="Corporate Compliance Requirements"
                    placeholder="Do you have any corporate compliance requirements we should be aware of? (e.g., required disclaimers, phrasing, or placement restrictions)"
                    value={form.values.compliance?.corporate_requirements || ''}
                    onChange={(html) => form.setFieldValue('compliance.corporate_requirements', html)}
                    error={form.errors['compliance.corporate_requirements']}
                    minRows={3}
                  />

                  <Radio.Group
                    label="Are there any restrictions on public comments or community tips being shown on your listing?"
                    value={form.values.compliance?.comments_restricted || 'no'}
                    onChange={(value) => {
                      form.setFieldValue('compliance.comments_restricted', value);
                      // Clear explanation when "No" is selected
                      if (value === 'no') {
                        form.setFieldValue('compliance.comments_explanation', '');
                      }
                    }}
                  >
                    <Stack mt="xs">
                      <Radio value="yes" label="Yes" />
                      <Radio value="no" label="No" />
                    </Stack>
                  </Radio.Group>

                  {form.values.compliance?.comments_restricted === 'yes' && (
                    <RichTextEditor
                      label="If yes, please explain"
                      placeholder="If yes, please explain: And would disabling the comments section on your listing satisfy requirements?"
                      value={form.values.compliance?.comments_explanation || ''}
                      onChange={(html) => form.setFieldValue('compliance.comments_explanation', html)}
                      error={form.errors['compliance.comments_explanation']}
                      minRows={3}
                    />
                  )}

                  <Divider my="md" label="Social Media Restrictions" />
                  <Text size="sm" fw={500} mb="xs">
                    Are there any social media platforms where your business cannot be mentioned or tagged?
                  </Text>
                  <Checkbox.Group
                    value={form.values.compliance?.social_media_restrictions || []}
                    onChange={(value) => form.setFieldValue('compliance.social_media_restrictions', value)}
                  >
                    <SimpleGrid cols={{ base: 2, sm: 3 }}>
                      <Checkbox value="facebook" label="Facebook" />
                      <Checkbox value="instagram" label="Instagram" />
                      <Checkbox value="x" label="X (formally Twitter)" />
                      <Checkbox value="tiktok" label="TikTok" />
                      <Checkbox value="linkedin" label="LinkedIn" />
                    </SimpleGrid>
                  </Checkbox.Group>

                  <RichTextEditor
                    label="Other Social Media Restrictions"
                    placeholder="Other social media platforms or additional restrictions"
                    value={form.values.compliance?.other_social_restrictions || ''}
                    onChange={(html) => form.setFieldValue('compliance.other_social_restrictions', html)}
                    error={form.errors['compliance.other_social_restrictions']}
                    minRows={2}
                  />

                  <Radio.Group
                    label="Do you require pre-approval before we feature or promote your business in any posts, newsletters, or other materials?"
                    value={form.values.compliance?.pre_approval_required || 'no'}
                    onChange={(value) => {
                      form.setFieldValue('compliance.pre_approval_required', value);
                      // Clear lead time when "No" is selected
                      if (value === 'no') {
                        form.setFieldValue('compliance.lead_time_details', '');
                      }
                    }}
                  >
                    <Stack mt="xs">
                      <Radio value="yes" label="Yes" />
                      <Radio value="no" label="No" />
                    </Stack>
                  </Radio.Group>

                  {form.values.compliance?.pre_approval_required === 'yes' && (
                    <RichTextEditor
                      label="Lead Time and Contact Information"
                      placeholder="If yes, how long of a lead time do you need and who do we contact with our post content for submission? (Email - Phone)"
                      value={form.values.compliance?.lead_time_details || ''}
                      onChange={(html) => form.setFieldValue('compliance.lead_time_details', html)}
                      error={form.errors['compliance.lead_time_details']}
                      minRows={3}
                    />
                  )}

                  <Radio.Group
                    label="Is there any language or branding you are required to use (or avoid) when referring to your business?"
                    value={form.values.compliance?.branding_requirements || 'no'}
                    onChange={(value) => {
                      form.setFieldValue('compliance.branding_requirements', value);
                      // Clear branding details when "No" is selected
                      if (value === 'no') {
                        form.setFieldValue('compliance.branding_details', '');
                      }
                    }}
                  >
                    <Stack mt="xs">
                      <Radio value="yes" label="Yes" />
                      <Radio value="no" label="No" />
                    </Stack>
                  </Radio.Group>

                  {form.values.compliance?.branding_requirements === 'yes' && (
                    <RichTextEditor
                      label="Branding Guidelines"
                      placeholder="If yes, please describe or attach brand guidelines"
                      value={form.values.compliance?.branding_details || ''}
                      onChange={(html) => form.setFieldValue('compliance.branding_details', html)}
                      error={form.errors['compliance.branding_details']}
                      minRows={3}
                    />
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Dynamic Attributes Section */}
            <Accordion.Item value="attributes">
              <Accordion.Control>
                <Text fw={600}>Dynamic Attributes</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <DynamicAttributeForm form={form} />
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>

          {/* Form Actions */}
          <Group justify="center" mt="xl">
            <Button
              size="lg"
              variant="light"
              loading={loading}
              onClick={form.onSubmit((values) => handleSubmit(values, 'draft'))}
              disabled={Object.keys(form.errors).length > 0}
            >
              Save Draft
            </Button>
            <Button
              size="lg"
              loading={loading}
              onClick={form.onSubmit((values) => handleSubmit(values, 'published'))}
              disabled={Object.keys(form.errors).length > 0}
            >
              {isEditing && form.values.publication_status === 'published' ? 'Update' : 'Publish'}
            </Button>
            {isEditing && form.values.publication_status === 'published' && (
              <Button
                size="lg"
                variant="outline"
                color="orange"
                loading={loading}
                onClick={form.onSubmit((values) => handleSubmit(values, 'draft'))}
                disabled={Object.keys(form.errors).length > 0}
              >
                Unpublish
              </Button>
            )}
            {isEditing && (
              <Button
                size="lg"
                color="red"
                variant="outline"
                onClick={handleDelete}
              >
                Delete POI
              </Button>
            )}
            <Button
              size="lg"
              variant="default"
              onClick={() => navigate('/pois')}
            >
              Cancel
            </Button>
          </Group>
        </form>
      </Stack>

      {/* Scroll to top button */}
      <Affix position={{ bottom: 20, right: 20 }}>
        <Transition transition="slide-up" mounted={scroll.y > 0}>
          {(transitionStyles) => (
            <Button
              leftSection={<IconChevronUp size={16} />}
              style={transitionStyles}
              onClick={() => scrollTo({ y: 0 })}
            >
              Scroll to top
            </Button>
          )}
        </Transition>
      </Affix>
    </Container>
  );
  } catch (error) {
    console.error('Render error in POIFormNew:', error);

    // Set the error in state to trigger the error UI
    if (!renderError) {
      setRenderError(error);
    }

    // Fallback render
    return (
      <Container size="xl" px={{ base: 'xs', sm: 'md', lg: 'xl' }}>
        <Stack spacing="xl" pb={100}>
          <Alert color="red" title="Component Error">
            <Text>The form crashed while rendering. Please check the console for details.</Text>
            <Button onClick={() => navigate('/pois')} mt="md">Back to POIs</Button>
          </Alert>
        </Stack>
      </Container>
    );
  }
}