import React from 'react';
import { Checkbox, NumberInput, SimpleGrid, Text, TextInput } from '@mantine/core';
import { RepeatableLocationGroup } from './RepeatableLocationGroup';
import RichTextEditor from '../../RichTextEditor';
import { RestroomPhotosUpload, shouldUseImageUpload } from '../ImageIntegration';
import { PUBLIC_TOILET_OPTIONS } from '../../../utils/constants';

/**
 * Composite wrapper for the `toilet_locations` JSONB array.
 *
 * Row shape: { lat, lng, description, photos, toilet_types }
 * Used by Park, Trail, and Event layouts.
 */
export const RestroomLocationGroup = React.memo(function RestroomLocationGroup({
  form,
  id,
  label = 'Restroom Locations',
  fieldName = 'toilet_locations',
}) {
  return (
    <RepeatableLocationGroup
      form={form}
      fieldName={fieldName}
      label={label}
      addButtonLabel="Add Another Bathroom Location"
      defaultRow={{ lat: null, lng: null, description: '', photos: '', toilet_types: [] }}
      renderRow={(row, index) => (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <NumberInput
              label="Restroom Latitude"
              placeholder="35.7128"
              precision={6}
              {...form.getInputProps(`${fieldName}.${index}.lat`)}
            />
            <NumberInput
              label="Restroom Longitude"
              placeholder="-79.0064"
              precision={6}
              {...form.getInputProps(`${fieldName}.${index}.lng`)}
            />
          </SimpleGrid>
          <RichTextEditor
            label="Description"
            placeholder="e.g., For paying customers only, Location details, accessibility info"
            value={row.description || ''}
            onChange={(html) => form.setFieldValue(`${fieldName}.${index}.description`, html)}
          />
          <Checkbox.Group
            label="Restroom Features at This Location"
            value={row.toilet_types || []}
            onChange={(value) => form.setFieldValue(`${fieldName}.${index}.toilet_types`, value)}
          >
            <SimpleGrid cols={{ base: 2, sm: 3 }}>
              {PUBLIC_TOILET_OPTIONS.filter(option => !['Yes', 'No'].includes(option)).map(option => (
                <Checkbox key={option} value={option} label={option} />
              ))}
            </SimpleGrid>
          </Checkbox.Group>
          {shouldUseImageUpload(id) ? (
            <RestroomPhotosUpload
              poiId={id}
              restroomIndex={index}
              form={{
                values: { toilets: form.values[fieldName] },
                setFieldValue: (field, value) => {
                  if (field === 'toilets') {
                    form.setFieldValue(fieldName, value);
                  }
                },
              }}
            />
          ) : (
            <TextInput
              label="Photos"
              placeholder="URLs to restroom photos (comma-separated)"
              {...form.getInputProps(`${fieldName}.${index}.photos`)}
              description="Image upload will be available shortly..."
            />
          )}
        </>
      )}
    />
  );
});

export default RestroomLocationGroup;
