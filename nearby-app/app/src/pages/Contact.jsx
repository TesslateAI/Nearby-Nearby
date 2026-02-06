import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle } from 'lucide-react';
import { getApiUrl } from '../config';
import './Contact.css';

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
      <div className="contact-page">
        <div className="contact-page__container">
          <div className="contact-page__success">
            <CheckCircle size={48} />
            <h2>Message sent!</h2>
            <p>Thank you for reaching out. We&rsquo;ll get back to you as soon as we can.</p>
            <Link to="/" className="contact-page__back-link">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-page">
      <div className="contact-page__container">
        <div className="contact-page__header">
          <Mail size={32} />
          <h1>Contact Us</h1>
          <p>Have a question, idea, or just want to say hello? We&rsquo;d love to hear from you.</p>
        </div>

        <form className="contact-page__form" onSubmit={handleSubmit}>
          <div className="contact-page__field">
            <label htmlFor="ct-name">Your name *</label>
            <input
              id="ct-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First and last name"
              maxLength={100}
              required
            />
          </div>

          <div className="contact-page__field">
            <label htmlFor="ct-email">Your email *</label>
            <input
              id="ct-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              maxLength={255}
              required
            />
          </div>

          <div className="contact-page__field">
            <label htmlFor="ct-message">Message *</label>
            <textarea
              id="ct-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What's on your mind?"
              rows={6}
              minLength={10}
              maxLength={5000}
              required
            />
          </div>

          {error && <p className="contact-page__error">{error}</p>}

          <button
            type="submit"
            className="contact-page__submit"
            disabled={submitting || !name.trim() || !email.trim() || message.trim().length < 10}
          >
            {submitting ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Contact;
