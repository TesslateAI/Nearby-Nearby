import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle } from 'lucide-react';
import { getApiUrl } from '../config';
import './ClaimBusiness.css';

function ClaimBusiness() {
  const [inChatham, setInChatham] = useState(null); // null, true, false
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [howHeard, setHowHeard] = useState('');
  const [anythingElse, setAnythingElse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!businessName.trim() || !contactName.trim() || !contactPhone.trim() || !contactEmail.trim() || !businessAddress.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const body = {
        business_name: businessName.trim(),
        contact_name: contactName.trim(),
        contact_phone: contactPhone.trim(),
        contact_email: contactEmail.trim(),
        business_address: businessAddress.trim(),
      };
      if (howHeard.trim()) body.how_heard = howHeard.trim();
      if (anythingElse.trim()) body.anything_else = anythingElse.trim();

      const response = await fetch(getApiUrl('api/business-claims'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
      <div className="claim-page">
        <div className="claim-page__container">
          <div className="claim-page__success">
            <CheckCircle size={48} />
            <h2>Claim received!</h2>
            <p>Thank you for registering <strong>{businessName}</strong>. Our team will review your submission and reach out soon.</p>
            <Link to="/explore" className="claim-page__back-link">Back to Explore</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="claim-page">
      <div className="claim-page__container">
        <div className="claim-page__header">
          <Building2 size={32} />
          <h1>Claim Your Business</h1>
          <p>Get your business listed on Nearby Nearby for free. We&rsquo;re currently serving Chatham County, NC.</p>
        </div>

        {/* Gate: Chatham County check */}
        {inChatham === null && (
          <div className="claim-page__gate">
            <p className="claim-page__gate-question">Is your business located in Chatham County, NC?</p>
            <div className="claim-page__gate-buttons">
              <button className="claim-page__gate-btn claim-page__gate-btn--yes" onClick={() => setInChatham(true)}>
                Yes, it is!
              </button>
              <button className="claim-page__gate-btn claim-page__gate-btn--no" onClick={() => setInChatham(false)}>
                Not yet
              </button>
            </div>
          </div>
        )}

        {inChatham === false && (
          <div className="claim-page__outside">
            <p>We&rsquo;re not in your area yet, but we&rsquo;re growing fast! Let us know where you are and we&rsquo;ll work to bring Nearby Nearby to your community.</p>
            <Link to="/community-interest" className="claim-page__cta-link">Tell Us About Your Community</Link>
            <button className="claim-page__back-btn" onClick={() => setInChatham(null)}>&larr; Go back</button>
          </div>
        )}

        {inChatham === true && (
          <form className="claim-page__form" onSubmit={handleSubmit}>
            <div className="claim-page__field">
              <label htmlFor="cb-name">Business name *</label>
              <input
                id="cb-name"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Joe's Coffee Shop"
                maxLength={200}
                required
              />
            </div>

            <div className="claim-page__field">
              <label htmlFor="cb-address">Business address *</label>
              <input
                id="cb-address"
                type="text"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="Street address, city, state, zip"
                maxLength={500}
                required
              />
            </div>

            <div className="claim-page__field">
              <label htmlFor="cb-contact-name">Your name *</label>
              <input
                id="cb-contact-name"
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="First and last name"
                maxLength={100}
                required
              />
            </div>

            <div className="claim-page__row">
              <div className="claim-page__field">
                <label htmlFor="cb-phone">Phone *</label>
                <input
                  id="cb-phone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="(919) 555-0123"
                  maxLength={20}
                  required
                />
              </div>
              <div className="claim-page__field">
                <label htmlFor="cb-email">Email *</label>
                <input
                  id="cb-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="you@business.com"
                  maxLength={255}
                  required
                />
              </div>
            </div>

            <div className="claim-page__field">
              <label htmlFor="cb-heard">How did you hear about us?</label>
              <input
                id="cb-heard"
                type="text"
                value={howHeard}
                onChange={(e) => setHowHeard(e.target.value)}
                placeholder="Social media, friend, event, etc."
                maxLength={500}
              />
            </div>

            <div className="claim-page__field">
              <label htmlFor="cb-anything">Anything else?</label>
              <textarea
                id="cb-anything"
                value={anythingElse}
                onChange={(e) => setAnythingElse(e.target.value)}
                rows={3}
                maxLength={2000}
              />
            </div>

            {error && <p className="claim-page__error">{error}</p>}

            <button
              type="submit"
              className="claim-page__submit"
              disabled={submitting || !businessName.trim() || !contactName.trim() || !contactPhone.trim() || !contactEmail.trim() || !businessAddress.trim()}
            >
              {submitting ? 'Submitting...' : 'Claim My Business'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ClaimBusiness;
