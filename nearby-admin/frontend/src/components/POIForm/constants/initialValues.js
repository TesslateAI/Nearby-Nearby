export const emptyInitialValues = {
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
  address_county: 'Chatham',
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
  longitude: -79.177397,
  latitude: 35.720303,
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
  // parking_photos removed - use Images table with image_type='parking'
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
  // rental_photos removed - use Images table with image_type='rental'
  // Additional Business Details
  price_range_per_person: '',
  pricing: '',
  discounts: [],
  gift_cards: 'no',
  youth_amenities: [],
  business_amenities: [],
  entertainment_options: [],
  // Menu & Online Booking (Business only)
  // menu_photos removed - use Images table with image_type='menu'
  menu_link: '',
  delivery_links: [],
  reservation_links: [],
  appointment_links: [],
  online_ordering_links: [],
  // gallery_photos removed - use Images table with image_type='gallery'
  // Business Entry
  business_entry_notes: '',
  // business_entry_photo removed - use Images table with image_type='entry'
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
    trailhead_latitude: null,
    trailhead_longitude: null,
    trailhead_entrance_photo: '',
    // trailhead_photo removed - use Images table with image_type='trail_head'
    trailhead_exit_location: null,
    trail_exit_latitude: null,
    trail_exit_longitude: null,
    trailhead_exit_photo: '',
    // trail_exit_photo removed - use Images table with image_type='trail_exit'
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
  // playground_photos removed - use Images table with image_type='playground'
  playground_location: null,
  // Parks & Trails Additional
  payphone_location: null,
  payphone_locations: [],
  park_entry_notes: '',
  // park_entry_photo removed - use Images table with image_type='entry'
  // parking_lot_photo removed - use Images table with image_type='parking'
  facilities_options: [],
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
    venue_settings: [],
    event_entry_notes: '',
    // event_entry_photo removed - use Images table with image_type='entry'
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
  // Primary Type linkage (unidirectional)
  primary_type_id: null,
  category_ids: []
};