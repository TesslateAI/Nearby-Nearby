import React from 'react';
import { Stack, Divider, Title, Text } from '@mantine/core';
import { THINGS_TO_DO } from '../../../utils/outdoorConstants';
import { IdealForSelector } from '../../IdealForSelector';
import { CheckboxGroupSection } from '../components/CheckboxGroupSection';

/**
 * Park Categories Section
 * Displays "Things to Do" as the main Park Categories section
 * Also includes Target Audience (Ideal For) for Parks
 */
export const ParkCategoriesSection = React.memo(function ParkCategoriesSection({ form }) {
  return (
    <Stack>
      {/* Park Categories - Things to Do */}
      <CheckboxGroupSection
        label="Park Categories - Things to Do"
        fieldName="things_to_do"
        options={THINGS_TO_DO}
        cols={{ base: 2, sm: 3 }}
        form={form}
      />

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
