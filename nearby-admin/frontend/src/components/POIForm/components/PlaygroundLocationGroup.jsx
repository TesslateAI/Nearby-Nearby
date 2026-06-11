import React from 'react';
import { Checkbox, Divider, SimpleGrid, Text } from '@mantine/core';
import { RepeatableLocationGroup } from './RepeatableLocationGroup';
import CoordinateInput from './CoordinateInput';
import RichTextEditor from '../../RichTextEditor';
import { PLAYGROUND_TYPES, PLAYGROUND_SURFACES } from '../../../utils/outdoorConstants';
import { PlaygroundPhotosUpload, shouldUseImageUpload } from '../ImageIntegration';

/**
 * Composite wrapper for the `playground_locations` JSONB array.
 *
 * Row shape: { lat, lng, types, surfaces, notes }
 *
 * NOTE: The column was historically singular (`playground_location`) — see
 * Alembic migration g67_001 which renames it to `playground_locations`
 * plural and wraps any legacy single-object rows in a single-element array.
 * The fieldName prop defaults to the new plural name; callers that still
 * read the old column may override it during transition.
 */
export const PlaygroundLocationGroup = React.memo(function PlaygroundLocationGroup({
  form,
  id,
  label = 'Playgrounds',
  fieldName = 'playground_locations',
}) {
  return (
    <RepeatableLocationGroup
      form={form}
      fieldName={fieldName}
      label={label}
      addButtonLabel="Add Another Playground"
      defaultRow={{ lat: null, lng: null, w3w: '', types: [], surfaces: [], notes: '' }}
      renderRow={(row, index) => (
        <>
          <Text fw={500}>Playground {index + 1}</Text>

          <Divider my="xs" label="Playground Types" />
          <Checkbox.Group
            value={row.types || []}
            onChange={(value) => form.setFieldValue(`${fieldName}.${index}.types`, value)}
          >
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {PLAYGROUND_TYPES.map(type => (
                <Checkbox key={type} value={type} label={type} />
              ))}
            </SimpleGrid>
          </Checkbox.Group>

          <Divider my="xs" label="Surface Type" />
          <Checkbox.Group
            value={row.surfaces || []}
            onChange={(value) => form.setFieldValue(`${fieldName}.${index}.surfaces`, value)}
          >
            <SimpleGrid cols={{ base: 2, sm: 3 }}>
              {PLAYGROUND_SURFACES.map(surface => (
                <Checkbox key={surface} value={surface} label={surface} />
              ))}
            </SimpleGrid>
          </Checkbox.Group>

          <Divider my="xs" label="Location" />
          <CoordinateInput
            label="Playground Coordinates"
            latLabel="Playground Latitude"
            lngLabel="Playground Longitude"
            value={{ lat: row?.lat ?? null, lng: row?.lng ?? null, w3w: row?.w3w ?? '' }}
            onChange={(v) => {
              form.setFieldValue(`${fieldName}.${index}.lat`, v.lat);
              form.setFieldValue(`${fieldName}.${index}.lng`, v.lng);
              form.setFieldValue(`${fieldName}.${index}.w3w`, v.w3w ?? '');
            }}
          />

          <RichTextEditor
            label="Notes"
            placeholder="Additional playground information"
            value={row.notes || ''}
            onChange={(html) => form.setFieldValue(`${fieldName}.${index}.notes`, html)}
          />

          {shouldUseImageUpload(id) ? (
            <PlaygroundPhotosUpload poiId={id} playgroundIndex={index} form={form} />
          ) : (
            <Text size="sm" c="dimmed">Save POI first to enable playground photo upload</Text>
          )}
        </>
      )}
    />
  );
});

export default PlaygroundLocationGroup;
