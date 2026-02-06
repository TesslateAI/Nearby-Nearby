import React from 'react';
import {
  Stack, Alert, Divider, Text, Title, SimpleGrid, Checkbox
} from '@mantine/core';
import { MainCategorySelector } from '../../MainCategorySelector';
import { TreeCategorySelector } from '../../TreeCategorySelector';
import { IdealForSelector } from '../../IdealForSelector';
import { PrimaryTypeSelector } from '../../PrimaryTypeSelector';
import { getFieldsForListingType, IDEAL_FOR_KEY_OPTIONS } from '../../../utils/constants';

export const CategoriesSection = React.memo(function CategoriesSection({
  form,
  isPaidListing,
  isFreeListing
}) {
  const isBusiness = form.values.poi_type === 'BUSINESS';

  return (
    <Stack>
      {isBusiness && isFreeListing && (
        <Alert color="blue" variant="light" mb="md">
          Free business listings are limited to 1 category and up to 5 ideal-for options
        </Alert>
      )}

      {/* Step 1: Select ALL categories first - Using Tree Selector */}
      <TreeCategorySelector
        value={form.values.category_ids || []}
        onChange={(value) => {
          if (isBusiness && isFreeListing && value.length > 1) return;
          form.setFieldValue('category_ids', value);
        }}
        poiType={form.values.poi_type}
        error={form.errors.category_ids}
      />

      {getFieldsForListingType(form.values.listing_type, form.values.poi_type)?.maxCategories && (
        <Text size="xs" c="dimmed">
          Maximum {getFieldsForListingType(form.values.listing_type, form.values.poi_type).maxCategories} categories allowed for this listing type
        </Text>
      )}

      {/* Step 2: Choose which category is the PRIMARY DISPLAY CATEGORY */}
      <MainCategorySelector
        value={form.values.main_category_id}
        onChange={(value) => form.setFieldValue('main_category_id', value)}
        poiType={form.values.poi_type}
        selectedCategories={form.values.category_ids || []}
        error={form.errors.main_category_id}
      />

      {form.values.main_category_id && (
        <Alert color="blue" variant="light">
          This category will be displayed on POI cards for quick identification
        </Alert>
      )}

      {/* Ideal For */}
      <Divider my="md" label="Target Audience" />

      {/* Key Ideal For - For Business listings (both free and paid) */}
      {isBusiness && (
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
          {isFreeListing && ' (up to 5 total)'}
        </Text>
        <IdealForSelector
          value={form.values.ideal_for || []}
          onChange={(value) => form.setFieldValue('ideal_for', value)}
          keyIdealFor={form.values.ideal_for_key || []}
          maxSelections={isFreeListing ? 5 : undefined}
          showAll={true}
        />
      </Stack>
    </Stack>
  );
});