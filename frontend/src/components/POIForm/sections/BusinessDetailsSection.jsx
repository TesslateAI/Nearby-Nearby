import React from 'react';
import {
  Stack, SimpleGrid, Select, TextInput, Divider, Checkbox, Group, ActionIcon, Button
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import {
  PRICE_RANGE_OPTIONS, GIFT_CARD_OPTIONS, DISCOUNT_TYPES,
  YOUTH_AMENITIES, BUSINESS_AMENITIES, ENTERTAINMENT_OPTIONS
} from '../../../utils/constants';
import { getCheckboxGroupProps } from '../constants/helpers';
import { addLink, removeLink, updateLink } from '../../../utils/fieldHelpers';
import {
  MenuPhotosUpload,
  GalleryPhotosUpload,
  EntryPhotoUpload,
  shouldUseImageUpload
} from '../ImageIntegration';
import RichTextEditor from '../../RichTextEditor';

export const BusinessDetailsSection = React.memo(function BusinessDetailsSection({
  form,
  isFreeListing,
  id
}) {
  return (
    <Stack>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <Select
          label="Price Range per Person"
          placeholder="Select price range"
          data={PRICE_RANGE_OPTIONS}
          {...form.getInputProps('price_range_per_person')}
        />
        {!isFreeListing && (
          <Select
            label="Gift Cards Available?"
            data={GIFT_CARD_OPTIONS}
            {...form.getInputProps('gift_cards')}
          />
        )}
      </SimpleGrid>

      <TextInput
        label="General Pricing"
        placeholder="e.g., Average meal $15-25"
        {...form.getInputProps('pricing')}
      />

      {!isFreeListing && (
        <>
          <Divider my="md" label="Discounts Offered" />
          <Checkbox.Group {...getCheckboxGroupProps(form, 'discounts')}>
            <SimpleGrid cols={{ base: 2, sm: 3 }}>
              {DISCOUNT_TYPES.map(discount => (
                <Checkbox key={discount} value={discount} label={discount} />
              ))}
            </SimpleGrid>
          </Checkbox.Group>

          <Divider my="md" label="Youth Amenities" />
          <Checkbox.Group {...getCheckboxGroupProps(form, 'youth_amenities')}>
            <SimpleGrid cols={{ base: 2, sm: 3 }}>
              {YOUTH_AMENITIES.map(amenity => (
                <Checkbox key={amenity} value={amenity} label={amenity} />
              ))}
            </SimpleGrid>
          </Checkbox.Group>

          <Divider my="md" label="Business Amenities" />
          <Checkbox.Group {...getCheckboxGroupProps(form, 'business_amenities')}>
            <SimpleGrid cols={{ base: 2, sm: 3 }}>
              {BUSINESS_AMENITIES.map(amenity => (
                <Checkbox key={amenity} value={amenity} label={amenity} />
              ))}
            </SimpleGrid>
          </Checkbox.Group>

          <Divider my="md" label="Entertainment Options" />
          <Checkbox.Group {...getCheckboxGroupProps(form, 'entertainment_options')}>
            <SimpleGrid cols={{ base: 2, sm: 3 }}>
              {ENTERTAINMENT_OPTIONS.map(option => (
                <Checkbox key={option} value={option} label={option} />
              ))}
            </SimpleGrid>
          </Checkbox.Group>
        </>
      )}
    </Stack>
  );
});

export const MenuBookingSection = React.memo(function MenuBookingSection({
  form,
  id
}) {
  return (
    <Stack>
      <TextInput
        label="Menu Link"
        placeholder="https://example.com/menu"
        {...form.getInputProps('menu_link')}
      />

      <Divider my="md" label="Menu Photos" />
      {shouldUseImageUpload(id) ? (
        <MenuPhotosUpload poiId={id} form={form} />
      ) : (
        <TextInput
          label="Menu Photos"
          placeholder="URLs to menu photos (comma-separated)"
          {...form.getInputProps('menu_photos')}
          description="Image upload will be available shortly..."
        />
      )}

      <Divider my="md" label="Delivery Services" />
      {(form.values.delivery_links || []).map((link, index) => (
        <Group key={index}>
          <TextInput
            style={{ flex: 1 }}
            placeholder="Delivery service URL"
            value={link}
            onChange={(e) => updateLink(form, 'delivery_links', index, e.target.value)}
          />
          <ActionIcon color="red" onClick={() => removeLink(form, 'delivery_links', index)}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      ))}
      <Button
        variant="light"
        leftSection={<IconPlus size={16} />}
        onClick={() => addLink(form, 'delivery_links', '')}
      >
        Add Delivery Link
      </Button>

      <Divider my="md" label="Reservation Systems" />
      {(form.values.reservation_links || []).map((link, index) => (
        <Group key={index}>
          <TextInput
            style={{ flex: 1 }}
            placeholder="Reservation system URL"
            value={link}
            onChange={(e) => updateLink(form, 'reservation_links', index, e.target.value)}
          />
          <ActionIcon color="red" onClick={() => removeLink(form, 'reservation_links', index)}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      ))}
      <Button
        variant="light"
        leftSection={<IconPlus size={16} />}
        onClick={() => addLink(form, 'reservation_links', '')}
      >
        Add Reservation Link
      </Button>

      <Divider my="md" label="Online Ordering" />
      {(form.values.online_ordering_links || []).map((link, index) => (
        <Group key={index}>
          <TextInput
            style={{ flex: 1 }}
            placeholder="Online ordering URL"
            value={link}
            onChange={(e) => updateLink(form, 'online_ordering_links', index, e.target.value)}
          />
          <ActionIcon color="red" onClick={() => removeLink(form, 'online_ordering_links', index)}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      ))}
      <Button
        variant="light"
        leftSection={<IconPlus size={16} />}
        onClick={() => addLink(form, 'online_ordering_links', '')}
      >
        Add Ordering Link
      </Button>

      <Divider my="md" label="Appointment Scheduling" />
      {(form.values.appointment_links || []).map((link, index) => (
        <Group key={index}>
          <TextInput
            style={{ flex: 1 }}
            placeholder="Appointment scheduling URL"
            value={link}
            onChange={(e) => updateLink(form, 'appointment_links', index, e.target.value)}
          />
          <ActionIcon color="red" onClick={() => removeLink(form, 'appointment_links', index)}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      ))}
      <Button
        variant="light"
        leftSection={<IconPlus size={16} />}
        onClick={() => addLink(form, 'appointment_links', '')}
      >
        Add Appointment Link
      </Button>
    </Stack>
  );
});

export const BusinessGallerySection = React.memo(function BusinessGallerySection({
  form,
  id
}) {
  return (
    <Stack>
      {shouldUseImageUpload(id) ? (
        <GalleryPhotosUpload poiId={id} form={form} />
      ) : (
        <TextInput
          label="Gallery Photos"
          placeholder="URLs to extra photos (comma-separated)"
          {...form.getInputProps('gallery_photos')}
          description="Image upload will be available shortly..."
        />
      )}
    </Stack>
  );
});

export const BusinessEntrySection = React.memo(function BusinessEntrySection({
  form,
  id
}) {
  return (
    <Stack>
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
        <TextInput
          label="Entry Photo"
          placeholder="URL to photo of business entrance"
          {...form.getInputProps('business_entry_photo')}
          description="Image upload will be available shortly..."
        />
      )}
    </Stack>
  );
});