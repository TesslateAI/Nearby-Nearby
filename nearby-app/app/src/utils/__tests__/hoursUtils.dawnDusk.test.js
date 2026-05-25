/**
 * Tests for dawn/dusk hours fix — issue #25
 *
 * isCurrentlyOpen(hoursData, lat, lng) must correctly resolve solar-relative
 * time tokens (dawn → sunrise, dusk → sunset) so parks/trails with
 * dawn-to-dusk hours don't always show as "Closed".
 *
 * We mock SunCalc so tests are deterministic regardless of the machine's
 * actual timezone or date.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── SunCalc mock ──────────────────────────────────────────────────────────
// Sunrise 06:30, Sunset 19:45 for our fake location.
vi.mock('suncalc', () => {
  const SUNRISE_HOUR = 6;
  const SUNRISE_MIN = 30;
  const SUNSET_HOUR = 19;
  const SUNSET_MIN = 45;

  return {
    default: {
      getTimes: (_date, _lat, _lng) => {
        const base = new Date(_date);
        const sunrise = new Date(base);
        sunrise.setHours(SUNRISE_HOUR, SUNRISE_MIN, 0, 0);
        const sunset = new Date(base);
        sunset.setHours(SUNSET_HOUR, SUNSET_MIN, 0, 0);
        return { sunrise, sunset };
      },
    },
  };
});

// Must import AFTER mock is registered
import { isCurrentlyOpen } from '../hoursUtils';

// ── Helpers ───────────────────────────────────────────────────────────────

/** Freeze Date.now() to a specific local wall-clock time. */
function freezeTime(hour, minute = 0) {
  const fake = new Date();
  fake.setHours(hour, minute, 0, 0);
  vi.useFakeTimers();
  vi.setSystemTime(fake);
}

function restoreTime() {
  vi.useRealTimers();
}

/** Minimal hoursData for a dawn-to-dusk day. */
function dawnDuskHours(dayOverride = {}) {
  const today = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayKey = dayNames[today.getDay()];

  const period = {
    open: { type: 'dawn' },
    close: { type: 'dusk' },
  };

  return {
    regular: {
      [todayKey]: { status: 'open', periods: [period], ...dayOverride },
    },
  };
}

/** hoursData where today is fixed hours, tomorrow is dawn-to-dusk. */
function mixedHours() {
  const today = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayKey = dayNames[today.getDay()];
  const tomorrowKey = dayNames[(today.getDay() + 1) % 7];

  return {
    regular: {
      [todayKey]: {
        status: 'open',
        periods: [{ open: { type: 'fixed', time: '08:00' }, close: { type: 'fixed', time: '17:00' } }],
      },
      [tomorrowKey]: {
        status: 'open',
        periods: [{ open: { type: 'dawn' }, close: { type: 'dusk' } }],
      },
    },
  };
}

// NC coordinates (Research Triangle area)
const LAT = 35.7796;
const LNG = -78.6382;

// ── Tests ─────────────────────────────────────────────────────────────────

