import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { useForm } from '@mantine/form';
import VenueInheritanceControls from '../VenueInheritanceControls';

// Mantine v8 SegmentedControl uses FloatingIndicator which calls ResizeObserver.
// jsdom does not implement it, so we provide a minimal stub here.
beforeAll(() => {
  if (typeof window.ResizeObserver === 'undefined') {
    window.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});

// ---------------------------------------------------------------------------
// TestWrapper — provides a real Mantine form so props mirror actual usage
// ---------------------------------------------------------------------------

function TestWrapper({ venuePoiId = null, venueInheritance = null }) {
  const form = useForm({
    initialValues: {
      event: {
        venue_poi_id: venuePoiId,
        venue_inheritance: venueInheritance,
      },
    },
  });
  return (
    <MantineProvider>
      <VenueInheritanceControls form={form} />
    </MantineProvider>
  );
}

/**
 * A stateful wrapper used for interaction tests — the form state can change
 * after user interaction (e.g., clicking a SegmentedControl button).
 */
function InteractiveWrapper({ venuePoiId = 'venue-123', venueInheritance = null }) {
  const form = useForm({
    initialValues: {
      event: {
        venue_poi_id: venuePoiId,
        venue_inheritance: venueInheritance,
      },
    },
  });
  return (
    <MantineProvider>
      <VenueInheritanceControls form={form} />
      {/* Expose current form values for assertions */}
      <pre data-testid="form-values">{JSON.stringify(form.values.event.venue_inheritance)}</pre>
    </MantineProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('VenueInheritanceControls', () => {
  it('renders nothing when no venue is selected (venue_poi_id is null)', () => {
    render(<TestWrapper venuePoiId={null} />);
    // The component returns null — no venue data inheritance heading should appear
    expect(screen.queryByText('Venue Data Inheritance')).not.toBeInTheDocument();
  });

  it('renders nothing when venue_poi_id is an empty string', () => {
    render(<TestWrapper venuePoiId="" />);
    expect(screen.queryByText('Venue Data Inheritance')).not.toBeInTheDocument();
  });

  it('renders section controls when a venue is selected (venue_poi_id is set)', () => {
    render(<TestWrapper venuePoiId="venue-abc-123" />);
    expect(screen.getByText('Venue Data Inheritance')).toBeInTheDocument();
  });

  it('shows all 7 section labels when a venue is selected', () => {
    render(<TestWrapper venuePoiId="venue-abc-123" />);

    expect(screen.getByText('Address & Location')).toBeInTheDocument();
    expect(screen.getByText('Parking')).toBeInTheDocument();
    expect(screen.getByText('Accessibility')).toBeInTheDocument();
    expect(screen.getByText('Restrooms')).toBeInTheDocument();
    expect(screen.getByText('Contact Info')).toBeInTheDocument();
    expect(screen.getByText('Hours')).toBeInTheDocument();
    expect(screen.getByText('Amenities')).toBeInTheDocument();
  });

  it('defaults all sections to "as_is" when venue_inheritance is null', () => {
    render(<TestWrapper venuePoiId="venue-abc-123" venueInheritance={null} />);

    // There should be 7 SegmentedControls. Each defaults to "Use As Is".
    // Mantine SegmentedControl marks the active label button with data-active="true".
    // We scope to <label> elements (the visible buttons) to avoid counting hidden inputs.
    const activeLabels = document.querySelectorAll('label[data-active="true"]');
    // All 7 sections should have their "Use As Is" label active
    expect(activeLabels.length).toBe(7);

    // Verify each active label's text is "Use As Is"
    activeLabels.forEach((label) => {
      expect(label.textContent).toBe('Use As Is');
    });
  });

  it('reflects an existing venue_inheritance value in the SegmentedControl', () => {
    render(
      <TestWrapper
        venuePoiId="venue-abc-123"
        venueInheritance={{ parking: 'use_and_add', accessibility: 'do_not_use' }}
      />,
    );

    // The "Use & Add" button in the parking row should be active
    const activeButtons = Array.from(document.querySelectorAll('[data-active="true"]'));
    const activeLabels = activeButtons.map((btn) => btn.textContent);

    expect(activeLabels).toContain('Use & Add');
    expect(activeLabels).toContain("Don't Use");
  });

  it('each section has a SegmentedControl with 3 options', () => {
    render(<TestWrapper venuePoiId="venue-abc-123" />);

    // VENUE_INHERITANCE_MODES has 3 entries: as_is, use_and_add, do_not_use
    const useAsIsButtons = screen.getAllByRole('radio', { name: 'Use As Is' });
    const useAndAddButtons = screen.getAllByRole('radio', { name: 'Use & Add' });
    const doNotUseButtons = screen.getAllByRole('radio', { name: "Don't Use" });

    expect(useAsIsButtons.length).toBe(7);
    expect(useAndAddButtons.length).toBe(7);
    expect(doNotUseButtons.length).toBe(7);
  });

  it('changing the mode for a section updates form values correctly', () => {
    render(<InteractiveWrapper venuePoiId="venue-abc-123" venueInheritance={null} />);

    // Click the "Use & Add" option for the first SegmentedControl (address section).
    // getAllByRole('radio') returns all radio inputs for SegmentedControls.
    const useAndAddInputs = screen.getAllByRole('radio', { name: 'Use & Add' });
    // The first "Use & Add" input corresponds to the first section (address)
    fireEvent.click(useAndAddInputs[0]);

    const formValues = JSON.parse(
      screen.getByTestId('form-values').textContent,
    );
    expect(formValues.address).toBe('use_and_add');
  });

  it('changing mode for parking section only updates parking, not other sections', () => {
    render(<InteractiveWrapper venuePoiId="venue-abc-123" venueInheritance={null} />);

    // VENUE_INHERITANCE_SECTIONS order: address, parking, accessibility, restrooms, contact, hours, amenities
    // Index 1 = parking section
    const doNotUseInputs = screen.getAllByRole('radio', { name: "Don't Use" });
    fireEvent.click(doNotUseInputs[1]); // parking row

    const formValues = JSON.parse(
      screen.getByTestId('form-values').textContent,
    );
    expect(formValues.parking).toBe('do_not_use');
    // Other sections should remain unchanged (not present means defaults to as_is)
    expect(formValues.address).toBeUndefined();
    expect(formValues.accessibility).toBeUndefined();
  });
});
