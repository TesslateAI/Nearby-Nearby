import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapPin, CheckCircle } from 'lucide-react';
import { getApiUrl } from '../config';
import './SuggestPlace.css';

const POI_TYPES = [
  { label: 'Business', value: 'BUSINESS' },
  { label: 'Park', value: 'PARK' },
  { label: 'Trail', value: 'TRAIL' },
  { label: 'Event', value: 'EVENT' },
];

function SuggestPlace() {
  const [searchParams] = useSearchParams();
  const prefilled = searchParams.get('name') || '';

  const [name, setName] = useState(prefilled);
  const [poiType, setPoiType] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const body = { name: name.trim() };
      if (poiType) body.poi_type = poiType;
      if (description.trim()) body.address_or_description = description.trim();
      if (email.trim()) body.submitter_email = email.trim();

      const response = await fetch(getApiUrl('api/suggestions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch {
      setError('Could not connect to the server. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="suggest-place">
        <div className="suggest-place__container">
          <div className="suggest-place__success">
            <CheckCircle size={48} />
            <h2>Thank you!</h2>
            <p>Your suggestion has been received. We review every submission and will add verified places to Nearby Nearby.</p>
            <Link to="/explore" className="suggest-place__back-link">Back to Explore</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="suggest-place">
      <div className="suggest-place__container">
        <div className="suggest-place__header">
          <MapPin size={32} />
          <h1>Suggest a Place</h1>
          <p>Know a local spot that should be on Nearby Nearby? Let us know and we'll look into adding it.</p>
        </div>

        <form className="suggest-place__form" onSubmit={handleSubmit}>
          <div className="suggest-place__field">
            <label htmlFor="sp-name">Place name *</label>
            <input
              id="sp-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Joe's Coffee Shop"
              required
            />
          </div>

          <div className="suggest-place__field">
            <label htmlFor="sp-type">Type</label>
            <select
              id="sp-type"
              value={poiType}
              onChange={(e) => setPoiType(e.target.value)}
            >
              <option value="">Select a type (optional)</option>
              {POI_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="suggest-place__field">
            <label htmlFor="sp-desc">Address or description</label>
            <textarea
              id="sp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Where is it? Any details that help us find it."
              rows={3}
            />
          </div>

          <div className="suggest-place__field">
            <label htmlFor="sp-email">Your email (optional)</label>
            <input
              id="sp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="We'll let you know when it's added"
            />
          </div>

          {error && <p className="suggest-place__error">{error}</p>}

          <button
            type="submit"
            className="suggest-place__submit"
            disabled={submitting || !name.trim()}
          >
            {submitting ? 'Submitting...' : 'Submit Suggestion'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SuggestPlace;
