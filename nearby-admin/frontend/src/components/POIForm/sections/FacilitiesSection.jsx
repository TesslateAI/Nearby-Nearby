import React from 'react';
import {
  Stack, SimpleGrid, Checkbox, Divider, Radio, Select, Card,
  NumberInput, TextInput, Button, Switch, Text, MultiSelect
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import RichTextEditor from '../../RichTextEditor';
import {
  KEY_FACILITIES, PAYMENT_METHODS,
  SMOKING_OPTIONS, PET_OPTIONS,
  PUBLIC_TOILET_OPTIONS, ENTERTAINMENT_OPTIONS, PARK_FACILITIES,
  PLAYGROUND_TYPES, PARK_PLAYGROUND_SURFACES
} from '../../../utils/constants';
import {
  RestroomPhotosUpload,
  RentalPhotosUpload,
  shouldUseImageUpload
} from '../ImageIntegration';
import { CheckboxGroupSection } from '../components/CheckboxGroupSection';
import CoordinateInput from '../components/CoordinateInput';
import { AccessibleRestroomChecklist, RepeatableLocationGroup } from '../layouts/_shared';

export const FacilitiesSection = React.memo(function FacilitiesSection({
  form,
  isBusiness,
  isPark,
  isTrail,
  isEvent,
  isFreeListing,
  id
}) {
  return (
    <Stack>
      {/* Key Facilities moved to Core Information for all POI types */}

      {/* Pay Phone Locations - Parks, Trails, and Events (#73 adds Event). */}
      {(isPark || isTrail || isEvent) && (
        <>
          <Divider my="md" label="Pay Phone Locations" />
          {(form.values.payphone_locations || []).map((phone, index) => (
            <Card key={index} withBorder p="md" mb="sm">
              <Stack>
                <CoordinateInput
                  label="Pay Phone Coordinates"
                  latLabel="Pay Phone Latitude"
                  lngLabel="Pay Phone Longitude"
                  value={{ lat: phone.lat ?? null, lng: phone.lng ?? null, w3w: phone.w3w ?? '' }}
                  onChange={(v) => {
                    const phones = [...(form.values.payphone_locations || [])];
                    phones[index] = { ...phones[index], lat: v.lat, lng: v.lng, w3w: v.w3w ?? '' };
                    form.setFieldValue('payphone_locations', phones);
                  }}
                />
                <TextInput
                  label="Description"
                  placeholder="e.g., Near entrance, by visitor center"
                  value={phone.description || ''}
                  onChange={(e) => {
                    const phones = [...(form.values.payphone_locations || [])];
                    phones[index] = { ...phones[index], description: e.target.value };
                    form.setFieldValue('payphone_locations', phones);
                  }}
                />
                <Button
                  color="red"
                  variant="light"
                  size="xs"
                  onClick={() => {
                    const phones = [...(form.values.payphone_locations || [])];
                    phones.splice(index, 1);
                    form.setFieldValue('payphone_locations', phones);
                  }}
                >
                  Remove Pay Phone
                </Button>
              </Stack>
            </Card>
          ))}
          <Button
            variant="light"
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              const phones = [...(form.values.payphone_locations || [])];
              phones.push({ lat: null, lng: null, w3w: '', description: '' });
              form.setFieldValue('payphone_locations', phones);
            }}
          >
            Add Another Pay Phone Location
          </Button>
        </>
      )}

      {/* Entertainment and Facilities (legacy sub-group).
          #76 removed both from the Park form and #77 removes both from the Trail
          form (system-level cross-POI cleanup). They no longer render for Park or
          Trail. No other POI type rendered them, so this block is now dead, but
          the guard is kept explicit for safety. */}
      {false && (
        <>
          <CheckboxGroupSection
            label="Entertainment"
            fieldName="entertainment_options"
            options={ENTERTAINMENT_OPTIONS}
            cols={{ base: 2, sm: 3 }}
            form={form}
          />

          <CheckboxGroupSection
            label="Facilities"
            fieldName="facilities_options"
            options={PARK_FACILITIES}
            cols={{ base: 2, sm: 3 }}
            form={form}
          />
        </>
      )}

      {/* Payment Methods. #73 Event reorg moves Payment Methods OUT of
          On Site Facilities into the Event Details accordion (Acc 3), rendered
          directly in EventLayout, so it is suppressed here for Event. Business
          keeps it inline. */}
      {isBusiness && (
        <CheckboxGroupSection
          label="Payment Methods"
          fieldName="payment_methods"
          options={PAYMENT_METHODS}
          cols={{ base: 2, sm: 3 }}
          form={form}
        />
      )}

      {/* Alcohol UI moved out of Facilities + Amenities per Issue #55 + #69.
          The dedicated <AlcoholAccordionItem> owns the gate, granular
          availability types, BYOB, and notes. Keeping a duplicate here
          previously caused two UIs to write incompatible values to
          alcohol_available. */}

      {/* #76 Park + #77 Trail + #73 Event: Additional Accessibility Details +
          the mobility_access tristates move OUT to the dedicated "Accessibility
          + Mobility Access" accordion, and Smoking Options + details move OUT to
          the "Alcohol + Smoking" accordion. Suppress all of them here for Park,
          Trail, and Event. Business keeps them in Facilities. */}
      {!isPark && !isTrail && !isEvent && (
        <>
          <RichTextEditor
            label="Additional Accessibility Details"
            placeholder="Describe accessibility features"
            value={form.values.wheelchair_details || ''}
            onChange={(html) => form.setFieldValue('wheelchair_details', html)}
            error={form.errors.wheelchair_details}
          />

          <Divider my="md" label="Wheelchair and Mobility Access Details" />
          <Text size="sm" c="dimmed" mb="md">
            These fields help users with mobility needs find accessible locations
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Select
              label="Step-Free Entry"
              placeholder="Select..."
              data={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
                { value: 'unknown', label: 'Unknown' }
              ]}
              value={form.values.mobility_access?.step_free_entry || ''}
              onChange={(value) => form.setFieldValue('mobility_access.step_free_entry', value)}
            />
            <Select
              label="Main Service Area Reachable Without Stairs"
              placeholder="Select..."
              data={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
                { value: 'unknown', label: 'Unknown' }
              ]}
              value={form.values.mobility_access?.main_area_accessible || ''}
              onChange={(value) => form.setFieldValue('mobility_access.main_area_accessible', value)}
            />
            <Select
              label="Primary Service on Ground Level"
              placeholder="Select..."
              data={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
                { value: 'unknown', label: 'Unknown' }
              ]}
              value={form.values.mobility_access?.ground_level_service || ''}
              onChange={(value) => form.setFieldValue('mobility_access.ground_level_service', value)}
            />
          </SimpleGrid>

          <CheckboxGroupSection
            label="Smoking Policy"
            fieldName="smoking_options"
            options={SMOKING_OPTIONS}
            cols={{ base: 2, sm: 3 }}
            form={form}
          />
          <RichTextEditor
            label="Smoking Policy Details"
            placeholder="Additional smoking policy information"
            value={form.values.smoking_details || ''}
            onChange={(html) => form.setFieldValue('smoking_details', html)}
            error={form.errors.smoking_details}
          />
        </>
      )}

      {/* #73 Event reorg: "Event Amenities - WiFi Options" REMOVED entirely —
          it duplicated the new Facilities + Amenities JSONB content (WiFi lives
          in amenities.wifi via FullAmenitiesBlock / ConnectivityRow). */}

      {/* Issue #60 — Drone Policy controls moved out of FacilitiesSection
          into a dedicated Park layout section (s14-drone-policy). Do not
          re-add drone controls here. */}
    </Stack>
  );
});

