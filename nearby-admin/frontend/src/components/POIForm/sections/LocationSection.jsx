import React, { lazy, Suspense } from 'react';
import {
  Stack, SimpleGrid, Select, NumberInput, Button, Divider,
  Checkbox, Radio, Card, Group, ActionIcon, Alert, Text, TextInput
} from '@mantine/core';
import { IconPlus, IconTrash, IconMapPin, IconInfoCircle } from '@tabler/icons-react';
import RichTextEditor from '../../RichTextEditor';
import { DebouncedTextInput } from '../../DebouncedTextInput';
import { getDebouncedInputProps, getNumericInputProps } from '../constants/helpers';
import { PARKING_OPTIONS, VENUE_SETTINGS } from '../../../utils/constants';
import {
  EntryPhotoUpload,
  ParkingPhotosUpload,
  shouldUseImageUpload
} from '../ImageIntegration';

// Lazy load the map component
const LocationMap = lazy(() => import('../../LocationMap'));
import { LocationMapSkeleton } from '../../LocationMap';

export const LocationSection = React.memo(function LocationSection({
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
      {/* Prominent Alert emphasizing Lat & Long is best */}
      <Alert
        icon={<IconMapPin size={20} />}
        title="Best Practice: Use Latitude & Longitude"
        color="blue"
        variant="light"
      >
        <Stack gap="xs">
          <Text size="sm">
            <strong>For the most accurate location</strong>, we recommend using the map pin below to set your
            Latitude & Longitude coordinates. This ensures precise placement on all maps and location services.
          </Text>
          <Text size="sm" c="dimmed">
            Address fields are optional and can be used for additional context, but the map coordinates
            are the primary location identifier.
          </Text>
        </Stack>
      </Alert>

      <Suspense fallback={<LocationMapSkeleton />}>
        <LocationMap
          latitude={form.values.latitude}
          longitude={form.values.longitude}
          onLocationChange={(lat, lng) => {
            form.setFieldValue('latitude', lat);
            form.setFieldValue('longitude', lng);
          }}
        />
      </Suspense>

      <Divider my="sm" label="Address (Optional)" labelPosition="center" />

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <DebouncedTextInput
          label="Street Address"
          placeholder="123 Main St"
          {...getDebouncedInputProps(form, 'address_street')}
        />
        <DebouncedTextInput
          label="Address Line 2 (Suite, Unit, etc.)"
          placeholder="Suite 100, Unit B, etc."
          {...getDebouncedInputProps(form, 'address_full')}
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 4 }}>
        <Select
          label="City"
          placeholder="Select or type city"
          data={[
            'Pittsboro', 'Siler City', 'Chapel Hill', 'Carrboro', 'Goldston',
            'Bear Creek', 'Bennett', 'Bonlee', 'Bynum', 'Gulf', 'Moncure',
            'Sanford', 'Apex', 'Holly Springs', 'Fuquay-Varina'
          ]}
          searchable
          allowDeselect
          nothingFoundMessage="Type to enter a custom city"
          {...form.getInputProps('address_city')}
        />
        <DebouncedTextInput
          label="County"
          placeholder="County name"
          {...getDebouncedInputProps(form, 'address_county')}
        />
        <Select
          label="State"
          placeholder="Select state"
          data={[
            { value: 'NC', label: 'North Carolina' },
            { value: 'SC', label: 'South Carolina' },
            { value: 'VA', label: 'Virginia' },
            { value: 'GA', label: 'Georgia' },
            { value: 'TN', label: 'Tennessee' }
          ]}
          {...form.getInputProps('address_state')}
          searchable
        />
        <DebouncedTextInput
          label="ZIP Code"
          placeholder="12345"
          {...getDebouncedInputProps(form, 'address_zip')}
        />
      </SimpleGrid>

      <Divider my="md" label="Coordinates" />
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <NumberInput
          label="Front Door Latitude"
          placeholder="35.7128"
          precision={6}
          {...getNumericInputProps(form, 'front_door_latitude')}
        />
        <NumberInput
          label="Front Door Longitude"
          placeholder="-79.0064"
          precision={6}
          {...getNumericInputProps(form, 'front_door_longitude')}
        />
      </SimpleGrid>
      <Button
        size="xs"
        variant="light"
        onClick={() => {
          form.setFieldValue('front_door_latitude', form.values.latitude);
          form.setFieldValue('front_door_longitude', form.values.longitude);
        }}
      >
        Use Map Pin for Lat/Long
      </Button>

      {/* Park Entry Information */}
      {isPark && (
        <>
          <Divider my="md" label="Park Entry Information" />
          <RichTextEditor
            label="Park Entry Notes"
            placeholder="Describe how to enter the park, special instructions, etc."
            value={form.values.park_entry_notes || ''}
            onChange={(html) => form.setFieldValue('park_entry_notes', html)}
            error={form.errors.park_entry_notes}
            minRows={3}
          />
          {shouldUseImageUpload(id) ? (
            <EntryPhotoUpload poiId={id} poiType="Park" form={form} />
          ) : (
            <Text size="sm" c="dimmed">Save POI first to enable park entry photo upload</Text>
          )}
        </>
      )}

      {/* Trail Entry Information */}
      {isTrail && (
        <>
          <Divider my="md" label="Trail Entry Information" />
          <RichTextEditor
            label="Trail Entry Notes"
            placeholder="Describe how to access the trail, trailhead location, special instructions, etc."
            value={form.values.trail_entry_notes || ''}
            onChange={(html) => form.setFieldValue('trail_entry_notes', html)}
            error={form.errors.trail_entry_notes}
            minRows={3}
          />
          {shouldUseImageUpload(id) ? (
            <EntryPhotoUpload poiId={id} poiType="Trail" form={form} />
          ) : (
            <Text size="sm" c="dimmed">Save POI first to enable trail entry photo upload</Text>
          )}
        </>
      )}

      {/* Business Entry Information - PAID Business only */}
      {isBusiness && !isFreeListing && (
        <>
          <Divider my="md" label="Business Entry Information" />
          <RichTextEditor
            label="Business Entry Notes"
            placeholder="Describe how to enter your business, special instructions, etc."
            value={form.values.business_entry_notes || ''}
            onChange={(html) => form.setFieldValue('business_entry_notes', html)}
            error={form.errors.business_entry_notes}
            minRows={3}
          />
          {shouldUseImageUpload(id) ? (
            <EntryPhotoUpload poiId={id} poiType="Business" form={form} />
          ) : (
            <Text size="sm" c="dimmed">Save POI first to enable business entry photo upload</Text>
          )}
        </>
      )}

      {/* Event Venue Information */}
      {isEvent && (
        <>
          <Divider my="md" label="Venue Settings" />
          <Checkbox.Group
            label="Venue Settings"
            value={form.values.event?.venue_settings || []}
            onChange={(value) => form.setFieldValue('event.venue_settings', value)}
          >
            <SimpleGrid cols={{ base: 2, sm: 4 }}>
              {VENUE_SETTINGS.map(setting => (
                <Checkbox key={setting} value={setting} label={setting} />
              ))}
            </SimpleGrid>
          </Checkbox.Group>

          <Divider my="md" label="Event Entry Information" />
          <RichTextEditor
            label="Event Entry Notes"
            placeholder="Describe how to enter the event, special instructions, etc."
            value={form.values.event?.event_entry_notes || ''}
            onChange={(html) => form.setFieldValue('event.event_entry_notes', html)}
            error={form.errors['event.event_entry_notes']}
            minRows={3}
          />
          {shouldUseImageUpload(id) ? (
            <EntryPhotoUpload poiId={id} poiType="Event" form={form} />
          ) : (
            <Text size="sm" c="dimmed">Save POI first to enable event entry photo upload</Text>
          )}
        </>
      )}

      <Divider my="md" label="Parking Information" />

      <Checkbox.Group
        label="Parking Types Available"
        value={form.values.parking_types || []}
        onChange={(value) => form.setFieldValue('parking_types', value)}
      >
        <SimpleGrid cols={{ base: 2, sm: 3 }}>
          {PARKING_OPTIONS.map(type => (
            <Checkbox key={type} value={type} label={type} />
          ))}
        </SimpleGrid>
      </Checkbox.Group>

      <RichTextEditor
        label="Parking Notes"
        placeholder="Additional parking information"
        value={form.values.parking_notes || ''}
        onChange={(html) => form.setFieldValue('parking_notes', html)}
        error={form.errors.parking_notes}
      />

      <RichTextEditor
        label="Public Transit Information"
        placeholder="Bus routes, train stations, etc."
        value={form.values.public_transit_info || ''}
        onChange={(html) => form.setFieldValue('public_transit_info', html)}
        error={form.errors.public_transit_info}
      />

      <Radio.Group
        label="Expect to Pay for Parking?"
        {...form.getInputProps('expect_to_pay_parking')}
      >
        <Stack mt="xs">
          <Radio value="yes" label="Yes" />
          <Radio value="no" label="No" />
          <Radio value="sometimes" label="Sometimes" />
        </Stack>
      </Radio.Group>

      {/* Primary Parking Location - lat/long and photos for main parking area */}
      <Divider my="md" label="Primary Parking Location" />
      <Text size="sm" c="dimmed" mb="sm">
        Set the coordinates and photos for the main parking area. Use "Add Another Parking Location" below for additional lots.
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <NumberInput
          label="Primary Parking Latitude"
          placeholder="35.7128"
          precision={6}
          value={form.values.primary_parking_lat || ''}
          onChange={(value) => form.setFieldValue('primary_parking_lat', value)}
        />
        <NumberInput
          label="Primary Parking Longitude"
          placeholder="-79.0064"
          precision={6}
          value={form.values.primary_parking_lng || ''}
          onChange={(value) => form.setFieldValue('primary_parking_lng', value)}
        />
      </SimpleGrid>
      <TextInput
        label="Primary Parking Area Name"
        placeholder="e.g., Main Lot, Front Parking"
        value={form.values.primary_parking_name || ''}
        onChange={(e) => form.setFieldValue('primary_parking_name', e.target.value)}
      />
      {shouldUseImageUpload(id) ? (
        <ParkingPhotosUpload poiId={id} parkingName={form.values.primary_parking_name || 'Primary'} form={form} />
      ) : (
        <Text size="sm" c="dimmed">Save POI first to enable parking photo upload</Text>
      )}

      {/* Parking Locations for Parks, Trails, and Events */}
      {(isPark || isTrail || isEvent) && (
        <>
          <Divider my="md" label="Parking Locations" />
          {(form.values.parking_locations || []).map((parking, index) => (
            <Card key={index} withBorder p="md" mb="sm">
              <Stack>
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <NumberInput
                    label="Parking Latitude"
                    placeholder="35.7128"
                    precision={6}
                    value={parking.lat || ''}
                    onChange={(value) => {
                      const locations = [...(form.values.parking_locations || [])];
                      locations[index] = { ...locations[index], lat: value };
                      form.setFieldValue('parking_locations', locations);
                    }}
                  />
                  <NumberInput
                    label="Parking Longitude"
                    placeholder="-79.0064"
                    precision={6}
                    value={parking.lng || ''}
                    onChange={(value) => {
                      const locations = [...(form.values.parking_locations || [])];
                      locations[index] = { ...locations[index], lng: value };
                      form.setFieldValue('parking_locations', locations);
                    }}
                  />
                </SimpleGrid>
                <TextInput
                  label="Parking Area Name"
                  placeholder={isPark ? "e.g., Main Lot, Visitor Center Parking" : isTrail ? "e.g., Trailhead Parking, Main Lot" : "e.g., Main Lot, Event Parking"}
                  value={parking.name || ''}
                  onChange={(e) => {
                    const locations = [...(form.values.parking_locations || [])];
                    locations[index] = { ...locations[index], name: e.target.value };
                    form.setFieldValue('parking_locations', locations);
                  }}
                />
                {shouldUseImageUpload(id) ? (
                  <ParkingPhotosUpload poiId={id} parkingIndex={index} parkingName={parking.name} form={form} />
                ) : (
                  <Text size="sm" c="dimmed">Save POI first to enable parking photo upload</Text>
                )}
                <Button
                  color="red"
                  variant="light"
                  size="xs"
                  onClick={() => {
                    const locations = [...(form.values.parking_locations || [])];
                    locations.splice(index, 1);
                    form.setFieldValue('parking_locations', locations);
                  }}
                >
                  Remove Parking Location
                </Button>
              </Stack>
            </Card>
          ))}
          <Button
            variant="light"
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              const locations = [...(form.values.parking_locations || [])];
              locations.push({ lat: null, lng: null, name: '' });
              form.setFieldValue('parking_locations', locations);
            }}
          >
            Add Another Parking Location
          </Button>
        </>
      )}
    </Stack>
  );
});