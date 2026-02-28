import React from 'react';
import {
  Stack, SimpleGrid, Switch, Divider, Text, Checkbox, Button,
  TextInput, NumberInput, Card, Select, Alert
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import RichTextEditor from '../../RichTextEditor';
import { getCheckboxGroupProps } from '../constants/helpers';
import {
  VENDOR_TYPES, COAT_CHECK_OPTIONS, EVENT_STATUS_OPTIONS, EVENT_COST_TYPES
} from '../../../utils/constants';
import {
  DownloadableMapsUpload,
  shouldUseImageUpload
} from '../ImageIntegration';
import { VenueSelector } from '../components/VenueSelector';

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
            value={form.values.event?.vendor_application_deadline instanceof Date ? form.values.event.vendor_application_deadline : (form.values.event?.vendor_application_deadline ? new Date(form.values.event.vendor_application_deadline) : null)}
            onChange={(val) => form.setFieldValue('event.vendor_application_deadline', val)}
            error={form.errors['event.vendor_application_deadline']}
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

export const EventVenueSection = React.memo(function EventVenueSection({ form, id }) {
  return (
    <Stack>
      <Text size="sm" c="dimmed" mb="md">
        Link this event to a venue and optionally copy the venue's location, parking,
        accessibility, and restroom information to pre-fill the event details.
      </Text>
      <VenueSelector form={form} poiId={id} />
    </Stack>
  );
});

// Task 134-136: Event Status Section
export const EventStatusSection = React.memo(function EventStatusSection({ form }) {
  const eventStatus = form.values.event?.event_status || 'Scheduled';
  const isCanceledOrPostponed = eventStatus === 'Canceled' || eventStatus === 'Postponed';
  const isRescheduled = eventStatus === 'Rescheduled';
  const isUpdatedDateTime = eventStatus === 'Updated Date and/or Time';

  return (
    <Stack>
      <Select
        label="Event Status"
        placeholder="Select event status"
        data={EVENT_STATUS_OPTIONS}
        value={eventStatus}
        onChange={(val) => form.setFieldValue('event.event_status', val)}
        error={form.errors['event.event_status']}
      />

      {isUpdatedDateTime && (
        <Alert color="yellow" variant="light">
          <Text size="sm">
            Changing the event date will require switching to &quot;Rescheduled&quot; status.
          </Text>
        </Alert>
      )}

      {isCanceledOrPostponed && (
        <>
          <RichTextEditor
            label="Cancellation / Postponement Message"
            placeholder="Explain why this event was canceled or postponed"
            value={form.values.event?.cancellation_paragraph || ''}
            onChange={(html) => form.setFieldValue('event.cancellation_paragraph', html)}
            error={form.errors['event.cancellation_paragraph']}
            minRows={3}
          />
          <Switch
            label="Show 'Contact Organizer' button"
            description="Display a link for attendees to contact the organizer"
            checked={form.values.event?.contact_organizer_toggle || false}
            onChange={(e) => form.setFieldValue('event.contact_organizer_toggle', e.currentTarget.checked)}
          />
        </>
      )}

      {isRescheduled && form.values.event?.new_event_link && (
        <Alert color="blue" variant="light">
          <Text size="sm">
            This event has been rescheduled. New event ID: {form.values.event.new_event_link}
          </Text>
        </Alert>
      )}
    </Stack>
  );
});

// Task 138: Event Organizer Section
export const EventOrganizerSection = React.memo(function EventOrganizerSection({ form }) {
  return (
    <Stack>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TextInput
          label="Organizer Name"
          placeholder="Organization or person name"
          {...form.getInputProps('event.organizer_name')}
        />
        <TextInput
          label="Organizer Email"
          placeholder="contact@organization.org"
          {...form.getInputProps('event.organizer_email')}
        />
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TextInput
          label="Organizer Phone"
          placeholder="919-555-0100"
          {...form.getInputProps('event.organizer_phone')}
        />
        <TextInput
          label="Organizer Website"
          placeholder="https://organization.org"
          {...form.getInputProps('event.organizer_website')}
        />
      </SimpleGrid>

      <Divider my="sm" label="Organizer Social Media" />
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TextInput
          label="Instagram"
          placeholder="@handle"
          value={form.values.event?.organizer_social_media?.instagram || ''}
          onChange={(e) => {
            const current = form.values.event?.organizer_social_media || {};
            form.setFieldValue('event.organizer_social_media', { ...current, instagram: e.target.value });
          }}
        />
        <TextInput
          label="Facebook"
          placeholder="page name or URL"
          value={form.values.event?.organizer_social_media?.facebook || ''}
          onChange={(e) => {
            const current = form.values.event?.organizer_social_media || {};
            form.setFieldValue('event.organizer_social_media', { ...current, facebook: e.target.value });
          }}
        />
      </SimpleGrid>
    </Stack>
  );
});

// Task 139: Event Cost & Ticketing Section
export const EventCostSection = React.memo(function EventCostSection({ form }) {
  const ticketLinks = form.values.event?.ticket_links || [];

  return (
    <Stack>
      <Select
        label="Cost Type"
        placeholder="Select cost type"
        data={EVENT_COST_TYPES}
        value={form.values.event?.cost_type || ''}
        onChange={(val) => form.setFieldValue('event.cost_type', val)}
        clearable
      />

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TextInput
          label="Cost"
          placeholder="e.g., $10 or $0-$50 or 0 (for free)"
          {...form.getInputProps('cost')}
        />
        <TextInput
          label="Single Ticket Link"
          placeholder="URL to purchase tickets"
          {...form.getInputProps('ticket_link')}
        />
      </SimpleGrid>

      <RichTextEditor
        label="Pricing Details"
        placeholder="Additional pricing info (e.g., Kids under 2 are free)"
        value={form.values.pricing_details || ''}
        onChange={(html) => form.setFieldValue('pricing_details', html)}
        error={form.errors.pricing_details}
        minRows={3}
      />

      <Divider my="sm" label="Multiple Ticket Links" />
      {ticketLinks.map((link, index) => (
        <Card key={index} withBorder p="sm" mb="xs">
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="Ticket Name"
              placeholder="e.g., General Admission, VIP"
              value={link.name || ''}
              onChange={(e) => {
                const updated = [...ticketLinks];
                updated[index] = { ...updated[index], name: e.target.value };
                form.setFieldValue('event.ticket_links', updated);
              }}
            />
            <TextInput
              label="Ticket URL"
              placeholder="https://tickets.example.com"
              value={link.url || ''}
              onChange={(e) => {
                const updated = [...ticketLinks];
                updated[index] = { ...updated[index], url: e.target.value };
                form.setFieldValue('event.ticket_links', updated);
              }}
            />
          </SimpleGrid>
          <Button
            color="red"
            variant="light"
            size="xs"
            mt="xs"
            leftSection={<IconTrash size={14} />}
            onClick={() => {
              const updated = ticketLinks.filter((_, i) => i !== index);
              form.setFieldValue('event.ticket_links', updated);
            }}
          >
            Remove
          </Button>
        </Card>
      ))}
      <Button
        variant="light"
        leftSection={<IconPlus size={16} />}
        onClick={() => {
          form.setFieldValue('event.ticket_links', [...ticketLinks, { name: '', url: '' }]);
        }}
      >
        Add Ticket Link
      </Button>
    </Stack>
  );
});

// Task 140: Event Sponsors Section
export const EventSponsorsSection = React.memo(function EventSponsorsSection({ form }) {
  const sponsors = form.values.event?.sponsors || [];

  return (
    <Stack>
      <Text size="sm" c="dimmed" mb="md">
        Add sponsors for this event. Each sponsor can have a name and optional website URL.
      </Text>
      {sponsors.map((sponsor, index) => (
        <Card key={index} withBorder p="sm" mb="xs">
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="Sponsor Name"
              placeholder="e.g., Acme Corp"
              value={sponsor.name || ''}
              onChange={(e) => {
                const updated = [...sponsors];
                updated[index] = { ...updated[index], name: e.target.value };
                form.setFieldValue('event.sponsors', updated);
              }}
            />
            <TextInput
              label="Sponsor URL"
              placeholder="https://sponsor.com"
              value={sponsor.url || ''}
              onChange={(e) => {
                const updated = [...sponsors];
                updated[index] = { ...updated[index], url: e.target.value };
                form.setFieldValue('event.sponsors', updated);
              }}
            />
          </SimpleGrid>
          <Button
            color="red"
            variant="light"
            size="xs"
            mt="xs"
            leftSection={<IconTrash size={14} />}
            onClick={() => {
              const updated = sponsors.filter((_, i) => i !== index);
              form.setFieldValue('event.sponsors', updated);
            }}
          >
            Remove
          </Button>
        </Card>
      ))}
      <Button
        variant="light"
        leftSection={<IconPlus size={16} />}
        onClick={() => {
          form.setFieldValue('event.sponsors', [...sponsors, { name: '', url: '' }]);
        }}
      >
        Add Sponsor
      </Button>
    </Stack>
  );
});