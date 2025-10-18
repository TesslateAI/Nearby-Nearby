import React from 'react';
import { Divider, Checkbox, SimpleGrid } from '@mantine/core';
import { getCheckboxGroupProps } from '../constants/helpers';

/**
 * Reusable checkbox group section component
 * Displays a divider with label and a grid of checkboxes
 *
 * @param {Object} props
 * @param {string} props.label - Section label for the divider
 * @param {string} props.fieldName - Form field name to bind to
 * @param {Array<string>} props.options - Array of checkbox option values/labels
 * @param {Object} props.cols - Grid column configuration (e.g., { base: 2, sm: 3 })
 * @param {Object} props.form - Mantine form instance
 * @param {boolean} [props.withDivider=true] - Whether to show the divider
 * @param {string} [props.dividerProps] - Additional props for Divider component
 */
export const CheckboxGroupSection = React.memo(function CheckboxGroupSection({
  label,
  fieldName,
  options,
  cols = { base: 2, sm: 3 },
  form,
  withDivider = true,
  dividerProps = {}
}) {
  return (
    <>
      {withDivider && <Divider my="md" label={label} {...dividerProps} />}
      <Checkbox.Group {...getCheckboxGroupProps(form, fieldName)}>
        <SimpleGrid cols={cols}>
          {options.map(option => (
            <Checkbox key={option} value={option} label={option} />
          ))}
        </SimpleGrid>
      </Checkbox.Group>
    </>
  );
});

export default CheckboxGroupSection;
