import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Briefcase,
  TreePine,
  Route,
  Calendar,
  MapPin,
  ArrowRight,
  X,
  Search,
  Heart
} from 'lucide-react';
import Map from '../components/Map';
import { getApiUrl } from '../config';
import { getPOIUrl } from '../utils/slugify';
import { filterPOIsByAttributes } from '../utils/attributeFilters';
import './Explore.css';

// Only 4 categories: Businesses, Parks, Trails, Events
const CATEGORIES = [
  { name: 'Businesses', type: 'BUSINESS', icon: Briefcase },
  { name: 'Parks', type: 'PARK', icon: TreePine },
  { name: 'Trails', type: 'TRAIL', icon: Route },
  { name: 'Events', type: 'EVENT', icon: Calendar }
];

function Explore() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryType = searchParams.get('type');

  const [pois, setPois] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryCounts, setCategoryCounts] = useState({});
  const [userLocation] = useState({ lat: 35.7198, lng: -79.1772 }); // Fixed: Pittsboro, NC
  const [locationName] = useState('Pittsboro, NC');
  const [isSearching, setIsSearching] = useState(false);
  const [originalPOIs, setOriginalPOIs] = useState([]); // Store original POIs from category fetch

  useEffect(() => {
    fetchCategoryCounts();
  }, []);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Haversine formula
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleHeartClick = (e, poiName) => {
    e.preventDefault();
    e.stopPropagation();
    alert('Saving locations is coming soon!');
  };

  useEffect(() => {
    if (categoryType) {
      const category = CATEGORIES.find(c => c.type === categoryType);
      setSelectedCategory(category);
      fetchPOIsByType(categoryType);
    } else {
      setSelectedCategory(null);
      setPois([]);
    }
  }, [categoryType]);

  const fetchCategoryCounts = async () => {
    try {
      const counts = {};
      await Promise.all(
        CATEGORIES.map(async (category) => {
          const response = await fetch(getApiUrl(`api/pois/by-type/${category.type}`));
          if (response.ok) {
            const data = await response.json();
            counts[category.type] = data.length;
          }
        })
      );
      setCategoryCounts(counts);
    } catch (err) {
      console.error('Failed to fetch category counts:', err);
    }
  };

  const fetchPOIsByType = async (type) => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl(`api/pois/by-type/${type}`));
      if (response.ok) {
        const data = await response.json();
        setPois(data);
        setOriginalPOIs(data); // Store original POIs for when search is cleared
      } else {
        setError('Failed to load results');
      }
    } catch (err) {
      setError('Failed to load results');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    navigate(`/explore?type=${category.type}`);
  };

  const clearFilters = () => {
    navigate('/explore');
    setSearchQuery('');
  };

  const handleSearch = async (query) => {
    setIsSearching(true);
    try {
      console.log('[Explore Search] Starting search for:', query);
      console.log('[Explore Search] Selected category:', selectedCategory);

      // Call hybrid search API
      const response = await fetch(
        getApiUrl(`api/pois/hybrid-search?q=${encodeURIComponent(query)}&limit=50`)
      );

      if (response.ok) {
        const data = await response.json();
        console.log('[Explore Search] API returned', data.length, 'POIs');

        // Apply attribute filtering
        const attributeFiltered = filterPOIsByAttributes(query, data);
        console.log('[Explore Search] After attribute filtering:', attributeFiltered.length, 'POIs');

        // If a specific type is selected, filter by that type
        if (selectedCategory) {
          console.log('[Explore Search] Filtering by type:', selectedCategory.type);
          const typeFiltered = attributeFiltered.filter(poi => {
            const matches = poi.poi_type === selectedCategory.type;
            console.log(`[Explore Search] POI "${poi.name}" (${poi.poi_type}) matches ${selectedCategory.type}?`, matches);
            return matches;
          });
          console.log('[Explore Search] After type filtering:', typeFiltered.length, 'POIs');
          setPois(typeFiltered);
        } else {
          setPois(attributeFiltered);
        }
      } else {
        console.error('Search API failed');
        // Fallback to simple name search on original POIs
        const nameFiltered = originalPOIs.filter(poi =>
          poi.name.toLowerCase().includes(query.toLowerCase())
        );
        setPois(nameFiltered);
      }
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to simple name search on original POIs
      const nameFiltered = originalPOIs.filter(poi =>
        poi.name.toLowerCase().includes(query.toLowerCase())
      );
      setPois(nameFiltered);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced hybrid search effect
  useEffect(() => {
    // Skip search if no category is selected
    if (!selectedCategory) return;

    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        handleSearch(searchQuery);
      } else {
        // Reset to original POIs when search is cleared
        setPois(originalPOIs);
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, originalPOIs, selectedCategory]);

  const getFilteredPOIs = () => {
    return pois; // POIs are already filtered by handleSearch
  };

  if (loading) {
    return (
      <div className="explore">
        <div className="explore__container">
          <div className="explore__loading">Loading categories...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="explore">
        <div className="explore__container">
          <div className="explore__error">{error}</div>
        </div>
      </div>
    );
  }

  // Render filtered results view
  if (selectedCategory) {
    const displayedPOIs = getFilteredPOIs();

    // Calculate distances for each POI
    const poisWithDistance = displayedPOIs.map(poi => {
      if (poi.location && poi.location.coordinates) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          poi.location.coordinates[1], // latitude
          poi.location.coordinates[0]  // longitude
        );
        return { ...poi, distance };
      }
      return poi;
    });

    return (
      <div className="explore explore--filtered">
        {/* Location bar */}
        <div className="filtered__location-bar">
          <MapPin size={16} />
          <span className="location-address">{locationName}</span>
        </div>

        {/* Header with category name */}
        <div className="filtered__header">
          <div className="filtered__header-content">
            <Link to="/explore" className="filtered__back">
              <X size={20} />
            </Link>
            <h1 className="filtered__title">{selectedCategory.name}</h1>
          </div>

          {/* Search bar */}
          <div className="filtered__search">
            <div className="search-input-wrapper">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Search by name or attributes (pet friendly, WiFi, etc.)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {isSearching && (
                <div className="search-loading">
                  <div className="search-spinner"></div>
                </div>
              )}
              {searchQuery && !isSearching && (
                <button onClick={() => setSearchQuery('')} className="search-clear">
                  <X size={16} />
                </button>
              )}
            </div>
            <button className="cancel-button" onClick={clearFilters}>Cancel</button>
          </div>

        </div>

        {/* Results grid with map */}
        <div className="filtered__content">
          {/* POI List */}
          <div className="filtered__list">
            {poisWithDistance.map((poi) => (
              <Link to={getPOIUrl(poi)} key={poi.id} className="poi-card">
                <button
                  className="poi-card__heart"
                  onClick={(e) => handleHeartClick(e, poi.name)}
                  aria-label="Save location"
                >
                  <Heart size={20} />
                </button>
                <div className="poi-card__image">
                  <MapPin size={32} />
                </div>
                <div className="poi-card__content">
                  <h3 className="poi-card__title">{poi.name}</h3>
                  {poi.address_city && (
                    <p className="poi-card__address">{poi.address_city}</p>
                  )}
                  {poi.distance !== undefined && (
                    <p className="poi-card__distance">
                      {poi.distance < 1
                        ? `${(poi.distance * 5280).toFixed(0)} ft away`
                        : `${poi.distance.toFixed(1)} mi away`
                      }
                    </p>
                  )}
                </div>
              </Link>
            ))}

            {poisWithDistance.length === 0 && !loading && (
              <div className="filtered__empty">
                <p>No results found.</p>
              </div>
            )}
          </div>

          {/* Map */}
          <div className="filtered__map">
            {poisWithDistance.length > 0 && poisWithDistance[0].location ? (
              <Map currentPOI={poisWithDistance[0]} nearbyPOIs={poisWithDistance.slice(1)} />
            ) : (
              <div className="map-placeholder">
                <p>📍 No location data available</p>
              </div>
            )}
          </div>
        </div>

      </div>
    );
  }

  // Render categories grid
  return (
    <div className="explore">
      <div className="explore__container">
        <div className="explore__header">
          <h1 className="explore__title">Explore categories</h1>
        </div>

        <div className="explore__categories">
          {CATEGORIES.map((category) => {
            const IconComponent = category.icon;
            const count = categoryCounts[category.type] || 0;
            return (
              <button
                key={category.type}
                className="category-card"
                onClick={() => handleCategoryClick(category)}
                aria-label={`Explore ${category.name}`}
              >
                <div className="category-card__icon">
                  <IconComponent size={48} strokeWidth={1.5} />
                </div>
                <h3 className="category-card__title">{category.name}</h3>
                <div className="category-card__count">
                  <span className="category-card__count-number">{count}</span>
                  <ArrowRight size={16} className="category-card__arrow" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Explore;
