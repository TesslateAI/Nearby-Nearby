export const validateForm = (values, activeStep) => {
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

  // Final validation (step 6) - check all required fields
  if (activeStep === 6) {
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
};

export const cleanFormValues = (values) => {
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

  return cleanValues;
};

export const buildPayload = (cleanValues) => {
  const payload = {
    name: cleanValues.name,
    poi_type: cleanValues.poi_type,
    description_long: cleanValues.description_long,
    description_short: cleanValues.description_short,
    status: cleanValues.status,
    status_message: cleanValues.status_message,
    is_verified: cleanValues.is_verified,
    is_disaster_hub: cleanValues.is_disaster_hub,
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
    contact_info: cleanValues.contact_info,
    compliance: cleanValues.compliance,
    custom_fields: cleanValues.custom_fields,
    corporate_compliance: cleanValues.corporate_compliance,
    main_emergency_contact: cleanValues.main_emergency_contact,
    public_toilets: cleanValues.public_toilets,
    category_ids: cleanValues.category_ids,
    location: {
      type: "Point",
      coordinates: [cleanValues.longitude, cleanValues.latitude]
    },
  };

  // Add subtype data based on POI type
  if (cleanValues.poi_type === 'BUSINESS') {
    payload.business = cleanValues.business || { listing_tier: 'free' };
  } else if (cleanValues.poi_type === 'PARK') {
    payload.park = cleanValues.park || {};
  } else if (cleanValues.poi_type === 'TRAIL') {
    payload.trail = cleanValues.trail || {};
  } else if (cleanValues.poi_type === 'EVENT') {
    // Ensure event object exists and has required fields
    payload.event = {
      start_datetime: cleanValues.event?.start_datetime || '',
      end_datetime: cleanValues.event?.end_datetime || null,
      cost_text: cleanValues.event?.cost_text || null
    };
  }

  return payload;
};

export const formatDateTimeForInput = (datetime) => {
  if (!datetime) return '';
  const date = new Date(datetime);
  return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
};