export const PublicAmenitiesSection = React.memo(function PublicAmenitiesSection({
  form,
  isPark,
  isTrail,
  isEvent,
  isBusiness,
  isFreeListing,
  id
}) {
  return (
    <Stack>
      <Divider my="md" label="Public Toilets" />
      <Radio.Group
        label="Are public toilets available?"
        value={form.values.public_toilets_available || 'no'}
        onChange={(value) => {
          form.setFieldValue('public_toilets_available', value);
          if (value === 'no') {
            form.setFieldValue('public_toilets', []);
            form.setFieldValue('toilet_description', '');
            form.setFieldValue('toilet_locations', []);
          }
        }}
      >
        <Stack mt="xs">
          <Radio value="yes" label="Yes" />
          <Radio value="no" label="No" />
        </Stack>
      </Radio.Group>

      {form.values.public_toilets_available === 'yes' && (
        <>
          <Checkbox.Group
            label="Public Toilet Options"
            value={form.values.public_toilets || []}
            onChange={(value) => form.setFieldValue('public_toilets', value)}
          >
            <SimpleGrid cols={{ base: 2, sm: 3 }}>
              {PUBLIC_TOILET_OPTIONS.filter(option => !['Yes', 'No'].includes(option)).map(option => (
                <Checkbox key={option} value={option} label={option} />
              ))}
            </SimpleGrid>
          </Checkbox.Group>

          {/* ADA checklist appears inline only when "Wheelchair + ADA Accessible"
              is selected above. Component returns null otherwise. (Wave 3 #47) */}
          <AccessibleRestroomChecklist form={form} />

          {/* Enhanced toilet locations for Parks, Trails, and Events */}
          {(isPark || isTrail || isEvent) ? (
            <>
              <Divider my="md" label="Restroom Locations" />
              {(form.values.toilet_locations || []).map((toilet, index) => (
                <Card key={index} withBorder p="md" mb="sm">
                  <Stack>
                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                      <NumberInput
                        label="Restroom Latitude"
                        placeholder="35.7128"
                        precision={6}
                        value={toilet.lat || ''}
                        onChange={(value) => {
                          const toilets = [...(form.values.toilet_locations || [])];
                          toilets[index] = { ...toilets[index], lat: value };
                          form.setFieldValue('toilet_locations', toilets);
                        }}
                      />
                      <NumberInput
                        label="Restroom Longitude"
                        placeholder="-79.0064"
                        precision={6}
                        value={toilet.lng || ''}
                        onChange={(value) => {
                          const toilets = [...(form.values.toilet_locations || [])];
                          toilets[index] = { ...toilets[index], lng: value };
                          form.setFieldValue('toilet_locations', toilets);
                        }}
                      />
                    </SimpleGrid>
                    <RichTextEditor
                      label="Description"
                      placeholder="e.g., For paying customers only, Location details, accessibility info"
                      value={toilet.description || ''}
                      onChange={(html) => {
                        const toilets = [...(form.values.toilet_locations || [])];
                        toilets[index] = { ...toilets[index], description: html };
                        form.setFieldValue('toilet_locations', toilets);
                      }}
                    />
                    <Checkbox.Group
                      label="Restroom Features at This Location"
                      value={toilet.toilet_types || []}
                      onChange={(value) => {
                        const toilets = [...(form.values.toilet_locations || [])];
                        toilets[index] = { ...toilets[index], toilet_types: value };
                        form.setFieldValue('toilet_locations', toilets);
                      }}
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
                          values: { toilets: form.values.toilet_locations },
                          setFieldValue: (field, value) => {
                            if (field === 'toilets') {
                              form.setFieldValue('toilet_locations', value);
                            }
                          }
                        }}
                      />
                    ) : (
                      <TextInput
                        label="Photos"
                        placeholder="URLs to restroom photos (comma-separated)"
                        value={toilet.photos || ''}
                        onChange={(e) => {
                          const toilets = [...(form.values.toilet_locations || [])];
                          toilets[index] = { ...toilets[index], photos: e.target.value };
                          form.setFieldValue('toilet_locations', toilets);
                        }}
                        description="Image upload will be available shortly..."
                      />
                    )}
                    <Button
                      color="red"
                      variant="light"
                      size="xs"
                      onClick={() => {
                        const toilets = [...(form.values.toilet_locations || [])];
                        toilets.splice(index, 1);
                        form.setFieldValue('toilet_locations', toilets);
                      }}
                    >
                      Remove Restroom
                    </Button>
                  </Stack>
                </Card>
              ))}
              <Button
                variant="light"
                leftSection={<IconPlus size={16} />}
                onClick={() => {
                  const toilets = [...(form.values.toilet_locations || [])];
                  toilets.push({ lat: null, lng: null, description: '', photos: '', toilet_types: [] });
                  form.setFieldValue('toilet_locations', toilets);
                }}
              >
                Add Another Bathroom Location
              </Button>
            </>
          ) : (
            <>
              <RichTextEditor
                label="Toilet Description"
                placeholder="e.g., For paying customers only, Location details"
                value={form.values.toilet_description || ''}
                onChange={(html) => form.setFieldValue('toilet_description', html)}
                error={form.errors.toilet_description}
              />

              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <NumberInput
                  label="Toilet Latitude"
                  placeholder="e.g., 35.7128"
                  precision={6}
                  {...form.getInputProps('toilet_latitude')}
                />
                <NumberInput
                  label="Toilet Longitude"
                  placeholder="e.g., -79.0064"
                  precision={6}
                  {...form.getInputProps('toilet_longitude')}
                />
              </SimpleGrid>

              {!(isBusiness && isFreeListing) && (
                shouldUseImageUpload(id) ? (
                  <RestroomPhotosUpload
                    poiId={id}
                    restroomIndex={0}
                    form={{
                      values: { toilets: [{ photos: form.values.toilet_photos }] },
                      setFieldValue: (field, value) => {
                        if (field === 'toilets' && value[0]) {
                          form.setFieldValue('toilet_photos', value[0].photos);
                        }
                      }
                    }}
                  />
                ) : (
                  <TextInput
                    label="Toilet Photos"
                    placeholder="URLs to toilet photos (comma-separated)"
                    {...form.getInputProps('toilet_photos')}
                    description="Image upload will be available shortly..."
                  />
                )
              )}
            </>
          )}
        </>
      )}

    </Stack>
  );
});

