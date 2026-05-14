import React from 'react';
import {
  Stack, SimpleGrid, Checkbox, Divider, Radio, TextInput, NumberInput,
  Button, Card, Text
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import RichTextEditor from '../../RichTextEditor';
import { getCheckboxGroupProps } from '../constants/helpers';
import {
  NATURAL_FEATURES, OUTDOOR_TYPES, HUNTING_FISHING_OPTIONS,
  FISHING_OPTIONS, HUNTING_TYPES, FISHING_TYPES, LICENSE_TYPES,
  PLAYGROUND_TYPES, PLAYGROUND_SURFACES, PLAYGROUND_AGE_GROUPS, PLAYGROUND_ADA_CHECKLIST,
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

      {(form.values.fishing_allowed === 'catch_release' || form.values.fishing_allowed === 'catch_keep') && (
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

const ADA_INCLUSIVE_TYPE = 'Inclusive (ADA Accessible)';
const ADA_GROUPS = [...new Set(PLAYGROUND_ADA_CHECKLIST.map(i => i.group))];

export const PlaygroundSection = React.memo(function PlaygroundSection({ form, id }) {
  const playgrounds = React.useMemo(() => {
    const val = form.values.playground_location;
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return [val];
  }, [form.values.playground_location]);

  const updatePlaygrounds = (newPlaygrounds) => {
    form.setFieldValue('playground_location', newPlaygrounds);
  };

  const hasInclusiveType = playgrounds.some(pg => (pg.types || []).includes(ADA_INCLUSIVE_TYPE));
  const adaChecked = form.values.playground_ada_checklist || [];
  const toggleAda = (label) => {
    const next = adaChecked.includes(label) ? adaChecked.filter(x => x !== label) : [...adaChecked, label];
    form.setFieldValue('playground_ada_checklist', next);
  };

  return (
    <Stack>
      <Divider my="xs" label="Age Group Served" />
      <Checkbox.Group
        value={form.values.playground_age_groups || []}
        onChange={(value) => form.setFieldValue('playground_age_groups', value)}
      >
        <SimpleGrid cols={{ base: 2, sm: 3 }}>
          {PLAYGROUND_AGE_GROUPS.map(ag => (
            <Checkbox key={ag} value={ag} label={ag} />
          ))}
        </SimpleGrid>
      </Checkbox.Group>

      {playgrounds.map((pg, index) => {
        const label = pg.name || `Playground ${index + 1}`;
        return (
          <Card key={index} withBorder p="md" mb="sm">
            <Stack>
              <Text fw={500}>{label}</Text>

              <TextInput
                label="Playground Name"
                placeholder="e.g., Toddler Area near parking"
                value={pg.name || ''}
                onChange={(e) => {
                  const updated = [...playgrounds];
                  updated[index] = { ...updated[index], name: e.target.value };
                  updatePlaygrounds(updated);
                }}
              />

              <Divider my="xs" label="Playground Types" />
              <Checkbox.Group
                value={pg.types || []}
                onChange={(value) => {
                  const updated = [...playgrounds];
                  updated[index] = { ...updated[index], types: value };
                  updatePlaygrounds(updated);
                }}
              >
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  {PLAYGROUND_TYPES.map(type => (
                    <Checkbox key={type} value={type} label={type} />
                  ))}
                </SimpleGrid>
              </Checkbox.Group>

              <Divider my="xs" label="Surface Type" />
              <Checkbox.Group
                value={pg.surfaces || []}
                onChange={(value) => {
                  const updated = [...playgrounds];
                  updated[index] = { ...updated[index], surfaces: value };
                  updatePlaygrounds(updated);
                }}
              >
                <SimpleGrid cols={{ base: 2, sm: 3 }}>
                  {PLAYGROUND_SURFACES.map(surface => (
                    <Checkbox key={surface} value={surface} label={surface} />
                  ))}
                </SimpleGrid>
              </Checkbox.Group>

              <Divider my="xs" label="Location" />
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <NumberInput
                  label="Latitude"
                  placeholder="35.7128"
                  precision={6}
                  value={pg.lat || ''}
                  onChange={(value) => {
                    const updated = [...playgrounds];
                    updated[index] = { ...updated[index], lat: value };
                    updatePlaygrounds(updated);
                  }}
                />
                <NumberInput
                  label="Longitude"
                  placeholder="-79.0064"
                  precision={6}
                  value={pg.lng || ''}
                  onChange={(value) => {
                    const updated = [...playgrounds];
                    updated[index] = { ...updated[index], lng: value };
                    updatePlaygrounds(updated);
                  }}
                />
              </SimpleGrid>

              <RichTextEditor
                label="Notes"
                placeholder="Additional playground information"
                value={pg.notes || ''}
                onChange={(html) => {
                  const updated = [...playgrounds];
                  updated[index] = { ...updated[index], notes: html };
                  updatePlaygrounds(updated);
                }}
              />

              {shouldUseImageUpload(id) ? (
                <PlaygroundPhotosUpload poiId={id} playgroundIndex={index} form={form} />
              ) : (
                <Text size="sm" c="dimmed">Save POI first to enable playground photo upload</Text>
              )}

              {playgrounds.length > 1 && (
                <Button
                  color="red"
                  variant="light"
                  size="xs"
                  onClick={() => {
                    const updated = [...playgrounds];
                    updated.splice(index, 1);
                    updatePlaygrounds(updated);
                  }}
                >
                  Remove {label}
                </Button>
              )}
            </Stack>
          </Card>
        );
      })}

      {hasInclusiveType && (
        <Stack gap="sm">
          <Divider my="xs" label="Inclusive (ADA Accessible) Checklist" />
          {ADA_GROUPS.map(group => (
            <Stack key={group} gap="xs">
              <Text size="sm" fw={600} c="dimmed">{group}</Text>
              {PLAYGROUND_ADA_CHECKLIST.filter(i => i.group === group).map(item => (
                <Checkbox
                  key={item.label}
                  label={item.label}
                  checked={adaChecked.includes(item.label)}
                  onChange={() => toggleAda(item.label)}
                />
              ))}
            </Stack>
          ))}
        </Stack>
      )}

      <Button
        variant="light"
        leftSection={<IconPlus size={16} />}
        onClick={() => {
          updatePlaygrounds([...playgrounds, { lat: null, lng: null, types: [], surfaces: [], notes: '', name: '' }]);
        }}
      >
        Add Another Playground
      </Button>
    </Stack>
  );
});