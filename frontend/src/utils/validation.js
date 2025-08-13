import { FORM_VALIDATION_MESSAGES } from './constants';

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return FORM_VALIDATION_MESSAGES.REQUIRED;
  if (!emailRegex.test(email)) return FORM_VALIDATION_MESSAGES.INVALID_EMAIL;
  return null;
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  if (phone && !phoneRegex.test(phone)) return FORM_VALIDATION_MESSAGES.INVALID_PHONE;
  return null;
};

export const validateUrl = (url) => {
  try {
    if (url) new URL(url);
    return null;
  } catch {
    return FORM_VALIDATION_MESSAGES.INVALID_URL;
  }
};

export const validateRequired = (value) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return FORM_VALIDATION_MESSAGES.REQUIRED;
  }
  return null;
};

export const validateMinLength = (value, min) => {
  if (value && value.length < min) {
    return FORM_VALIDATION_MESSAGES.MIN_LENGTH(min);
  }
  return null;
};

export const validateMaxLength = (value, max) => {
  if (value && value.length > max) {
    return FORM_VALIDATION_MESSAGES.MAX_LENGTH(max);
  }
  return null;
};

export const validateCoordinates = (lat, lng) => {
  if (lat === undefined || lng === undefined) {
    return 'Location is required';
  }
  if (lat < -90 || lat > 90) {
    return 'Latitude must be between -90 and 90';
  }
  if (lng < -180 || lng > 180) {
    return 'Longitude must be between -180 and 180';
  }
  return null;
};

export const validateBusinessHours = (hours) => {
  if (!hours || typeof hours !== 'object') return null;
  
  for (const [day, dayHours] of Object.entries(hours)) {
    if (!dayHours.closed && dayHours.open && dayHours.close) {
      const openTime = new Date(`2000-01-01 ${dayHours.open}`);
      const closeTime = new Date(`2000-01-01 ${dayHours.close}`);
      
      if (openTime >= closeTime) {
        return `${day}: Closing time must be after opening time`;
      }
    }
  }
  
  return null;
};

export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start > end) {
    return 'End date must be after start date';
  }
  
  return null;
};

export const validatePrice = (price) => {
  if (price === undefined || price === null || price === '') return null;
  
  const numPrice = parseFloat(price);
  if (isNaN(numPrice) || numPrice < 0) {
    return 'Price must be a positive number';
  }
  
  return null;
};

export const createFormValidation = (rules) => {
  return (values) => {
    const errors = {};
    
    for (const [field, validators] of Object.entries(rules)) {
      const value = values[field];
      
      for (const validator of validators) {
        const error = validator(value, values);
        if (error) {
          errors[field] = error;
          break;
        }
      }
    }
    
    return errors;
  };
};

export const POIFormValidation = createFormValidation({
  name: [validateRequired, (v) => validateMinLength(v, 3), (v) => validateMaxLength(v, 100)],
  description: [(v) => validateMaxLength(v, 500)],
  poi_type: [validateRequired],
  email: [validateEmail],
  phone: [validatePhone],
  website: [validateUrl],
});

export const CategoryFormValidation = createFormValidation({
  name: [validateRequired, (v) => validateMinLength(v, 2), (v) => validateMaxLength(v, 50)],
  description: [(v) => validateMaxLength(v, 200)],
});

export const AttributeFormValidation = createFormValidation({
  name: [validateRequired, (v) => validateMinLength(v, 2), (v) => validateMaxLength(v, 50)],
  data_type: [validateRequired],
});