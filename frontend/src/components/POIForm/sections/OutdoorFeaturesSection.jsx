import React from 'react';
import {
  Stack, SimpleGrid, Checkbox, Divider, Radio, Switch, TextInput
} from '@mantine/core';
import RichTextEditor from '../../RichTextEditor';
import { getCheckboxGroupProps } from '../constants/helpers';
import {
  NATURAL_FEATURES, OUTDOOR_TYPES, HUNTING_FISHING_OPTIONS,
  FISHING_OPTIONS, HUNTING_TYPES, FISHING_TYPES, LICENSE_TYPES,
  PLAYGROUND_TYPES, PLAYGROUND_SURFACES
} from '../../../utils/outdoorConstants';
import { PET_OPTIONS } from '../../../utils/constants';
import {
  PlaygroundPhotosUpload,
  shouldUseImageUpload
} from '../ImageIntegration';

export const OutdoorFeaturesSection = React.memo(function OutdoorFeaturesSection({ form }) {
  return (
    <Stack>
      <Divider my="md" label="Natural Features" />
      <Checkbox.Group {...getCheckboxGroupProps(form, 'natural_features')}>
        <SimpleGrid cols={{ base: 2, sm: 3 }}>
          {NATURAL_FEATURES.map(feature => (
            <Checkbox key={feature} value={feature} label={feature} />
          ))}
        </SimpleGrid>
      </Checkbox.Group>

      <Divider my="md" label="Outdoor Types" />
      <Checkbox.Group {...getCheckboxGroupProps(form, 'outdoor_types')}>
        <SimpleGrid cols={{ base: 2, sm: 3 }}>
          {OUTDOOR_TYPES.map(type => (
            <Checkbox key={type} value={type} label={type} />
          ))}
        </SimpleGrid>
      </Checkbox.Group>

      <RichTextEditor
        label="Night Sky Viewing"
        placeholder="Information about stargazing opportunities"
        value={form.values.night_sky_viewing || ''}
        onChange={(html) => form.setFieldValue('night_sky_viewing', html)}
        error={form.errors.night_sky_viewing}
        minRows={3}
      />

      <RichTextEditor
        label="Birding & Wildlife"
        placeholder="Notable species and viewing information"
        value={form.values.birding_wildlife || ''}
        onChange={(html) => form.setFieldValue('birding_wildlife', html)}
        error={form.errors.birding_wildlife}
        minRows={3}
      />
    </Stack>
  );
});

export const HuntingFishingSection = React.memo(function HuntingFishingSection({ form }) {
  return (
    <Stack>
      <Radio.Group
        label="Do you allow hunting?"
        {...form.getInputProps('hunting_fishing_allowed')}
      >
        <Stack mt="xs">
          {HUNTING_FISHING_OPTIONS.map(option => (
            <Radio key={option.value} value={option.value} label={option.label} />
          ))}
        </Stack>
      </Radio.Group>

      {(form.values.hunting_fishing_allowed === 'seasonal' || form.values.hunting_fishing_allowed === 'year_round') && (
        <>
          <Divider my="md" label="Hunting Types Allowed" />
          <Checkbox.Group {...getCheckboxGroupProps(form, 'hunting_types')}>
            <SimpleGrid cols={{ base: 2, sm: 3 }}>
              {HUNTING_TYPES.map(type => (
                <Checkbox key={type} value={type} label={type} />
              ))}
            </SimpleGrid>
          </Checkbox.Group>
        </>
      )}

      <Radio.Group
        label="Do you allow fishing on this property?"
        {...form.getInputProps('fishing_allowed')}
      >
        <Stack mt="xs">
          {FISHING_OPTIONS.map(option => (
            <Radio key={option.value} value={option.value} label={option.label} />
          ))}
        </Stack>
      </Radio.Group>

      {(form.values.fishing_allowed !== 'no') && (
        <>
          <Divider my="md" label="Fishing Types" />
          <Checkbox.Group {...getCheckboxGroupProps(form, 'fishing_types')}>
            <SimpleGrid cols={{ base: 2, sm: 3 }}>
              {FISHING_TYPES.map(type => (
                <Checkbox key={type} value={type} label={type} />
              ))}
            </SimpleGrid>
          </Checkbox.Group>
        </>
      )}

      {(form.values.hunting_fishing_allowed !== 'no' || form.values.fishing_allowed !== 'no') && (
        <>
          <Divider my="md" label="Licenses & Permits" />
          <Checkbox.Group {...getCheckboxGroupProps(form, 'licenses_required')}>
            <SimpleGrid cols={{ base: 2, sm: 3 }}>
              {LICENSE_TYPES.map(license => (
                <Checkbox key={license} value={license} label={license} />
              ))}
            </SimpleGrid>
          </Checkbox.Group>

          <RichTextEditor
            label="Additional Hunting & Fishing Information"
            placeholder="Season dates, bag limits, special regulations..."
            value={form.values.hunting_fishing_info || ''}
            onChange={(html) => form.setFieldValue('hunting_fishing_info', html)}
            error={form.errors.hunting_fishing_info}
            minRows={3}
          />
        </>
      )}
    </Stack>
  );
});

