import { useState } from 'react';
import Overlay from '../Overlay';
import useOverlay from '../../hooks/useOverlay';
import { getApiUrl } from '../../config';
import './SuggestEditOverlay.css';

const SUBJECT_OPTIONS = [
  'Inappropriate content',
  "Something's missing",
  'Wrong information',
  'Other',
];

function SuggestEditOverlay({ poiName, poiId, triggerRef: externalTriggerRef }) {
  const { isOpen, open, close, panelRef, triggerRef } = useOverlay('suggest_edit_overlay');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleOpen = () => {
    setSubmitted(false);
    setErrors([]);
    open();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const errs = [];
    if (!form.fullName.trim()) errs.push('Full Name is required');
    if (!form.email.trim()) errs.push('Email is required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.push('Please enter a valid email');
    if (!form.phone.trim()) errs.push('Phone is required');
    if (!form.subject) errs.push('Please select a subject');
    if (!form.message.trim()) errs.push('Message is required');
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    setSubmitting(true);

    try {
      const res = await fetch(getApiUrl('/api/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.fullName,
          email: form.email,
          phone: form.phone,
          subject: `Suggest Edit: ${form.subject} — ${poiName}`,
          message: form.message,
          poi_id: poiId,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setForm({ fullName: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setErrors(['Something went wrong. Please try again later.']);
      }
    } catch {
      setErrors(['Network error. Please check your connection and try again.']);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    setForm({ fullName: '', email: '', phone: '', subject: '', message: '' });
    setErrors([]);
  };

  // Expose the open function via the external trigger ref
  if (externalTriggerRef) {
    externalTriggerRef.current = { open: handleOpen };
  }

  return (
    <Overlay
      id="suggest_edit_overlay"
      isOpen={isOpen}
      onClose={close}
      panelRef={panelRef}
    >
      <div className="se-overlay">
        <h2 className="se-overlay__title">Suggest an Update</h2>

        {/* Location in Question */}
        <div className="se-overlay__location">
          <span className="se-overlay__location-label">Location in Question</span>
          <span className="se-overlay__location-name">{poiName}</span>
        </div>

        {submitted ? (
          <div className="se-overlay__success">
            <p>Thank you for your suggestion! We'll review it shortly.</p>
            <button type="button" className="se-overlay__btn se-overlay__btn--primary" onClick={close}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {/* Error Summary */}
            {errors.length > 0 && (
              <div className="se-overlay__errors" role="alert">
                <ul>
                  {errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contact Info */}
            <fieldset className="se-overlay__fieldset">
              <legend className="se-overlay__legend">Contact Info</legend>
              <div className="se-overlay__field">
                <label htmlFor="se-fullName" className="se-overlay__label">Full Name *</label>
                <input
                  id="se-fullName"
                  name="fullName"
                  type="text"
                  className="se-overlay__input"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="se-overlay__field">
                <label htmlFor="se-email" className="se-overlay__label">Email *</label>
                <input
                  id="se-email"
                  name="email"
                  type="email"
                  className="se-overlay__input"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="se-overlay__field">
                <label htmlFor="se-phone" className="se-overlay__label">Phone *</label>
                <input
                  id="se-phone"
                  name="phone"
                  type="tel"
                  className="se-overlay__input"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </fieldset>

            {/* Additional Details */}
            <fieldset className="se-overlay__fieldset">
              <legend className="se-overlay__legend">Additional Details</legend>
              <div className="se-overlay__field">
                <label htmlFor="se-subject" className="se-overlay__label">Subject *</label>
                <select
                  id="se-subject"
                  name="subject"
                  className="se-overlay__select"
                  value={form.subject}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a subject...</option>
                  {SUBJECT_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="se-overlay__field">
                <label htmlFor="se-message" className="se-overlay__label">Message *</label>
                <textarea
                  id="se-message"
                  name="message"
                  className="se-overlay__textarea"
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  required
                />
              </div>
            </fieldset>

            {/* Buttons */}
            <div className="se-overlay__actions">
              <button
                type="submit"
                className="se-overlay__btn se-overlay__btn--primary"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Form'}
              </button>
              <button
                type="button"
                className="se-overlay__btn se-overlay__btn--secondary"
                onClick={handleClear}
              >
                Clear Form
              </button>
            </div>
          </form>
        )}
      </div>
    </Overlay>
  );
}

export default SuggestEditOverlay;
