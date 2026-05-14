import { Mail } from 'lucide-react';
import './EventStatusBanner.css';

const STATUS_CONFIG = {
  'Canceled': {
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fca5a5',
    label: 'Event Canceled',
  },
  'Postponed': {
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fcd34d',
    label: 'Event Postponed',
  },
  'Rescheduled': {
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#93c5fd',
    label: 'Event Rescheduled',
  },
  'Updated Date and/or Time': {
    color: '#ea580c',
    bg: '#fff7ed',
    border: '#fdba74',
    label: 'Date/Time Updated',
  },
  'Moved Online': {
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#c4b5fd',
    label: 'Moved Online',
  },
  'Unofficial Proposed Date': {
    color: '#6b7280',
    bg: '#f9fafb',
    border: '#d1d5db',
    label: 'Unofficial Proposed Date',
  },
};

/**
 * EventStatusBanner
 *
 * Renders a colored alert banner when an event has a non-Scheduled status.
 * Returns null for "Scheduled" (default/normal state).
 *
 * Props:
 *   eventStatus            - string: one of the STATUS_CONFIG keys, or "Scheduled"
 *   statusExplanation      - string: shown for most non-canceled statuses
 *   cancellationParagraph  - string: shown specifically for "Canceled"
 *   contactOrganizerToggle - bool:   whether to show the Contact Organizer button
 *   newEventLink           - string: URL for "Rescheduled" status
 *   onlineEventUrl         - string: URL for "Moved Online" status
 *   onContactOrganizer     - func:   callback for Contact Organizer button click
 */
function EventStatusBanner({
  eventStatus,
  statusExplanation,
  cancellationParagraph,
  contactOrganizerToggle,
  newEventLink,
  onlineEventUrl,
  onContactOrganizer,
}) {
  if (!eventStatus || eventStatus === 'Scheduled') return null;

  const config = STATUS_CONFIG[eventStatus];
  if (!config) return null;

  const { color, bg, border, label } = config;

  const bannerStyle = {
    background: bg,
    borderLeft: `4px solid ${color}`,
  };

  return (
    <div className="event-status-banner" style={bannerStyle}>
      <div className="event-status-banner__label" style={{ color }}>
        {label}
      </div>

      {/* Canceled: show cancellationParagraph */}
      {eventStatus === 'Canceled' && cancellationParagraph && (
        <p className="event-status-banner__body">{cancellationParagraph}</p>
      )}

      {/* All others: show statusExplanation */}
      {eventStatus !== 'Canceled' && statusExplanation && (
        <p className="event-status-banner__body">{statusExplanation}</p>
      )}

      {/* Rescheduled: link to new event */}
      {eventStatus === 'Rescheduled' && newEventLink && (
        <a
          href={newEventLink}
          className="event-status-banner__link"
          style={{ color }}
          target="_blank"
          rel="noopener noreferrer"
        >
          View New Event Details
        </a>
      )}

      {/* Moved Online: link to online URL */}
      {eventStatus === 'Moved Online' && onlineEventUrl && (
        <a
          href={onlineEventUrl}
          className="event-status-banner__link"
          style={{ color }}
          target="_blank"
          rel="noopener noreferrer"
        >
          Join Online Event
        </a>
      )}

      {/* Contact Organizer button */}
      {contactOrganizerToggle && (
        <button
          className="event-status-banner__contact-btn"
          onClick={onContactOrganizer}
          type="button"
        >
          <Mail size={14} />
          Contact Organizer
        </button>
      )}
    </div>
  );
}

export default EventStatusBanner;