export const PetPolicySection = React.memo(function PetPolicySection({ form }) {
  return (
    <Stack>
      <Radio.Group
        label="Are pets allowed?"
        value={form.values.pets_allowed || 'no'}
        onChange={(value) => {
          form.setFieldValue('pets_allowed', value);
          if (value === 'no') {
            form.setFieldValue('pet_options', []);
            form.setFieldValue('pet_policy', '');
          }
        }}
      >
        <Stack mt="xs">
          <Radio value="yes" label="Yes" />
          <Radio value="no" label="No" />
        </Stack>
      </Radio.Group>

      {form.values.pets_allowed === 'yes' && (
        <>
          <Divider my="md" label="Pet Policy Details" />
          <Checkbox.Group
            label="Pet Policy Options"
            {...getCheckboxGroupProps(form, 'pet_options')}
          >
            <SimpleGrid cols={{ base: 2, sm: 3 }}>
              {PET_OPTIONS.filter(option => !['Allowed', 'Not Allowed'].includes(option)).map(option => (
                <Checkbox key={option} value={option} label={option} />
              ))}
            </SimpleGrid>
          </Checkbox.Group>
          <RichTextEditor
            label="Additional Pet Policy Information"
            placeholder="Additional pet policy information"
            value={form.values.pet_policy || ''}
            onChange={(html) => form.setFieldValue('pet_policy', html)}
            error={form.errors.pet_policy}
          />
        </>
      )}
    </Stack>
  );
});

export const PlaygroundSection = React.memo(function PlaygroundSection({ form, id }) {
  return (
    <Stack>
      <Switch
        label="Playground Available"
        {...form.getInputProps('playground_available', { type: 'checkbox' })}
      />

      {form.values.playground_available && (
        <>
          <Divider my="md" label="Playground Types" />
          <Checkbox.Group {...getCheckboxGroupProps(form, 'playground_types')}>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {PLAYGROUND_TYPES.map(type => (
                <Checkbox key={type} value={type} label={type} />
              ))}
            </SimpleGrid>
          </Checkbox.Group>

          <Divider my="md" label="Playground Surface Type" />
          <Checkbox.Group {...getCheckboxGroupProps(form, 'playground_surface_types')}>
            <SimpleGrid cols={{ base: 2, sm: 3 }}>
              {PLAYGROUND_SURFACES.map(surface => (
                <Checkbox key={surface} value={surface} label={surface} />
              ))}
            </SimpleGrid>
          </Checkbox.Group>

          <RichTextEditor
            label="Playground Notes"
            placeholder="Additional playground information"
            value={form.values.playground_notes || ''}
            onChange={(html) => form.setFieldValue('playground_notes', html)}
            error={form.errors.playground_notes}
          />

          {shouldUseImageUpload(id) ? (
            <PlaygroundPhotosUpload poiId={id} form={form} />
          ) : (
            <TextInput
              label="Playground Photos"
              placeholder="URLs to playground photos (comma-separated)"
              {...form.getInputProps('playground_photos')}
              description="Image upload will be available shortly..."
            />
          )}
        </>
      )}
    </Stack>
  );
});