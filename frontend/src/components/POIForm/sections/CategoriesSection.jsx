import {
  Stack, Alert, Divider, Text, Title, SimpleGrid, Checkbox
} from '@mantine/core';
import { MainCategorySelector } from '../../MainCategorySelector';
import { SecondaryCategoriesSelector } from '../../SecondaryCategoriesSelector';
import { IdealForSelector } from '../../IdealForSelector';
import { getFieldsForListingType, IDEAL_FOR_KEY_OPTIONS } from '../../../utils/constants';

export function CategoriesSection({
  form,
  isPaidListing,
  isFreeListing
}) {
  return (
    <Stack>
      {form.values.poi_type === 'BUSINESS' && form.values.listing_type === 'free' && (
        <Alert color="blue" variant="light" mb="md">
          Free business listings are limited to 1 category and 3 ideal-for options
        </Alert>
      )}

      <MainCategorySelector
        value={form.values.main_category_id}
        onChange={(value) => form.setFieldValue('main_category_id', value)}
        poiType={form.values.poi_type}
        error={form.errors.main_category_id}
      />

      {/* Only show secondary categories for non-Business POIs */}
      {form.values.poi_type !== 'BUSINESS' && (
        <SecondaryCategoriesSelector
          value={form.values.category_ids || []}
          onChange={(value) => form.setFieldValue('category_ids', value)}
          poiType={form.values.poi_type}
          mainCategoryId={form.values.main_category_id}
          maxValues={getFieldsForListingType(form.values.listing_type, form.values.poi_type)?.maxCategories}
          error={form.errors.category_ids}
        />
      )}

      {/* Ideal For */}
      <Divider my="md" label="Target Audience" />

      {/* Key Ideal For - Only for paid listings */}
      {isPaidListing && (
        <Stack mb="md">
          <Title order={5}>Key Ideal For</Title>
          <Text size="sm" c="dimmed">
            Select up to 3 primary audiences (these will be prominently displayed)
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            {IDEAL_FOR_KEY_OPTIONS.map((option) => (
              <Checkbox
                key={option}
                label={option}
                checked={(form.values.ideal_for_key || []).includes(option)}
                onChange={(event) => {
                  const checked = event.currentTarget.checked;
                  if (checked && (form.values.ideal_for_key?.length || 0) < 3) {
                    form.setFieldValue('ideal_for_key', [...(form.values.ideal_for_key || []), option]);
                  } else if (!checked) {
                    form.setFieldValue('ideal_for_key', (form.values.ideal_for_key || []).filter(v => v !== option));
                  }
                }}
                disabled={
                  form.values.ideal_for_key?.length >= 3 &&
                  !(form.values.ideal_for_key || []).includes(option)
                }
              />
            ))}
          </SimpleGrid>
          <Text size="xs" c="dimmed">
            {form.values.ideal_for_key?.length || 0} / 3 selected
          </Text>
        </Stack>
      )}

      {/* Full Ideal For */}
      <Stack>
        <Title order={5}>Ideal For</Title>
        <Text size="sm" c="dimmed">
          Select all audiences that would enjoy this {form.values.poi_type?.toLowerCase() || 'POI'}
        </Text>
        <IdealForSelector
          value={form.values.ideal_for || []}
          onChange={(value) => form.setFieldValue('ideal_for', value)}
          keyIdealFor={form.values.ideal_for_key || []}
          maxSelections={isFreeListing ? 5 : undefined}
          showAll={!isFreeListing}
        />
        {isFreeListing && (
          <Text size="xs" c="dimmed" mt="xs">
            Free listings can select up to 5 ideal audiences
          </Text>
        )}
      </Stack>
    </Stack>
  );
}