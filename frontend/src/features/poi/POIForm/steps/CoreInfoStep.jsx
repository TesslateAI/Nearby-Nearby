import { TextInput, Select, Textarea, SimpleGrid, Switch, Stack } from '@mantine/core';
import { POI_STATUSES } from '../constants';

function CoreInfoStep({ form }) {
  const isBusiness = form.values.poi_type === 'BUSINESS';
  const isPaidListing = isBusiness && ['paid', 'paid_founding', 'sponsor'].includes(form.values.business?.listing_tier);

  return (
    <Stack mt="xl" p="md">
      <SimpleGrid cols={2}>
        <TextInput withAsterisk label="POI Name/Title" {...form.getInputProps('name')} />
        <Select withAsterisk label="POI Type" data={['BUSINESS', 'PARK', 'TRAIL', 'EVENT']} {...form.getInputProps('poi_type')} />
      </SimpleGrid>
      <Textarea 
        label="Full Description" 
        {...form.getInputProps('description_long')} 
        minRows={4} 
        maxLength={isBusiness && !isPaidListing ? 200 : undefined} 
        description={isBusiness && !isPaidListing ? '200 character limit for free listings' : 'Unlimited characters'} 
      />
      <Textarea 
        label="Short Description" 
        placeholder="A brief summary" 
        {...form.getInputProps('description_short')} 
        minRows={2} 
        maxLength={250} 
        description="250 character summary." 
      />
      <SimpleGrid cols={2}>
        <Select label="Status" data={POI_STATUSES} {...form.getInputProps('status')} />
        <TextInput label="Status Message" placeholder="e.g., Closed for private event" maxLength={100} {...form.getInputProps('status_message')} />
      </SimpleGrid>
      <SimpleGrid cols={2}>
        <Switch label="This listing is verified by Nearby Nearby" {...form.getInputProps('is_verified', { type: 'checkbox' })} />
        <Switch label="This is a disaster hub" {...form.getInputProps('is_disaster_hub', { type: 'checkbox' })} />
      </SimpleGrid>
    </Stack>
  );
}

export default CoreInfoStep;