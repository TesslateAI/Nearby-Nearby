import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import './EventSponsors.css';

const TIER_CLASSES = {
  Platinum: 'event-sponsors__tier--platinum',
  Gold: 'event-sponsors__tier--gold',
  Silver: 'event-sponsors__tier--silver',
  Bronze: 'event-sponsors__tier--bronze',
  Community: 'event-sponsors__tier--community',
};

/**
 * EventSponsors - Displays sponsors for an event POI
 *
 * Props:
 * - poiId: string - the event POI ID to fetch sponsors for
 */
function EventSponsors({ poiId }) {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!poiId) return;

    const fetchSponsors = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch(`${API_BASE_URL}/api/pois/${poiId}/sponsors`);
        if (!response.ok) {
          setError(true);
          return;
        }
        const data = await response.json();
        setSponsors(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSponsors();
  }, [poiId]);

  if (loading) {
    return <div className="event-sponsors__loading">Loading sponsors...</div>;
  }

  if (error) {
    return <div className="event-sponsors__error">Unable to load sponsors.</div>;
  }

  if (sponsors.length === 0) {
    return (
      <div className="event-sponsors__empty">
        No sponsors listed for this event.
      </div>
    );
  }

  const renderSponsorName = (sponsor) => {
    if (sponsor.poi_id) {
      return (
        <Link to={`/poi/${sponsor.poi_id}`} className="event-sponsors__name">
          {sponsor.name}
        </Link>
      );
    }
    if (sponsor.url) {
      return (
        <a
          href={sponsor.url}
          className="event-sponsors__name"
          target="_blank"
          rel="noopener noreferrer"
        >
          {sponsor.name}
        </a>
      );
    }
    return <span className="event-sponsors__name">{sponsor.name}</span>;
  };

  return (
    <div className="event-sponsors">
      <div className="event-sponsors__grid">
        {sponsors.map((sponsor) => (
          <div key={sponsor.id} className="event-sponsors__card">
            {sponsor.logo_url && (
              <div className="event-sponsors__logo-wrapper">
                <img
                  src={sponsor.logo_url}
                  alt={`${sponsor.name} logo`}
                  className="event-sponsors__logo"
                />
              </div>
            )}
            <div className="event-sponsors__info">
              {renderSponsorName(sponsor)}
              {sponsor.tier && (
                <span
                  className={`event-sponsors__tier-badge ${TIER_CLASSES[sponsor.tier] || ''}`}
                >
                  {sponsor.tier}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EventSponsors;