describe('isCurrentlyOpen — dawn/dusk fix (#25)', () => {
  afterEach(() => restoreTime());

  // ── Core regression: dawn-to-dusk park/trail ──────────────────────────

  it('returns isOpen=true at midday for a dawn-to-dusk POI', () => {
    freezeTime(12, 0); // noon
    const result = isCurrentlyOpen(dawnDuskHours(), LAT, LNG);
    expect(result.isOpen).toBe(true);
  });

  it('returns isOpen=true just after mocked sunrise (06:31)', () => {
    freezeTime(6, 31);
    const result = isCurrentlyOpen(dawnDuskHours(), LAT, LNG);
    expect(result.isOpen).toBe(true);
  });

  it('returns isOpen=true in the late afternoon (18:00)', () => {
    freezeTime(18, 0);
    const result = isCurrentlyOpen(dawnDuskHours(), LAT, LNG);
    expect(result.isOpen).toBe(true);
  });

  it('returns isOpen=false before sunrise (05:00)', () => {
    freezeTime(5, 0);
    const result = isCurrentlyOpen(dawnDuskHours(), LAT, LNG);
    expect(result.isOpen).toBe(false);
  });

  it('returns isOpen=false after sunset (20:00)', () => {
    freezeTime(20, 0);
    const result = isCurrentlyOpen(dawnDuskHours(), LAT, LNG);
    expect(result.isOpen).toBe(false);
  });

  it('returns isOpen=false at midnight', () => {
    freezeTime(0, 0);
    const result = isCurrentlyOpen(dawnDuskHours(), LAT, LNG);
    expect(result.isOpen).toBe(false);
  });

  // ── No-coordinates fallback: honest unknown, NOT false "open" ─────────

  it('returns "Hours vary by season" when lat/lng missing for a dawn-to-dusk POI', () => {
    freezeTime(12, 0);
    const result = isCurrentlyOpen(dawnDuskHours());
    expect(result.isOpen).toBe(false);
    expect(result.status).toBe('Hours vary by season');
  });

  it('returns "Hours vary by season" when coords are null explicitly', () => {
    freezeTime(12, 0);
    const result = isCurrentlyOpen(dawnDuskHours(), null, null);
    expect(result.isOpen).toBe(false);
    expect(result.status).toBe('Hours vary by season');
  });

  // ── Mixed schedule: today fixed hours, tomorrow dawn-to-dusk ─────────

  it('evaluates today fixed hours correctly (open during window)', () => {
    freezeTime(10, 0); // inside 08:00–17:00
    const result = isCurrentlyOpen(mixedHours(), LAT, LNG);
    expect(result.isOpen).toBe(true);
  });

  it('evaluates today fixed hours correctly (closed outside window)', () => {
    freezeTime(18, 0); // outside 08:00–17:00
    const result = isCurrentlyOpen(mixedHours(), LAT, LNG);
    expect(result.isOpen).toBe(false);
  });

  // ── Fixed-only periods still work (regression guard) ──────────────────

  it('still handles fixed/fixed periods correctly when open', () => {
    freezeTime(10, 0);
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayKey = dayNames[today.getDay()];

    const hours = {
      regular: {
        [todayKey]: {
          status: 'open',
          periods: [{ open: { type: 'fixed', time: '09:00' }, close: { type: 'fixed', time: '17:00' } }],
        },
      },
    };

    const result = isCurrentlyOpen(hours, LAT, LNG);
    expect(result.isOpen).toBe(true);
  });

  it('still handles fixed/fixed periods correctly when closed', () => {
    freezeTime(8, 0); // before 09:00
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayKey = dayNames[today.getDay()];

    const hours = {
      regular: {
        [todayKey]: {
          status: 'open',
          periods: [{ open: { type: 'fixed', time: '09:00' }, close: { type: 'fixed', time: '17:00' } }],
        },
      },
    };

    const result = isCurrentlyOpen(hours, LAT, LNG);
    expect(result.isOpen).toBe(false);
  });

  // ── Special statuses unaffected ───────────────────────────────────────

  it('returns isOpen=true for 24hours status', () => {
    freezeTime(3, 0);
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayKey = dayNames[today.getDay()];
    const hours = { regular: { [todayKey]: { status: '24hours' } } };
    const result = isCurrentlyOpen(hours, LAT, LNG);
    expect(result.isOpen).toBe(true);
    expect(result.status).toBe('Open 24 Hours');
  });

  it('returns isOpen=false for appointment status', () => {
    freezeTime(12, 0);
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayKey = dayNames[today.getDay()];
    const hours = { regular: { [todayKey]: { status: 'appointment' } } };
    const result = isCurrentlyOpen(hours, LAT, LNG);
    expect(result.isOpen).toBe(false);
    expect(result.status).toBe('By Appointment Only');
  });

  it('returns isOpen=false for null hoursData', () => {
    const result = isCurrentlyOpen(null, LAT, LNG);
    expect(result.isOpen).toBe(false);
    expect(result.status).toBe('unknown');
  });

  // ── GeoJSON coordinate ordering ───────────────────────────────────────

  it('correctly interprets GeoJSON [lng, lat] ordering from poi.location.coordinates', () => {
    // SunCalc mock ignores actual coords, but we verify the calling pattern:
    // coordinates[0] = lng, coordinates[1] = lat
    freezeTime(12, 0);
    const coords = [-78.6382, 35.7796]; // [lng, lat]
    const lat = coords[1];
    const lng = coords[0];
    const result = isCurrentlyOpen(dawnDuskHours(), lat, lng);
    expect(result.isOpen).toBe(true);
  });
});
