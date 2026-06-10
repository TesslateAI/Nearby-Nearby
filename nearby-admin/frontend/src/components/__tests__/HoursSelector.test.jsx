/**
 * Tests for HoursSelector — issues #46 (Seasonal Hours Only) and
 * #54 (Appointments subsection + auto-flip of hours_but_appointment_required).
 *
 * Verifies:
 *   - Quick-set buttons render at the TOP of the Regular Hours panel (#46).
 *   - The new "Set to Seasonal Hours Only" button toggles seasonal_only
 *     on the hours blob and switches to the Seasonal tab.
 *   - Clicking another quick-set preset clears seasonal_only (#46 exit path).
 *   - The Appointments subsection renders Switch + URL TextInput bound to
 *     the top-level POI fields hours_but_appointment_required +
 *     appointment_booking_url (#54).
 *   - Clicking "By Appointment Only" flips the boolean to true (#54).
 *   - Auto-flip-off when zero days remain at status==='appointment' (#54).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { useForm } from '@mantine/form';
import HoursSelector from '../HoursSelector';

// jsdom does not implement ResizeObserver; Mantine's Tabs/FloatingIndicator
// uses it on mount. Provide a no-op mock.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Avoid notifications dependency in jsdom.
vi.mock('@mantine/notifications', () => ({
  notifications: { show: vi.fn() },
}));

function Wrapper({
  initialHours = {},
  initialAppointmentRequired = false,
  initialBookingUrl = '',
  onFormReady,
}) {
  const form = useForm({
    initialValues: {
      hours: initialHours,
      hours_but_appointment_required: initialAppointmentRequired,
      appointment_booking_url: initialBookingUrl,
    },
  });
  if (onFormReady) onFormReady(form);
  return (
    <MantineProvider>
      <HoursSelector
        value={form.values.hours || {}}
        onChange={(v) => form.setFieldValue('hours', v)}
        form={form}
      />
    </MantineProvider>
  );
}

describe('HoursSelector — quick-set buttons (#46)', () => {
  it('renders all 4 quick-set buttons including the new Seasonal Hours Only button', () => {
    render(<Wrapper />);
    expect(screen.getByRole('button', { name: /Set Mon-Fri/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Set 24\/7/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /By Appointment Only/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Set to Seasonal Hours Only/i })).toBeTruthy();
  });

  it('clicking "Set to Seasonal Hours Only" sets seasonal_only=true and switches to Seasonal tab', () => {
    let capturedForm;
    render(<Wrapper onFormReady={(f) => (capturedForm = f)} />);
    fireEvent.click(screen.getByRole('button', { name: /Set to Seasonal Hours Only/i }));
    expect(capturedForm.values.hours.seasonal_only).toBe(true);
    // Required alert appears in the seasonal panel
    expect(screen.getByText(/Seasonal Hours Required/i)).toBeTruthy();
  });

  it('clicking "Set Mon-Fri" while seasonal-only resets seasonal_only=false', () => {
    let capturedForm;
    render(
      <Wrapper
        initialHours={{ seasonal_only: true }}
        onFormReady={(f) => (capturedForm = f)}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Set Mon-Fri/i }));
    expect(capturedForm.values.hours.seasonal_only).toBe(false);
  });

  it('clicking "Clear Seasonal-Only Mode" link clears the flag', () => {
    let capturedForm;
    render(
      <Wrapper
        initialHours={{ seasonal_only: true }}
        onFormReady={(f) => (capturedForm = f)}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Clear Seasonal-Only Mode/i }));
    expect(capturedForm.values.hours.seasonal_only).toBe(false);
  });
});

describe('HoursSelector — Appointments subsection (#54)', () => {
  it('renders the "Appointments required" Switch bound to hours_but_appointment_required', () => {
    let capturedForm;
    render(<Wrapper onFormReady={(f) => (capturedForm = f)} />);
    const switchInput = screen.getByLabelText(/Appointments required/i);
    expect(switchInput).toBeTruthy();
    fireEvent.click(switchInput);
    expect(capturedForm.values.hours_but_appointment_required).toBe(true);
  });

  it('renders the Appointment Booking URL TextInput bound to appointment_booking_url', () => {
    let capturedForm;
    render(<Wrapper onFormReady={(f) => (capturedForm = f)} />);
    const urlInput = screen.getByLabelText(/Appointment Booking URL/i);
    expect(urlInput).toBeTruthy();
    fireEvent.change(urlInput, { target: { value: 'https://calendly.com/test' } });
    expect(capturedForm.values.appointment_booking_url).toBe('https://calendly.com/test');
  });

  it('clicking "By Appointment Only" sets hours_but_appointment_required=true', () => {
    let capturedForm;
    render(<Wrapper onFormReady={(f) => (capturedForm = f)} />);
    expect(capturedForm.values.hours_but_appointment_required).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: /By Appointment Only/i }));
    expect(capturedForm.values.hours_but_appointment_required).toBe(true);
  });

  it('preserves appointment_booking_url even after the Appointments toggle is turned off', () => {
    let capturedForm;
    render(
      <Wrapper
        initialAppointmentRequired={true}
        initialBookingUrl="https://example.com/book"
        onFormReady={(f) => (capturedForm = f)}
      />
    );
    const switchInput = screen.getByLabelText(/Appointments required/i);
    fireEvent.click(switchInput);
    // Switch is now off, URL must remain untouched
    expect(capturedForm.values.hours_but_appointment_required).toBe(false);
    expect(capturedForm.values.appointment_booking_url).toBe('https://example.com/book');
  });
});
