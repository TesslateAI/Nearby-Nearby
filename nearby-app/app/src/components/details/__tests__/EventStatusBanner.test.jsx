import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import EventStatusBanner from '../EventStatusBanner';

function renderBanner(props = {}) {
  return render(
    <MemoryRouter>
      <EventStatusBanner {...props} />
    </MemoryRouter>
  );
}

describe('EventStatusBanner', () => {
  it('renders nothing for "Scheduled" status', () => {
    const { container } = renderBanner({ eventStatus: 'Scheduled' });
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when eventStatus is undefined', () => {
    const { container } = renderBanner({});
    expect(container.firstChild).toBeNull();
  });

  it('renders red banner with "canceled" text for "Canceled" status', () => {
    renderBanner({
      eventStatus: 'Canceled',
      cancellationParagraph: 'This event has been canceled due to weather.',
    });

    const banner = document.querySelector('.event-status-banner');
    expect(banner).toBeInTheDocument();

    // Label shows "Event Canceled"
    expect(screen.getByText('Event Canceled')).toBeInTheDocument();

    // The label has the red color
    const label = document.querySelector('.event-status-banner__label');
    expect(label).toHaveStyle({ color: '#dc2626' });

    // Background is the red-tinted color
    expect(banner).toHaveStyle({ borderLeft: '4px solid #dc2626' });

    // Cancellation paragraph is displayed
    expect(screen.getByText('This event has been canceled due to weather.')).toBeInTheDocument();
  });

  it('renders amber banner with status_explanation for "Postponed"', () => {
    renderBanner({
      eventStatus: 'Postponed',
      statusExplanation: 'The event has been postponed due to venue issues.',
    });

    const banner = document.querySelector('.event-status-banner');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveStyle({ borderLeft: '4px solid #d97706' });

    expect(screen.getByText('Event Postponed')).toBeInTheDocument();
    expect(screen.getByText('The event has been postponed due to venue issues.')).toBeInTheDocument();
  });

  it('renders blue banner with link text for "Rescheduled" when new_event_link is set', () => {
    renderBanner({
      eventStatus: 'Rescheduled',
      statusExplanation: 'This event has moved to a new date.',
      newEventLink: 'https://example.com/new-event',
    });

    const banner = document.querySelector('.event-status-banner');
    expect(banner).toHaveStyle({ borderLeft: '4px solid #2563eb' });

    expect(screen.getByText('Event Rescheduled')).toBeInTheDocument();

    // Link is rendered with correct href
    const link = screen.getByRole('link', { name: 'View New Event Details' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com/new-event');
  });

  it('does not render new event link for "Rescheduled" when newEventLink is absent', () => {
    renderBanner({
      eventStatus: 'Rescheduled',
      statusExplanation: 'Rescheduled.',
    });

    expect(screen.queryByRole('link', { name: 'View New Event Details' })).not.toBeInTheDocument();
  });

  it('renders banner with explanation for "Updated Date and/or Time"', () => {
    renderBanner({
      eventStatus: 'Updated Date and/or Time',
      statusExplanation: 'The start time has shifted to 3pm.',
    });

    const banner = document.querySelector('.event-status-banner');
    expect(banner).toHaveStyle({ borderLeft: '4px solid #ea580c' });

    expect(screen.getByText('Date/Time Updated')).toBeInTheDocument();
    expect(screen.getByText('The start time has shifted to 3pm.')).toBeInTheDocument();
  });

  it('renders purple banner with online URL for "Moved Online" when online_event_url is set', () => {
    renderBanner({
      eventStatus: 'Moved Online',
      statusExplanation: 'Join us virtually.',
      onlineEventUrl: 'https://zoom.us/j/12345',
    });

    const banner = document.querySelector('.event-status-banner');
    expect(banner).toHaveStyle({ borderLeft: '4px solid #7c3aed' });

    expect(screen.getByText('Moved Online')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: 'Join Online Event' });
    expect(link).toHaveAttribute('href', 'https://zoom.us/j/12345');
  });

  it('renders gray banner for "Unofficial Proposed Date"', () => {
    renderBanner({
      eventStatus: 'Unofficial Proposed Date',
      statusExplanation: 'Date is tentative.',
    });

    const banner = document.querySelector('.event-status-banner');
    expect(banner).toHaveStyle({ borderLeft: '4px solid #6b7280' });

    expect(screen.getByText('Unofficial Proposed Date')).toBeInTheDocument();
  });

  it('shows "Contact Organizer" button when contactOrganizerToggle is true', () => {
    renderBanner({
      eventStatus: 'Canceled',
      contactOrganizerToggle: true,
      onContactOrganizer: vi.fn(),
    });

    const btn = screen.getByRole('button', { name: /contact organizer/i });
    expect(btn).toBeInTheDocument();
  });

  it('hides "Contact Organizer" button when contactOrganizerToggle is false', () => {
    renderBanner({
      eventStatus: 'Canceled',
      contactOrganizerToggle: false,
    });

    expect(screen.queryByRole('button', { name: /contact organizer/i })).not.toBeInTheDocument();
  });

  it('calls onContactOrganizer callback when button is clicked', async () => {
    const onContactOrganizer = vi.fn();
    renderBanner({
      eventStatus: 'Postponed',
      contactOrganizerToggle: true,
      onContactOrganizer,
    });

    const btn = screen.getByRole('button', { name: /contact organizer/i });
    await userEvent.click(btn);
    expect(onContactOrganizer).toHaveBeenCalledTimes(1);
  });
});
