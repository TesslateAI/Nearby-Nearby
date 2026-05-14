import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import POISearchSelect from '../POISearchSelect';

// Mock the api module
vi.mock('../../../utils/api', () => ({
  default: { get: vi.fn() },
  api: { get: vi.fn() },
}));

import api from '../../../utils/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderWithMantine(ui) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

// Standard POI API response shape
const mockPOIResponse = {
  items: [
    {
      id: 'uuid-1',
      name: 'Test POI',
      poi_type: 'BUSINESS',
      address_city: 'Durham',
      slug: 'test-poi',
    },
    {
      id: 'uuid-2',
      name: 'Another Place',
      poi_type: 'PARK',
      address_city: 'Chapel Hill',
      slug: 'another-place',
    },
  ],
};

function makeResponse(data, ok = true) {
  return { ok, json: () => Promise.resolve(data) };
}

/**
 * Change the input value, advance all fake timers past the debounce window,
 * and flush all pending microtasks/promises — all inside a single act() call
 * so React can process state updates synchronously.
 */
async function typeAndFlush(input, text) {
  await act(async () => {
    fireEvent.change(input, { target: { value: text } });
    // Advance past the 300 ms debounce
    vi.advanceTimersByTime(350);
    // Flush any queued promises (the async api.get call)
    await Promise.resolve();
    await Promise.resolve();
  });
}

// ---------------------------------------------------------------------------
// Test lifecycle
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POISearchSelect', () => {
  it('renders with placeholder text', () => {
    renderWithMantine(
      <POISearchSelect onSelect={vi.fn()} placeholder="Search POIs..." />
    );

    expect(screen.getByPlaceholderText('Search POIs...')).toBeInTheDocument();
  });

  it('calls API on input change (debounced)', async () => {
    api.get.mockResolvedValue(makeResponse(mockPOIResponse));

    renderWithMantine(
      <POISearchSelect onSelect={vi.fn()} placeholder="Search POIs..." />
    );

    const input = screen.getByPlaceholderText('Search POIs...');

    // Change value but don't advance time — debounce must NOT have fired yet
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test' } });
    });
    expect(api.get).not.toHaveBeenCalled();

    // Advance + flush — debounce fires and the async fetch resolves
    await typeAndFlush(input, 'test');

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith(
      expect.stringContaining('search=test')
    );
  });

  it('displays search results in dropdown', async () => {
    api.get.mockResolvedValue(makeResponse(mockPOIResponse));

    renderWithMantine(
      <POISearchSelect onSelect={vi.fn()} placeholder="Search POIs..." />
    );

    const input = screen.getByPlaceholderText('Search POIs...');
    await typeAndFlush(input, 'test');

    expect(screen.getByText('Test POI')).toBeInTheDocument();
    expect(screen.getByText('Another Place')).toBeInTheDocument();
  });

  it('calls onSelect with POI data when result is clicked', async () => {
    const mockOnSelect = vi.fn();
    api.get.mockResolvedValue(makeResponse(mockPOIResponse));

    renderWithMantine(
      <POISearchSelect onSelect={mockOnSelect} placeholder="Search POIs..." />
    );

    const input = screen.getByPlaceholderText('Search POIs...');
    await typeAndFlush(input, 'test');

    expect(screen.getByText('Test POI')).toBeInTheDocument();

    // The component uses onMouseDown on result items so the handler fires before
    // the input's onBlur hides the dropdown.
    await act(async () => {
      fireEvent.mouseDown(screen.getByText('Test POI'));
    });

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith({
      id: 'uuid-1',
      name: 'Test POI',
      slug: 'test-poi',
      poi_type: 'BUSINESS',
      address_city: 'Durham',
    });
  });

  it('filters by filterTypes prop when provided', async () => {
    api.get.mockResolvedValue(makeResponse({ items: [] }));

    renderWithMantine(
      <POISearchSelect
        onSelect={vi.fn()}
        placeholder="Search POIs..."
        filterTypes={['BUSINESS', 'EVENT']}
      />
    );

    const input = screen.getByPlaceholderText('Search POIs...');
    await typeAndFlush(input, 'venue');

    expect(api.get).toHaveBeenCalledTimes(1);
    const url = api.get.mock.calls[0][0];
    expect(url).toMatch(/poi_type=BUSINESS/);
    expect(url).toMatch(/poi_type=EVENT/);
  });

  it('shows loading state during fetch', async () => {
    let resolveResponse;
    // Never-resolving promise so we can inspect the loading state mid-flight
    const inFlight = new Promise((resolve) => {
      resolveResponse = () =>
        resolve({ ok: true, json: () => Promise.resolve({ items: [] }) });
    });
    api.get.mockReturnValue(inFlight);

    renderWithMantine(
      <POISearchSelect onSelect={vi.fn()} placeholder="Search POIs..." />
    );

    const input = screen.getByPlaceholderText('Search POIs...');

    // Fire the debounce but do NOT await the fetch resolution
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test' } });
      vi.advanceTimersByTime(350);
      await Promise.resolve(); // kick off the async fetch
    });

    // At this point the fetch is in-flight; loading state should be active.
    // Mantine's Loader renders an SVG element inside the input's rightSection.
    const svgOrLoader =
      document.querySelector('svg') ||
      document.querySelector('[class*="Loader"]');
    expect(svgOrLoader).toBeTruthy();

    // Resolve inside act so React can flush the resulting state update cleanly
    await act(async () => {
      resolveResponse();
      await Promise.resolve();
    });
  });

  it('handles empty results gracefully', async () => {
    api.get.mockResolvedValue(makeResponse({ items: [] }));

    renderWithMantine(
      <POISearchSelect onSelect={vi.fn()} placeholder="Search POIs..." />
    );

    const input = screen.getByPlaceholderText('Search POIs...');
    await typeAndFlush(input, 'xyznotfound');

    expect(screen.getByText('No results found')).toBeInTheDocument();
  });
});
