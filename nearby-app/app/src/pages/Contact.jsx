import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle } from 'lucide-react';
import { getApiUrl } from '../config';
import '../styles/forms.css';

function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl('api/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
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
            <h2>Message sent!</h2>
            <p>Thank you for reaching out. We&rsquo;ll get back to you as soon as we can.</p>
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
          <Mail size={32} />
          <h1>Contact Us</h1>
          <p>Have a question, idea, or just want to say hello? We&rsquo;d love to hear from you.</p>
        </div>

        <form className="accessible_form" onSubmit={handleSubmit} noValidate>
          <fieldset className="form_fieldset">
            <legend className="form_legend">Contact Information</legend>

            <div className="form_group">
              <label htmlFor="ct-name" className="form_label">
                Your name <span className="required" aria-label="required">*</span>
              </label>
              <input
                id="ct-name"
                className="form_input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First and last name"
                maxLength={100}
                required
                aria-required="true"
              />
            </div>

            <div className="form_group">
              <label htmlFor="ct-email" className="form_label">
                Your email <span className="required" aria-label="required">*</span>
              </label>
              <input
                id="ct-email"
                className="form_input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={255}
                required
                aria-required="true"
              />
            </div>

            <div className="form_group">
              <label htmlFor="ct-message" className="form_label">
                Message <span className="required" aria-label="required">*</span>
              </label>
              <textarea
                id="ct-message"
                className="form_textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                rows={6}
                minLength={10}
                maxLength={5000}
                required
                aria-required="true"
              />
            </div>
          </fieldset>

          {error && <p className="form_error" role="alert">{error}</p>}

          <div className="form_submit_row">
            <button
              type="submit"
              className="button btn_primary"
              disabled={submitting || !name.trim() || !email.trim() || message.trim().length < 10}
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Contact;
