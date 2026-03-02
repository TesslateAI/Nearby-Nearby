import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EventVendors from '../EventVendors';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('EventVendors', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('fetches from /api/pois/{id}/vendors on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    renderWithRouter(<EventVendors poiId="abc-123" />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/pois/abc-123/vendors')
      );
    });
  });

  it('renders vendor cards with name', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 'v1', name: 'Taco Truck', poi_type: 'BUSINESS' },
        { id: 'v2', name: 'Honey Farm Stand', poi_type: 'BUSINESS' },
      ],
    });

    renderWithRouter(<EventVendors poiId="event-1" />);

    await waitFor(() => {
      expect(screen.getByText('Taco Truck')).toBeInTheDocument();
      expect(screen.getByText('Honey Farm Stand')).toBeInTheDocument();
    });
  });

  it('vendor name links to vendor POI page', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 'vendor-999', name: 'Blue Ridge Pottery', poi_type: 'BUSINESS' },
      ],
    });

    renderWithRouter(<EventVendors poiId="event-1" />);

    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'Blue Ridge Pottery' });
      expect(link).toBeInTheDocument();
      expect(link.getAttribute('href')).toBe('/poi/vendor-999');
    });
  });

  it('renders empty state when no vendors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    renderWithRouter(<EventVendors poiId="event-2" />);

    await waitFor(() => {
      expect(
        screen.getByText('No vendors listed for this event.')
      ).toBeInTheDocument();
    });
  });

  it('handles API error gracefully and shows error message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    renderWithRouter(<EventVendors poiId="event-err" />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load vendors.')).toBeInTheDocument();
    });
  });
});
