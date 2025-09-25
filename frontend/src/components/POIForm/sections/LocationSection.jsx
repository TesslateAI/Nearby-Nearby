import { lazy, Suspense } from 'react';
import {
  Stack, SimpleGrid, TextInput, Select, NumberInput, Button, Divider,
  Checkbox, Radio, Card, Group, ActionIcon
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import RichTextEditor from '../../RichTextEditor';
import { getControlledInputProps, getNumericInputProps } from '../constants/helpers';
import { PARKING_OPTIONS, VENUE_SETTINGS } from '../../../utils/constants';
import {
  EntryPhotoUpload,
  ParkingPhotosUpload,
  shouldUseImageUpload
} from '../ImageIntegration';

// Lazy load the map component
const LocationMap = lazy(() => import('../../LocationMap'));
import { LocationMapSkeleton } from '../../LocationMap';

export function LocationSection({
  form,
  isPark,
  isEvent,
  isFreeListing,
  id
}) {
  return (
    <Stack>
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

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TextInput
          label="Street Address"
          placeholder="123 Main St"
          {...getControlledInputProps(form, 'address_street')}
        />
        <TextInput
          label="Address Line 2 (Suite, Unit, etc.)"
          placeholder="Suite 100, Unit B, etc."
          {...getControlledInputProps(form, 'address_full')}
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 4 }}>
        <TextInput
          label="City"
          placeholder="City name"
          {...getControlledInputProps(form, 'address_city')}
          withAsterisk
        />
        <TextInput
          label="County"
          placeholder="County name"
          {...getControlledInputProps(form, 'address_county')}
        />
        <Select
          label="State"
          placeholder="Select state"
          data={['NC', 'SC', 'VA', 'GA', 'TN']}
          {...form.getInputProps('address_state')}
          withAsterisk
        />
        <TextInput
          label="ZIP Code"
          placeholder="12345"
          {...getControlledInputProps(form, 'address_zip')}
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
            <TextInput
              label="Park Entry Photo"
              placeholder="URL to photo of park entrance"
              {...form.getInputProps('park_entry_photo')}
              description="Image upload will be available shortly..."
            />
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
            <TextInput
              label="Event Entry Photo"
              placeholder="URL to photo of event entrance"
              {...form.getInputProps('event.event_entry_photo')}
              description="Image upload will be available shortly..."
            />
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

      {!isFreeListing && (
        <>
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
        </>
      )}

      {/* Parking Locations for Parks and Events */}
      {(isPark || isEvent) && (
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
                  placeholder={isPark ? "e.g., Main Lot, Visitor Center Parking" : "e.g., Main Lot, Event Parking"}
                  value={parking.name || ''}
                  onChange={(e) => {
                    const locations = [...(form.values.parking_locations || [])];
                    locations[index] = { ...locations[index], name: e.target.value };
                    form.setFieldValue('parking_locations', locations);
                  }}
                />
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

          {shouldUseImageUpload(id) ? (
            <ParkingPhotosUpload poiId={id} form={form} />
          ) : (
            <TextInput
              label="Parking Lot Photo"
              placeholder="URL to photo of parking area"
              {...form.getInputProps('parking_lot_photo')}
              description="Image upload will be available shortly..."
            />
          )}
        </>
      )}
    </Stack>
  );
}