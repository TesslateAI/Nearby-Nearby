export const emptyInitialValues = {
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
  // New corporate compliance and emergency fields
  corporate_compliance: {
    has_compliance_requirements: false,
    compliance_description: '',
    disable_comments: false,
    comments_restriction_reason: '',
    social_media_restrictions: [],
    other_social_media: '',
    pre_approval_required: false,
    approval_lead_time: '',
    approval_contact_name: '',
    approval_contact_email: '',
    approval_contact_phone: '',
    has_branding_requirements: false,
    branding_description: ''
  },
  main_emergency_contact: {
    name: '',
    email: '',
    phone: ''
  },
  public_toilets: {
    available: false,
    types: [],
    locations: [],
    description: ''
  },
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

export const POI_STATUSES = [
  'Fully Open', 
  'Partly Open', 
  'Temporary Hour Changes', 
  'Temporarily Closed', 
  'Call Ahead', 
  'Permanently Closed', 
  'Warning', 
  'Limited Capacity', 
  'Coming Soon', 
  'Under Development', 
  'Alert'
];

export const SOCIAL_MEDIA_PLATFORMS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'x_twitter', label: 'X (formally Twitter)' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' }
];

export const TOILET_TYPES = [
  { value: 'family', label: 'Family' },
  { value: 'baby_changing', label: 'Baby Changing Station' },
  { value: 'wheelchair_accessible', label: 'Wheelchair/Handicap Accessible' },
  { value: 'porta_potti', label: 'Porta Potti' },
  { value: 'porta_potti_only', label: 'Porta Potti Only' }
];