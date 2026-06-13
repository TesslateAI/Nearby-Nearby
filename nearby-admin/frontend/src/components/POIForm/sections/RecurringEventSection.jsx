import React, { useState } from 'react';
import {
  Stack,
  Switch,
  Select,
  NumberInput,
  Chip,
  Card,
  Text,
  Group,
  Button,
  Badge,
  Divider,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { REPEAT_FREQUENCY_OPTIONS } from '../../../utils/constants';

// ---------------------------------------------------------------------------
// Day-of-week options used for weekly/biweekly chip groups
// ---------------------------------------------------------------------------
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Frequencies that expose the day-of-week chip selector
const WEEKLY_FREQUENCIES = ['weekly', 'biweekly'];

// ---------------------------------------------------------------------------
// Preview calculation helper — returns up to `limit` future occurrence Dates
// starting from `startDate`, applying the given repeat_pattern and skipping
// any dates found in `excludedDates`.
//
// Kept intentionally simple — no rrule dependency.
// ---------------------------------------------------------------------------
function calculateNextOccurrences(startDate, pattern, excludedDates = [], limit = 5) {
  if (!startDate || !pattern?.frequency) return [];

  const excluded = new Set(
    (excludedDates || []).map((d) => {
      const date = typeof d === 'string' ? new Date(d) : d;
      return date.toDateString();
    })
  );

  const interval = Math.max(1, pattern.interval || 1);
  const frequency = pattern.frequency;
  const daysOfWeek = pattern.days_of_week || [];

  // Build a lookup from short name → JS getDay() index (0=Sun … 6=Sat)
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  const results = [];
  const cursor = new Date(startDate);
  // Ensure we start from the next valid occurrence after startDate
  cursor.setHours(startDate.getHours ? startDate.getHours() : 0);

  // Safety cap — never iterate more than 1 000 steps to prevent infinite loops
  const MAX_ITERATIONS = 1000;
  let iterations = 0;

  while (results.length < limit && iterations < MAX_ITERATIONS) {
    iterations++;

    // Advance cursor by one unit *before* the first check so we don't include
    // the start date itself (it's the "current" event, not a future occurrence).
    const candidate = new Date(cursor);

    // Should this candidate be skipped based on days_of_week?
    let include = true;

    if (WEEKLY_FREQUENCIES.includes(frequency) && daysOfWeek.length > 0) {
      const candidateDay = candidate.getDay(); // 0=Sun
      const selectedIndices = daysOfWeek.map((d) => dayMap[d]).filter((i) => i !== undefined);
      include = selectedIndices.includes(candidateDay);
    }

    if (include && !excluded.has(candidate.toDateString())) {
      results.push(new Date(candidate));
    }

    // Advance the cursor by the appropriate interval
    switch (frequency) {
      case 'daily':
        cursor.setDate(cursor.getDate() + interval);
        break;
      case 'weekly':
        // For weekly with day selection, step one day at a time so we can
        // hit each selected weekday within the same week
        cursor.setDate(cursor.getDate() + 1);
        break;
      case 'biweekly':
        // Same as weekly — step daily but the outer interval semantics are
        // encoded by stepping two calendar weeks when no specific day matched
        // within the current week.  Simplify: step 1 day and let the
        // days_of_week filter do the work; after finishing the week, skip
        // the next week.
        cursor.setDate(cursor.getDate() + 1);
        // If we just moved into a new week (Mon), skip the alternate week
        if (cursor.getDay() === 1 && interval > 1) {
          cursor.setDate(cursor.getDate() + 7);
        }
        break;
      case 'monthly':
        cursor.setMonth(cursor.getMonth() + interval);
        break;
      case 'yearly':
        cursor.setFullYear(cursor.getFullYear() + interval);
        break;
      default:
        cursor.setDate(cursor.getDate() + interval);
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// RecurringEventSection
// ---------------------------------------------------------------------------

export default function RecurringEventSection({ form }) {
  const [showExcludedPicker, setShowExcludedPicker] = useState(false);
  const [showManualPicker, setShowManualPicker] = useState(false);
  const [pendingExcludedDate, setPendingExcludedDate] = useState(null);
  const [pendingManualDate, setPendingManualDate] = useState(null);

  const isRepeating = form.values.event?.is_repeating || false;
  const pattern = form.values.event?.repeat_pattern || {};
  const frequency = pattern.frequency || '';
  const interval = pattern.interval || 1;
  const daysOfWeek = pattern.days_of_week || [];
  const excludedDates = form.values.event?.excluded_dates || [];
  const manualDates = form.values.event?.manual_dates || [];
  const recurrenceEndDate = form.values.event?.recurrence_end_date || null;
  const startDatetime = form.values.event?.start_datetime || null;

  // When toggling repeating ON, initialise the pattern with sensible defaults
  function handleToggleRepeating(checked) {
    form.setFieldValue('event.is_repeating', checked);
    if (checked && !form.values.event?.repeat_pattern) {
      form.setFieldValue('event.repeat_pattern', {
        frequency: 'weekly',
        interval: 1,
        days_of_week: [],
      });
    }
  }

  function handleFrequencyChange(value) {
    const current = form.values.event?.repeat_pattern || {};
    form.setFieldValue('event.repeat_pattern', {
      ...current,
      frequency: value,
      // Clear days_of_week when switching away from weekly/biweekly
      ...(WEEKLY_FREQUENCIES.includes(value) ? {} : { days_of_week: [] }),
    });
  }

  function handleIntervalChange(value) {
    const current = form.values.event?.repeat_pattern || {};
    form.setFieldValue('event.repeat_pattern', { ...current, interval: value });
  }

  function handleDaysOfWeekChange(selected) {
    const current = form.values.event?.repeat_pattern || {};
    form.setFieldValue('event.repeat_pattern', { ...current, days_of_week: selected });
  }

  function handleAddExcludedDate() {
    if (!pendingExcludedDate) return;
    const dateStr = pendingExcludedDate.toISOString().split('T')[0];
    if (!excludedDates.includes(dateStr)) {
      form.setFieldValue('event.excluded_dates', [...excludedDates, dateStr]);
    }
    setPendingExcludedDate(null);
    setShowExcludedPicker(false);
  }

  function handleRemoveExcludedDate(dateStr) {
    form.setFieldValue(
      'event.excluded_dates',
      excludedDates.filter((d) => d !== dateStr)
    );
  }

  function handleAddManualDate() {
    if (!pendingManualDate) return;
    const dateStr = pendingManualDate.toISOString().split('T')[0];
    if (!manualDates.includes(dateStr)) {
      form.setFieldValue('event.manual_dates', [...manualDates, dateStr]);
    }
    setPendingManualDate(null);
    setShowManualPicker(false);
  }

  function handleRemoveManualDate(dateStr) {
    form.setFieldValue(
      'event.manual_dates',
      manualDates.filter((d) => d !== dateStr)
    );
  }

  // Compute preview occurrences
  const previewOccurrences =
    isRepeating && startDatetime
      ? calculateNextOccurrences(
          startDatetime instanceof Date ? startDatetime : new Date(startDatetime),
          pattern,
          excludedDates
        )
      : [];

  const showDaysOfWeek = isRepeating && WEEKLY_FREQUENCIES.includes(frequency);

  return (
    <Stack>
      {/* Master toggle */}
      <Switch
        label="Repeating event"
        description="Enable if this event occurs on a recurring schedule"
        checked={isRepeating}
        onChange={(e) => handleToggleRepeating(e.currentTarget.checked)}
      />

      {isRepeating && (
        <>
          <Divider my="xs" label="Recurrence Pattern" />

          {/* Frequency + Interval row */}
          <Group align="flex-end" grow>
            <Select
              label="Frequency"
              placeholder="How often does it repeat?"
              data={REPEAT_FREQUENCY_OPTIONS}
              value={frequency || null}
              onChange={handleFrequencyChange}
            />
            <NumberInput
              label="Interval"
              description="Repeat every N periods"
              min={1}
              max={52}
              value={interval}
              onChange={handleIntervalChange}
            />
          </Group>

          {/* Day-of-week chips — only for weekly / biweekly */}
          {showDaysOfWeek && (
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                Days of the week
              </Text>
              <Chip.Group multiple value={daysOfWeek} onChange={handleDaysOfWeekChange}>
                <Group gap="xs">
                  {DAYS_OF_WEEK.map((day) => (
                    <Chip key={day} value={day} size="sm">
                      {day}
                    </Chip>
                  ))}
                </Group>
              </Chip.Group>
            </Stack>
          )}

          {/* Recurrence end date */}
          <DatePickerInput
            label="Recurrence End Date"
            description="Leave blank for no end date"
            placeholder="Pick end date"
            value={
              recurrenceEndDate
                ? recurrenceEndDate instanceof Date
                  ? recurrenceEndDate
                  : new Date(recurrenceEndDate)
                : null
            }
            onChange={(val) => form.setFieldValue('event.recurrence_end_date', val)}
            clearable
          />

          {/* ---------------------------------------------------------- */}
          {/* Excluded dates                                              */}
          {/* ---------------------------------------------------------- */}
          <Divider my="xs" label="Excluded Dates" />
          <Text size="sm" c="dimmed">
            Dates when the event does NOT occur despite falling on the recurring schedule.
          </Text>

          {excludedDates.length > 0 && (
            <Group gap="xs" wrap="wrap">
              {excludedDates.map((dateStr) => (
                <Badge
                  key={dateStr}
                  color="red"
                  variant="light"
                  rightSection={
                    <button
                      type="button"
                      onClick={() => handleRemoveExcludedDate(dateStr)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0 2px',
                        lineHeight: 1,
                      }}
                      aria-label={`Remove excluded date ${dateStr}`}
                    >
                      ×
                    </button>
                  }
                >
                  {dateStr}
                </Badge>
              ))}
            </Group>
          )}

          {showExcludedPicker ? (
            <Card withBorder p="sm">
              <Stack gap="xs">
                <DatePickerInput
                  label="Select date to exclude"
                  placeholder="Pick a date"
                  value={pendingExcludedDate}
                  onChange={setPendingExcludedDate}
                />
                <Group gap="xs">
                  <Button size="xs" onClick={handleAddExcludedDate} disabled={!pendingExcludedDate}>
                    Add
                  </Button>
                  <Button
                    size="xs"
                    variant="subtle"
                    onClick={() => {
                      setPendingExcludedDate(null);
                      setShowExcludedPicker(false);
                    }}
                  >
                    Cancel
                  </Button>
                </Group>
              </Stack>
            </Card>
          ) : (
            <Button
              variant="light"
              size="xs"
              leftSection={<IconPlus size={14} />}
              onClick={() => setShowExcludedPicker(true)}
            >
              Add Excluded Date
            </Button>
          )}

          {/* ---------------------------------------------------------- */}
          {/* Manual dates                                               */}
          {/* ---------------------------------------------------------- */}
          <Divider my="xs" label="Manual Dates" />
          <Text size="sm" c="dimmed">
            Additional one-off dates when this event occurs outside its regular schedule.
          </Text>

          {manualDates.length > 0 && (
            <Group gap="xs" wrap="wrap">
              {manualDates.map((dateStr) => (
                <Badge
                  key={dateStr}
                  color="blue"
                  variant="light"
                  rightSection={
                    <button
                      type="button"
                      onClick={() => handleRemoveManualDate(dateStr)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0 2px',
                        lineHeight: 1,
                      }}
                      aria-label={`Remove manual date ${dateStr}`}
                    >
                      ×
                    </button>
                  }
                >
                  {dateStr}
                </Badge>
              ))}
            </Group>
          )}

          {showManualPicker ? (
            <Card withBorder p="sm">
              <Stack gap="xs">
                <DatePickerInput
                  label="Select manual date"
                  placeholder="Pick a date"
                  value={pendingManualDate}
                  onChange={setPendingManualDate}
                />
                <Group gap="xs">
                  <Button size="xs" onClick={handleAddManualDate} disabled={!pendingManualDate}>
                    Add
                  </Button>
                  <Button
                    size="xs"
                    variant="subtle"
                    onClick={() => {
                      setPendingManualDate(null);
                      setShowManualPicker(false);
                    }}
                  >
                    Cancel
                  </Button>
                </Group>
              </Stack>
            </Card>
          ) : (
            <Button
              variant="light"
              size="xs"
              leftSection={<IconPlus size={14} />}
              onClick={() => setShowManualPicker(true)}
            >
              Add Manual Date
            </Button>
          )}

          {/* ---------------------------------------------------------- */}
          {/* Preview panel                                              */}
          {/* ---------------------------------------------------------- */}
          <Divider my="xs" label="Preview" />
          <Card withBorder p="md" bg="gray.0">
            <Stack gap="xs">
              <Text fw={500} size="sm">
                Next occurrences
              </Text>
              {previewOccurrences.length === 0 ? (
                <Text size="sm" c="dimmed">
                  {frequency
                    ? 'No occurrences to preview — check frequency, interval, and days of week.'
                    : 'Select a frequency to preview upcoming occurrences.'}
                </Text>
              ) : (
                previewOccurrences.map((date, i) => (
                  <Text key={i} size="sm">
                    {date.toLocaleDateString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                ))
              )}
            </Stack>
          </Card>
        </>
      )}
    </Stack>
  );
}
