import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import './EventVendors.css';

/**
 * EventVendors - Displays participating vendors for an event POI
 *
 * Props:
 * - poiId: string - the event POI ID to fetch vendors for
 */
function EventVendors({ poiId }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!poiId) return;

    const fetchVendors = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch(`${API_BASE_URL}/api/pois/${poiId}/vendors`);
        if (!response.ok) {
          setError(true);
          return;
        }
        const data = await response.json();
        setVendors(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, [poiId]);

  if (loading) {
    return <div className="event-vendors__loading">Loading vendors...</div>;
  }

  if (error) {
    return <div className="event-vendors__error">Unable to load vendors.</div>;
  }

  if (vendors.length === 0) {
    return (
      <div className="event-vendors__empty">
        No vendors listed for this event.
      </div>
    );
  }

  return (
    <div className="event-vendors">
      <div className="event-vendors__grid">
        {vendors.map((vendor) => (
          <div key={vendor.id} className="event-vendors__card">
            <Link to={`/poi/${vendor.id}`} className="event-vendors__name">
              {vendor.name}
            </Link>
            {vendor.poi_type && (
              <span className="event-vendors__type-badge">
                {vendor.poi_type}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default EventVendors;
