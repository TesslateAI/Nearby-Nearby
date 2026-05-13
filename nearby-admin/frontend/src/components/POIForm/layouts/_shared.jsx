// Shared helpers used by all 5 Phase 1 layouts.
import React, { useEffect, useState } from 'react';
import {
  Accordion, Stack, Group, Switch, Select, Textarea, Badge, Text,
  Checkbox, Title, SimpleGrid, MultiSelect, TextInput, NumberInput,
  Button, ActionIcon, Divider
} from '@mantine/core';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import {
  SPONSOR_LEVEL_OPTIONS, LISTING_TYPES,
  IDEAL_FOR_ATMOSPHERE, IDEAL_FOR_AGE_GROUP, IDEAL_FOR_SOCIAL_SETTINGS, IDEAL_FOR_LOCAL_SPECIAL,
  PARKING_OPTIONS, PARKING_ADA_CHECKLIST, ARRIVAL_METHOD_OPTIONS,
  RESTROOM_ADA_CHECKLIST, PUBLIC_TOILET_OPTIONS,
  AMENITIES_GENERAL, AMENITIES_FAMILY_YOUTH, AMENITIES_WATER_BOATING, AMENITIES_DINING_SEATING,
  ALCOHOL_AVAILABLE_OPTIONS, WIFI_OPTIONS, CELL_SERVICE_OPTIONS,
  PET_OPTIONS, PAYMENT_METHODS, DISCOUNT_TYPES,
} from '../../../utils/constants';

