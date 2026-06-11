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
  IDEAL_FOR_ATMOSPHERE, IDEAL_FOR_AGE_GROUP, IDEAL_FOR_SOCIAL_SETTINGS,
  IDEAL_FOR_LOCAL_SPECIAL, IDEAL_FOR_SPECIAL_NEEDS,
  PARKING_OPTIONS, PARKING_ADA_CHECKLIST, ARRIVAL_METHOD_OPTIONS,
  RESTROOM_ADA_CHECKLIST, PUBLIC_TOILET_OPTIONS,
  AMENITIES_GENERAL, AMENITIES_FAMILY_YOUTH, AMENITIES_WATER_BOATING, AMENITIES_DINING_SEATING,
  AMENITY_SUBSELECT_OPTIONS, AMENITY_ADA_CHECKLISTS, isAmenityVisibleForPoiType,
  ALCOHOL_AVAILABLE_OPTIONS, WIFI_OPTIONS, CELL_SERVICE_OPTIONS,
  PET_OPTIONS, PAYMENT_METHODS, DISCOUNT_TYPES,
  PLAYGROUND_AGE_GROUPS, PLAYGROUND_ADA_CATEGORIES,
  PLAYGROUND_TYPES, PARK_PLAYGROUND_SURFACES,
} from '../../../utils/constants';
import CoordinateInput from '../components/CoordinateInput';
import { PlaygroundPhotosUpload } from '../ImageIntegration';

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
// Unified Ideal-For checkbox grid (Issue #43).
//
// One canonical UI replacing the 3 competing surfaces (flat Key Ideal For
// checkboxes, legacy <IdealForSelector />, and the 4-MultiSelect grouped picker).
//
// Renders 5 groups (Atmosphere, Age Group, Social Settings, Local + Special,
// Supports These Special Needs) as inline checkbox grids. Per-listing-type
// visibility + total-cap rules:
//   - "Business Free"  -> all 5 groups visible, 5 total max
//   - "Business Paid"  -> all 5 groups visible, no cap
//   - "Event"          -> all 5 groups visible, 10 total max
//   - "Park"/"Trail"   -> NOT rendered (per visibility table, returns null)
//
// Storage: form.values.ideal_for = {
//   atmosphere, age_group, social_settings, local_special, special_needs
// }
// JSONB key — no migration needed.
// -----------------------------------------------------------------------------
const IDEAL_FOR_GROUPS = [
  { key: 'atmosphere',      label: 'ATMOSPHERE',                    options: IDEAL_FOR_ATMOSPHERE },
  { key: 'age_group',       label: 'AGE GROUP',                     options: IDEAL_FOR_AGE_GROUP },
  { key: 'social_settings', label: 'SOCIAL SETTINGS',               options: IDEAL_FOR_SOCIAL_SETTINGS },
  { key: 'local_special',   label: 'LOCAL + SPECIAL',               options: IDEAL_FOR_LOCAL_SPECIAL },
  { key: 'special_needs',   label: 'SUPPORTS THESE SPECIAL NEEDS',  options: IDEAL_FOR_SPECIAL_NEEDS },
];

// Per-listing-type rules. listingType is the human-readable label so callers
// can pass it directly from the layout file ("Business Free", "Event", etc).
export const IDEAL_FOR_RULES = {
  'Business Free': { visible: true,  cap: 5 },
  'Business Paid': { visible: true,  cap: null },
  'Event':         { visible: true,  cap: 10 },
  'Park':          { visible: true,  cap: null },
  'Trail':         { visible: true,  cap: null },
};

function rulesFor(listingType) {
  return IDEAL_FOR_RULES[listingType] || { visible: true, cap: null };
}

