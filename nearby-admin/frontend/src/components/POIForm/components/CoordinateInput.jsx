import React, { useState } from 'react';
import {
  NumberInput,
  Group,
  Button,
  Text,
  Stack,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconMapPin, IconWorld } from '@tabler/icons-react';
import { api } from '../../../utils/api';

// Same regex the backend enforces for what3words on /api/utils/what3words-to-coords
const W3W_PATTERN = /^[a-z]+\.[a-z]+\.[a-z]+$/;

/**
 * <CoordinateInput>
 * --------------------------------------------------------------------------
 * Reusable lat / lng / what3words trio with one-click lookup in either
 * direction. Hits the same backend utility endpoints used elsewhere in the
 * admin app (POST /api/utils/what3words-to-coords and its coords-to-w3w
 * counterpart).
 *
 * Props
 *   value         { lat?: number, lng?: number, w3w?: string }
 *   onChange(v)   merges and emits the full {lat,lng,w3w} object on every
 *                 sub-input change. The parent is responsible for binding
 *                 each field to its eventual backing column.
 *   label         section header (default "Coordinates")
 *   latLabel      override for the latitude input label
 *   lngLabel      override for the longitude input label
 *   requireBoth   when true, the W3W → coords lookup will refuse to clobber
 *                 a populated coord pair (currently informational; we never
 *                 silently overwrite).
 *   disabled      when true, all inputs and buttons are read-only.
 */
export default function CoordinateInput({
  value = {},
  onChange,
  label = 'Coordinates',
  latLabel = 'Latitude',
  lngLabel = 'Longitude',
  requireBoth = false,
  disabled = false,
}) {
  const [busy, setBusy] = useState(false);
  const lat = value?.lat ?? null;
  const lng = value?.lng ?? null;
  const w3w = value?.w3w ?? '';

  const emit = (patch) => {
    if (typeof onChange === 'function') {
      onChange({ lat, lng, w3w, ...patch });
    }
  };

  const w3wValid = typeof w3w === 'string' && W3W_PATTERN.test(w3w.trim());
  const coordsPresent =
    typeof lat === 'number' && typeof lng === 'number' &&
    !Number.isNaN(lat) && !Number.isNaN(lng);

  const lookupW3WToCoords = async () => {
    if (!w3wValid) return;
    setBusy(true);
    try {
      const resp = await api.post('/utils/what3words-to-coords', {
        words: w3w.trim(),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.detail || `HTTP ${resp.status}`);
      }
      const data = await resp.json();
      emit({ lat: data.latitude, lng: data.longitude });
      notifications.show({
        color: 'green',
        title: 'Coordinates filled',
        message: `Filled lat/lng from "${data.words}".`,
      });
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'W3W lookup failed',
        message: String(err?.message || err),
      });
    } finally {
      setBusy(false);
    }
  };

  const lookupCoordsToW3W = async () => {
    if (!coordsPresent) return;
    setBusy(true);
    try {
      const resp = await api.post('/utils/coords-to-what3words', {
        latitude: lat,
        longitude: lng,
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.detail || `HTTP ${resp.status}`);
      }
      const data = await resp.json();
      emit({ w3w: data.words });
      notifications.show({
        color: 'green',
        title: 'what3words filled',
        message: `Filled what3words address: "${data.words}".`,
      });
    } catch (err) {
      notifications.show({
        color: 'red',
        title: 'Coords lookup failed',
        message: String(err?.message || err),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack gap="xs">
      {label ? <Text fw={500}>{label}</Text> : null}

      <Group grow align="flex-start" wrap="wrap">
        <NumberInput
          label={latLabel}
          placeholder="35.7128"
          min={-90}
          max={90}
          decimalScale={7}
          value={lat ?? ''}
          onChange={(v) => emit({ lat: v === '' || v === null ? null : Number(v), w3w: '' })}
          disabled={disabled}
        />
        <NumberInput
          label={lngLabel}
          placeholder="-79.0064"
          min={-180}
          max={180}
          decimalScale={7}
          value={lng ?? ''}
          onChange={(v) => emit({ lng: v === '' || v === null ? null : Number(v), w3w: '' })}
          disabled={disabled}
        />
      </Group>

      <TextInput
        label="what3words Address"
        placeholder="word1.word2.word3"
        description='Three lowercase words separated by dots, e.g. "filled.count.soap"'
        value={w3w}
        onChange={(e) => emit({ w3w: e.currentTarget.value })}
        disabled={disabled}
      />

      <Group mt="sm" gap="xs" wrap="wrap">
        <Tooltip
          label={w3wValid ? 'Look up lat/lng for this what3words address' : 'Enter a valid w1.w2.w3 first'}
          withArrow
        >
          <Button
            size="xs"
            variant="light"
            leftSection={<IconMapPin size={14} />}
            disabled={disabled || busy || !w3wValid}
            onClick={lookupW3WToCoords}
            loading={busy}
          >
            Lookup W3W → Coords
          </Button>
        </Tooltip>

        <Tooltip
          label={coordsPresent ? 'Look up the what3words address for these coords' : 'Enter lat and lng first'}
          withArrow
        >
          <Button
            size="xs"
            variant="light"
            leftSection={<IconWorld size={14} />}
            disabled={disabled || busy || !coordsPresent}
            onClick={lookupCoordsToW3W}
            loading={busy}
          >
            Lookup Coords → W3W
          </Button>
        </Tooltip>

        {requireBoth && (!coordsPresent || !w3wValid) && (
          <Text size="xs" c="dimmed">
            (Both pairs recommended)
          </Text>
        )}
      </Group>
    </Stack>
  );
}
