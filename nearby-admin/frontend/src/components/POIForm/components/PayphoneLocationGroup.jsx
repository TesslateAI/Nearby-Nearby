import React from 'react';
import { NumberInput, SimpleGrid, TextInput } from '@mantine/core';
import { RepeatableLocationGroup } from './RepeatableLocationGroup';

/**
 * Composite wrapper for the `payphone_locations` JSONB array.
 *
 * Row shape: { lat, lng, description }
 * Used by Park and Trail layouts.
 */
export const PayphoneLocationGroup = React.memo(function PayphoneLocationGroup({
  form,
  label = 'Pay Phone Locations',
  fieldName = 'payphone_locations',
}) {
  return (
    <RepeatableLocationGroup
      form={form}
      fieldName={fieldName}
      label={label}
      addButtonLabel="Add Another Pay Phone Location"
      defaultRow={{ lat: null, lng: null, description: '' }}
      renderRow={(row, index) => (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <NumberInput
              label="Pay Phone Latitude"
              placeholder="35.7128"
              precision={6}
              {...form.getInputProps(`${fieldName}.${index}.lat`)}
            />
            <NumberInput
              label="Pay Phone Longitude"
              placeholder="-79.0064"
              precision={6}
              {...form.getInputProps(`${fieldName}.${index}.lng`)}
            />
          </SimpleGrid>
          <TextInput
            label="Description"
            placeholder="e.g., Near entrance, by visitor center"
            {...form.getInputProps(`${fieldName}.${index}.description`)}
          />
        </>
      )}
    />
  );
});

export default PayphoneLocationGroup;