export function IdealForGrouped({ form, listingType, totalCap = null }) {
  // Back-compat: callers that still pass totalCap directly win over listingType.
  const rules = listingType ? rulesFor(listingType) : { visible: true, cap: totalCap };
  if (!rules.visible) return null;
  const cap = totalCap != null ? totalCap : rules.cap;

  const current = form.values.ideal_for || {};
  const currentTotal = IDEAL_FOR_GROUPS.reduce(
    (n, g) => n + ((current[g.key] || []).length), 0
  );

  function toggle(groupKey, option, checked) {
    const list = Array.isArray(current[groupKey]) ? current[groupKey] : [];
    if (checked) {
      if (list.includes(option)) return;
      if (cap != null && currentTotal >= cap) return; // cap enforced
      form.setFieldValue(`ideal_for.${groupKey}`, [...list, option]);
    } else {
      form.setFieldValue(`ideal_for.${groupKey}`, list.filter(v => v !== option));
    }
  }

  const capReached = cap != null && currentTotal >= cap;

  return (
    <Stack>
      <Title order={5}>Ideal For</Title>
      {cap != null && (
        <Text size="xs" c="dimmed" data-testid="ideal-for-cap-counter">
          {currentTotal} / {cap} selected
        </Text>
      )}
      {IDEAL_FOR_GROUPS.map((g) => {
        const groupVal = Array.isArray(current[g.key]) ? current[g.key] : [];
        return (
          <Stack key={g.key} gap="xs" data-testid={`ideal-for-group-${g.key}`}>
            <Text fw={700} size="xs" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
              {g.label}
            </Text>
            {g.key === 'special_needs' && (
              <Text size="xs" c="dimmed">
                Select needs your location, program, service, or staff can reasonably
                support or accommodate. <strong>Only select items you actively serve
                or are equipped to handle.</strong>
              </Text>
            )}
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
              {g.options.map((opt) => {
                const checked = groupVal.includes(opt);
                const disabled = !checked && capReached;
                return (
                  <Checkbox
                    key={opt}
                    label={opt}
                    checked={checked}
                    disabled={disabled}
                    onChange={(e) => toggle(g.key, opt, e.currentTarget.checked)}
                  />
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
// Featured Ideal For — read-only chip display of currently-selected ideal_for
// items (across all 5 groups). Replaces the old flat "Key Ideal For" checkbox
// block in CategoriesSection.
// -----------------------------------------------------------------------------
export function FeaturedIdealForChips({ form }) {
  const current = form.values.ideal_for || {};
  const selected = IDEAL_FOR_GROUPS.flatMap(g => (Array.isArray(current[g.key]) ? current[g.key] : []));
  return (
    <Stack gap="xs">
      <Title order={5}>Featured Ideal For</Title>
      <Text size="sm" c="dimmed">
        Items currently selected in the Ideal For section above.
      </Text>
      {selected.length === 0 ? (
        <Text size="sm" c="dimmed" fs="italic">None selected yet.</Text>
      ) : (
        <Group gap="xs">
          {selected.map((v) => (
            <Badge key={v} variant="light" color="blue">{v}</Badge>
          ))}
        </Group>
      )}
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
// Accessible Restroom ADA checklist (Wave 3 #47)
//
// Renders ONLY when `public_toilets` includes "Wheelchair + ADA Accessible".
// Groups checklist items by group header. Does NOT mirror to
// `accessible_restroom` from the client — backend `compute_accessible_restroom`
// is authoritative (strict ALL-THREE rule) and runs on save.
// -----------------------------------------------------------------------------
export function AccessibleRestroomChecklist({ form }) {
  const publicToilets = Array.isArray(form.values.public_toilets)
    ? form.values.public_toilets
    : [];
  if (!publicToilets.includes('Wheelchair + ADA Accessible')) {
    return null;
  }

  const value = Array.isArray(form.values.accessible_restroom_details)
    ? form.values.accessible_restroom_details
    : [];
  const toggle = (label) => {
    const next = value.includes(label)
      ? value.filter((x) => x !== label)
      : [...value, label];
    form.setFieldValue('accessible_restroom_details', next);
  };

  // Group items by `group`, preserving insertion order.
  const groups = [];
  const groupIndex = new Map();
  for (const item of RESTROOM_ADA_CHECKLIST) {
    if (!groupIndex.has(item.group)) {
      groupIndex.set(item.group, groups.length);
      groups.push({ group: item.group, items: [] });
    }
    groups[groupIndex.get(item.group)].items.push(item);
  }

  return (
    <Stack gap="md" mt="xs" pl="md" style={{ borderLeft: '2px solid var(--mantine-color-gray-3)' }}>
      <Text fw={600}>Accessible Restroom Details (ADA)</Text>
      <Text size="xs" c="dimmed">
        Wheelchair-accessibility is computed strictly: a wide door (32" min) + a
        side OR rear grab bar + level entry must all be checked.
      </Text>
      {groups.map(({ group, items }) => (
        <Stack key={group} gap={4}>
          <Text size="sm" fw={500} c="dimmed">{group}</Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            {items.map((opt) => (
              <Checkbox
                key={opt.label}
                label={opt.label}
                checked={value.includes(opt.label)}
                onChange={() => toggle(opt.label)}
              />
            ))}
          </SimpleGrid>
        </Stack>
      ))}
    </Stack>
  );
}

// -----------------------------------------------------------------------------
// Facilities + Amenities block — Issue #55 rebuild.
//
// Renders the four Phase-1 groups (General, Family + Youth, Water + Boating,
// Dining/Seating/Gathering) as filterable Checkbox.Group blocks per POI type,
// plus the top-level Wifi (required) and Cell Service single-selects, plus all
// conditional sub-option panels and ADA inline checklists from the spec.
//
// Data shape — everything serializes into the existing `amenities` JSONB blob
// on points_of_interest (no migration needed):
//   amenities.wifi               -> string
//   amenities.cell_service       -> string
//   amenities.general            -> string[]  (selected item `value`s)
//   amenities.family_youth       -> string[]
//   amenities.water_boating      -> string[]
//   amenities.dining_seating     -> string[]
//   amenities.{slug}_options     -> string[]  (sub-select panels)
//   amenities.{slug}_ada         -> string[]  (ADA inline checklists)
//   amenities.ev_charging_station_count -> number
// -----------------------------------------------------------------------------
const AMENITY_GROUPS = [
  { key: 'general',        label: 'General',                       items: AMENITIES_GENERAL },
  { key: 'family_youth',   label: 'Family + Youth',                items: AMENITIES_FAMILY_YOUTH },
  { key: 'water_boating',  label: 'Water + Boating',               items: AMENITIES_WATER_BOATING },
  { key: 'dining_seating', label: 'Dining, Seating + Gathering',   items: AMENITIES_DINING_SEATING },
];

function AmenitySubSelectPanel({ form, parentItem, poiType }) {
  const slug = parentItem.hasSubSelect;
  const opts = AMENITY_SUBSELECT_OPTIONS[slug] || [];
  const visibleOpts = opts.filter((o) => isAmenityVisibleForPoiType(o, poiType));
  const fieldPath = `amenities.${parentItem.value}_options`;
  const value = form.values.amenities?.[`${parentItem.value}_options`] || [];

  return (
    <Stack
      gap="xs"
      mt="xs"
      pl="md"
      style={{ borderLeft: '2px solid var(--mantine-color-gray-3)' }}
    >
      <Text size="sm" fw={500} c="dimmed">
        {parentItem.label} — select all that apply
      </Text>
      <Checkbox.Group
        value={value}
        onChange={(vals) => form.setFieldValue(fieldPath, vals)}
      >
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
          {visibleOpts.map((opt) => (
            <Checkbox key={opt.value} value={opt.value} label={opt.label} />
          ))}
        </SimpleGrid>
      </Checkbox.Group>

      {slug === 'ev_charging' && (
        <NumberInput
          label="Number of stations"
          min={0}
          value={form.values.amenities?.ev_charging_station_count ?? ''}
          onChange={(v) => form.setFieldValue('amenities.ev_charging_station_count', v)}
        />
      )}
    </Stack>
  );
}

function AmenityAdaChecklist({ form, parentItem }) {
  const slug = parentItem.hasAdaChecklist;
  const items = AMENITY_ADA_CHECKLISTS[slug] || [];
  const fieldPath = `amenities.${parentItem.value}_ada`;
  const value = form.values.amenities?.[`${parentItem.value}_ada`] || [];
  return (
    <Stack
      gap="xs"
      mt="xs"
      pl="md"
      style={{ borderLeft: '2px solid var(--mantine-color-gray-3)' }}
    >
      <Text size="sm" fw={500} c="dimmed">
        ADA Accessibility — {parentItem.label}
      </Text>
      <Checkbox.Group
        value={value}
        onChange={(vals) => form.setFieldValue(fieldPath, vals)}
      >
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
          {items.map((label) => (
            <Checkbox key={label} value={label} label={label} />
          ))}
        </SimpleGrid>
      </Checkbox.Group>
    </Stack>
  );
}

export function FullAmenitiesBlock({ form, poiType = 'BUSINESS' }) {
  return (
    <Stack>
      <Title order={5}>Facilities + Amenities</Title>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        <Select
          label="Wifi"
          description="Required"
          required
          data={WIFI_OPTIONS}
          value={form.values.amenities?.wifi || null}
          onChange={(v) => form.setFieldValue('amenities.wifi', v)}
        />
        <Select
          label="Cell Service"
          data={CELL_SERVICE_OPTIONS}
          clearable
          value={form.values.amenities?.cell_service || null}
          onChange={(v) => form.setFieldValue('amenities.cell_service', v)}
        />
      </SimpleGrid>

      {AMENITY_GROUPS.map(({ key, label, items }) => {
        const visibleItems = items.filter((it) => isAmenityVisibleForPoiType(it, poiType));
        if (visibleItems.length === 0) return null;
        const fieldPath = `amenities.${key}`;
        const value = form.values.amenities?.[key] || [];

        return (
          <Stack key={key} gap="xs">
            <Divider label={label} labelPosition="left" />
            <Checkbox.Group
              value={value}
              onChange={(vals) => form.setFieldValue(fieldPath, vals)}
            >
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                {visibleItems.map((it) => (
                  <Checkbox key={it.value} value={it.value} label={it.label} />
                ))}
              </SimpleGrid>
            </Checkbox.Group>

            {/* Conditional panels — only render when the parent item is checked. */}
            {visibleItems.map((it) => {
              if (!value.includes(it.value)) return null;
              return (
                <React.Fragment key={`${it.value}-extras`}>
                  {it.hasSubSelect && (
                    <AmenitySubSelectPanel form={form} parentItem={it} poiType={poiType} />
                  )}
                  {it.hasAdaChecklist && (
                    <AmenityAdaChecklist form={form} parentItem={it} />
                  )}
                </React.Fragment>
              );
            })}
          </Stack>
        );
      })}
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
// PlaygroundRowExtras — internal helper used by RepeatableLocationGroup when
// `extraFields="playground"`.  Renders the per-playground age-groups
// MultiSelect plus the 4-category ADA checklist.  Pure controlled component
// driven through the parent form via `fieldName` + index.
// -----------------------------------------------------------------------------
function PlaygroundRowExtras({ form, fieldName, idx, isPark = false, id = null }) {
  const row = form.values?.[fieldName]?.[idx] || {};
  const ageGroups = Array.isArray(row.age_groups) ? row.age_groups : [];
  const types = Array.isArray(row.types) ? row.types : [];
  const surfaces = Array.isArray(row.surfaces) ? row.surfaces : [];
  const adaChecklist = (row.ada_checklist && typeof row.ada_checklist === 'object')
    ? row.ada_checklist
    : {};

  const updateAgeGroups = (vals) => {
    form.setFieldValue(`${fieldName}.${idx}.age_groups`, vals);
  };

  const updateAdaCategory = (catKey, vals) => {
    form.setFieldValue(`${fieldName}.${idx}.ada_checklist.${catKey}`, vals);
  };

  return (
    <Stack gap="md">
      <MultiSelect
        label="Age Groups"
        description="Who this playground is designed for"
        placeholder="Select one or more"
        data={PLAYGROUND_AGE_GROUPS}
        value={ageGroups}
        onChange={updateAgeGroups}
        searchable
        clearable
      />

      {/* #76 Park Acc 9: Playground Types + Surfaces live INSIDE each grouping
          (moved off the accordion top), plus per-grouping Images + Notes. */}
      {isPark && (
        <>
          <MultiSelect
            label="Playground Types"
            placeholder="Select one or more"
            data={PLAYGROUND_TYPES}
            value={types}
            onChange={(v) => form.setFieldValue(`${fieldName}.${idx}.types`, v)}
            searchable
            clearable
          />
          <MultiSelect
            label="Playground Surface Types"
            placeholder="Select one or more"
            data={PARK_PLAYGROUND_SURFACES}
            value={surfaces}
            onChange={(v) => form.setFieldValue(`${fieldName}.${idx}.surfaces`, v)}
            searchable
            clearable
          />
        </>
      )}

      <Stack gap="xs">
        <Text fw={500}>ADA Accessibility Checklist</Text>
        {Object.entries(PLAYGROUND_ADA_CATEGORIES).map(([catKey, cat]) => {
          const groupValue = Array.isArray(adaChecklist[catKey]) ? adaChecklist[catKey] : [];
          return (
            <Stack key={catKey} gap={4}>
              <Text fw={500} c="dimmed" size="sm">{cat.label}</Text>
              <Checkbox.Group
                value={groupValue}
                onChange={(vals) => updateAdaCategory(catKey, vals)}
              >
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                  {cat.items.map((opt) => (
                    <Checkbox key={opt.value} value={opt.value} label={opt.label} />
                  ))}
                </SimpleGrid>
              </Checkbox.Group>
            </Stack>
          );
        })}
      </Stack>

      {isPark && (
        <>
          <Textarea
            label="Playground Notes"
            placeholder="Additional details about this playground"
            autosize
            minRows={2}
            value={row.notes || ''}
            onChange={(e) => form.setFieldValue(`${fieldName}.${idx}.notes`, e.currentTarget.value)}
          />
          {id ? (
            <PlaygroundPhotosUpload poiId={id} playgroundIndex={idx} form={form} />
          ) : (
            <Text size="sm" c="dimmed">Save POI first to enable playground photo upload</Text>
          )}
        </>
      )}
    </Stack>
  );
}

// -----------------------------------------------------------------------------
// RepeatableLocationGroup — repeats a row of { lat, lng, name? } objects bound
// to `form.values[fieldName]` (must be an array, even if empty/undefined).
//
// Optional `extraFields` selectors render additional inputs inside each row:
//   - "playground": per-row age_groups MultiSelect + grouped ADA checklist
//                   (data shape: { age_groups: string[], ada_checklist: {} })
//
// Backward compat: missing keys render as empty controls. Updates use
// setFieldValue with merge-style paths so untouched keys are preserved.
// -----------------------------------------------------------------------------
export function RepeatableLocationGroup({
  form,
  fieldName,
  extraFields = null,
  addLabel = 'Add another location',
  showName = true,
  // #76 Park Acc 9 only: when isPark + extraFields='playground', each grouping
  // uses the CoordinateInput bundle (w3w + manual lat/long) and renders the
  // per-grouping Types/Surfaces/Images/Notes. Defaults keep Trail/Event intact.
  isPark = false,
  id = null,
}) {
  const isPlayground = extraFields === 'playground';
  const rows = Array.isArray(form.values?.[fieldName]) ? form.values[fieldName] : [];

  const addRow = () => {
    const next = [...rows, { lat: null, lng: null, name: '' }];
    form.setFieldValue(fieldName, next);
  };

  const removeRow = (idx) => {
    const next = rows.filter((_, i) => i !== idx);
    form.setFieldValue(fieldName, next);
  };

  return (
    <Stack>
      {rows.map((row, idx) => (
        <div
          key={idx}
          style={{
            border: '1px solid var(--mantine-color-gray-3)',
            borderRadius: 8,
            padding: 12,
          }}
        >
          <Stack>
            <Group justify="space-between" align="center">
              <Text fw={500}>
                {isPlayground ? 'Playground' : 'Location'} {idx + 1}
              </Text>
              <ActionIcon
                variant="light"
                color="red"
                onClick={() => removeRow(idx)}
                aria-label="Remove"
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>

            {showName && (
              <TextInput
                label="Name (optional)"
                placeholder="e.g. Main Playground, North Lot Playground"
                value={row?.name ?? ''}
                onChange={(e) =>
                  form.setFieldValue(`${fieldName}.${idx}.name`, e.currentTarget.value)
                }
              />
            )}

            {isPlayground && isPark ? (
              <CoordinateInput
                label="Playground Coordinates"
                latLabel="Playground Latitude"
                lngLabel="Playground Longitude"
                value={{ lat: row?.lat ?? null, lng: row?.lng ?? null, w3w: row?.w3w ?? '' }}
                onChange={(v) => {
                  form.setFieldValue(`${fieldName}.${idx}.lat`, v.lat);
                  form.setFieldValue(`${fieldName}.${idx}.lng`, v.lng);
                  form.setFieldValue(`${fieldName}.${idx}.w3w`, v.w3w ?? '');
                }}
              />
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <NumberInput
                  label="Latitude"
                  placeholder="35.7128"
                  decimalScale={6}
                  value={row?.lat ?? ''}
                  onChange={(v) => form.setFieldValue(`${fieldName}.${idx}.lat`, v)}
                />
                <NumberInput
                  label="Longitude"
                  placeholder="-79.0064"
                  decimalScale={6}
                  value={row?.lng ?? ''}
                  onChange={(v) => form.setFieldValue(`${fieldName}.${idx}.lng`, v)}
                />
              </SimpleGrid>
            )}

            {isPlayground && (
              <>
                <Divider my="xs" />
                <PlaygroundRowExtras
                  form={form}
                  fieldName={fieldName}
                  idx={idx}
                  isPark={isPark}
                  id={id}
                />
              </>
            )}
          </Stack>
        </div>
      ))}

      <Button leftSection={<IconPlus size={14} />} variant="light" onClick={addRow}>
        {addLabel}
      </Button>
    </Stack>
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
