import {
  Stack, SimpleGrid, TextInput, Divider, Text, Alert
} from '@mantine/core';
import { getControlledInputProps } from '../constants/helpers';

export function ContactSection({
  form,
  isEvent,
  isFreeListing
}) {
  return (
    <Stack>
      {/* Organizer Name moved here from Core Info for Events */}
      {isEvent && (
        <TextInput
          label="Organizer Name"
          placeholder="Name of event organizer"
          {...form.getInputProps('event.organizer_name')}
        />
      )}
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <TextInput
          label="Website"
          placeholder="https://example.com"
          {...getControlledInputProps(form, 'website_url')}
        />
        <TextInput
          label="Phone Number"
          placeholder="(555) 123-4567"
          {...getControlledInputProps(form, 'phone_number')}
        />
        <TextInput
          label="Email"
          placeholder="contact@example.com"
          {...getControlledInputProps(form, 'email')}
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
        <TextInput
          label="Instagram"
          placeholder="@username"
          {...getControlledInputProps(form, 'instagram_username')}
        />
        <TextInput
          label="Facebook"
          placeholder="pagename"
          {...getControlledInputProps(form, 'facebook_username')}
        />
        <TextInput
          label="X (Twitter)"
          placeholder="@username"
          {...getControlledInputProps(form, 'x_username')}
        />
        <TextInput
          label="TikTok"
          placeholder="@username"
          {...getControlledInputProps(form, 'tiktok_username')}
        />
        <TextInput
          label="LinkedIn"
          placeholder="company-name"
          {...getControlledInputProps(form, 'linkedin_username')}
        />
      </SimpleGrid>
    </Stack>
  );
}