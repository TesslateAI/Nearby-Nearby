import React from 'react';
import { Stack, Divider, Title, Text, Alert } from '@mantine/core';
import { MainCategorySelector } from '../../MainCategorySelector';
import { TreeCategorySelector } from '../../TreeCategorySelector';
import { IdealForSelector } from '../../IdealForSelector';

/**
 * Park Categories Section
 * Uses standard category selection from backend
 * Includes Primary Display Category and Target Audience (Ideal For)
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

      {/* Target Audience - Ideal For */}
      <Divider my="md" label="Target Audience" />
      <Stack>
        <Title order={5}>Ideal For</Title>
        <Text size="sm" c="dimmed">
          Select all audiences that would enjoy this park
        </Text>
        <IdealForSelector
          value={form.values.ideal_for || []}
          onChange={(value) => form.setFieldValue('ideal_for', value)}
          keyIdealFor={form.values.ideal_for_key || []}
          showAll={true}
        />
      </Stack>
    </Stack>
  );
});
