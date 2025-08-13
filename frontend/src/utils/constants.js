export const POI_TYPES = {
  BUSINESS: 'business',
  PARK: 'park',
  TRAIL: 'trail',
  EVENT: 'event',
};

export const POI_TYPE_LABELS = {
  [POI_TYPES.BUSINESS]: 'Business',
  [POI_TYPES.PARK]: 'Park',
  [POI_TYPES.TRAIL]: 'Trail',
  [POI_TYPES.EVENT]: 'Event',
};

export const POI_TYPE_OPTIONS = Object.entries(POI_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MODERATE: 'moderate',
  HARD: 'hard',
  EXPERT: 'expert',
};

export const DIFFICULTY_LABELS = {
  [DIFFICULTY_LEVELS.EASY]: 'Easy',
  [DIFFICULTY_LEVELS.MODERATE]: 'Moderate',
  [DIFFICULTY_LEVELS.HARD]: 'Hard',
  [DIFFICULTY_LEVELS.EXPERT]: 'Expert',
};

export const TRAIL_TYPES = {
  LOOP: 'loop',
  OUT_AND_BACK: 'out-and-back',
  POINT_TO_POINT: 'point-to-point',
};

export const TRAIL_TYPE_LABELS = {
  [TRAIL_TYPES.LOOP]: 'Loop',
  [TRAIL_TYPES.OUT_AND_BACK]: 'Out and Back',
  [TRAIL_TYPES.POINT_TO_POINT]: 'Point to Point',
};

export const RELATIONSHIP_TYPES = {
  VENUE: 'venue',
  TRAIL_IN_PARK: 'trail-in-park',
  SERVICE_PROVIDER: 'service-provider',
  SPONSOR: 'sponsor',
  PARTNER: 'partner',
};

export const RELATIONSHIP_TYPE_LABELS = {
  [RELATIONSHIP_TYPES.VENUE]: 'Venue',
  [RELATIONSHIP_TYPES.TRAIL_IN_PARK]: 'Trail in Park',
  [RELATIONSHIP_TYPES.SERVICE_PROVIDER]: 'Service Provider',
  [RELATIONSHIP_TYPES.SPONSOR]: 'Sponsor',
  [RELATIONSHIP_TYPES.PARTNER]: 'Partner',
};

export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export const DEFAULT_MAP_CENTER = [45.5152, -122.6784]; // Portland, OR
export const DEFAULT_MAP_ZOOM = 13;

export const MAP_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const API_ENDPOINTS = {
  POIS: '/api/pois/',
  CATEGORIES: '/api/categories/',
  ATTRIBUTES: '/api/attributes/',
  RELATIONSHIPS: '/api/relationships/',
  AUTH: '/api/auth/',
  NEARBY: '/api/pois/nearby',
  SEARCH: '/api/pois/search',
};

export const NOTIFICATION_DURATION = 5000; // 5 seconds

export const FORM_VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_URL: 'Please enter a valid URL',
  MIN_LENGTH: (min) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max) => `Must be no more than ${max} characters`,
};

export const PAGE_SIZE = 20;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const STATUS_OPTIONS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  ARCHIVED: 'archived',
};

export const STATUS_LABELS = {
  [STATUS_OPTIONS.ACTIVE]: 'Active',
  [STATUS_OPTIONS.INACTIVE]: 'Inactive',
  [STATUS_OPTIONS.PENDING]: 'Pending',
  [STATUS_OPTIONS.ARCHIVED]: 'Archived',
};