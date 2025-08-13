import { TextInput, Stack, Divider } from '@mantine/core';
import DynamicAttributeForm from '../../../../components/forms/DynamicAttributeForm';

function AttributesStep({ form }) {
  return (
    <Stack mt="xl" p="md">
      <Divider my="md" label="Dynamic Attributes" />
      <DynamicAttributeForm
        poiType={form.values.poi_type}
        value={form.values.amenities}
        onChange={(value) => form.setFieldValue('amenities', value)}
      />

      <Divider my="md" label="Photos" />
      <TextInput label="Featured Image URL" {...form.getInputProps('photos.featured')} />
    </Stack>
  );
}

export default AttributesStep;