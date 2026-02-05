import React from 'react';
import {
  Stack, SimpleGrid, Divider, Text, Alert
} from '@mantine/core';
import { DebouncedTextInput } from '../../DebouncedTextInput';
import { getDebouncedInputProps } from '../constants/helpers';

export const ContactSection = React.memo(function ContactSection({
  form,
  isEvent,
  isFreeListing
}) {
  return (
    <Stack>
      {/* Organizer Name moved here from Core Info for Events */}
      {isEvent && (
        <DebouncedTextInput
          label="Organizer Name"
          placeholder="Name of event organizer"
          {...getDebouncedInputProps(form, 'event.organizer_name')}
        />
      )}
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <DebouncedTextInput
          label="Website"
          placeholder="https://example.com"
          {...getDebouncedInputProps(form, 'website_url')}
        />
        <DebouncedTextInput
          label="Phone Number"
          placeholder="(555) 123-4567"
          {...getDebouncedInputProps(form, 'phone_number')}
        />
        <DebouncedTextInput
          label="Email"
          placeholder="contact@example.com"
          {...getDebouncedInputProps(form, 'email')}
        />
      </SimpleGrid>

      <Divider my="md" label="Social Media Usernames" />
      <Text size="sm" c="dimmed">Enter just the username (not the full URL)</Text>
      {isFreeListing && (
        <Alert color="blue" variant="light" mt="xs">
          For free accounts, these links are for internal use only and will not be displayed publicly. This helps us tag the correct business on social media.
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        <DebouncedTextInput
          label="Instagram"
          placeholder="@username"
          {...getDebouncedInputProps(form, 'instagram_username')}
        />
        <DebouncedTextInput
          label="Facebook"
          placeholder="pagename"
          {...getDebouncedInputProps(form, 'facebook_username')}
        />
        <DebouncedTextInput
          label="X (Twitter)"
          placeholder="@username"
          {...getDebouncedInputProps(form, 'x_username')}
        />
        <DebouncedTextInput
          label="TikTok"
          placeholder="@username"
          {...getDebouncedInputProps(form, 'tiktok_username')}
        />
        <DebouncedTextInput
          label="LinkedIn"
          placeholder="company-name"
          {...getDebouncedInputProps(form, 'linkedin_username')}
        />
      </SimpleGrid>
    </Stack>
  );
});