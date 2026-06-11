import React from 'react';
import {
  Stack, SimpleGrid, Select, Switch, Alert, Text, Divider
} from '@mantine/core';
import RichTextEditor from '../../RichTextEditor';
import { DebouncedTextInput } from '../../DebouncedTextInput';
import { getDebouncedInputProps } from '../constants/helpers';
import { getStatusOptions } from '../../../utils/constants'; // KEY_FACILITIES removed (Migration A #34)
import {
  FeaturedImageUpload,
  shouldUseImageUpload
} from '../ImageIntegration';
// CheckboxGroupSection import removed — no longer used after key_facilities removal (Migration A #34)

export const CoreInformationSection = React.memo(function CoreInformationSection({
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
        />
        <Select
          label="Listing Type"
          placeholder="Select Listing Type"
          data={[
            { value: 'free', label: 'Free' },
            { value: 'paid', label: 'Paid' },
            { value: 'sponsor_platform', label: 'Sponsor – Platform' },
            { value: 'sponsor_state', label: 'Sponsor – State' },
            { value: 'sponsor_county', label: 'Sponsor – County' },
            { value: 'sponsor_town', label: 'Sponsor – Town' },
            { value: 'community_comped', label: 'Community Comped' }
          ]}
          {...form.getInputProps('listing_type')}
        />
      </SimpleGrid>

      <DebouncedTextInput
        label="Name"
        placeholder="Enter POI name"
        {...getDebouncedInputProps(form, 'name')}
      />

      {!(isBusiness && isFreeListing) && (
        <RichTextEditor
          label="Teaser Paragraph"
          placeholder="Brief description (120 characters max)"
          value={form.values.teaser_paragraph || ''}
          onChange={(html) => form.setFieldValue('teaser_paragraph', html)}
          error={form.errors.teaser_paragraph}
          showCharCount={true}
          maxLength={120}
          minRows={2}
        />
      )}

      {isBusiness && form.values.listing_type === 'free' ? (
        <RichTextEditor
          label="Short Description"
          placeholder="Brief description"
          value={form.values.description_short || ''}
          onChange={(html) => form.setFieldValue('description_short', html)}
          error={form.errors.description_short}
          showCharCount={true}
          maxLength={250}
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

      {!isEvent && (
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Select
            label="Status"
            placeholder="Select status"
            data={getStatusOptions(form.values.poi_type)}
            {...form.getInputProps('status')}
          />
          <DebouncedTextInput
            label="Status Message"
            placeholder="Additional status info (max 100 chars)"
            maxLength={100}
            {...getDebouncedInputProps(form, 'status_message')}
          />
        </SimpleGrid>
      )}

      {/* Business Free (#74) + Business Paid (#75) + Park (#76) + Trail (#77) +
          Event (#73): these toggles move OUT of Identity — is_verified /
          is_disaster_hub → Admin-Only; lat_long_most_accurate → Address. Other
          POI types keep them here. */}
      {!((isBusiness && (isFreeListing || isPaidListing)) || isPark || isTrail || isEvent) && (
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <Switch
            label="Verified"
            {...form.getInputProps('is_verified', { type: 'checkbox' })}
          />
          <Switch
            label="Disaster Hub"
            {...form.getInputProps('is_disaster_hub', { type: 'checkbox' })}
          />
          <Switch
            label="Lat/Long Most Accurate"
            description="Map coordinates are the most reliable location"
            {...form.getInputProps('lat_long_most_accurate', { type: 'checkbox' })}
          />
          {isBusiness && (
            <Switch
              label="Don't Display Location"
              {...form.getInputProps('dont_display_location', { type: 'checkbox' })}
            />
          )}
        </SimpleGrid>
      )}

      {/* key_facilities removed — renamed _deprecated_key_facilities (Migration A #34) */}

      {/* #73 Event reorg: the Event Details block (Date Instructions banner +
          Start/End Date & Time) moved OUT of Event Identity into the Event
          Details accordion (Acc 3), rendered directly in EventLayout. The dead
          "Create Repeating Event" button was removed entirely — the working
          mechanism is RecurringEventSection in Acc 3. */}

      {/* Event cost moved to EventCostSection (Task 139) */}

      {/* #75 Business Paid + #76 Park + #77 Trail + #73 Event move the History
          paragraph OUT of Identity into the dedicated "Locally Found + History"
          accordion, so it must NOT render here for those types. */}
      {(isPaidListing && !isBusiness && !isPark && !isTrail && !isEvent) && (
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

      {/* Business Free (#74) + Business Paid (#75) + Park (#76) + Trail (#77) +
          Event (#73): the Featured / Main Image upload moves to the dedicated
          Images accordion (rendered there via <FeaturedImageUpload>). For every
          other POI type the Featured Image stays inline in Core Information. */}
      {!((isBusiness && (isFreeListing || isPaidListing)) || isPark || isTrail || isEvent) && (
        shouldUseImageUpload(id) ? (
          <FeaturedImageUpload
            key={`featured-image-${id}`}
            poiId={id}
            isBusiness={isBusiness}
            isFreeListing={isFreeListing}
            form={form}
          />
        ) : (
          <Alert color="blue" variant="light" key={`featured-placeholder-${id || 'new'}`}>
            <Text size="sm">
              Featured Image upload will be available shortly...
            </Text>
          </Alert>
        )
      )}
    </Stack>
  );
});