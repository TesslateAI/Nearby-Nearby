import React from 'react';
import {
  Stack, SimpleGrid, Checkbox, Divider, Radio, Select, Card,
  NumberInput, TextInput, Button, Switch
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import RichTextEditor from '../../RichTextEditor';
import { getCheckboxGroupProps } from '../constants/helpers';
import {
  KEY_FACILITIES, PAYMENT_METHODS, ALCOHOL_OPTIONS, WHEELCHAIR_OPTIONS,
  SMOKING_OPTIONS, WIFI_OPTIONS, DRONE_USAGE_OPTIONS, PET_OPTIONS,
  PUBLIC_TOILET_OPTIONS, ENTERTAINMENT_OPTIONS, PARK_FACILITIES
} from '../../../utils/constants';
import {
  RestroomPhotosUpload,
  RentalPhotosUpload,
  shouldUseImageUpload
} from '../ImageIntegration';
import { CheckboxGroupSection } from '../components/CheckboxGroupSection';

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

      {/* Pay Phone Locations - Parks only */}
      {isPark && (
        <>
          <Divider my="md" label="Pay Phone Locations" />
          {(form.values.payphone_locations || []).map((phone, index) => (
            <Card key={index} withBorder p="md" mb="sm">
              <Stack>
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <NumberInput
                    label="Pay Phone Latitude"
                    placeholder="35.7128"
                    precision={6}
                    value={phone.lat || ''}
                    onChange={(value) => {
                      const phones = [...(form.values.payphone_locations || [])];
                      phones[index] = { ...phones[index], lat: value };
                      form.setFieldValue('payphone_locations', phones);
                    }}
                  />
                  <NumberInput
                    label="Pay Phone Longitude"
                    placeholder="-79.0064"
                    precision={6}
                    value={phone.lng || ''}
                    onChange={(value) => {
                      const phones = [...(form.values.payphone_locations || [])];
                      phones[index] = { ...phones[index], lng: value };
                      form.setFieldValue('payphone_locations', phones);
                    }}
                  />
                </SimpleGrid>
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
              phones.push({ lat: null, lng: null, description: '' });
              form.setFieldValue('payphone_locations', phones);
            }}
          >
            Add Another Pay Phone Location
          </Button>
        </>
      )}

      {/* Entertainment and Facilities Options - Parks and Trails */}
      {(isPark || isTrail) && (
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

      {/* Payment Methods - only for Business and Events (Parks/Trails don't need this) */}
      {(isBusiness || isEvent) && (
        <CheckboxGroupSection
          label="Payment Methods"
          fieldName="payment_methods"
          options={PAYMENT_METHODS}
          cols={{ base: 2, sm: 3 }}
          form={form}
        />
      )}

      <Divider my="md" label="Alcohol Availability" />
      <Radio.Group
        label="Is alcohol available?"
        value={form.values.alcohol_available || 'no'}
        onChange={(value) => {
          form.setFieldValue('alcohol_available', value);
          if (value === 'no') {
            form.setFieldValue('alcohol_options', []);
          }
        }}
      >
        <Stack mt="xs">
          <Radio value="yes" label="Yes" />
          <Radio value="no" label="No" />
        </Stack>
      </Radio.Group>

      {form.values.alcohol_available === 'yes' && (
        <Checkbox.Group
          label="Alcohol Options"
          {...getCheckboxGroupProps(form, 'alcohol_options')}
        >
          <SimpleGrid cols={{ base: 2, sm: 3 }}>
            {ALCOHOL_OPTIONS.filter(option => !['Yes', 'No Alcohol Allowed'].includes(option)).map(option => (
              <Checkbox key={option} value={option} label={option} />
            ))}
          </SimpleGrid>
        </Checkbox.Group>
      )}

      <CheckboxGroupSection
        label="Wheelchair Accessibility"
        fieldName="wheelchair_accessible"
        options={WHEELCHAIR_OPTIONS}
        cols={{ base: 2, sm: 3 }}
        form={form}
      />
      <RichTextEditor
        label="Additional Accessibility Details"
        placeholder="Describe accessibility features"
        value={form.values.wheelchair_details || ''}
        onChange={(html) => form.setFieldValue('wheelchair_details', html)}
        error={form.errors.wheelchair_details}
      />

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

      {isEvent && (
        <CheckboxGroupSection
          label="Event Amenities - WiFi Options"
          fieldName="wifi_options"
          options={WIFI_OPTIONS}
          cols={{ base: 2, sm: 3 }}
          form={form}
        />
      )}

      {(isEvent || isPark || isTrail) && (
        <>
          <Divider my="md" label="Drone Policy" />
          <Select
            label="Drone Usage"
            placeholder="Select drone policy"
            data={DRONE_USAGE_OPTIONS}
            {...form.getInputProps('drone_usage')}
          />
          <RichTextEditor
            label="Drone Policy Details"
            placeholder="Additional drone policy information"
            value={form.values.drone_policy || ''}
            onChange={(html) => form.setFieldValue('drone_policy', html)}
            error={form.errors.drone_policy}
          />
        </>
      )}
    </Stack>
  );
});

export const PublicAmenitiesSection = React.memo(function PublicAmenitiesSection({
  form,
  isPark,
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

          {/* Enhanced toilet locations for Parks */}
          {isPark ? (
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
                  toilets.push({ lat: null, lng: null, description: '', photos: '' });
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

              {shouldUseImageUpload(id) ? (
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
              )}
            </>
          )}
        </>
      )}

      {/* Rentals section - for non-Parks */}
      {!isPark && (
        <>
          <Divider my="md" label="Rental Information" />
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
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput
                  label="Rental Pricing"
                  placeholder="Pricing information"
                  {...form.getInputProps('rental_pricing')}
                />
                <TextInput
                  label="Rental Link"
                  placeholder="Link to rental information"
                  {...form.getInputProps('rental_link')}
                />
              </SimpleGrid>
            </>
          )}
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
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="Rental Pricing"
              placeholder="Pricing information"
              {...form.getInputProps('rental_pricing')}
            />
            <TextInput
              label="Rental Link"
              placeholder="Link to rental information"
              {...form.getInputProps('rental_link')}
            />
          </SimpleGrid>
          {shouldUseImageUpload(id) ? (
            <RentalPhotosUpload poiId={id} form={form} />
          ) : (
            <TextInput
              label="Photos of Rental"
              placeholder="URLs to rental photos (comma-separated)"
              {...form.getInputProps('rental_photos')}
              description="Image upload will be available shortly..."
            />
          )}
        </>
      )}
    </Stack>
  );
});