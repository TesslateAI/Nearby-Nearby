import { getFieldsForListingType } from '../../../utils/constants';

export const getValidationRules = () => ({
  name: (value) => (!value ? 'Name is required' : null),
  poi_type: (value) => (!value ? 'POI type is required' : null),
  latitude: (value) => (value === null || value === undefined ? 'Location is required' : null),
  longitude: (value) => (value === null || value === undefined ? 'Location is required' : null),
  address_city: (value) => (!value ? 'City is required' : null),
  address_state: (value) => (!value ? 'State is required' : null),
  main_category_id: (value) => (!value ? 'Main category is required' : null),
  category_ids: (value, values) => {
    // Secondary categories are optional for all POI types
    if (values?.poi_type === 'BUSINESS') {
      return null;
    }
    const fieldConfig = getFieldsForListingType(values?.listing_type, values?.poi_type);
    const maxCategories = fieldConfig?.maxCategories || 3;
    return value?.length > maxCategories ? `Maximum ${maxCategories} categories allowed` : null;
  },
  'event.start_datetime': (value, values) => {
    if (values?.poi_type === 'EVENT' && !value) {
      return 'Start date/time is required for events';
    }
    return null;
  }
});