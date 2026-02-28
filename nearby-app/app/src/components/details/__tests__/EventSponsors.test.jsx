import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EventSponsors from '../EventSponsors';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('EventSponsors', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('fetches from /api/pois/{id}/sponsors on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    renderWithRouter(<EventSponsors poiId="event-42" />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/pois/event-42/sponsors')
      );
    });
  });

  it('renders sponsor with name and tier badge', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 's1', name: 'Acme Corp', tier: 'Gold', poi_id: null, url: null },
      ],
    });

    renderWithRouter(<EventSponsors poiId="event-1" />);

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Gold')).toBeInTheDocument();
    });
  });

  it('linked sponsor name links to POI page when poi_id is present', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 's2',
          name: 'Blue Ridge Brewery',
          tier: 'Platinum',
          poi_id: 'poi-uuid-999',
          url: null,
        },
      ],
    });

    renderWithRouter(<EventSponsors poiId="event-1" />);

    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'Blue Ridge Brewery' });
      expect(link.getAttribute('href')).toBe('/poi/poi-uuid-999');
    });
  });

  it('manual sponsor name links to external URL when url is set and no poi_id', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 's3',
          name: 'Mountain Outfitters',
          tier: 'Silver',
          poi_id: null,
          url: 'https://example.com/sponsor',
        },
      ],
    });

    renderWithRouter(<EventSponsors poiId="event-1" />);

    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'Mountain Outfitters' });
      expect(link.getAttribute('href')).toBe('https://example.com/sponsor');
    });
  });

  it('renders sponsor logo when logo_url is available', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 's4',
          name: 'Valley Foods',
          tier: 'Bronze',
          poi_id: null,
          url: null,
          logo_url: 'https://cdn.example.com/valley-foods-logo.png',
        },
      ],
    });

    renderWithRouter(<EventSponsors poiId="event-1" />);

    await waitFor(() => {
      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img.getAttribute('src')).toBe(
        'https://cdn.example.com/valley-foods-logo.png'
      );
    });
  });

  it('renders empty state when no sponsors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    renderWithRouter(<EventSponsors poiId="event-3" />);

    await waitFor(() => {
      expect(
        screen.getByText('No sponsors listed for this event.')
      ).toBeInTheDocument();
    });
  });
});
