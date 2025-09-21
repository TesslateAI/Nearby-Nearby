// Helper function to get checkbox group props with null safety
export const getCheckboxGroupProps = (form, fieldPath) => {
  const inputProps = form.getInputProps(fieldPath);
  return {
    ...inputProps,
    value: inputProps.value || []
  };
};

// Helper function to get input props with guaranteed controlled values
export const getControlledInputProps = (form, fieldPath, defaultValue = '') => {
  const inputProps = form.getInputProps(fieldPath);
  return {
    ...inputProps,
    value: inputProps.value === null || inputProps.value === undefined ? defaultValue : inputProps.value
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