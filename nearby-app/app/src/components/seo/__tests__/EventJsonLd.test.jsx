import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EventJsonLd from '../EventJsonLd';

function getJsonLd(container) {
  const script = container.querySelector('script[type="application/ld+json"]');
  return script ? JSON.parse(script.textContent) : null;
}

function buildPoi(overrides = {}) {
  return {
    id: 'test-id',
    name: 'Test Event',
    poi_type: 'EVENT',
    event: {
      start_datetime: '2026-06-01T10:00:00',
      event_status: 'Scheduled',
      organizer_name: 'Test Org',
      ...overrides.event,
    },
    location: { type: 'Point', coordinates: [-79.1, 35.7] },
    address_city: 'Durham',
    address_state: 'NC',
    ...overrides,
  };
}

describe('EventJsonLd', () => {
  describe('eventStatus mapping', () => {
    it('maps "Scheduled" to https://schema.org/EventScheduled', () => {
      const poi = buildPoi({ event: { event_status: 'Scheduled' } });
      const { container } = render(<EventJsonLd poi={poi} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd).not.toBeNull();
      expect(jsonLd.eventStatus).toBe('https://schema.org/EventScheduled');
    });

    it('maps "Canceled" to https://schema.org/EventCancelled (British spelling)', () => {
      const poi = buildPoi({ event: { event_status: 'Canceled' } });
      const { container } = render(<EventJsonLd poi={poi} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd).not.toBeNull();
      expect(jsonLd.eventStatus).toBe('https://schema.org/EventCancelled');
    });

    it('maps "Postponed" to https://schema.org/EventPostponed', () => {
      const poi = buildPoi({ event: { event_status: 'Postponed' } });
      const { container } = render(<EventJsonLd poi={poi} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd).not.toBeNull();
      expect(jsonLd.eventStatus).toBe('https://schema.org/EventPostponed');
    });

    it('maps "Rescheduled" to https://schema.org/EventRescheduled', () => {
      const poi = buildPoi({ event: { event_status: 'Rescheduled' } });
      const { container } = render(<EventJsonLd poi={poi} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd).not.toBeNull();
      expect(jsonLd.eventStatus).toBe('https://schema.org/EventRescheduled');
    });

    it('maps "Moved Online" to https://schema.org/EventMovedOnline', () => {
      const poi = buildPoi({
        event: {
          event_status: 'Moved Online',
          online_event_url: 'https://zoom.us/j/12345',
        },
      });
      const { container } = render(<EventJsonLd poi={poi} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd).not.toBeNull();
      expect(jsonLd.eventStatus).toBe('https://schema.org/EventMovedOnline');
    });

    it('maps "Updated Date and/or Time" to https://schema.org/EventScheduled', () => {
      const poi = buildPoi({ event: { event_status: 'Updated Date and/or Time' } });
      const { container } = render(<EventJsonLd poi={poi} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd).not.toBeNull();
      expect(jsonLd.eventStatus).toBe('https://schema.org/EventScheduled');
    });

    it('maps "Unofficial Proposed Date" to https://schema.org/EventScheduled', () => {
      const poi = buildPoi({ event: { event_status: 'Unofficial Proposed Date' } });
      const { container } = render(<EventJsonLd poi={poi} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd).not.toBeNull();
      expect(jsonLd.eventStatus).toBe('https://schema.org/EventScheduled');
    });

    it('defaults to https://schema.org/EventScheduled for unknown status', () => {
      const poi = buildPoi({ event: { event_status: 'SomethingUnknown' } });
      const { container } = render(<EventJsonLd poi={poi} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd).not.toBeNull();
      expect(jsonLd.eventStatus).toBe('https://schema.org/EventScheduled');
    });

    it('uses poi.event.event_status (not poi.event.status or poi.status)', () => {
      // Provides the wrong fields; event_status is absent so should default to Scheduled
      const poi = buildPoi({
        event: {
          event_status: undefined,
          status: 'Canceled',   // old field name — must be ignored
        },
        status: 'Canceled',     // top-level field — must be ignored
      });
      const { container } = render(<EventJsonLd poi={poi} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd).not.toBeNull();
      // Should default to Scheduled because event_status is absent
      expect(jsonLd.eventStatus).toBe('https://schema.org/EventScheduled');
    });
  });

  describe('offers', () => {
    it('includes offers when cost_type is "single_price" and cost is set', () => {
      const poi = buildPoi({
        cost: 15,
        event: { cost_type: 'single_price' },
      });
      const { container } = render(<EventJsonLd poi={poi} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd).not.toBeNull();
      expect(jsonLd.offers).toBeDefined();
      expect(Array.isArray(jsonLd.offers)).toBe(true);
      expect(jsonLd.offers).toHaveLength(1);
      expect(jsonLd.offers[0]['@type']).toBe('Offer');
      expect(jsonLd.offers[0].price).toBe(15);
      expect(jsonLd.offers[0].priceCurrency).toBe('USD');
    });

    it('includes offers with price 0 when cost_type is "free"', () => {
      const poi = buildPoi({
        event: { cost_type: 'free' },
      });
      const { container } = render(<EventJsonLd poi={poi} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd).not.toBeNull();
      expect(jsonLd.offers).toBeDefined();
      expect(jsonLd.offers[0].price).toBe(0);
    });

    it('includes offers when cost_type is "range" and cost is set', () => {
      const poi = buildPoi({
        cost: 25,
        event: { cost_type: 'range' },
      });
      const { container } = render(<EventJsonLd poi={poi} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd).not.toBeNull();
      expect(jsonLd.offers).toBeDefined();
      expect(jsonLd.offers[0].price).toBe(25);
    });

    it('does not include offers when cost is absent and cost_type is "single_price"', () => {
      const poi = buildPoi({
        cost: undefined,
        event: { cost_type: 'single_price' },
      });
      const { container } = render(<EventJsonLd poi={poi} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd).not.toBeNull();
      expect(jsonLd.offers).toBeUndefined();
    });
  });

  describe('VirtualLocation', () => {
    it('includes VirtualLocation when event_status is "Moved Online" and online_event_url is present', () => {
      const poi = buildPoi({
        event: {
          event_status: 'Moved Online',
          online_event_url: 'https://zoom.us/j/99999',
        },
      });
      const { container } = render(<EventJsonLd poi={poi} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd).not.toBeNull();

      // location should be an array containing a VirtualLocation
      expect(Array.isArray(jsonLd.location)).toBe(true);
      const virtualLocation = jsonLd.location.find(l => l['@type'] === 'VirtualLocation');
      expect(virtualLocation).toBeDefined();
      expect(virtualLocation.url).toBe('https://zoom.us/j/99999');

      // Should also set eventAttendanceMode
      expect(jsonLd.eventAttendanceMode).toBe('https://schema.org/OnlineEventAttendanceMode');
    });

    it('does not include VirtualLocation when online_event_url is absent even if Moved Online', () => {
      const poi = buildPoi({
        event: {
          event_status: 'Moved Online',
          online_event_url: undefined,
        },
      });
      const { container } = render(<EventJsonLd poi={poi} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd).not.toBeNull();

      // location should NOT be an array of locations (no virtual location added)
      if (Array.isArray(jsonLd.location)) {
        const virtualLocation = jsonLd.location.find(l => l['@type'] === 'VirtualLocation');
        expect(virtualLocation).toBeUndefined();
      } else {
        // Single location object — no VirtualLocation present
        expect(jsonLd.location['@type']).not.toBe('VirtualLocation');
      }
    });

    it('does not include VirtualLocation for non-online statuses even with online_event_url', () => {
      const poi = buildPoi({
        event: {
          event_status: 'Scheduled',
          online_event_url: 'https://zoom.us/j/12345',
        },
      });
      const { container } = render(<EventJsonLd poi={poi} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd).not.toBeNull();

      if (Array.isArray(jsonLd.location)) {
        const virtualLocation = jsonLd.location.find(l => l['@type'] === 'VirtualLocation');
        expect(virtualLocation).toBeUndefined();
      }
      expect(jsonLd.eventAttendanceMode).not.toBe('https://schema.org/OnlineEventAttendanceMode');
    });
  });

  describe('organizer', () => {
    it('includes organizer with Organization type and name', () => {
      const poi = buildPoi({
        event: {
          organizer_name: 'Durham Events Co',
        },
      });
      const { container } = render(<EventJsonLd poi={poi} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd).not.toBeNull();
      expect(jsonLd.organizer).toBeDefined();
      expect(jsonLd.organizer['@type']).toBe('Organization');
      expect(jsonLd.organizer.name).toBe('Durham Events Co');
    });

    it('includes organizer email from poi.event.organizer_email', () => {
      const poi = buildPoi({
        event: {
          organizer_name: 'Durham Events Co',
          organizer_email: 'info@durhamevents.com',
        },
        email: 'wrong@email.com', // top-level — must be ignored
      });
      const { container } = render(<EventJsonLd poi={poi} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd).not.toBeNull();
      expect(jsonLd.organizer.email).toBe('info@durhamevents.com');
    });

    it('includes organizer telephone from poi.event.organizer_phone', () => {
      const poi = buildPoi({
        event: {
          organizer_name: 'Durham Events Co',
          organizer_phone: '919-555-1234',
        },
        phone_number: '000-000-0000', // top-level — must be ignored
      });
      const { container } = render(<EventJsonLd poi={poi} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd).not.toBeNull();
      expect(jsonLd.organizer.telephone).toBe('919-555-1234');
    });

    it('includes organizer url from poi.event.organizer_website', () => {
      const poi = buildPoi({
        event: {
          organizer_name: 'Durham Events Co',
          organizer_website: 'durhamevents.com',
        },
      });
      const { container } = render(<EventJsonLd poi={poi} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd).not.toBeNull();
      expect(jsonLd.organizer.url).toBe('https://durhamevents.com');
    });

    it('does not include organizer when organizer_name is absent', () => {
      const poi = buildPoi({
        event: {
          organizer_name: undefined,
        },
      });
      const { container } = render(<EventJsonLd poi={poi} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd).not.toBeNull();
      expect(jsonLd.organizer).toBeUndefined();
    });
  });

  describe('general structure', () => {
    it('renders a script tag with application/ld+json type', () => {
      const poi = buildPoi();
      const { container } = render(<EventJsonLd poi={poi} />);
      const script = container.querySelector('script[type="application/ld+json"]');
      expect(script).not.toBeNull();
    });

    it('sets @context to https://schema.org and @type to Event', () => {
      const poi = buildPoi();
      const { container } = render(<EventJsonLd poi={poi} />);
      const jsonLd = getJsonLd(container);
      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(jsonLd['@type']).toBe('Event');
    });

    it('returns null when poi is missing', () => {
      const { container } = render(<EventJsonLd poi={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when poi.event is missing', () => {
      const { container } = render(<EventJsonLd poi={{ id: 'x', name: 'X', poi_type: 'EVENT' }} />);
      expect(container.firstChild).toBeNull();
    });
  });
});
