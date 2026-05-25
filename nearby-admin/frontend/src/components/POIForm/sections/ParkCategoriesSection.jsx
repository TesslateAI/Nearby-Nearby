import React from 'react';
import { Stack, Alert } from '@mantine/core';
import { MainCategorySelector } from '../../MainCategorySelector';
import { TreeCategorySelector } from '../../TreeCategorySelector';

/**
 * Park Categories Section
 * Uses standard category selection from backend.
 * Includes Primary Display Category.
 *
 * Issue #43: Ideal For is NOT rendered on Park layouts (visibility table).
 * The legacy <IdealForSelector /> stack was removed; the new unified
 * IdealForGrouped is also NOT rendered for Parks.
 */
export const ParkCategoriesSection = React.memo(function ParkCategoriesSection({ form }) {
  return (
    <Stack>
      {/* Step 1: Select ALL categories first - Using Tree Selector */}
      <TreeCategorySelector
        value={form.values.category_ids || []}
        onChange={(value) => form.setFieldValue('category_ids', value)}
        poiType={form.values.poi_type}
        error={form.errors.category_ids}
      />

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
    </Stack>
  );
});
