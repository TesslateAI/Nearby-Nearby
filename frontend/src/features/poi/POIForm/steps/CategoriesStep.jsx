import { TextInput, Select, SimpleGrid, Stack, Divider } from '@mantine/core';
import { CategorySelector } from '../../../categories/CategorySelector';

function CategoriesStep({ form }) {
  const isBusiness = form.values.poi_type === 'BUSINESS';
  const isPark = form.values.poi_type === 'PARK';
  const isTrail = form.values.poi_type === 'TRAIL';
  const isEvent = form.values.poi_type === 'EVENT';

  return (
    <Stack mt="xl" p="md">
      <CategorySelector 
        value={form.values.category_ids} 
        onChange={(ids) => form.setFieldValue('category_ids', ids)} 
      />

      {isBusiness && (
        <>
          <Divider my="md" label="Business Details" />
          <SimpleGrid cols={2}>
            <Select 
              label="Listing Tier" 
              data={['free', 'paid', 'paid_founding', 'sponsor']} 
              {...form.getInputProps('business.listing_tier')} 
            />
            <Select 
              label="Price Range" 
              placeholder="Select price range" 
              data={['$', '$$', '$$$', '$$$$']} 
              {...form.getInputProps('business.price_range')} 
            />
          </SimpleGrid>
        </>
      )}

      {isPark && (
        <>
          <Divider my="md" label="Park Details" />
          <TextInput 
            label="Drone Usage Policy" 
            placeholder="e.g., Allowed with permit" 
            {...form.getInputProps('park.drone_usage_policy')} 
          />
        </>
      )}

      {isTrail && (
        <>
          <Divider my="md" label="Trail Details" />
          <SimpleGrid cols={3}>
            <TextInput 
              label="Length" 
              placeholder="e.g., 2.5 miles" 
              {...form.getInputProps('trail.length_text')} 
            />
            <Select 
              label="Difficulty" 
              placeholder="Select difficulty" 
              data={['easy', 'moderate', 'difficult', 'expert']} 
              {...form.getInputProps('trail.difficulty')} 
            />
            <Select 
              label="Route Type" 
              placeholder="Select route type" 
              data={['loop', 'out_and_back', 'point_to_point']} 
              {...form.getInputProps('trail.route_type')} 
            />
          </SimpleGrid>
        </>
      )}

      {isEvent && (
        <>
          <Divider my="md" label="Event Details" />
          <SimpleGrid cols={2}>
            <TextInput 
              withAsterisk 
              type="datetime-local" 
              label="Start Date/Time" 
              {...form.getInputProps('event.start_datetime')} 
            />
            <TextInput 
              type="datetime-local" 
              label="End Date/Time" 
              {...form.getInputProps('event.end_datetime')} 
            />
          </SimpleGrid>
          <TextInput 
            label="Cost" 
            placeholder="e.g., Free, $15, Donation suggested" 
            {...form.getInputProps('event.cost_text')} 
          />
        </>
      )}
    </Stack>
  );
}

export default CategoriesStep;