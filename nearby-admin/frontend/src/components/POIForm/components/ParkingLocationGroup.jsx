import React from 'react';
import { NumberInput, SimpleGrid, TextInput, Text } from '@mantine/core';
import { RepeatableLocationGroup } from './RepeatableLocationGroup';
import { ParkingPhotosUpload } from '../ImageIntegration';

/**
 * Composite wrapper for the `parking_locations` JSONB array.
 *
 * Row shape: { lat, lng, name }
 * Used by Park, Trail, and Event layouts.
 */
export const ParkingLocationGroup = React.memo(function ParkingLocationGroup({
  form,
  id,
  isPark = false,
  isTrail = false,
  isEvent = false,
  label = 'Parking Locations',
  fieldName = 'parking_locations',
  enablePhotos = true,
}) {
  const namePlaceholder = isPark
    ? 'e.g., Main Lot, Visitor Center Parking'
    : isTrail
      ? 'e.g., Trailhead Parking, Main Lot'
      : isEvent
        ? 'e.g., Main Lot, Event Parking'
        : 'e.g., Main Lot';

  return (
    <RepeatableLocationGroup
      form={form}
      fieldName={fieldName}
      label={label}
      addButtonLabel="Add Another Parking Location"
      defaultRow={{ lat: null, lng: null, name: '' }}
      renderRow={(row, index) => (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <NumberInput
              label="Parking Latitude"
              placeholder="35.7128"
              precision={6}
              {...form.getInputProps(`${fieldName}.${index}.lat`)}
            />
            <NumberInput
              label="Parking Longitude"
              placeholder="-79.0064"
              precision={6}
              {...form.getInputProps(`${fieldName}.${index}.lng`)}
            />
          </SimpleGrid>
          <TextInput
            label="Parking Area Name"
            placeholder={namePlaceholder}
            {...form.getInputProps(`${fieldName}.${index}.name`)}
          />
          {enablePhotos && (id ? (
            <ParkingPhotosUpload
              poiId={id}
              parkingIndex={index}
              parkingName={row.name}
              form={form}
            />
          ) : (
            <Text size="sm" c="dimmed">Save POI first to enable parking photo upload</Text>
          ))}
        </>
      )}
    />
  );
});

export default ParkingLocationGroup;
