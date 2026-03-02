import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { API_BASE_URL } from '../config';
import './EventsCalendar.css';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_COLORS = {
  Scheduled: '#6366f1',
  Canceled: '#dc2626',
  Postponed: '#d97706',
  Rescheduled: '#2563eb',
};

function getStatusColor(status) {
  return STATUS_COLORS[status] ?? '#6366f1';
}

function transformToCalendarEvent(poi) {
  const isCanceled = poi.event?.event_status === 'Canceled';
  return {
    id: poi.id,
    title: isCanceled ? `[CANCELED] ${poi.name}` : poi.name,
    start: poi.event?.start_datetime ?? null,
    end: poi.event?.end_datetime ?? null,
    color: getStatusColor(poi.event?.event_status),
    extendedProps: {
      slug: poi.slug,
      poi_type: poi.poi_type,
      event_status: poi.event?.event_status,
    },
  };
}

// ---------------------------------------------------------------------------
// View definitions
// ---------------------------------------------------------------------------

const VIEWS = [
  { label: 'Month', value: 'dayGridMonth' },
  { label: 'Week', value: 'timeGridWeek' },
  { label: 'Day', value: 'timeGridDay' },
  { label: 'List', value: 'listMonth' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function EventsCalendar() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('dayGridMonth');

  // Fetch all published events on mount
  useEffect(() => {
    const url = `${API_BASE_URL}/api/pois?poi_type=EVENT&publication_status=published&limit=250`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const items = Array.isArray(data.items) ? data.items : [];
        setEvents(items.map(transformToCalendarEvent));
      })
      .catch((err) => {
        console.error('EventsCalendar: failed to fetch events', err);
        setError('Failed to load events.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleEventClick = ({ event }) => {
    const slug = event.extendedProps?.slug;
    if (slug) {
      navigate(`/events/${slug}`);
    }
  };

  return (
    <div className="events-calendar">
      <div className="events-calendar__header">
        <h1 className="events-calendar__title">Events Calendar</h1>

        {/* View toggle buttons */}
        <div className="events-calendar__view-controls" role="group" aria-label="Calendar view">
          {VIEWS.map((view) => (
            <button
              key={view.value}
              type="button"
              className={`events-calendar__view-btn${currentView === view.value ? ' events-calendar__view-btn--active' : ''}`}
              onClick={() => setCurrentView(view.value)}
              aria-pressed={currentView === view.value}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="events-calendar__loading" role="status" aria-live="polite">
          Loading events…
        </div>
      )}

      {error && !loading && (
        <div className="events-calendar__error" role="alert">
          {error}
        </div>
      )}

      {!loading && (
        <div className="events-calendar__body">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
            initialView={currentView}
            key={currentView}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '',
            }}
            events={events}
            eventClick={handleEventClick}
            height="auto"
            nowIndicator
          />
        </div>
      )}
    </div>
  );
}

export default EventsCalendar;