// -----------------------------------------------------------------------------
// Admin-Only Section — last item in every layout. Renders only for admin role.
// -----------------------------------------------------------------------------
export function AdminOnlyAccordionItem({ form, userRole }) {
  if (userRole !== 'admin') return null;
  return (
    <Accordion.Item value="admin-only">
      <Accordion.Control>
        <Group>
          <Text fw={600}>Admin Only</Text>
          <Badge size="sm" variant="filled" color="red">Admin</Badge>
        </Group>
      </Accordion.Control>
      <Accordion.Panel>
        <Stack>
          <Switch
            label="Verified"
            description="POI has been reviewed and verified by an admin"
            checked={!!form.values.is_verified}
            onChange={(e) => form.setFieldValue('is_verified', e.currentTarget.checked)}
          />
          <Switch
            label="Disaster Hub"
            description="Designated shelter / supply / information hub during emergencies"
            checked={!!form.values.is_disaster_hub}
            onChange={(e) => form.setFieldValue('is_disaster_hub', e.currentTarget.checked)}
          />
          <Switch
            label="Sponsor"
            description="Toggle to mark this POI as a paid sponsor"
            checked={!!form.values.is_sponsor}
            onChange={(e) => {
              const v = e.currentTarget.checked;
              form.setFieldValue('is_sponsor', v);
              if (v) form.setFieldValue('listing_type', 'paid');
              else form.setFieldValue('sponsor_level', null);
            }}
          />
          {form.values.is_sponsor && (
            <Select
              label="Sponsor Level"
              data={SPONSOR_LEVEL_OPTIONS}
              value={form.values.sponsor_level}
              onChange={(v) => form.setFieldValue('sponsor_level', v)}
              clearable
            />
          )}
          <Select
            label="Listing Type"
            data={LISTING_TYPES}
            value={form.values.listing_type}
            onChange={(v) => form.setFieldValue('listing_type', v)}
          />
          <Textarea
            label="Admin Notes"
            description="Internal notes — not shown publicly"
            minRows={3}
            autosize
            {...form.getInputProps('admin_notes')}
          />
          <Group>
            <Text size="sm" c="dimmed">Has Been Published:</Text>
            <Badge color={form.values.has_been_published ? 'green' : 'gray'}>
              {form.values.has_been_published ? 'Yes' : 'No'}
            </Badge>
          </Group>
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
}

// -----------------------------------------------------------------------------
// Grouped Ideal-For picker (4 groups). Optional global cap (used in Free layout).
// Writes to form.values.ideal_for = { atmosphere, age_group, social_settings, local_special }.
// -----------------------------------------------------------------------------
export function IdealForGrouped({ form, totalCap = null }) {
  const groups = [
    { key: 'atmosphere',      label: 'Atmosphere',      options: IDEAL_FOR_ATMOSPHERE },
    { key: 'age_group',       label: 'Age Group',       options: IDEAL_FOR_AGE_GROUP },
    { key: 'social_settings', label: 'Social Settings', options: IDEAL_FOR_SOCIAL_SETTINGS },
    { key: 'local_special',   label: 'Local Special',   options: IDEAL_FOR_LOCAL_SPECIAL },
  ];
  const current = form.values.ideal_for || {};
  const currentTotal = groups.reduce((n, g) => n + ((current[g.key] || []).length), 0);

  function onGroupChange(key, vals) {
    if (totalCap != null) {
      const otherTotal = groups
        .filter(g => g.key !== key)
        .reduce((n, g) => n + ((current[g.key] || []).length), 0);
      if (otherTotal + vals.length > totalCap) {
        // truncate to remaining capacity
        const remain = Math.max(0, totalCap - otherTotal);
        vals = vals.slice(0, remain);
      }
    }
    form.setFieldValue(`ideal_for.${key}`, vals);
  }

  return (
    <Stack>
      <Title order={5}>Ideal For</Title>
      {totalCap && (
        <Text size="xs" c="dimmed">{currentTotal} / {totalCap} selected</Text>
      )}
      {groups.map(g => (
        <MultiSelect
          key={g.key}
          label={g.label}
          data={g.options}
          value={current[g.key] || []}
          onChange={(vals) => onGroupChange(g.key, vals)}
          searchable
          clearable
        />
      ))}
    </Stack>
  );
}

// -----------------------------------------------------------------------------
// Arrival Methods chip group (multi-select via Checkboxes)
// -----------------------------------------------------------------------------
export function ArrivalMethodsGroup({ form }) {
  const value = form.values.arrival_methods || [];
  const toggle = (v) => {
    if (value.includes(v)) form.setFieldValue('arrival_methods', value.filter(x => x !== v));
    else form.setFieldValue('arrival_methods', [...value, v]);
  };
  return (
    <Stack gap="xs">
      <Text fw={500}>Arrival Methods</Text>
      <SimpleGrid cols={{ base: 2, sm: 3 }}>
        {ARRIVAL_METHOD_OPTIONS.map(opt => (
          <Checkbox
            key={opt}
            label={opt}
            checked={value.includes(opt)}
            onChange={() => toggle(opt)}
          />
        ))}
      </SimpleGrid>
    </Stack>
  );
}

// -----------------------------------------------------------------------------
// What3Words address text input
// -----------------------------------------------------------------------------
export function What3WordsInput({ form }) {
  return (
    <TextInput
      label="what3words Address"
      placeholder="e.g. filled.count.soap"
      description="Three-word address that pinpoints a 3m square"
      {...form.getInputProps('what3words_address')}
      value={form.values.what3words_address ?? ''}
    />
  );
}

// -----------------------------------------------------------------------------
// Accessible Parking ADA checklist (gated on parking_types containing accessible)
// -----------------------------------------------------------------------------
export function AccessibleParkingChecklist({ form }) {
  const value = form.values.accessible_parking_details || [];
  const toggle = (v) => {
    const arr = Array.isArray(value) ? value : [];
    if (arr.includes(v)) form.setFieldValue('accessible_parking_details', arr.filter(x => x !== v));
    else form.setFieldValue('accessible_parking_details', [...arr, v]);
  };
  return (
    <Stack gap="xs">
      <Text fw={500}>Accessible Parking Details (ADA)</Text>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        {PARKING_ADA_CHECKLIST.map(opt => (
          <Checkbox
            key={opt}
            label={opt}
            checked={(Array.isArray(value) ? value : []).includes(opt)}
            onChange={() => toggle(opt)}
          />
        ))}
      </SimpleGrid>
    </Stack>
  );
}

// -----------------------------------------------------------------------------
// Accessible Restroom ADA checklist + auto-derived boolean
// -----------------------------------------------------------------------------
export function AccessibleRestroomChecklist({ form }) {
  const value = form.values.accessible_restroom_details || [];
  const toggle = (v) => {
    const arr = Array.isArray(value) ? value : [];
    const next = arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
    form.setFieldValue('accessible_restroom_details', next);
    form.setFieldValue('accessible_restroom', next.length > 0);
  };
  return (
    <Stack gap="xs">
      <Text fw={500}>Accessible Restroom Details (ADA)</Text>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        {RESTROOM_ADA_CHECKLIST.map(opt => (
          <Checkbox
            key={opt}
            label={opt}
            checked={(Array.isArray(value) ? value : []).includes(opt)}
            onChange={() => toggle(opt)}
          />
        ))}
      </SimpleGrid>
    </Stack>
  );
}

// -----------------------------------------------------------------------------
// Grouped Amenities block (4 groups), used in Paid Business / Park / Trail / Event
// -----------------------------------------------------------------------------
export function FullAmenitiesBlock({ form }) {
  return (
    <Stack>
      <Title order={5}>Amenities</Title>
      <MultiSelect label="General" searchable data={AMENITIES_GENERAL}
        value={form.values.amenities_general || []}
        onChange={(v) => form.setFieldValue('amenities_general', v)} />
      <MultiSelect label="Family / Youth" searchable data={AMENITIES_FAMILY_YOUTH}
        value={form.values.amenities_family_youth || []}
        onChange={(v) => form.setFieldValue('amenities_family_youth', v)} />
      <MultiSelect label="Water / Boating" searchable data={AMENITIES_WATER_BOATING}
        value={form.values.amenities_water_boating || []}
        onChange={(v) => form.setFieldValue('amenities_water_boating', v)} />
      <MultiSelect label="Dining / Seating" searchable data={AMENITIES_DINING_SEATING}
        value={form.values.amenities_dining_seating || []}
        onChange={(v) => form.setFieldValue('amenities_dining_seating', v)} />
    </Stack>
  );
}

// -----------------------------------------------------------------------------
// Connectivity row (WiFi + Cell)
// -----------------------------------------------------------------------------
export function ConnectivityRow({ form }) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
      <Select label="WiFi" data={WIFI_OPTIONS} clearable
        value={form.values.amenities?.wifi || null}
        onChange={(v) => form.setFieldValue('amenities.wifi', v)} />
      <Select label="Cell Service" data={CELL_SERVICE_OPTIONS} clearable
        value={form.values.cell_service}
        onChange={(v) => form.setFieldValue('cell_service', v)} />
    </SimpleGrid>
  );
}

