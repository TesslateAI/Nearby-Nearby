// Helper function to get checkbox group props with null safety
export const getCheckboxGroupProps = (form, fieldPath) => {
  const inputProps = form.getInputProps(fieldPath);
  return {
    ...inputProps,
    value: inputProps.value || []
  };
};

// Helper function to get input props with guaranteed controlled values
// Note: For TextInput, use DebouncedTextInput component with getDebouncedInputProps instead
export const getControlledInputProps = (form, fieldPath, defaultValue = '') => {
  const inputProps = form.getInputProps(fieldPath);
  return {
    ...inputProps,
    value: inputProps.value === null || inputProps.value === undefined ? defaultValue : inputProps.value,
    onChange: (event) => {
      // Convert event to value for form.setFieldValue
      const value = event.currentTarget ? event.currentTarget.value : event;
      form.setFieldValue(fieldPath, value);
    }
  };
};

// Helper function for debounced text inputs
// Returns props that work with DebouncedTextInput component
export const getDebouncedInputProps = (form, fieldPath, defaultValue = '') => {
  const value = form.values[fieldPath];
  const error = form.errors[fieldPath];

  return {
    value: value === null || value === undefined ? defaultValue : value,
    onChange: (newValue) => form.setFieldValue(fieldPath, newValue),
    error: error
  };
};

// Helper function for numeric inputs
export const getNumericInputProps = (form, fieldPath) => {
  const inputProps = form.getInputProps(fieldPath);
  return {
    ...inputProps,
    value: inputProps.value === null || inputProps.value === undefined ? '' : inputProps.value
  };
};