// Shared helpers used by all 5 Phase 1 layouts.
import React, { useEffect, useState } from 'react';
import {
  Accordion, Stack, Group, Switch, Select, Textarea, Badge, Text,
  Checkbox, Title, SimpleGrid, MultiSelect, TextInput, NumberInput,
  Button, ActionIcon, Divider, Alert
} from '@mantine/core';
import { IconTrash, IconPlus, IconMapPin } from '@tabler/icons-react';
import { api } from '../../../utils/api';
import {
  SPONSOR_LEVEL_OPTIONS, LISTING_TYPES,
  IDEAL_FOR_ATMOSPHERE, IDEAL_FOR_AGE_GROUP, IDEAL_FOR_SOCIAL_SETTINGS, IDEAL_FOR_LOCAL_SPECIAL,
  IDEAL_FOR_SPECIAL_NEEDS,
  PARKING_OPTIONS, PARKING_ADA_CHECKLIST, ARRIVAL_METHOD_OPTIONS,
  RESTROOM_ADA_CHECKLIST, PUBLIC_TOILET_OPTIONS,
  AMENITIES_GENERAL, AMENITIES_FAMILY_YOUTH, AMENITIES_WATER_BOATING, AMENITIES_DINING_SEATING,
  AMENITIES_VISIBILITY, WIFI_OPTIONS, CELL_SERVICE_OPTIONS,
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
// Grouped Ideal-For picker (5 groups, checkbox grid). Optional totalCap.
// Writes to form.values.ideal_for = { atmosphere, age_group, social_settings,
//   local_special, special_needs }.
// -----------------------------------------------------------------------------
const IDEAL_FOR_GROUPS = [
  { key: 'atmosphere',      label: 'Atmosphere',                   options: IDEAL_FOR_ATMOSPHERE },
  { key: 'age_group',       label: 'Age Group',                    options: IDEAL_FOR_AGE_GROUP },
  { key: 'social_settings', label: 'Social Settings',              options: IDEAL_FOR_SOCIAL_SETTINGS },
  { key: 'local_special',   label: 'Local + Special',              options: IDEAL_FOR_LOCAL_SPECIAL },
  { key: 'special_needs',   label: 'Supports These Special Needs', options: IDEAL_FOR_SPECIAL_NEEDS },
];

// Age group options excluding the "All Ages" shortcut (which is a UI trigger, not saved)
const AGE_GROUP_ITEMS = IDEAL_FOR_AGE_GROUP.filter(o => o !== 'All Ages');

export function IdealForGrouped({ form, totalCap = null }) {
  const current = form.values.ideal_for || {};
  const currentTotal = IDEAL_FOR_GROUPS.reduce((n, g) => n + ((current[g.key] || []).length), 0);
  const atCap = totalCap != null && currentTotal >= totalCap;

  function toggle(key, val) {
    const arr = current[key] || [];
    if (arr.includes(val)) {
      form.setFieldValue(`ideal_for.${key}`, arr.filter(x => x !== val));
    } else if (totalCap == null || currentTotal < totalCap) {
      form.setFieldValue(`ideal_for.${key}`, [...arr, val]);
    }
  }

  function toggleAllAges() {
    const groupVals = current.age_group || [];
    const allSelected = AGE_GROUP_ITEMS.every(o => groupVals.includes(o));
    if (allSelected) {
      form.setFieldValue('ideal_for.age_group', []);
    } else {
      if (totalCap != null) {
        const otherTotal = currentTotal - groupVals.length;
        const canAdd = totalCap - otherTotal;
        form.setFieldValue('ideal_for.age_group', AGE_GROUP_ITEMS.slice(0, canAdd));
      } else {
        form.setFieldValue('ideal_for.age_group', [...AGE_GROUP_ITEMS]);
      }
    }
  }

  return (
    <Stack gap="md">
      <Group>
        <Title order={5}>Ideal For</Title>
        {totalCap != null && (
          <Text size="xs" c={atCap ? 'red' : 'dimmed'}>
            {currentTotal} / {totalCap} selected
          </Text>
        )}
      </Group>
      {IDEAL_FOR_GROUPS.map(g => {
        const groupVals = current[g.key] || [];
        const isAgeGroup = g.key === 'age_group';
        const isSpecialNeeds = g.key === 'special_needs';
        const options = isAgeGroup ? AGE_GROUP_ITEMS : g.options;
        const allAgesSelected = isAgeGroup && AGE_GROUP_ITEMS.every(o => groupVals.includes(o));

        return (
          <Stack key={g.key} gap="xs">
            <Text fw={600} size="sm" c="dimmed">{g.label}</Text>
            {isSpecialNeeds && (
              <Text size="xs" c="dimmed" fs="italic">
                Select needs your location, program, service, or staff can reasonably support or accommodate. Only select items you actively serve or are equipped to handle.
              </Text>
            )}
            {isAgeGroup && (
              <Checkbox
                label={<Text fw={600} size="sm">All Ages <Text span size="xs" c="dimmed" fs="italic">(selects every age group below)</Text></Text>}
                checked={allAgesSelected}
                indeterminate={!allAgesSelected && groupVals.length > 0}
                onChange={toggleAllAges}
                disabled={atCap && groupVals.length === 0}
              />
            )}
            <SimpleGrid cols={{ base: 2, sm: 3 }}>
              {options.map(opt => {
                const checked = groupVals.includes(opt);
                const disabled = atCap && !checked;
                const isStrollerFriendly = opt === 'Stroller Friendly';
                return (
                  <Stack key={opt} gap={2}>
                    <Checkbox
                      label={opt}
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(g.key, opt)}
                    />
                    {isStrollerFriendly && (
                      <Text size="xs" c="dimmed" fs="italic" ml={26}>
                        flat, paved, or firm surface suitable for strollers
                      </Text>
                    )}
                  </Stack>
                );
              })}
            </SimpleGrid>
          </Stack>
        );
      })}
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
// What3Words address text input with resolve-to-coords button
// -----------------------------------------------------------------------------
export function What3WordsInput({ form }) {
  const [resolving, setResolving] = useState(false);
  const [resolveResult, setResolveResult] = useState(null);
  const [resolveError, setResolveError] = useState(null);

  const handleResolve = async () => {
    const words = (form.values.what3words_address || '').trim();
    if (!words) return;
    setResolving(true);
    setResolveResult(null);
    setResolveError(null);
    try {
      const resp = await api.request('/utils/what3words-to-coords', {
        method: 'POST',
        body: JSON.stringify({ words }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || `Error ${resp.status}`);
      }
      const data = await resp.json();
      setResolveResult(data);
    } catch (err) {
      setResolveError(err?.message || 'Failed to resolve address');
    } finally {
      setResolving(false);
    }
  };

  const applyCoords = () => {
    if (!resolveResult) return;
    form.setFieldValue('latitude', resolveResult.latitude);
    form.setFieldValue('longitude', resolveResult.longitude);
    setResolveResult(null);
  };

  return (
    <Stack gap="xs">
      <Group align="flex-end">
        <TextInput
          style={{ flex: 1 }}
          label="what3words Address"
          placeholder="e.g. filled.count.soap"
          description="Three-word address that pinpoints a 3m square"
          {...form.getInputProps('what3words_address')}
          value={form.values.what3words_address ?? ''}
        />
        <Button
          variant="light"
          leftSection={<IconMapPin size={16} />}
          loading={resolving}
          disabled={!form.values.what3words_address}
          onClick={handleResolve}
        >
          Resolve
        </Button>
      </Group>
      {resolveResult && (
        <Alert color="green" variant="light">
          <Group justify="space-between">
            <Text size="sm">
              {resolveResult.latitude.toFixed(6)}, {resolveResult.longitude.toFixed(6)}
              {resolveResult.nearest_place ? ` — ${resolveResult.nearest_place}` : ''}
            </Text>
            <Button size="xs" variant="filled" color="green" onClick={applyCoords}>
              Apply to Map Pin
            </Button>
          </Group>
        </Alert>
      )}
      {resolveError && (
        <Alert color="red" variant="light">
          <Text size="sm">{resolveError}</Text>
        </Alert>
      )}
    </Stack>
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
// Only renders when "Wheelchair + ADA Accessible" is selected in public_toilets
// accessible_restroom = true when wide door + side grab bar + level entry are all checked
// -----------------------------------------------------------------------------
const ADA_TRIGGER = 'Wheelchair + ADA Accessible';
const ADA_REQUIRED_LABELS = [
  'Wide door — minimum 32 inches clear width',
  'Side grab bar installed',
  'Level entry — no lip or step',
];

export function AccessibleRestroomChecklist({ form }) {
  const toilets = form.values.public_toilets || [];
  if (!toilets.includes(ADA_TRIGGER)) return null;

  const checked = form.values.accessible_restroom_details || [];
  const arr = Array.isArray(checked) ? checked : [];

  const toggle = (label) => {
    const next = arr.includes(label) ? arr.filter(x => x !== label) : [...arr, label];
    form.setFieldValue('accessible_restroom_details', next);
    const allThree = ADA_REQUIRED_LABELS.every(l => next.includes(l));
    form.setFieldValue('accessible_restroom', allThree);
  };

  const groups = [...new Set(RESTROOM_ADA_CHECKLIST.map(i => i.group))];

  return (
    <Stack gap="sm">
      <Text fw={500}>ADA Restroom Checklist</Text>
      {groups.map(group => (
        <Stack key={group} gap="xs">
          <Text size="sm" fw={600} c="dimmed">{group}</Text>
          {RESTROOM_ADA_CHECKLIST.filter(i => i.group === group).map(item => (
            <Checkbox
              key={item.label}
              label={item.label}
              checked={arr.includes(item.label)}
              onChange={() => toggle(item.label)}
            />
          ))}
        </Stack>
      ))}
    </Stack>
  );
}

// -----------------------------------------------------------------------------
// Grouped Amenities block (4 groups), used in Paid Business / Park / Trail / Event
// -----------------------------------------------------------------------------
export function FullAmenitiesBlock({ form, poiType }) {
  const isPT = ['PARK', 'TRAIL'].includes(poiType);
  const isBE = ['BUSINESS', 'EVENT'].includes(poiType);

  const filterItems = (items) => items.filter(item => {
    const vis = AMENITIES_VISIBILITY[item];
    if (!vis) return true;
    if (vis === 'PT') return isPT;
    if (vis === 'BE') return isBE;
    return true;
  });

  return (
    <Stack>
      <Title order={5}>Amenities</Title>
      <MultiSelect label="General" searchable data={filterItems(AMENITIES_GENERAL)}
        value={form.values.amenities?.general || []}
        onChange={(v) => form.setFieldValue('amenities.general', v)} />
      <MultiSelect label="Family + Youth" searchable data={filterItems(AMENITIES_FAMILY_YOUTH)}
        value={form.values.amenities?.family_youth || []}
        onChange={(v) => form.setFieldValue('amenities.family_youth', v)} />
      <MultiSelect label="Water + Boating" searchable data={filterItems(AMENITIES_WATER_BOATING)}
        value={form.values.amenities?.water_boating || []}
        onChange={(v) => form.setFieldValue('amenities.water_boating', v)} />
      <MultiSelect label="Dining, Seating + Gathering" searchable data={filterItems(AMENITIES_DINING_SEATING)}
        value={form.values.amenities?.dining_seating || []}
        onChange={(v) => form.setFieldValue('amenities.dining_seating', v)} />
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