// -----------------------------------------------------------------------------
// Alcohol Availability single-select
// -----------------------------------------------------------------------------
export function AlcoholAvailableSelect({ form }) {
  return (
    <Select
      label="Alcohol Available"
      data={ALCOHOL_AVAILABLE_OPTIONS}
      value={form.values.alcohol_available}
      onChange={(v) => form.setFieldValue('alcohol_available', v)}
      clearable
    />
  );
}

// -----------------------------------------------------------------------------
// Generic repeatable list helper used by multiple layouts (ticket_links, sponsors,
// access_points, etc.).  Renders rows + Add button.
// -----------------------------------------------------------------------------
export function RepeatableList({ items, onAdd, onRemove, renderRow, addLabel = 'Add' }) {
  return (
    <Stack>
      {(items || []).map((item, idx) => (
        <Group key={idx} align="flex-end" wrap="nowrap">
          <div style={{ flex: 1 }}>{renderRow(item, idx)}</div>
          <ActionIcon variant="light" color="red" onClick={() => onRemove(idx)} aria-label="Remove">
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      ))}
      <Button leftSection={<IconPlus size={14} />} variant="light" onClick={onAdd}>
        {addLabel}
      </Button>
    </Stack>
  );
}

export {
  PARKING_OPTIONS, PUBLIC_TOILET_OPTIONS, PET_OPTIONS, PAYMENT_METHODS, DISCOUNT_TYPES,
};
