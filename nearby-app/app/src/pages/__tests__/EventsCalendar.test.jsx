import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EventsCalendar from '../EventsCalendar';

// ---------------------------------------------------------------------------
// Mock FullCalendar — it doesn't work well in jsdom
// ---------------------------------------------------------------------------
vi.mock('@fullcalendar/react', () => ({
  default: function MockFullCalendar({ events, eventClick }) {
    return (
      <div data-testid="fullcalendar">
        {events && events.map((event, i) => (
          <div
            key={i}
            data-testid={`calendar-event-${i}`}
            onClick={() => eventClick?.({ event })}
          >
            {event.title}
          </div>
        ))}
      </div>
    );
  }
}));

vi.mock('@fullcalendar/daygrid', () => ({ default: {} }));
vi.mock('@fullcalendar/timegrid', () => ({ default: {} }));
vi.mock('@fullcalendar/list', () => ({ default: {} }));

// ---------------------------------------------------------------------------
// Mock react-router-dom navigate
// ---------------------------------------------------------------------------
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ---------------------------------------------------------------------------
// Mock fetch
// ---------------------------------------------------------------------------
const mockFetch = vi.fn();
global.fetch = mockFetch;

// ---------------------------------------------------------------------------
// Sample API response
// ---------------------------------------------------------------------------
const buildApiResponse = (overrides = []) => ({
  items: overrides.length
    ? overrides
    : [
        {
          id: 'uuid-1',
          name: 'Summer Festival',
          slug: 'summer-festival',
          poi_type: 'EVENT',
          event: {
            start_datetime: '2026-06-01T10:00:00',
            end_datetime: '2026-06-01T18:00:00',
            event_status: 'Scheduled',
          },
        },
        {
          id: 'uuid-2',
          name: 'Jazz Night',
          slug: 'jazz-night',
          poi_type: 'EVENT',
          event: {
            start_datetime: '2026-06-15T19:00:00',
            end_datetime: '2026-06-15T22:00:00',
            event_status: 'Canceled',
          },
        },
      ],
});

function renderCalendar() {
  return render(
    <MemoryRouter>
      <EventsCalendar />
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('EventsCalendar', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => buildApiResponse(),
    });
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the FullCalendar component', async () => {
    renderCalendar();

    await waitFor(() => {
      expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
    });
  });

  it('fetches events from the API on mount with correct URL', async () => {
    renderCalendar();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('/api/pois');
    expect(calledUrl).toContain('poi_type=EVENT');
    expect(calledUrl).toContain('publication_status=published');
    expect(calledUrl).toContain('limit=250');
  });

  it('renders calendar events with correct titles after fetch', async () => {
    renderCalendar();

    await waitFor(() => {
      expect(screen.getByText('Summer Festival')).toBeInTheDocument();
    });
  });

  it('prefixes canceled event titles with [CANCELED]', async () => {
    renderCalendar();

    await waitFor(() => {
      expect(screen.getByText('[CANCELED] Jazz Night')).toBeInTheDocument();
    });
  });

  it('does not prefix Scheduled event titles with [CANCELED]', async () => {
    renderCalendar();

    await waitFor(() => {
      expect(screen.getByText('Summer Festival')).toBeInTheDocument();
      expect(screen.queryByText('[CANCELED] Summer Festival')).not.toBeInTheDocument();
    });
  });

  it('renders view toggle buttons: Month, Week, Day, List', async () => {
    renderCalendar();

    // View buttons should be present (they may appear before or after fetch)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /month/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /week/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /day/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /list/i })).toBeInTheDocument();
    });
  });

  it('clicking a calendar event navigates to the event detail page', async () => {
    const user = userEvent.setup();
    renderCalendar();

    await waitFor(() => {
      expect(screen.getByTestId('calendar-event-0')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('calendar-event-0'));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    // Should navigate to a path containing the event slug
    const navArg = mockNavigate.mock.calls[0][0];
    expect(navArg).toContain('summer-festival');
  });

  it('shows a loading state while fetching', () => {
    // Never resolve the fetch so we stay in loading state
    mockFetch.mockReturnValue(new Promise(() => {}));

    renderCalendar();

    // Some loading indicator should be present (text or spinner)
    expect(
      screen.getByText(/loading/i) ||
      screen.getByRole('status') ||
      document.querySelector('.events-calendar__loading')
    ).toBeTruthy();
  });

  it('handles API errors gracefully without crashing', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    renderCalendar();

    // Calendar should still mount even if fetch fails
    await waitFor(() => {
      expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
    });
  });

  it('handles fetch network errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    renderCalendar();

    await waitFor(() => {
      expect(screen.getByTestId('fullcalendar')).toBeInTheDocument();
    });
  });

  it('passes the correct number of events to FullCalendar', async () => {
    renderCalendar();

    await waitFor(() => {
      // Both events should be rendered in mock calendar
      expect(screen.getByTestId('calendar-event-0')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-event-1')).toBeInTheDocument();
    });
  });
});
