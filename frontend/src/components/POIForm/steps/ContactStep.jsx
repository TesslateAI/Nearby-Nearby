import { TextInput, SimpleGrid, Stack } from '@mantine/core';

function ContactStep({ form }) {
  return (
    <Stack mt="xl" p="md">
      <SimpleGrid cols={2}>
        <TextInput label="Website URL" {...form.getInputProps('website_url')} />
        <TextInput label="Phone Number" {...form.getInputProps('phone_number')} />
      </SimpleGrid>
      <TextInput label="Email" type="email" {...form.getInputProps('email')} />
    </Stack>
  );
}

export default ContactStep;