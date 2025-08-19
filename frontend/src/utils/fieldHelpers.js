// Helper functions for managing dynamic form fields

// Add a new link to an array of links
export const addLink = (form, fieldName, placeholder = '') => {
  const currentLinks = form.values[fieldName] || [];
  form.setFieldValue(fieldName, [...currentLinks, placeholder]);
};

// Remove a link from an array of links
export const removeLink = (form, fieldName, index) => {
  const currentLinks = form.values[fieldName] || [];
  form.setFieldValue(fieldName, currentLinks.filter((_, i) => i !== index));
};

// Update a specific link in an array
export const updateLink = (form, fieldName, index, value) => {
  const currentLinks = form.values[fieldName] || [];
  const newLinks = [...currentLinks];
  newLinks[index] = value;
  form.setFieldValue(fieldName, newLinks);
};

// Add a parking location
export const addParkingLocation = (form) => {
  const currentLocations = form.values.parking_locations || [];
  form.setFieldValue('parking_locations', [...currentLocations, { lat: null, lng: null, name: '' }]);
};

// Remove a parking location
export const removeParkingLocation = (form, index) => {
  const currentLocations = form.values.parking_locations || [];
  form.setFieldValue('parking_locations', currentLocations.filter((_, i) => i !== index));
};

// Update a parking location
export const updateParkingLocation = (form, index, field, value) => {
  const currentLocations = form.values.parking_locations || [];
  const newLocations = [...currentLocations];
  newLocations[index] = { ...newLocations[index], [field]: value };
  form.setFieldValue('parking_locations', newLocations);
};