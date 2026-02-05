import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getApiUrl } from '../config';
import { isUUID, getPOIUrl } from '../utils/slugify';
import './POIDetail.css';

// Import type-specific detail components
import BusinessDetail from '../components/details/BusinessDetail';
import EventDetail from '../components/details/EventDetail';
import ParkDetail from '../components/details/ParkDetail';
import TrailDetail from '../components/details/TrailDetail';
import GenericDetail from '../components/details/GenericDetail';

/**
 * POIDetail - Smart router component that fetches POI data and renders
 * the appropriate type-specific detail component based on poi_type
 */
function POIDetail() {
  const { id, slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [poi, setPoi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get the identifier (either id or slug)
  const identifier = id || slug;

  useEffect(() => {
    fetchPOIDetails();
  }, [identifier]);

  const fetchPOIDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Determine if we're using UUID or slug
      const isUUIDIdentifier = isUUID(identifier);
      const endpoint = isUUIDIdentifier
        ? `api/pois/${identifier}`
        : `api/pois/by-slug/${identifier}`;

      const response = await fetch(getApiUrl(endpoint));
      if (response.ok) {
        const data = await response.json();
        setPoi(data);

        // If we fetched by UUID but POI has a slug, redirect to SEO-friendly URL
        if (isUUIDIdentifier && data.slug) {
          const seoUrl = getPOIUrl(data);
          window.history.replaceState(null, '', seoUrl);
        }
      } else {
        setError('POI not found');
      }
    } catch (err) {
      setError('Failed to load POI details');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Determine POI type from API response or URL path
  const getTypeFromPath = () => {
    if (location.pathname.startsWith('/places/')) return 'business';
    if (location.pathname.startsWith('/events/')) return 'event';
    if (location.pathname.startsWith('/parks/')) return 'park';
    if (location.pathname.startsWith('/trails/')) return 'trail';
    return null;
  };

  // Render loading state
  if (loading) {
    return (
      <div className="poi-detail__loading">Loading...</div>
    );
  }

  // Render error state
  if (error || !poi) {
    return (
      <div className="poi-detail__error">
        <h2>{error || 'POI not found'}</h2>
        <button type="button" onClick={() => navigate('/')} className="poi-detail__back-btn">
          Back to Home
        </button>
      </div>
    );
  }

  // Determine which component to render based on POI type
  const renderDetailComponent = () => {
    // Get type from API response, fall back to URL path
    const type = (poi.poi_type || getTypeFromPath() || '').toLowerCase();

    // Business types (restaurants, cafes, shops, services, etc.)
    const businessTypes = ['business', 'restaurant', 'cafe', 'shop', 'store', 'service', 'food', 'retail'];
    if (businessTypes.includes(type)) {
      return <BusinessDetail poi={poi} />;
    }

    // Event type
    if (type === 'event') {
      return <EventDetail poi={poi} />;
    }

    // Park type
    if (type === 'park') {
      return <ParkDetail poi={poi} />;
    }

    // Trail type
    if (type === 'trail') {
      return <TrailDetail poi={poi} />;
    }

    // Fallback to generic detail view
    return <GenericDetail poi={poi} />;
  };

  return (
    <div className="poi-detail-page">
      {renderDetailComponent()}
    </div>
  );
}

export default POIDetail;