// -----------------------------------------------------------------------------
// PlaygroundsSection — #49: reorganized playground UI.
//
// Renders:
//   - "Playground Available" switch (form.values.playground_available)
//   - Refreshed POI-level playground TYPES + SURFACES multi-selects
//   - RepeatableLocationGroup bound to playground_locations[] with the
//     per-row age_groups MultiSelect + 4-category ADA checklist
//
// NOTE: the previous flat POI-level "ADA Playground Checklist" + POI-level
// age_groups MultiSelect have been REMOVED from the layout that mounts this
// section. That data now lives inside each playground_locations[idx].
// -----------------------------------------------------------------------------
export const PlaygroundsSection = React.memo(function PlaygroundsSection({ form, isPark, id }) {
  return (
    <Stack>
      <Switch
        label="This POI has a playground"
        checked={!!form.values.playground_available}
        onChange={(e) => form.setFieldValue('playground_available', e.currentTarget.checked)}
      />

      {form.values.playground_available && (
        <>
          {/* #76 Park Acc 9: Playground Types + Surfaces are removed from the
              accordion top and live INSIDE each playground grouping instead (see
              PlaygroundRowExtras). Trail / Event keep the POI-level multiselects. */}
          {!isPark && (
            <>
              <MultiSelect
                label="Playground Types"
                placeholder="Select one or more"
                data={PLAYGROUND_TYPES}
                value={form.values.playground_types || []}
                onChange={(v) => form.setFieldValue('playground_types', v)}
                searchable
                clearable
              />

              <MultiSelect
                label="Playground Surface(s)"
                placeholder="Select one or more"
                data={PARK_PLAYGROUND_SURFACES}
                value={form.values.playground_surface_types || []}
                onChange={(v) => form.setFieldValue('playground_surface_types', v)}
                searchable
                clearable
              />
            </>
          )}

          <Divider my="xs" label="Playground Locations" />
          <Text size="xs" c="dimmed">
            Add one entry per playground. Each playground has its own age groups and ADA checklist.
          </Text>

          <RepeatableLocationGroup
            form={form}
            fieldName="playground_locations"
            extraFields="playground"
            addLabel="Add a playground"
            isPark={isPark}
            id={id}
          />
        </>
      )}
    </Stack>
  );
});

export const RentalsSection = React.memo(function RentalsSection({
  form,
  id
}) {
  return (
    <Stack>
      <Switch
        label="Available for Rent"
        {...form.getInputProps('available_for_rent', { type: 'checkbox' })}
      />
      {form.values.available_for_rent && (
        <>
          <RichTextEditor
            label="Rental Information"
            placeholder="What's available for rent?"
            value={form.values.rental_info || ''}
            onChange={(html) => form.setFieldValue('rental_info', html)}
            error={form.errors.rental_info}
          />
          <TextInput
            label="Rental Link"
            placeholder="Link to rental information"
            {...form.getInputProps('rental_link')}
          />
          {shouldUseImageUpload(id) ? (
            <RentalPhotosUpload poiId={id} form={form} />
          ) : (
            <Text size="sm" c="dimmed">Save POI first to enable rental photo upload</Text>
          )}
        </>
      )}
    </Stack>
  );
});