/**
 * Clean form values for API submission
 * Converts empty strings to null for optional fields
 */
export const cleanFormValues = (values) => {
  const cleanValues = { ...values };

  // Clean business fields
  if (cleanValues.business && cleanValues.business.price_range === '') {
    cleanValues.business.price_range = null;
  }

  // Clean optional string fields - convert empty strings to null
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

  return cleanValues;
};

/**
 * Prepare POI payload for API submission
 * Transforms form data to match API schema
 */
export const preparePOIPayload = (formValues) => {
  const cleanValues = cleanFormValues(formValues);

  const payload = {
    ...cleanValues,
    publication_status: cleanValues.publication_status || 'draft',
    location: {
      type: 'Point',
      coordinates: [cleanValues.longitude, cleanValues.latitude]
    }
  };

  // Remove fields not needed in payload
  delete payload.longitude;
  delete payload.latitude;

  // Remove read-only / relationship fields returned by the API that the backend doesn't accept on update
  delete payload.id;
  delete payload.created_at;
  delete payload.last_updated;
  delete payload.categories;
  delete payload.main_category;
  delete payload.secondary_categories;
  delete payload.primary_type;
  delete payload.images;
  delete payload.source_relationships;
  delete payload.target_relationships;

  // Remove UI-only fields that don't exist in backend
  // These are used to control whether sections are shown, but the actual data is in other fields
  delete payload.alcohol_available;  // UI control only - alcohol_options array is what gets saved
  delete payload.public_toilets_available;  // UI control only - public_toilets array is what gets saved
  delete payload.pets_allowed;  // UI control only - pet_options array is what gets saved

  // Only include the subtype data relevant to the POI type
  if (payload.poi_type !== 'BUSINESS') delete payload.business;
  if (payload.poi_type !== 'PARK') delete payload.park;
  if (payload.poi_type !== 'TRAIL') delete payload.trail;
  if (payload.poi_type !== 'EVENT') delete payload.event;

  return payload;
};
