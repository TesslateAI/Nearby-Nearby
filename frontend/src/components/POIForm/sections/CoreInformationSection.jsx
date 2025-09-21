import {
  Stack, SimpleGrid, Select, TextInput, Switch, Alert, Text, Button, Divider
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { IconPlus } from '@tabler/icons-react';
import RichTextEditor from '../../RichTextEditor';
import { getControlledInputProps } from '../constants/helpers';
import { getStatusOptions } from '../../../utils/constants';
import {
  FeaturedImageUpload,
  shouldUseImageUpload
} from '../ImageIntegration';

export function CoreInformationSection({
  form,
  isBusiness,
  isPark,
  isTrail,
  isEvent,
  isPaidListing,
  isFreeListing,
  id
}) {
  return (
    <Stack>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Select
          label="POI Type"
          placeholder="Select POI Type"
          data={[
            { value: 'BUSINESS', label: 'Business' },
            { value: 'PARK', label: 'Park' },
            { value: 'TRAIL', label: 'Trail' },
            { value: 'EVENT', label: 'Event' }
          ]}
          {...form.getInputProps('poi_type')}
          withAsterisk
        />
        <Select
          label="Listing Type"
          placeholder="Select Listing Type"
          data={[
            { value: 'free', label: 'Free' },
            { value: 'paid', label: 'Paid' },
            { value: 'paid_founding', label: 'Paid Founding' },
            { value: 'sponsor', label: 'Sponsor' },
            { value: 'community_comped', label: 'Community Comped' }
          ]}
          {...form.getInputProps('listing_type')}
        />
      </SimpleGrid>

      <TextInput
        label="Name"
        placeholder="Enter POI name"
        {...getControlledInputProps(form, 'name')}
        withAsterisk
      />

      <RichTextEditor
        label="Teaser Paragraph"
        placeholder="Brief 120 character description"
        maxLength={120}
        value={form.values.teaser_paragraph || ''}
        onChange={(html) => form.setFieldValue('teaser_paragraph', html)}
        error={form.errors.teaser_paragraph}
        minRows={2}
      />

      {isBusiness && form.values.listing_type === 'free' ? (
        <RichTextEditor
          label="Short Description"
          placeholder="Brief description (max 250 characters)"
          maxLength={250}
          value={form.values.description_short || ''}
          onChange={(html) => form.setFieldValue('description_short', html)}
          error={form.errors.description_short}
          minRows={3}
        />
      ) : (
        <RichTextEditor
          label="Long Description"
          placeholder="Detailed description"
          value={form.values.description_long || ''}
          onChange={(html) => form.setFieldValue('description_long', html)}
          error={form.errors.description_long}
          minRows={4}
        />
      )}

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Select
          label="Status"
          placeholder="Select status"
          data={getStatusOptions(form.values.poi_type)}
          {...form.getInputProps('status')}
        />
        <TextInput
          label="Status Message"
          placeholder="Additional status info (max 100 chars)"
          maxLength={100}
          {...getControlledInputProps(form, 'status_message')}
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Switch
          label="Verified"
          {...form.getInputProps('is_verified', { type: 'checkbox' })}
        />
        <Switch
          label="Disaster Hub"
          {...form.getInputProps('is_disaster_hub', { type: 'checkbox' })}
        />
        {isBusiness && (
          <Switch
            label="Don't Display Location"
            {...form.getInputProps('dont_display_location', { type: 'checkbox' })}
          />
        )}
      </SimpleGrid>

      {isEvent && (
        <>
          <Divider my="md" label="Event Details" />
          <Alert color="blue" variant="light" mb="md">
            <Text size="sm">
              <strong>Date Instructions:</strong>
              <br />• If your event takes place on multiple separate days, please create a Repeat Event and enter each day individually.
              <br />• If your event runs past midnight (for example, December 31st at 10:00 AM until January 1st at 3:00 AM), enter it as one single event since it's continuous.
            </Text>
          </Alert>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <DateTimePicker
              label="Start Date & Time"
              placeholder="Select start date and time"
              {...form.getInputProps('event.start_datetime')}
              withAsterisk
            />
            <DateTimePicker
              label="End Date & Time"
              placeholder="Select end date and time"
              {...form.getInputProps('event.end_datetime')}
            />
          </SimpleGrid>
          <Button
            variant="outline"
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              alert('Recurring events functionality will be implemented in a future update');
            }}
          >
            Create Repeating Event
          </Button>
        </>
      )}

      {isEvent && (
        <>
          <Divider my="md" label="Cost Information" />
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput
              label="Cost"
              placeholder="e.g., $10 or $0-$50 or 0 (for free)"
              {...getControlledInputProps(form, 'cost')}
            />
            <TextInput
              label="Ticket Link"
              placeholder="URL to purchase tickets"
              {...getControlledInputProps(form, 'ticket_link')}
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
        </>
      )}

      {(isPaidListing || isPark || isTrail) && (
        <>
          <Divider my="md" label="History" />
          <RichTextEditor
            label="History Paragraph"
            placeholder="Brief history or background"
            value={form.values.history_paragraph || ''}
            onChange={(html) => form.setFieldValue('history_paragraph', html)}
            error={form.errors.history_paragraph}
            minRows={3}
          />
        </>
      )}

      {shouldUseImageUpload(id) ? (
        <FeaturedImageUpload
          poiId={id}
          isBusiness={isBusiness}
          isFreeListing={isFreeListing}
          form={form}
        />
      ) : (
        <TextInput
          label={isBusiness && isFreeListing ? "Logo" : "Featured Image"}
          placeholder={isBusiness && isFreeListing ? "URL to business logo" : "URL to featured image"}
          {...form.getInputProps('featured_image')}
          description="Save the POI first to enable image upload"
        />
      )}
    </Stack>
  );
}