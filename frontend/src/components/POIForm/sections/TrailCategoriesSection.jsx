import React from 'react';
import { Stack, Divider, Title, Text } from '@mantine/core';
import { IdealForSelector } from '../../IdealForSelector';

/**
 * Trail Categories Section
 * Uses standard category selection
 * Includes Target Audience (Ideal For) for Trails
 */
export const TrailCategoriesSection = React.memo(function TrailCategoriesSection({ form }) {
  return (
    <Stack>
      {/* Target Audience - Ideal For */}
      <Divider my="md" label="Target Audience" />
      <Stack>
        <Title order={5}>Ideal For</Title>
        <Text size="sm" c="dimmed">
          Select all audiences that would enjoy this trail
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

export default TrailCategoriesSection;
