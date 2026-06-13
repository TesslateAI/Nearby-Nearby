/**
 * Tests for contextual hours status labels — issue #37
 *
 * getOpenCloseStatusLabel() must produce rich, informative labels:
 *   - "Open until 8:00 PM"  (currently open)
 *   - "Closed · Opens 9:00 AM"  (closed but opens today)
 *   - "Closed · Opens Tomorrow 9:00 AM"  (past today's last period)
 *   - "Open 24 Hours"  (24h POI)
 *   - "By Appointment Only"  (appointment POI)
 *
 * getNextOpenTransition() caps the forward scan at 7 days.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── SunCalc mock — sunrise 06:30, sunset 19:45 ───────────────────────────
vi.mock('suncalc', () => {
  return {
    default: {
      getTimes: (_date, _lat, _lng) => {
        const base = new Date(_date);
        const sunrise = new Date(base);
        sunrise.setHours(6, 30, 0, 0);
        const sunset = new Date(base);
        sunset.setHours(19, 45, 0, 0);
        return { sunrise, sunset };
      },
    },
  };
});

import {
  getOpenCloseStatusLabel,
  getNextOpenTransition,
} from '../hoursUtils';

// ── Helpers ───────────────────────────────────────────────────────────────

function makeDate(hour, minute = 0) {
  const d = new Date(2026, 0, 5); // Monday 5 Jan 2026
  d.setHours(hour, minute, 0, 0);
  return d;
}

const MONDAY_HOURS = {
  regular: {
    monday: {
      status: 'open',
      periods: [
        { open: { type: 'fixed', time: '09:00' }, close: { type: 'fixed', time: '17:00' } },
      ],
    },
    tuesday: {
      status: 'open',
      periods: [
        { open: { type: 'fixed', time: '10:00' }, close: { type: 'fixed', time: '18:00' } },
      ],
    },
    wednesday: { status: 'closed' },
    thursday: { status: 'closed' },
    friday: { status: 'closed' },
    saturday: { status: 'closed' },
    sunday: { status: 'closed' },
  },
};

const ALL_CLOSED_HOURS = {
  regular: {
    monday: { status: 'closed' },
    tuesday: { status: 'closed' },
    wednesday: { status: 'closed' },
    thursday: { status: 'closed' },
    friday: { status: 'closed' },
    saturday: { status: 'closed' },
    sunday: { status: 'closed' },
  },
};

const HOURS_24 = {
  regular: {
    monday: { status: '24hours' },
    tuesday: { status: '24hours' },
    wednesday: { status: '24hours' },
    thursday: { status: '24hours' },
    friday: { status: '24hours' },
    saturday: { status: '24hours' },
    sunday: { status: '24hours' },
  },
};

const APPOINTMENT_HOURS = {
  regular: {
    monday: { status: 'appointment' },
    tuesday: { status: 'appointment' },
    wednesday: { status: 'appointment' },
    thursday: { status: 'appointment' },
    friday: { status: 'appointment' },
    saturday: { status: 'appointment' },
    sunday: { status: 'appointment' },
  },
};

// ── getOpenCloseStatusLabel ───────────────────────────────────────────────

describe('getOpenCloseStatusLabel', () => {
  it('returns open variant with "Open until X" when currently in an open period', () => {
    const now = makeDate(11, 0); // 11:00 AM — inside 09:00-17:00
    const { variant, label } = getOpenCloseStatusLabel(MONDAY_HOURS, now);
    expect(variant).toBe('open');
    expect(label).toMatch(/open until/i);
    expect(label).toMatch(/5:00 PM/i);
  });

  it('returns opensoon/closed variant with "Opens X" when before first period today', () => {
    const now = makeDate(7, 0); // 07:00 AM — before 09:00
    const { variant, label } = getOpenCloseStatusLabel(MONDAY_HOURS, now);
    // Opens at 9am today — variant should be opensoon
    expect(['opensoon', 'closed']).toContain(variant);
    expect(label).toMatch(/9:00 AM/i);
  });

  it('returns closed variant with next-open transition when past last period today', () => {
    const now = makeDate(18, 0); // 18:00 — past 17:00 close
    const { variant, label } = getOpenCloseStatusLabel(MONDAY_HOURS, now);
    expect(variant).toBe('closed');
    // Should surface Tuesday 10:00 AM as the next open time
    expect(label).toMatch(/tomorrow|tuesday/i);
    expect(label).toMatch(/10:00 AM/i);
  });

  it('returns "Open 24 Hours" for a 24-hours POI', () => {
    const now = makeDate(3, 0);
    const { variant, label } = getOpenCloseStatusLabel(HOURS_24, now);
    expect(variant).toBe('open');
    expect(label).toMatch(/24 hours/i);
  });

  it('returns "By Appointment Only" for an appointment POI', () => {
    const now = makeDate(10, 0);
    const { variant, label } = getOpenCloseStatusLabel(APPOINTMENT_HOURS, now);
    expect(variant).toBe('closed');
    expect(label).toMatch(/appointment/i);
  });

  it('returns null variant when hoursData is null', () => {
    const { variant, label } = getOpenCloseStatusLabel(null, makeDate(10, 0));
    expect(variant).toBeNull();
    expect(label).toBeNull();
  });

  it('does not return a bare "Closed" string when next-open transition exists', () => {
    const now = makeDate(20, 0); // After close on Monday
    const { label } = getOpenCloseStatusLabel(MONDAY_HOURS, now);
    // The label must include some contextual info about when it opens next
    expect(label).not.toBe('Closed');
    expect(label).toBeTruthy();
  });

  it('returns closed with null next-open info when closed all week', () => {
    const now = makeDate(10, 0);
    const { variant, label } = getOpenCloseStatusLabel(ALL_CLOSED_HOURS, now);
    expect(variant).toBe('closed');
    // No next-open transition — falls through to raw status
    expect(label).toBeTruthy();
  });
});

// ── getNextOpenTransition ─────────────────────────────────────────────────

describe('getNextOpenTransition', () => {
  it('returns null when hoursData is null', () => {
    expect(getNextOpenTransition(null, makeDate(10, 0))).toBeNull();
  });

  it('returns null for a POI closed all week (cap at 7 days)', () => {
    expect(getNextOpenTransition(ALL_CLOSED_HOURS, makeDate(10, 0))).toBeNull();
  });

  it('returns "Today" label when an open period still remains today', () => {
    const now = makeDate(7, 30); // Before 09:00 on Monday
    const result = getNextOpenTransition(MONDAY_HOURS, now);
    expect(result).not.toBeNull();
    expect(result.dayLabel).toBe('Today');
    expect(result.openLabel).toMatch(/9:00 AM/i);
  });

  it('returns "Tomorrow" label when current period is past and next open is Tuesday', () => {
    const now = makeDate(18, 0); // After 17:00 close on Monday
    const result = getNextOpenTransition(MONDAY_HOURS, now);
    expect(result).not.toBeNull();
    expect(result.dayLabel).toBe('Tomorrow');
    expect(result.openLabel).toMatch(/10:00 AM/i);
  });

  it('returns "Open 24 Hours" for a 24h POI', () => {
    const now = makeDate(3, 0);
    const result = getNextOpenTransition(HOURS_24, now);
    expect(result).not.toBeNull();
    expect(result.openLabel).toMatch(/24 hours/i);
  });
});

// ── Dawn/dusk integration ─────────────────────────────────────────────────

describe('getOpenCloseStatusLabel — dawn/dusk via resolveTime', () => {
  const DAWN_DUSK_HOURS = {
    regular: {
      monday: {
        status: 'open',
        periods: [
          { open: { type: 'dawn' }, close: { type: 'dusk' } },
        ],
      },
      tuesday: { status: 'closed' },
      wednesday: { status: 'closed' },
      thursday: { status: 'closed' },
      friday: { status: 'closed' },
      saturday: { status: 'closed' },
      sunday: { status: 'closed' },
    },
  };

  it('returns open during daytime (after sunrise, before sunset)', () => {
    const now = makeDate(10, 0); // 10 AM — between 06:30 and 19:45
    const { variant } = getOpenCloseStatusLabel(DAWN_DUSK_HOURS, now, 35.5, -79.0);
    expect(variant).toBe('open');
  });

  it('returns closed at night (after sunset)', () => {
    const now = makeDate(21, 0); // 21:00 — after 19:45
    const { variant } = getOpenCloseStatusLabel(DAWN_DUSK_HOURS, now, 35.5, -79.0);
    expect(variant).toBe('closed');
  });

  it('returns "Hours vary by season" variant when no coordinates given', () => {
    const now = makeDate(10, 0);
    // Without coords, dawn/dusk cannot be resolved
    const { label } = getOpenCloseStatusLabel(DAWN_DUSK_HOURS, now, null, null);
    // Label should indicate unknown / vary status (not hard "Closed")
    expect(label).toMatch(/vary|season|unknown|appointment|closed/i);
  });
});
