import React, { useEffect, useState } from 'react';
import {
  Stack, SimpleGrid, Checkbox, Divider, Radio, Switch, TextInput, NumberInput,
  Button, Card, Text
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import RichTextEditor from '../../RichTextEditor';
import { getCheckboxGroupProps } from '../constants/helpers';
import {
  NATURAL_FEATURES, HUNTING_FISHING_OPTIONS,
  FISHING_OPTIONS, HUNTING_TYPES, FISHING_TYPES, LICENSE_TYPES,
  PLAYGROUND_TYPES, PLAYGROUND_SURFACES
} from '../../../utils/outdoorConstants';
import { PET_OPTIONS } from '../../../utils/constants';
import { api } from '../../../utils/api';
import {
  PlaygroundPhotosUpload,
  shouldUseImageUpload
} from '../ImageIntegration';

// Issue #68: replace the dead `OUTDOOR_TYPES` constant with a live fetch from
// the categories API. The Trail layout (and any other consumer of the
// outdoor_types Checkbox.Group) now sees the same dynamic option set that
// `ParkLayout.jsx:39` already uses.
function useOutdoorTypeOptions() {
  const [options, setOptions] = useState([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await api.get('/categories/by-poi-type/PARK');
        if (!resp.ok || cancelled) return;
        const data = await resp.json();
        const list = Array.isArray(data) ? data : (data.items || []);
        // Use category name as the stored value to stay backward-compatible
        // with existing rows (outdoor_types currently stores a list of name
        // strings). Slug is exposed on the option so we can switch later.
        setOptions(
          list.map((c) => ({
            value: c.name,
            label: c.name,
            slug: c.slug,
          }))
        );
      } catch (_e) { /* network / startup race — render empty list */ }
    })();
    return () => { cancelled = true; };
  }, []);
  return options;
}

export const OutdoorFeaturesSection = React.memo(function OutdoorFeaturesSection({ form, isPark }) {
  const outdoorTypeOptions = useOutdoorTypeOptions();
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

      {/* #76 Park: the legacy "Outdoor Types" Checkbox.Group is removed from the
          Park form. Trail (and other consumers) keep it until their own reorg. */}
      {!isPark && (
        <>
          <Divider my="md" label="Outdoor Types" />
          <Checkbox.Group {...getCheckboxGroupProps(form, 'outdoor_types')}>
            <SimpleGrid cols={{ base: 2, sm: 3 }}>
              {outdoorTypeOptions.length === 0 ? (
                <Text size="sm" c="dimmed">
                  Loading outdoor types…
                </Text>
              ) : (
                outdoorTypeOptions.map(({ value, label }) => (
                  <Checkbox key={value} value={value} label={label} />
                ))
              )}
            </SimpleGrid>
          </Checkbox.Group>
        </>
      )}

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

      {(['catch_release', 'catch_keep'].includes(form.values.fishing_allowed)) && (
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
  // Normalize: if playground_locations is a single dict (legacy), wrap in array.
  // Migration g67_001 renamed the column singular -> plural and one-time wraps
  // existing singular-object rows, but defensive normalization stays for
  // forms loaded from older API responses.
  const playgrounds = React.useMemo(() => {
    const val = form.values.playground_locations;
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return [val];
  }, [form.values.playground_locations]);

  const updatePlaygrounds = (newPlaygrounds) => {
    form.setFieldValue('playground_locations', newPlaygrounds);
  };

  return (
    <Stack>
      <Switch
        label="Playground Available"
        {...form.getInputProps('playground_available', { type: 'checkbox' })}
      />

      {form.values.playground_available && (
        <>
          {playgrounds.map((pg, index) => (
            <Card key={index} withBorder p="md" mb="sm">
              <Stack>
                <Text fw={500}>Playground {index + 1}</Text>

                <Divider my="xs" label="Playground Types" />
                <Checkbox.Group
                  value={pg.types || form.values.playground_types || []}
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
                  value={pg.surfaces || form.values.playground_surface_types || []}
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
                    Remove Playground {index + 1}
                  </Button>
                )}
              </Stack>
            </Card>
          ))}

          <Button
            variant="light"
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              updatePlaygrounds([...playgrounds, { lat: null, lng: null, types: [], surfaces: [], notes: '' }]);
            }}
          >
            Add Another Playground
          </Button>
        </>
      )}
    </Stack>
  );
});