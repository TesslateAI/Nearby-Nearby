import { useState, useEffect, useRef } from 'react';
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
import SearchBar from '../components/SearchBar';
import NearbyFilters from '../components/nearby-feature/NearbyFilters';
import { getApiUrl } from '../config';
import { getPOIUrl } from '../utils/slugify';
import './Explore.css';

const CATEGORIES = [
  { name: 'Businesses', type: 'BUSINESS', icon: Briefcase },
  { name: 'Parks', type: 'PARK', icon: TreePine },
  { name: 'Trails', type: 'TRAIL', icon: Route },
  { name: 'Events', type: 'EVENT', icon: Calendar }
];

// Map filter labels to API poi_type values
const FILTER_TYPE_MAP = {
  All: null,
  Businesses: 'BUSINESS',
  Events: 'EVENT',
  Parks: 'PARK',
  Trails: 'TRAIL',
};
const EXPLORE_FILTERS = ['All', 'Businesses', 'Events', 'Parks', 'Trails'];

// Reverse map: API type -> filter label
const TYPE_TO_FILTER = Object.fromEntries(
  Object.entries(FILTER_TYPE_MAP).filter(([, v]) => v).map(([k, v]) => [v, k])
);

function Explore() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL params
  const urlQuery = searchParams.get('q') || '';
  const urlType = searchParams.get('type') || null;

  const [pois, setPois] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [categoryCounts, setCategoryCounts] = useState({});
  const [userLocation] = useState({ lat: 35.7198, lng: -79.1772 });
  const [locationName] = useState('Pittsboro, NC');

  // Search results mode state
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState(
    urlType ? (TYPE_TO_FILTER[urlType] || 'All') : 'All'
  );

  const searchBarRef = useRef(null);

  // Determine mode
  const isSearchMode = !!urlQuery;
  const isByTypeMode = !urlQuery && !!urlType;

  useEffect(() => {
    fetchCategoryCounts();
  }, []);

  // --- Search results mode ---
  useEffect(() => {
    if (isSearchMode) {
      fetchSearchResults(urlQuery, urlType);
      // Sync filter pill to URL type
      setActiveFilter(urlType ? (TYPE_TO_FILTER[urlType] || 'All') : 'All');
    }
  }, [urlQuery, urlType]);

  const fetchSearchResults = async (query, type) => {
    setSearchLoading(true);
    setError(null);
    try {
      let url = `api/pois/hybrid-search?q=${encodeURIComponent(query)}&limit=50`;
      if (type) url += `&poi_type=${encodeURIComponent(type)}`;
      const response = await fetch(getApiUrl(url));
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search fetch error:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleExploreSearch = (query) => {
    const params = new URLSearchParams({ q: query });
    const apiType = FILTER_TYPE_MAP[activeFilter];
    if (apiType) params.set('type', apiType);
    navigate(`/explore?${params.toString()}`);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    if (isSearchMode) {
      const params = new URLSearchParams({ q: urlQuery });
      const apiType = FILTER_TYPE_MAP[filter];
      if (apiType) params.set('type', apiType);
      setSearchParams(params);
    } else {
      // Not in search mode, just navigate to by-type
      const apiType = FILTER_TYPE_MAP[filter];
      if (apiType) {
        navigate(`/explore?type=${apiType}`);
      } else {
        navigate('/explore');
      }
    }
  };

  // --- By-type mode ---
  useEffect(() => {
    if (isByTypeMode) {
      const category = CATEGORIES.find(c => c.type === urlType);
      setSelectedCategory(category || null);
      if (category) fetchPOIsByType(urlType);
    } else if (!isSearchMode) {
      setSelectedCategory(null);
      setPois([]);
    }
  }, [urlType, isSearchMode]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleHeartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    alert('Saving locations is coming soon!');
  };

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
      } else {
        setError('Failed to load results');
      }
    } catch (err) {
      setError('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    navigate(`/explore?type=${category.type}`);
  };

  const clearFilters = () => {
    navigate('/explore');
  };

  const getFilteredPOIs = () => {
    if (localSearchQuery) {
      return pois.filter(poi =>
        poi.name.toLowerCase().includes(localSearchQuery.toLowerCase())
      );
    }
    return pois;
  };

  const addDistances = (items) => {
    return items.map(poi => {
      if (poi.location && poi.location.coordinates) {
        const distance = calculateDistance(
          userLocation.lat, userLocation.lng,
          poi.location.coordinates[1],
          poi.location.coordinates[0]
        );
        return { ...poi, distance };
      }
      return poi;
    });
  };

  // =====================================================================
  // RENDER: Search results mode (?q=...)
  // =====================================================================
  if (isSearchMode) {
    const poisWithDistance = addDistances(searchResults);

    return (
      <div className="explore explore--filtered">
        <div className="filtered__location-bar">
          <MapPin size={16} />
          <span className="location-address">{locationName}</span>
        </div>

        <div className="filtered__header">
          <div className="filtered__header-content">
            <Link to="/explore" className="filtered__back">
              <X size={20} />
            </Link>
            <h1 className="filtered__title">Search results</h1>
          </div>

          {/* Filter pills */}
          <div className="filtered__filters-row">
            <NearbyFilters
              selectedFilter={activeFilter}
              onFilterChange={handleFilterChange}
              variant="light"
              filters={EXPLORE_FILTERS}
            />
          </div>

          {/* Search bar pre-filled with query */}
          <div className="filtered__search">
            <div className="search-input-wrapper" style={{flex: 1}}>
              <SearchBar
                ref={searchBarRef}
                placeholder="Search..."
                initialQuery={urlQuery}
                onSearch={handleExploreSearch}
                selectedType={FILTER_TYPE_MAP[activeFilter]}
              />
            </div>
            <button className="cancel-button" onClick={clearFilters}>Clear</button>
          </div>
        </div>

        <div className="filtered__content">
          <div className="filtered__list">
            {searchLoading ? (
              <div className="filtered__empty"><p>Searching...</p></div>
            ) : poisWithDistance.length > 0 ? (
              poisWithDistance.map((poi) => (
                <Link to={getPOIUrl(poi)} key={poi.id} className="poi-card">
                  <button
                    className="poi-card__heart"
                    onClick={handleHeartClick}
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
              ))
            ) : (
              <div className="filtered__empty">
                <p>No results found for &ldquo;{urlQuery}&rdquo;</p>
                <Link to={`/suggest-place?name=${encodeURIComponent(urlQuery)}`} className="filtered__suggest-link">
                  Suggest this place
                </Link>
              </div>
            )}
          </div>

          <div className="filtered__map">
            {poisWithDistance.length > 0 && poisWithDistance[0].location ? (
              <Map currentPOI={poisWithDistance[0]} nearbyPOIs={poisWithDistance.slice(1)} />
            ) : (
              <div className="map-placeholder">
                <p>No location data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // RENDER: By-type results mode (?type=BUSINESS)
  // =====================================================================
  if (isByTypeMode && selectedCategory) {
    const displayedPOIs = getFilteredPOIs();
    const poisWithDistance = addDistances(displayedPOIs);

    if (loading) {
      return (
        <div className="explore">
          <div className="explore__container">
            <div className="explore__loading">Loading...</div>
          </div>
        </div>
      );
    }

    return (
      <div className="explore explore--filtered">
        <div className="filtered__location-bar">
          <MapPin size={16} />
          <span className="location-address">{locationName}</span>
        </div>

        <div className="filtered__header">
          <div className="filtered__header-content">
            <Link to="/explore" className="filtered__back">
              <X size={20} />
            </Link>
            <h1 className="filtered__title">{selectedCategory.name}</h1>
          </div>

          <div className="filtered__search">
            <div className="search-input-wrapper">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Search..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="search-input"
              />
              {localSearchQuery && (
                <button onClick={() => setLocalSearchQuery('')} className="search-clear">
                  <X size={16} />
                </button>
              )}
            </div>
            <button className="cancel-button" onClick={clearFilters}>Cancel</button>
          </div>
        </div>

        <div className="filtered__content">
          <div className="filtered__list">
            {poisWithDistance.map((poi) => (
              <Link to={getPOIUrl(poi)} key={poi.id} className="poi-card">
                <button
                  className="poi-card__heart"
                  onClick={handleHeartClick}
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

          <div className="filtered__map">
            {poisWithDistance.length > 0 && poisWithDistance[0].location ? (
              <Map currentPOI={poisWithDistance[0]} nearbyPOIs={poisWithDistance.slice(1)} />
            ) : (
              <div className="map-placeholder">
                <p>No location data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // RENDER: Category grid (default)
  // =====================================================================
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
