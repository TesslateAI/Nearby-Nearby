import { PARKING_OPTIONS } from '../../../utils/constants';

// First PARKING_OPTIONS entry is the "Accessible Parking" option whose selection
// reveals — and now requires — the ADA accessible-parking sub-checklist.
export const ACCESSIBLE_PARKING_OPTION = PARKING_OPTIONS[0];
export const ACCESSIBLE_PARKING_MESSAGE = 'Select at least one accessible parking detail';

// When "Accessible Parking" is selected anywhere, at least one ADA sub-option is
// required before the listing can be published. Covers BOTH shapes used across
// the 5 POI types:
//   - flat `parking_types` / `accessible_parking_details` (Business Free + legacy)
//   - per-row `parking_locations[]` groupings (Business Paid, Park, Trail, Event)
// Returns a Mantine errors object keyed by field path so the inline error lands
// on the offending checklist.
export const validateAccessibleParking = (values) => {
  const errors = {};
  const isSelected = (types) =>
    Array.isArray(types) && types.includes(ACCESSIBLE_PARKING_OPTION);
  const isEmpty = (details) => !Array.isArray(details) || details.length === 0;

  if (isSelected(values?.parking_types) && isEmpty(values?.accessible_parking_details)) {
    errors.accessible_parking_details = ACCESSIBLE_PARKING_MESSAGE;
  }

  const locations = Array.isArray(values?.parking_locations) ? values.parking_locations : [];
  locations.forEach((row, index) => {
    if (isSelected(row?.parking_types) && isEmpty(row?.accessible_parking_details)) {
      errors[`parking_locations.${index}.accessible_parking_details`] = ACCESSIBLE_PARKING_MESSAGE;
    }
  });

  return errors;
};

export const getValidationRules = () => ({
  name: (value) => (!value ? 'Name is required' : null),
  poi_type: (value) => (!value ? 'POI type is required' : null),
  latitude: (value) => (value === null || value === undefined ? 'Location is required' : null),
  longitude: (value) => (value === null || value === undefined ? 'Location is required' : null),
  address_city: (value) => (!value ? 'City is required' : null),
  address_state: (value) => (!value ? 'State is required' : null),
  main_category_id: (value) => (!value ? 'Main category is required' : null),
  category_ids: (value, values) => {
    // Rule: only a FREE BUSINESS is limited to a single category. Paid business
    // and every other POI type (park / trail / event) may have multiple. Mirrors
    // the backend check in crud_poi.py so the limit shows inline instead of
    // surfacing as a save-time 400.
    const isFreeBusiness =
      values?.poi_type === 'BUSINESS' &&
      (values?.listing_type === 'free' || !values?.listing_type);
    if (isFreeBusiness && (value?.length || 0) > 1) {
      return 'Free business listings are limited to 1 category';
    }
    return null;
  },
  'event.start_datetime': (value, values) => {
    if (values?.poi_type === 'EVENT' && !value) {
      return 'Start date/time is required for events';
    }
    return null;
  },
  // #49: soft validation — every playground row must declare at least one
  // age group. Returns an array of per-row errors so Mantine's form surfaces
  // the warning on the offending row without blocking save.
  playground_locations: (value) => {
    if (!Array.isArray(value) || value.length === 0) return null;
    const missing = value.some(
      (row) => !row || !Array.isArray(row.age_groups) || row.age_groups.length === 0
    );
    return missing
      ? 'Each playground should have at least one age group selected'
      : null;
  }
});