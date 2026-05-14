import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EventDetail from '../EventDetail';

// Mock child components that pull in heavy deps (Leaflet, etc.)
vi.mock('../EventStatusBanner', () => ({
  default: function MockBanner({ eventStatus }) {
    return eventStatus !== 'Scheduled' ? (
      <div data-testid="event-status-banner">{eventStatus}</div>
    ) : null;
  },
}));

vi.mock('../../nearby-feature/NearbySection', () => ({
  default: function MockNearby() {
    return <div data-testid="nearby-section" />;
  },
}));

vi.mock('../../seo/index', () => ({
  EventJsonLd: function MockJsonLd() {
    return null;
  },
}));

// Keep real MemoryRouter but mock useNavigate to avoid side-effects
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

// Mock DOMPurify so tests don't need a real DOM sanitizer
vi.mock('dompurify', () => ({
  default: {
    sanitize: (html) => html,
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildPoi(overrides = {}) {
  return {
    id: 'test-id',
    name: 'Test Event',
    poi_type: 'EVENT',
    status: 'Fully Open',
    event: {
      start_datetime: '2026-06-01T10:00:00',
      end_datetime: '2026-06-01T18:00:00',
      event_status: 'Scheduled',
      organizer_name: 'Test Org',
      ...overrides.event,
    },
    location: { type: 'Point', coordinates: [-79.1, 35.7] },
    ...overrides,
  };
}

function renderDetail(poiOverrides = {}) {
  const poi = buildPoi(poiOverrides);
  return render(
    <MemoryRouter>
      <EventDetail poi={poi} />
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EventDetail', () => {
  beforeEach(() => {
    // Reset clipboard / share mocks between tests
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  });

  // --- B1: Status Banner ---

  it('canceled event shows status banner', () => {
    renderDetail({ event: { event_status: 'Canceled' } });
    expect(screen.getByTestId('event-status-banner')).toBeInTheDocument();
    expect(screen.getByTestId('event-status-banner')).toHaveTextContent('Canceled');
  });

  it('scheduled event does NOT show status banner', () => {
    renderDetail({ event: { event_status: 'Scheduled' } });
    expect(screen.queryByTestId('event-status-banner')).not.toBeInTheDocument();
  });

  it('uses event.event_status field to determine banner', () => {
    renderDetail({ event: { event_status: 'Postponed' } });
    const banner = screen.getByTestId('event-status-banner');
    expect(banner).toHaveTextContent('Postponed');
  });

  it('status row shows event_status value (not poi.status)', () => {
    // When event_status is set, the STATUS: row should show event_status
    renderDetail({ status: 'Fully Open', event: { event_status: 'Postponed' } });
    // The status value span in the header row should contain Postponed (not "Fully Open")
    const statusValue = document.querySelector('.poi-detail__status-value');
    expect(statusValue).toHaveTextContent('Postponed');
  });

  // --- B1: Canceled event hides date/time ---

  it('canceled event hides date badge', () => {
    renderDetail({
      event: {
        event_status: 'Canceled',
        start_datetime: '2026-06-01T10:00:00',
      },
    });
    // The date badge (sponsor-badge) should not be present for canceled events
    const dateBadge = document.querySelector('.poi-detail__sponsor-badge');
    expect(dateBadge).not.toBeInTheDocument();
  });

  it('canceled event hides quick-info date row', () => {
    renderDetail({
      event: {
        event_status: 'Canceled',
        start_datetime: '2026-06-01T10:00:00',
      },
    });
    // The formatted date text (e.g., "June 1, 2026") should not appear in the quick-info section
    // The start_datetime should be hidden when canceled
    expect(screen.queryByText(/June 1, 2026/i)).not.toBeInTheDocument();
  });

  it('scheduled event shows date badge and quick info date', () => {
    renderDetail({
      event: {
        event_status: 'Scheduled',
        start_datetime: '2026-06-01T10:00:00',
      },
    });
    // Date badge
    const dateBadge = document.querySelector('.poi-detail__sponsor-badge');
    expect(dateBadge).toBeInTheDocument();
    // Quick info shows the date
    expect(screen.getByText(/June 1, 2026/i)).toBeInTheDocument();
  });

  // --- B2: COST & TICKETS section ---

  it('renders "Free" in COST & TICKETS when cost_type is "free"', () => {
    renderDetail({ event: { cost_type: 'free' } });
    // Accordion button for the section
    expect(screen.getByRole('button', { name: /cost & tickets/i })).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('renders price in COST & TICKETS when cost is set and cost_type is "single_price"', () => {
    renderDetail({ event: { cost_type: 'single_price' }, cost: '$25' });
    expect(screen.getByText('$25')).toBeInTheDocument();
  });

  it('ticket URL renders as clickable link', () => {
    renderDetail({
      event: { cost_type: 'free' },
      ticket_link: 'https://tickets.example.com',
    });
    // Accordion content is hidden (display:none) initially; use hidden:true to find it
    const link = screen.getByRole('link', { name: /buy tickets/i, hidden: true });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://tickets.example.com');
  });

  it('does not render COST & TICKETS section when no cost data exists', () => {
    renderDetail({ event: {} });
    expect(screen.queryByRole('button', { name: /cost & tickets/i })).not.toBeInTheDocument();
  });

  // --- B2: EVENT DETAILS section with organizer info ---

  it('shows organizer name in EVENT DETAILS section', () => {
    renderDetail({ event: { organizer_name: 'Amazing Org' } });
    expect(screen.getByText('Amazing Org')).toBeInTheDocument();
  });

  it('shows organizer email in EVENT DETAILS when provided', () => {
    renderDetail({ event: { organizer_name: 'Org', organizer_email: 'org@example.com' } });
    expect(screen.getByText('org@example.com')).toBeInTheDocument();
  });

  it('shows organizer phone in EVENT DETAILS when provided', () => {
    renderDetail({ event: { organizer_name: 'Org', organizer_phone: '555-1234' } });
    expect(screen.getByText('555-1234')).toBeInTheDocument();
  });

  // --- B2: Venue link ---

  it('venue name links to venue POI when venue_poi_id exists', () => {
    renderDetail({
      event: {
        venue_name: 'Grand Hall',
        venue_poi_id: 'venue-abc-123',
      },
    });
    // Accordion content is initially hidden; use hidden:true
    const venueLink = screen.getByRole('link', { name: /grand hall/i, hidden: true });
    expect(venueLink).toBeInTheDocument();
    expect(venueLink).toHaveAttribute('href', expect.stringContaining('venue-abc-123'));
  });

  it('venue name shows as plain text when no venue_poi_id', () => {
    renderDetail({
      event: {
        venue_name: 'Local Park',
        venue_poi_id: null,
      },
    });
    // The text is in the hidden accordion panel
    const allLocalPark = screen.getAllByText('Local Park', { hidden: true });
    expect(allLocalPark.length).toBeGreaterThan(0);
    // None of them should be a link
    expect(screen.queryByRole('link', { name: /local park/i, hidden: true })).not.toBeInTheDocument();
  });

  // --- B2: Description HTML rendering ---

  it('renders description_long as HTML content (not escaped text)', () => {
    renderDetail({ description_long: '<strong>Bold text</strong> in description.' });
    // The strong element should be rendered, not shown as raw HTML string
    const strong = document.querySelector('.poi-detail__description-box strong');
    expect(strong).toBeInTheDocument();
    expect(strong).toHaveTextContent('Bold text');
  });

  // --- General rendering ---

  it('renders the event name as the main title', () => {
    renderDetail({ name: 'Summer Festival 2026' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Summer Festival 2026');
  });

  it('renders NearbySection', () => {
    renderDetail();
    expect(screen.getByTestId('nearby-section')).toBeInTheDocument();
  });

  it('renders description_short as subtitle', () => {
    renderDetail({ description_short: 'A great outdoor event.' });
    expect(screen.getByText('A great outdoor event.')).toBeInTheDocument();
  });

  it('renders address in quick info when address_street is set', () => {
    renderDetail({ address_street: '123 Main St' });
    // Address appears in the quick-info section (visible) and possibly in the accordion
    const addressItems = screen.getAllByText('123 Main St');
    // At least the quick-info item should be present
    expect(addressItems.length).toBeGreaterThan(0);
    // The quick-info item should be visible (not in a hidden panel)
    const quickInfoItem = document.querySelector('.poi-detail__info-item .poi-detail__info-text');
    expect(quickInfoItem).toHaveTextContent('123 Main St');
  });
});
