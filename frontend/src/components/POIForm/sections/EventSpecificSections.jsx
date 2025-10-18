import React from 'react';
import {
  Stack, SimpleGrid, Switch, Divider, Text, Checkbox, Button,
  TextInput, NumberInput, Card
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { IconPlus } from '@tabler/icons-react';
import RichTextEditor from '../../RichTextEditor';
import { getCheckboxGroupProps } from '../constants/helpers';
import {
  VENDOR_TYPES, COAT_CHECK_OPTIONS
} from '../../../utils/constants';
import {
  DownloadableMapsUpload,
  shouldUseImageUpload
} from '../ImageIntegration';

export const EventVendorsSection = React.memo(function EventVendorsSection({ form, id }) {
  return (
    <Stack>
      <Switch
        label="Has Vendors"
        {...form.getInputProps('event.has_vendors', { type: 'checkbox' })}
      />
      {form.values.event?.has_vendors && (
        <>
          <Divider my="md" label="Vendor Types" />
          <Text size="sm" c="dimmed" mb="md">
            Select the types of vendors that will be present at your event:
          </Text>
          <Checkbox.Group {...getCheckboxGroupProps(form, 'event.vendor_types')}>
            <Stack spacing="md">
              {Object.entries(
                VENDOR_TYPES.reduce((groups, vendor) => {
                  const group = vendor.group || 'Other';
                  if (!groups[group]) groups[group] = [];
                  groups[group].push(vendor);
                  return groups;
                }, {})
              ).map(([groupName, vendors]) => (
                <div key={groupName}>
                  <Text fw={500} size="sm" mb="xs">{groupName}</Text>
                  <SimpleGrid cols={{ base: 2, sm: 3 }} ml="md">
                    {vendors.map(vendor => (
                      <Checkbox
                        key={vendor.value}
                        value={vendor.value}
                        label={vendor.label}
                      />
                    ))}
                  </SimpleGrid>
                </div>
              ))}
            </Stack>
          </Checkbox.Group>

          <DateTimePicker
            label="Vendor Application Deadline"
            placeholder="Select deadline"
            {...form.getInputProps('event.vendor_application_deadline')}
          />

          <RichTextEditor
            label="Vendor Application Information"
            placeholder="How to apply to be a vendor"
            value={form.values.event?.vendor_application_info || ''}
            onChange={(html) => form.setFieldValue('event.vendor_application_info', html)}
            error={form.errors['event.vendor_application_info']}
            minRows={3}
          />

          <TextInput
            label="Vendor Fee"
            placeholder="Cost to be a vendor"
            {...form.getInputProps('event.vendor_fee')}
          />

          <RichTextEditor
            label="Vendor Requirements"
            placeholder="Requirements for vendors"
            value={form.values.event?.vendor_requirements || ''}
            onChange={(html) => form.setFieldValue('event.vendor_requirements', html)}
            error={form.errors?.event?.vendor_requirements}
          />
        </>
      )}
    </Stack>
  );
});

export const EventAmenitiesSection = React.memo(function EventAmenitiesSection({ form }) {
  return (
    <Stack>
      <Checkbox.Group
        label="Coat Check Options"
        {...getCheckboxGroupProps(form, 'event.coat_check_options')}
      >
        <SimpleGrid cols={{ base: 2, sm: 3 }}>
          {COAT_CHECK_OPTIONS.map(option => (
            <Checkbox key={option} value={option} label={option} />
          ))}
        </SimpleGrid>
      </Checkbox.Group>

      <RichTextEditor
        label="Food & Drink Information"
        placeholder="What food and drink options are available?"
        value={form.values.event?.food_and_drink_info || ''}
        onChange={(html) => form.setFieldValue('event.food_and_drink_info', html)}
        error={form.errors['event.food_and_drink_info']}
        minRows={3}
      />
    </Stack>
  );
});

export const EventMapsSection = React.memo(function EventMapsSection({ form, id }) {
  return (
    <Stack>
      <Divider my="md" label="Downloadable Maps" />
      {shouldUseImageUpload(id) ? (
        <DownloadableMapsUpload poiId={id} form={form} />
      ) : (
        <>
          {(form.values.downloadable_maps || []).map((map, index) => (
            <Card key={index} withBorder p="md" mb="sm">
              <Stack>
                <TextInput
                  label="Map Title"
                  placeholder="e.g., Event Layout, Vendor Map"
                  value={map.name || ''}
                  onChange={(e) => {
                    const maps = [...(form.values.downloadable_maps || [])];
                    maps[index] = { ...maps[index], name: e.target.value };
                    form.setFieldValue('downloadable_maps', maps);
                  }}
                />
                <TextInput
                  label="Map URL"
                  placeholder="URL to PDF or image file"
                  value={map.url || ''}
                  onChange={(e) => {
                    const maps = [...(form.values.downloadable_maps || [])];
                    maps[index] = { ...maps[index], url: e.target.value };
                    form.setFieldValue('downloadable_maps', maps);
                  }}
                />
                <Button
                  color="red"
                  variant="light"
                  size="xs"
                  onClick={() => {
                    const maps = [...(form.values.downloadable_maps || [])];
                    maps.splice(index, 1);
                    form.setFieldValue('downloadable_maps', maps);
                  }}
                >
                  Remove Map
                </Button>
              </Stack>
            </Card>
          ))}
          <Button
            variant="light"
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              const maps = [...(form.values.downloadable_maps || [])];
              maps.push({ name: '', url: '' });
              form.setFieldValue('downloadable_maps', maps);
            }}
          >
            Add Another Map
          </Button>
          <Text size="xs" c="dimmed" mt="xs">
            Save the POI first to enable file upload
          </Text>
        </>
      )}

      <Divider my="md" label="Event Food and Drink" />
      <RichTextEditor
        label="Event Food and Drink"
        placeholder="Will there be food, drinks to purchase? If so, what kind of food? Can attendees bring their own?"
        value={form.values.event?.food_and_drink_info || ''}
        onChange={(html) => form.setFieldValue('event.food_and_drink_info', html)}
        error={form.errors['event.food_and_drink_info']}
        minRows={3}
      />
    </Stack>
  );
});