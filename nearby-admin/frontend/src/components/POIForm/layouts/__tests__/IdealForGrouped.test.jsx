import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IdealForGrouped } from '../_shared';

// ---------------------------------------------------------------------------
// jsdom polyfill — Mantine v8 components touch ResizeObserver.
// ---------------------------------------------------------------------------
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// ---------------------------------------------------------------------------
// TestWrapper — wraps IdealForGrouped with a real @mantine/form instance so
// the component's setFieldValue calls actually persist between assertions.
// ---------------------------------------------------------------------------
function TestWrapper({ listingType, initialIdealFor }) {
  const form = useForm({
    initialValues: {
      ideal_for: initialIdealFor || {
        atmosphere: [],
        age_group: [],
        social_settings: [],
        local_special: [],
        special_needs: [],
      },
    },
  });

  return (
    <MantineProvider>
      <IdealForGrouped form={form} listingType={listingType} />
    </MantineProvider>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function expectAllGroupsPresent() {
  // Use group test ids because option labels overlap and SimpleGrid wraps each.
  expect(screen.getByTestId('ideal-for-group-atmosphere')).toBeInTheDocument();
  expect(screen.getByTestId('ideal-for-group-age_group')).toBeInTheDocument();
  expect(screen.getByTestId('ideal-for-group-social_settings')).toBeInTheDocument();
  expect(screen.getByTestId('ideal-for-group-local_special')).toBeInTheDocument();
  expect(screen.getByTestId('ideal-for-group-special_needs')).toBeInTheDocument();
}

function clickCheckboxesUntilCap(cap) {
  // Click first N "Atmosphere" options to trigger the cap.
  const group = screen.getByTestId('ideal-for-group-atmosphere');
  const checkboxes = within(group).getAllByRole('checkbox');
  for (let i = 0; i < cap; i++) {
    fireEvent.click(checkboxes[i]);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('IdealForGrouped (Issue #43 unified checkbox grid)', () => {
  beforeEach(() => {
    // Each test gets a fresh component tree.
  });

  it('renders all 5 groups when listingType="Business Paid"', () => {
    render(<TestWrapper listingType="Business Paid" />);
    expectAllGroupsPresent();
    // No cap counter on Business Paid (unlimited).
    expect(screen.queryByTestId('ideal-for-cap-counter')).not.toBeInTheDocument();
  });

  it('hides all groups when listingType="Park" (Park does not show Ideal For)', () => {
    render(<TestWrapper listingType="Park" />);
    expect(screen.queryByTestId('ideal-for-group-atmosphere')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ideal-for-group-age_group')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ideal-for-group-social_settings')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ideal-for-group-local_special')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ideal-for-group-special_needs')).not.toBeInTheDocument();
    expect(screen.queryByText('Ideal For')).not.toBeInTheDocument();
  });

  it('hides all groups when listingType="Trail" (Trail does not show Ideal For)', () => {
    render(<TestWrapper listingType="Trail" />);
    expect(screen.queryByTestId('ideal-for-group-atmosphere')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ideal-for-group-age_group')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ideal-for-group-social_settings')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ideal-for-group-local_special')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ideal-for-group-special_needs')).not.toBeInTheDocument();
    expect(screen.queryByText('Ideal For')).not.toBeInTheDocument();
  });

  it('enforces 5-item total cap when listingType="Business Free"', () => {
    render(<TestWrapper listingType="Business Free" />);
    expectAllGroupsPresent();

    // Cap counter starts at 0 / 5.
    expect(screen.getByTestId('ideal-for-cap-counter')).toHaveTextContent('0 / 5 selected');

    // Click 5 checkboxes — should hit the cap.
    clickCheckboxesUntilCap(5);
    expect(screen.getByTestId('ideal-for-cap-counter')).toHaveTextContent('5 / 5 selected');

    // The 6th option (still in Atmosphere) must now be disabled.
    const group = screen.getByTestId('ideal-for-group-atmosphere');
    const checkboxes = within(group).getAllByRole('checkbox');
    const sixth = checkboxes[5];
    expect(sixth).toBeDisabled();

    // Clicking the sixth must NOT increment the counter.
    fireEvent.click(sixth);
    expect(screen.getByTestId('ideal-for-cap-counter')).toHaveTextContent('5 / 5 selected');
  });

  it('enforces 10-item total cap when listingType="Event"', () => {
    render(<TestWrapper listingType="Event" />);
    expectAllGroupsPresent();

    expect(screen.getByTestId('ideal-for-cap-counter')).toHaveTextContent('0 / 10 selected');

    // Atmosphere has 22 options — pick 10 from it to hit the cap.
    clickCheckboxesUntilCap(10);
    expect(screen.getByTestId('ideal-for-cap-counter')).toHaveTextContent('10 / 10 selected');

    const group = screen.getByTestId('ideal-for-group-atmosphere');
    const eleventh = within(group).getAllByRole('checkbox')[10];
    expect(eleventh).toBeDisabled();
  });

  it('allows unchecking once cap is reached (disabled only applies to unchecked options)', () => {
    render(<TestWrapper listingType="Business Free" />);
    clickCheckboxesUntilCap(5);
    expect(screen.getByTestId('ideal-for-cap-counter')).toHaveTextContent('5 / 5 selected');

    // Uncheck the first one to free up capacity.
    const group = screen.getByTestId('ideal-for-group-atmosphere');
    const first = within(group).getAllByRole('checkbox')[0];
    fireEvent.click(first);
    expect(screen.getByTestId('ideal-for-cap-counter')).toHaveTextContent('4 / 5 selected');
  });
});
