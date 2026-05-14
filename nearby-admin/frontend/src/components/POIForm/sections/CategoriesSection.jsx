import React from 'react';
import {
  Stack, Alert, Divider, Text, Title, Badge, Group
} from '@mantine/core';
import { MainCategorySelector } from '../../MainCategorySelector';
import { TreeCategorySelector } from '../../TreeCategorySelector';
import { IdealForSelector } from '../../IdealForSelector';
import { getLegacyFieldsForListingType as getFieldsForListingType } from '../../../utils/constants';
import { IDEAL_FOR_ATMOSPHERE, IDEAL_FOR_AGE_GROUP, IDEAL_FOR_SOCIAL_SETTINGS, IDEAL_FOR_LOCAL_SPECIAL, IDEAL_FOR_SPECIAL_NEEDS } from '../../../utils/constants';

const ALL_IDEAL_FOR_ITEMS = [
  ...IDEAL_FOR_ATMOSPHERE,
  ...IDEAL_FOR_AGE_GROUP,
  ...IDEAL_FOR_SOCIAL_SETTINGS,
  ...IDEAL_FOR_LOCAL_SPECIAL,
  ...IDEAL_FOR_SPECIAL_NEEDS,
];

function KeyIdealForChips({ form }) {
  const idealFor = form.values.ideal_for || {};
  const allSelected = [
    ...(idealFor.atmosphere || []),
    ...(idealFor.age_group || []),
    ...(idealFor.social_settings || []),
    ...(idealFor.local_special || []),
    ...(idealFor.special_needs || []),
  ].filter(v => ALL_IDEAL_FOR_ITEMS.includes(v));

  const keySelections = (form.values.ideal_for_key || []).filter(v => allSelected.includes(v));
  const atCap = keySelections.length >= 3;

  function toggleKey(val) {
    if (keySelections.includes(val)) {
      form.setFieldValue('ideal_for_key', keySelections.filter(v => v !== val));
    } else if (!atCap) {
      form.setFieldValue('ideal_for_key', [...keySelections, val]);
    }
  }

  if (allSelected.length === 0) return null;

  return (
    <Stack gap="xs">
      <Title order={6}>Key Ideal For — Feature on Listing Card</Title>
      <Text size="sm" c="dimmed">
        Select up to 3 from your Ideal For choices to feature prominently on the listing card. Only items you've already selected above appear here.
      </Text>
      <Group gap="xs" wrap="wrap">
        {allSelected.map(val => {
          const isKey = keySelections.includes(val);
          const disabled = atCap && !isKey;
          return (
            <Badge
              key={val}
              variant={isKey ? 'filled' : 'outline'}
              color={isKey ? 'blue' : 'gray'}
              style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1 }}
              onClick={() => !disabled && toggleKey(val)}
            >
              {val}
            </Badge>
          );
        })}
      </Group>
      <Text size="xs" c={atCap ? 'red' : 'dimmed'}>
        {keySelections.length} / 3 featured on listing card
      </Text>
    </Stack>
  );
}

export const CategoriesSection = React.memo(function CategoriesSection({
  form,
  isPaidListing,
  isFreeListing
}) {
  const isBusiness = form.values.poi_type === 'BUSINESS';
  const isPark = form.values.poi_type === 'PARK';
  const isTrail = form.values.poi_type === 'TRAIL';
  const showKeyIdealFor = !isPark && !isTrail;

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
        onCategoryName={(name) => form.setFieldValue('primary_display_category', name)}
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

      {/* Key Ideal For — chip-based, only for Business + Event (not Park/Trail) */}
      {showKeyIdealFor && (
        <>
          <Divider my="sm" />
          <KeyIdealForChips form={form} />
        </>
      )}
    </Stack>
  );
});
