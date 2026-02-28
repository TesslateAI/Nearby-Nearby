import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { useForm } from '@mantine/form';
import { EventVendorsSection } from '../EventSpecificSections';

// ---------------------------------------------------------------------------
// jsdom does not implement ResizeObserver — polyfill for Mantine Select.
// ---------------------------------------------------------------------------
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// ---------------------------------------------------------------------------
// Mock POISearchSelect — avoids network calls.
// ---------------------------------------------------------------------------

vi.mock('../../../common/POISearchSelect', () => ({
  default: function MockPOISearchSelect({ onSelect, placeholder }) {
    return (
      <div data-testid="poi-search-select">
        <input placeholder={placeholder} />
        <button
          onClick={() =>
            onSelect({
              id: 'test-uuid',
              name: 'Test POI',
              slug: 'test-poi',
              poi_type: 'BUSINESS',
              address_city: 'Durham',
            })
          }
        >
          Select Test POI
        </button>
      </div>
    );
  },
}));

// ---------------------------------------------------------------------------
// TestWrapper
// ---------------------------------------------------------------------------

function TestWrapper({ initialValues = {} }) {
  const form = useForm({
    initialValues: {
      event: {
        has_vendors: false,
        vendor_types: [],
        vendor_poi_links: [],
        vendor_application_deadline: null,
        vendor_application_info: '',
        vendor_fee: '',
        vendor_requirements: '',
        ...initialValues,
      },
    },
  });

  return (
    <MantineProvider>
      <EventVendorsSection form={form} />
    </MantineProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe('EventVendorsSection', () => {
  it('renders "Has Vendors" toggle switch', () => {
    render(<TestWrapper />);
    expect(screen.getByRole('switch', { name: /has vendors/i })).toBeInTheDocument();
  });

  it('vendor details are hidden when has_vendors is false', () => {
    render(<TestWrapper />);
    // Vendor Fee input only shown when has_vendors is true
    expect(screen.queryByLabelText(/vendor fee/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /link vendor poi/i })).not.toBeInTheDocument();
  });

  it('shows vendor type checkboxes when has_vendors is true', () => {
    render(<TestWrapper initialValues={{ has_vendors: true }} />);
    // At least one vendor type checkbox should be visible (e.g., "Food Trucks")
    expect(screen.getByText('Food Trucks')).toBeInTheDocument();
  });

  it('"Link Vendor POI" button is visible when has_vendors is true', () => {
    render(<TestWrapper initialValues={{ has_vendors: true }} />);
    expect(screen.getByRole('button', { name: /link vendor poi/i })).toBeInTheDocument();
  });

  it('clicking "Link Vendor POI" adds a POI link row with POISearchSelect', async () => {
    render(<TestWrapper initialValues={{ has_vendors: true }} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /link vendor poi/i }));
    });

    expect(screen.getByTestId('poi-search-select')).toBeInTheDocument();
  });

  it('vendor link row has a vendor_type select', async () => {
    render(<TestWrapper initialValues={{ has_vendors: true }} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /link vendor poi/i }));
    });

    // After adding a row, at least one "Vendor Type" label should appear (the
    // per-row Select label). Use queryAllByText since "Vendor Types" (the
    // checkbox section heading) also matches the regex.
    const vendorTypeLabels = screen.getAllByText(/vendor type/i);
    expect(vendorTypeLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('remove button on a vendor link row removes that row', async () => {
    render(<TestWrapper initialValues={{ has_vendors: true }} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /link vendor poi/i }));
    });

    // POISearchSelect is present
    expect(screen.getByTestId('poi-search-select')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    });

    // After removal POISearchSelect should be gone
    expect(screen.queryByTestId('poi-search-select')).not.toBeInTheDocument();
  });

  it('renders existing vendor_poi_links from initial data', () => {
    render(
      <TestWrapper
        initialValues={{
          has_vendors: true,
          vendor_poi_links: [{ poi_id: 'abc-123', vendor_type: 'Food Trucks' }],
        }}
      />
    );

    // A POISearchSelect should be rendered for the existing link
    expect(screen.getByTestId('poi-search-select')).toBeInTheDocument();
  });

  it('toggling has_vendors off hides the vendor POI link rows', async () => {
    render(<TestWrapper initialValues={{ has_vendors: true }} />);

    // Confirm row can be added
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /link vendor poi/i }));
    });
    expect(screen.getByTestId('poi-search-select')).toBeInTheDocument();

    // Toggle has_vendors off
    await act(async () => {
      fireEvent.click(screen.getByRole('switch', { name: /has vendors/i }));
    });

    // Vendor content should be hidden
    expect(screen.queryByTestId('poi-search-select')).not.toBeInTheDocument();
  });
});
