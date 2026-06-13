import React from 'react';
import {
  Card, Stack, Group, Text, SegmentedControl, Divider
} from '@mantine/core';
import {
  VENUE_INHERITANCE_SECTIONS,
  VENUE_INHERITANCE_MODES,
} from '../../../utils/constants';

/**
 * VenueInheritanceControls
 *
 * Renders per-section inheritance controls when an event is linked to a venue.
 * Each of the 7 sections (address, parking, accessibility, restrooms, contact,
 * hours, amenities) gets a SegmentedControl with three modes:
 *   - as_is      → show venue data read-only, no event overrides
 *   - use_and_add → show venue data read-only + allow event-specific additions
 *   - do_not_use → hide venue data, show only the event's own fields
 *
 * Returns null when no venue is selected (venue_poi_id is falsy).
 */
const VenueInheritanceControls = React.memo(function VenueInheritanceControls({ form }) {
  const venuePoiId = form.values.event?.venue_poi_id;

  if (!venuePoiId) {
    return null;
  }

  const currentInheritance = form.values.event?.venue_inheritance || {};

  function handleModeChange(sectionKey, newMode) {
    form.setFieldValue('event.venue_inheritance', {
      ...currentInheritance,
      [sectionKey]: newMode,
    });
  }

  return (
    <Card withBorder p="md" mt="md">
      <Text fw={600} size="sm" mb="md">
        Venue Data Inheritance
      </Text>
      <Text size="xs" c="dimmed" mb="md">
        For each section, choose how venue information is used for this event.
      </Text>
      <Stack gap="sm">
        {VENUE_INHERITANCE_SECTIONS.map((section, index) => (
          <React.Fragment key={section.value}>
            {index > 0 && <Divider />}
            <Group justify="space-between" align="center" wrap="wrap" gap="xs">
              <Text size="sm" fw={500} style={{ minWidth: 140 }}>
                {section.label}
              </Text>
              <SegmentedControl
                size="xs"
                data={VENUE_INHERITANCE_MODES}
                value={currentInheritance[section.value] || 'as_is'}
                onChange={(value) => handleModeChange(section.value, value)}
              />
            </Group>
          </React.Fragment>
        ))}
      </Stack>
    </Card>
  );
});

export default VenueInheritanceControls;
