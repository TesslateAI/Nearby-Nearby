import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { useForm } from '@mantine/form';
import { EventSponsorsSection } from '../EventSpecificSections';

// ---------------------------------------------------------------------------
// jsdom does not implement ResizeObserver, which is required by Mantine's
// Select dropdown (ScrollArea).  Polyfill it globally for this test file.
// ---------------------------------------------------------------------------
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// ---------------------------------------------------------------------------
// Mock POISearchSelect — avoids network calls, exposes a simple button that
// fires onSelect with a predictable POI payload.
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
// TestWrapper — provides a real Mantine form so the component can call
// form.setFieldValue, form.values, etc. without mocking the form API.
// ---------------------------------------------------------------------------

function TestWrapper({ initialSponsors = [] }) {
  const form = useForm({
    initialValues: {
      event: { sponsors: initialSponsors },
    },
  });

  return (
    <MantineProvider>
      <EventSponsorsSection form={form} />
    </MantineProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe('EventSponsorsSection', () => {
  it('renders "Add Sponsor" button', () => {
    render(<TestWrapper />);
    expect(screen.getByRole('button', { name: /add sponsor/i })).toBeInTheDocument();
  });

  it('clicking "Add Sponsor" adds a new sponsor row', async () => {
    render(<TestWrapper />);

    // No sponsor rows (no Switch) initially
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add sponsor/i }));
    });

    // After adding, a Switch should appear for toggling POI link vs manual
    expect(screen.getAllByRole('switch').length).toBeGreaterThanOrEqual(1);
  });

  it('new sponsor row defaults to manual entry mode (POISearchSelect not shown)', async () => {
    render(<TestWrapper />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add sponsor/i }));
    });

    // POISearchSelect should NOT be shown by default (manual mode is default)
    expect(screen.queryByTestId('poi-search-select')).not.toBeInTheDocument();
  });

  it('toggling the switch in a sponsor row reveals POISearchSelect', async () => {
    render(<TestWrapper />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add sponsor/i }));
    });

    const toggle = screen.getByRole('switch');
    await act(async () => {
      fireEvent.click(toggle);
    });

    expect(screen.getByTestId('poi-search-select')).toBeInTheDocument();
  });

  it('manual mode shows name, url, and logo_url fields', async () => {
    render(<TestWrapper />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add sponsor/i }));
    });

    // Switch is OFF by default → manual fields visible
    expect(screen.getByText(/sponsor name/i)).toBeInTheDocument();
    expect(screen.getByText(/sponsor url/i)).toBeInTheDocument();
    expect(screen.getByText(/logo url/i)).toBeInTheDocument();
  });

  it('tier select is available in manual mode', async () => {
    render(<TestWrapper />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add sponsor/i }));
    });

    // Label text "Tier" should be present
    expect(screen.getByText('Tier')).toBeInTheDocument();
  });

  it('tier select is available in POI link mode', async () => {
    render(<TestWrapper />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add sponsor/i }));
    });

    const toggle = screen.getByRole('switch');
    await act(async () => {
      fireEvent.click(toggle);
    });

    // Tier label should still be present after switching to POI link mode
    expect(screen.getByText('Tier')).toBeInTheDocument();
  });

  it('remove button removes the sponsor row', async () => {
    render(<TestWrapper />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /add sponsor/i }));
    });

    // A Switch appeared — confirm row is present
    expect(screen.getAllByRole('switch').length).toBeGreaterThanOrEqual(1);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    });

    // After removal no switch should remain
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('renders existing sponsors from initial data (manual sponsor)', () => {
    render(
      <TestWrapper
        initialSponsors={[{ name: 'Acme Corp', url: 'https://acme.com', logo_url: '', tier: 'Gold' }]}
      />
    );

    // The sponsor name input should be pre-filled
    expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
  });

  it('renders existing POI-linked sponsor from initial data', () => {
    render(
      <TestWrapper
        initialSponsors={[{ poi_id: 'some-uuid', name: 'Linked Biz', tier: 'Platinum' }]}
      />
    );

    // When poi_id is present the row should start in link mode → POISearchSelect shown
    expect(screen.getByTestId('poi-search-select')).toBeInTheDocument();
  });
});
