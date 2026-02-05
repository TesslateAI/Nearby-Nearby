// Common messages for POI form
export const MESSAGES = {
  IMAGE_UPLOAD_PENDING: 'Image upload will be available after the form initializes.',
  FORM_INITIALIZING: 'Initializing form with image upload capabilities...',
  DRAFT_AUTO_CREATE_FAILED: 'Could not auto-create draft. You can still fill the form and save manually.',
};

export const getImageUploadPendingMessage = (fieldName) => {
  return `${fieldName} upload will be available after the form initializes.`;
};