import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ContactOrganizerModal from '../ContactOrganizerModal';

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

const baseOrganizer = {
  name: 'Blue Ridge Events Co.',
  email: 'info@blueridgeevents.com',
  phone: '828-555-0100',
  website: 'https://blueridgeevents.com',
  organizer_poi_id: null,
};

describe('ContactOrganizerModal', () => {
  it('renders organizer name', () => {
    renderWithRouter(
      <ContactOrganizerModal
        isOpen={true}
        onClose={vi.fn()}
        organizer={baseOrganizer}
      />
    );

    expect(screen.getByText('Blue Ridge Events Co.')).toBeInTheDocument();
  });

  it('renders mailto link for email', () => {
    renderWithRouter(
      <ContactOrganizerModal
        isOpen={true}
        onClose={vi.fn()}
        organizer={baseOrganizer}
      />
    );

    const emailLink = screen.getByRole('link', {
      name: /info@blueridgeevents\.com/i,
    });
    expect(emailLink.getAttribute('href')).toBe(
      'mailto:info@blueridgeevents.com'
    );
  });

  it('renders tel link for phone', () => {
    renderWithRouter(
      <ContactOrganizerModal
        isOpen={true}
        onClose={vi.fn()}
        organizer={baseOrganizer}
      />
    );

    const phoneLink = screen.getByRole('link', { name: /828-555-0100/i });
    expect(phoneLink.getAttribute('href')).toBe('tel:828-555-0100');
  });

  it('renders website link', () => {
    renderWithRouter(
      <ContactOrganizerModal
        isOpen={true}
        onClose={vi.fn()}
        organizer={baseOrganizer}
      />
    );

    const websiteLink = screen.getByRole('link', { name: /website/i });
    expect(websiteLink.getAttribute('href')).toBe(
      'https://blueridgeevents.com'
    );
  });

  it('links to organizer POI page when organizer_poi_id is present', () => {
    const organizer = {
      ...baseOrganizer,
      organizer_poi_id: 'poi-uuid-1234',
    };

    renderWithRouter(
      <ContactOrganizerModal
        isOpen={true}
        onClose={vi.fn()}
        organizer={organizer}
      />
    );

    const poiLink = screen.getByRole('link', { name: /view organizer page/i });
    expect(poiLink.getAttribute('href')).toBe('/poi/poi-uuid-1234');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();

    renderWithRouter(
      <ContactOrganizerModal
        isOpen={true}
        onClose={onClose}
        organizer={baseOrganizer}
      />
    );

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = renderWithRouter(
      <ContactOrganizerModal
        isOpen={false}
        onClose={vi.fn()}
        organizer={baseOrganizer}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
