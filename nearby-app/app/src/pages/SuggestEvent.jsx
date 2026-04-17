import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, CheckCircle } from 'lucide-react';
import { getApiUrl } from '../config';
import '../styles/forms.css';

function SuggestEvent() {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [organizerPhone, setOrganizerPhone] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eventName.trim() || !organizerEmail.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl('api/event-suggestions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: eventName.trim(),
          event_date: eventDate.trim() || null,
          event_location: eventLocation.trim() || null,
          organizer_name: organizerName.trim() || null,
          organizer_email: organizerEmail.trim(),
          organizer_phone: organizerPhone.trim() || null,
          event_description: eventDescription.trim() || null,
          additional_info: additionalInfo.trim() || null,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const data = await response.json().catch(() => null);
        setError(data?.detail || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Could not connect to the server. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="form_page">
        <div className="form_page__container">
          <div className="form_page__success">
            <CheckCircle size={48} />
            <h2>Event suggestion submitted!</h2>
            <p>
              Thank you for letting us know about this event.
              Our team will review your suggestion and may follow up for more details.
            </p>
            <Link to="/" className="form_page__back-link">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form_page">
      <div className="form_page__container">
        <div className="form_page__header">
          <CalendarPlus size={32} />
          <h1>Suggest an Event</h1>
          <p>
            Know about a local event happening in your community? Let us know and
            we&rsquo;ll add it to Nearby Nearby so others can discover it too.
          </p>
        </div>

        <form className="accessible_form" onSubmit={handleSubmit} noValidate>
          <fieldset>
            <legend>Event Details</legend>

            <div className="form_group">
              <label htmlFor="se-event-name">
                Event name <span className="required" aria-label="required">*</span>
              </label>
              <input
                id="se-event-name"
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. Pittsboro Farmers Market"
                maxLength={255}
                required
                aria-required="true"
              />
            </div>

            <div className="form_group">
              <label htmlFor="se-event-date">Date &amp; time</label>
              <input
                id="se-event-date"
                type="text"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                placeholder="e.g. Saturday, March 15, 2026 — 9 AM to 1 PM"
                maxLength={100}
                aria-describedby="se-date-hint"
              />
              <span className="hint_text" id="se-date-hint">
                Include the date, start time, and end time if known.
              </span>
            </div>

            <div className="form_group">
              <label htmlFor="se-event-location">Location</label>
              <input
                id="se-event-location"
                type="text"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="e.g. Chatham Mills, 480 Hillsboro St, Pittsboro NC"
                maxLength={255}
              />
            </div>

            <div className="form_group">
              <label htmlFor="se-description">Description</label>
              <textarea
                id="se-description"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Tell us about the event — what it is, who it's for, what to expect."
                rows={5}
                maxLength={5000}
              />
            </div>

            <div className="form_group">
              <label htmlFor="se-additional-info">Details link</label>
              <input
                id="se-additional-info"
                type="url"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="https://example.com/event-details"
                aria-describedby="se-link-hint"
              />
              <span className="hint_text" id="se-link-hint">
                A link to the event page, Facebook event, or flyer with more info.
              </span>
            </div>
          </fieldset>

          <fieldset>
            <legend>Your Contact Information</legend>

            <div className="form_group">
              <label htmlFor="se-name">Your name</label>
              <input
                id="se-name"
                type="text"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                placeholder="First and last name"
                maxLength={100}
              />
            </div>

            <div className="form_group">
              <label htmlFor="se-email">
                Email address <span className="required" aria-label="required">*</span>
              </label>
              <input
                id="se-email"
                type="email"
                value={organizerEmail}
                onChange={(e) => setOrganizerEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={255}
                required
                aria-required="true"
              />
            </div>

            <div className="form_group">
              <label htmlFor="se-phone">Phone number</label>
              <input
                id="se-phone"
                type="tel"
                value={organizerPhone}
                onChange={(e) => setOrganizerPhone(e.target.value)}
                placeholder="(123) 456-7890"
                maxLength={50}
              />
            </div>
          </fieldset>

          {error && <p className="form_error" role="alert">{error}</p>}

          <div className="form_actions">
            <button
              type="submit"
              className="button btn_primary"
              disabled={submitting || !eventName.trim() || !organizerEmail.trim()}
            >
              {submitting ? 'Submitting...' : 'Submit Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SuggestEvent;
