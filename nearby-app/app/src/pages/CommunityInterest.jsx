import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Globe, CheckCircle } from 'lucide-react';
import { getApiUrl } from '../config';
import '../styles/forms.css';
import './CommunityInterest.css';

const ROLE_OPTIONS = [
  'Resident',
  'Business Owner',
  'Event Organizer',
  'Nonprofit/Community Group',
  'Local Gov/Tourism Rep',
  'Visitor/Traveler',
  'Other',
];

function CommunityInterest() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [roles, setRoles] = useState([]);
  const [roleOther, setRoleOther] = useState('');
  const [why, setWhy] = useState('');
  const [howHeard, setHowHeard] = useState('');
  const [anythingElse, setAnythingElse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const toggleRole = (role) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const body = { location: location.trim() };
      if (name.trim()) body.name = name.trim();
      if (email.trim()) body.email = email.trim();
      if (roles.length > 0) body.role = roles;
      if (roles.includes('Other') && roleOther.trim()) body.role_other = roleOther.trim();
      if (why.trim()) body.why = why.trim();
      if (howHeard.trim()) body.how_heard = howHeard.trim();
      if (anythingElse.trim()) body.anything_else = anythingElse.trim();

      const response = await fetch(getApiUrl('api/community-interest'), {
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
      <div className="form_page">
        <div className="form_page__container">
          <div className="form_page__success">
            <CheckCircle size={48} />
            <h2>Thank you!</h2>
            <p>We appreciate your interest. We&rsquo;re working hard to bring Nearby Nearby to more communities and we&rsquo;ll keep you posted!</p>
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
          <Globe size={32} />
          <h1>Want Nearby Nearby in Your Community?</h1>
          <p>We&rsquo;re expanding! Tell us about your area and we&rsquo;ll work to bring Nearby Nearby to you.</p>
        </div>

        <form className="accessible_form" onSubmit={handleSubmit} noValidate>
          <fieldset>
            <legend>Your Community</legend>

            <div className="form_group">
              <label htmlFor="ci-location">
                Your location (Town, County, State) <span className="required" aria-label="required">*</span>
              </label>
              <input
                id="ci-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Pittsboro, Chatham County, NC"
                maxLength={200}
                required
                aria-required="true"
              />
            </div>

            <div className="form_group">
              <label htmlFor="ci-name">Your name</label>
              <input
                id="ci-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First and last name"
                maxLength={100}
              />
            </div>

            <div className="form_group">
              <label htmlFor="ci-email">Your email</label>
              <input
                id="ci-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={255}
              />
            </div>
          </fieldset>

          <fieldset>
            <legend>About You</legend>

            <fieldset className="form_group">
              <legend>Are you a... (select all that apply)</legend>
              <div className="checkbox_group">
                {ROLE_OPTIONS.map((role) => {
                  const id = `ci-role-${role.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
                  return (
                    <div key={role} className="checkbox_item">
                      <input
                        type="checkbox"
                        id={id}
                        checked={roles.includes(role)}
                        onChange={() => toggleRole(role)}
                      />
                      <label htmlFor={id}>{role}</label>
                    </div>
                  );
                })}
              </div>
            </fieldset>

            {roles.includes('Other') && (
              <div className="form_group">
                <label htmlFor="ci-role-other">Please specify</label>
                <input
                  id="ci-role-other"
                  type="text"
                  value={roleOther}
                  onChange={(e) => setRoleOther(e.target.value)}
                  placeholder="Your role"
                  maxLength={100}
                />
              </div>
            )}

            <div className="form_group">
              <label htmlFor="ci-why">Why do you want Nearby Nearby in your community?</label>
              <textarea
                id="ci-why"
                value={why}
                onChange={(e) => setWhy(e.target.value)}
                placeholder="Tell us what you'd love to see..."
                rows={4}
                maxLength={2000}
              />
            </div>

            <div className="form_group">
              <label htmlFor="ci-heard">How did you hear about us?</label>
              <input
                id="ci-heard"
                type="text"
                value={howHeard}
                onChange={(e) => setHowHeard(e.target.value)}
                placeholder="Social media, friend, event, etc."
                maxLength={500}
              />
            </div>

            <div className="form_group">
              <label htmlFor="ci-anything">Anything else you&rsquo;d like to share?</label>
              <textarea
                id="ci-anything"
                value={anythingElse}
                onChange={(e) => setAnythingElse(e.target.value)}
                rows={3}
                maxLength={2000}
              />
            </div>
          </fieldset>

          {error && <p className="form_error" role="alert">{error}</p>}

          <div className="form_actions">
            <button
              type="submit"
              className="button btn_primary"
              disabled={submitting || !location.trim()}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CommunityInterest;
