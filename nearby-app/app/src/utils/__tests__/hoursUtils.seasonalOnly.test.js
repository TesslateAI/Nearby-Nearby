/**
 * Tests for seasonal_only gating — issue #46
 *
 * When `hours.seasonal_only === true`, getEffectiveHoursForDate MUST NOT fall
 * back to regular hours. Instead:
 *   - If an active seasonal period exists for today → return that period.
 *   - If NO active seasonal period exists → return Closed (label references
 *     the seasonal schedule). Do not leak stale regular hours.
 *
 * When `hours.seasonal_only === false`, the legacy regular-hours fallback
 * must still work.
 */

import { describe, it, expect } from 'vitest';
import { getEffectiveHoursForDate } from '../hoursUtils';

const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

/** Build a regular-hours block where every day is open 9-5. */
function regular9to5() {
  const regular = {};
  for (const d of DAY_NAMES) {
    regular[d] = {
      status: 'open',
      periods: [
        {
          open: { type: 'fixed', time: '09:00' },
          close: { type: 'fixed', time: '17:00' },
        },
      ],
    };
  }
  return regular;
}

/**
 * Build seasonal hours that include the given month (1-12). The 'summer'
 * season covers June/July/August in the active-season detector — passing
 * a July date will trigger it.
 */
function summerSeasonal(openTime = '10:00', closeTime = '20:00') {
  const seasonal = { summer: {} };
  for (const d of DAY_NAMES) {
    seasonal.summer[d] = {
      status: 'open',
      periods: [
        {
          open: { type: 'fixed', time: openTime },
          close: { type: 'fixed', time: closeTime },
        },
      ],
    };
  }
  return seasonal;
}

describe('getEffectiveHoursForDate — seasonal_only gating (#46)', () => {
  it('returns the active seasonal period when seasonal_only=true and a season is active', () => {
    const julyDate = new Date(2026, 6, 15); // July 15, 2026 — summer
    const hoursData = {
      regular: regular9to5(),
      seasonal: summerSeasonal('10:00', '20:00'),
      seasonal_only: true,
    };

    const result = getEffectiveHoursForDate(hoursData, julyDate);

    expect(result.source).toBe('seasonal');
    expect(result.hours.status).toBe('open');
    // Confirm we received the SEASONAL hours, not the regular 9-5.
    expect(result.hours.periods[0].open.time).toBe('10:00');
    expect(result.hours.periods[0].close.time).toBe('20:00');
  });

  it('returns Closed when seasonal_only=true and NO seasonal period is active', () => {
    // January is not in any defined season range (winter covers Dec/Jan/Feb in
    // SEASON_DEFINITIONS, but only if seasonal.winter exists — we only define
    // summer here, so January has no active season).
    const januaryDate = new Date(2026, 0, 15); // January 15, 2026
    const hoursData = {
      regular: regular9to5(),
      seasonal: summerSeasonal(),
      seasonal_only: true,
    };

    const result = getEffectiveHoursForDate(hoursData, januaryDate);

    expect(result.source).toBe('seasonal');
    expect(result.hours.status).toBe('closed');
    // Must NOT return the stale regular hours.
    expect(result.hours.periods).toBeUndefined();
    // Label should reference the seasonal schedule so consumers can
    // distinguish from a genuine "closed today" entry.
    expect(result.label).toMatch(/seasonal/i);
  });

  it('falls back to regular hours when seasonal_only=false (legacy behavior preserved)', () => {
    const januaryDate = new Date(2026, 0, 15); // January 15, 2026
    const hoursData = {
      regular: regular9to5(),
      seasonal: summerSeasonal(),
      seasonal_only: false,
    };

    const result = getEffectiveHoursForDate(hoursData, januaryDate);

    expect(result.source).toBe('regular');
    expect(result.hours.status).toBe('open');
    expect(result.hours.periods[0].open.time).toBe('09:00');
    expect(result.hours.periods[0].close.time).toBe('17:00');
  });

  it('falls back to regular hours when seasonal_only is missing entirely (default behavior)', () => {
    const januaryDate = new Date(2026, 0, 15);
    const hoursData = {
      regular: regular9to5(),
      seasonal: summerSeasonal(),
      // no seasonal_only key at all
    };

    const result = getEffectiveHoursForDate(hoursData, januaryDate);

    expect(result.source).toBe('regular');
    expect(result.hours.status).toBe('open');
  });

  it('still uses an active seasonal period over regular when seasonal_only=false (precedence unchanged)', () => {
    const julyDate = new Date(2026, 6, 15);
    const hoursData = {
      regular: regular9to5(),
      seasonal: summerSeasonal('11:00', '21:00'),
      seasonal_only: false,
    };

    const result = getEffectiveHoursForDate(hoursData, julyDate);

    expect(result.source).toBe('seasonal');
    expect(result.hours.periods[0].open.time).toBe('11:00');
    expect(result.hours.periods[0].close.time).toBe('21:00');
  });
});
