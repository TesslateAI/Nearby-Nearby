import React from 'react';
import { Stack, Checkbox, SimpleGrid, Divider } from '@mantine/core';
import { getCheckboxGroupProps } from '../constants/helpers';
import { THINGS_TO_DO } from '../../../utils/outdoorConstants';

/**
 * Park Categories Section
 * Displays "Things to Do" as the main Park Categories section
 * This was previously part of OutdoorFeaturesSection but has been promoted
 * to be a primary categorization for Parks
 */
export const ParkCategoriesSection = React.memo(function ParkCategoriesSection({ form }) {
  return (
    <Stack>
      <Divider my="md" label="Park Categories - Things to Do" />
      <Checkbox.Group {...getCheckboxGroupProps(form, 'things_to_do')}>
        <SimpleGrid cols={{ base: 2, sm: 3 }}>
          {THINGS_TO_DO.map(activity => (
            <Checkbox key={activity} value={activity} label={activity} />
          ))}
        </SimpleGrid>
      </Checkbox.Group>
    </Stack>
  );
});
