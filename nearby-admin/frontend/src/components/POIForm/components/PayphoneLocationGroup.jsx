import React from 'react';
import { TextInput } from '@mantine/core';
import { RepeatableLocationGroup } from './RepeatableLocationGroup';
import CoordinateInput from './CoordinateInput';

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
      defaultRow={{ lat: null, lng: null, w3w: '', description: '' }}
      renderRow={(row, index) => (
        <>
          <CoordinateInput
            label="Pay Phone Coordinates"
            latLabel="Pay Phone Latitude"
            lngLabel="Pay Phone Longitude"
            value={{ lat: row?.lat ?? null, lng: row?.lng ?? null, w3w: row?.w3w ?? '' }}
            onChange={(v) => {
              form.setFieldValue(`${fieldName}.${index}.lat`, v.lat);
              form.setFieldValue(`${fieldName}.${index}.lng`, v.lng);
              form.setFieldValue(`${fieldName}.${index}.w3w`, v.w3w ?? '');
            }}
          />
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
