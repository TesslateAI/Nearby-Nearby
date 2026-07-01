import React from 'react';
import {
  Stack, Alert, Text
} from '@mantine/core';
import { MainCategorySelector } from '../../MainCategorySelector';
import { TreeCategorySelector } from '../../TreeCategorySelector';
import { PrimaryTypeSelector } from '../../PrimaryTypeSelector';
import { getLegacyFieldsForListingType as getFieldsForListingType } from '../../../utils/constants';

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

      {/* Featured Ideal For (the "Key Ideal For" top-3 picker) now renders in
          each layout AFTER IdealForGrouped — see FeaturedIdealForChips in
          _shared.jsx. It is intentionally NOT here, and NOT on Park/Trail. */}
    </Stack>
  );
});
