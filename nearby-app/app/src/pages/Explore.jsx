import { useState, useEffect, useRef, useCallback } from 'react';
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
  Heart,
  ChevronDown,
  RotateCcw
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

const RADIUS_OPTIONS = [1, 3, 5, 10, 15];
const DATE_PRESETS = [
  { value: 'any', label: 'Any Date' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'weekend', label: 'This Weekend' },
];

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

  // Controls state
  const [radius, setRadius] = useState(5);
  const [radiusOpen, setRadiusOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('any');
  const [dateOpen, setDateOpen] = useState(false);
  const [customDate, setCustomDate] = useState('');

  const searchBarRef = useRef(null);
  const radiusRef = useRef(null);
  const dateRef = useRef(null);

  // Determine mode
  const isSearchMode = !!urlQuery;
  const isByTypeMode = !urlQuery && !!urlType;

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (radiusRef.current && !radiusRef.current.contains(e.target)) {
        setRadiusOpen(false);
      }
      if (dateRef.current && !dateRef.current.contains(e.target)) {
        setDateOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setRadiusOpen(false);
        setDateOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
    setRadius(5);
    setDateFilter('any');
    setCustomDate('');
    navigate('/explore');
  };

  const clearControls = () => {
    setRadius(5);
    setDateFilter('any');
    setCustomDate('');
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

  const handleRadiusSelect = useCallback((value) => {
    setRadius(value);
    setRadiusOpen(false);
  }, []);

  const handleDateSelect = useCallback((value) => {
    setDateFilter(value);
    if (value !== 'custom') setCustomDate('');
    setDateOpen(false);
  }, []);

  // Controls bar (shared between search and by-type modes)
  const renderControls = () => (
    <div className="one_search_controls">
      <div className="one_search_group">
        <div className="radius_dropdown_wrapper" ref={radiusRef}>
          <button
            className="btn_show_radius_options nearby_dropdown__select"
            type="button"
            aria-haspopup="true"
            aria-expanded={radiusOpen}
            onClick={() => setRadiusOpen(prev => !prev)}
          >
            <span className="radius_button_text">{radius} {radius === 1 ? 'mile' : 'miles'}</span>
            <ChevronDown size={16} className="lucide_chevron_down" />
          </button>
          {radiusOpen && (
            <div className="dropdown_show_radius_options" role="menu">
              {RADIUS_OPTIONS.map(r => (
                <button
                  key={r}
                  className={`radius_dropdown_option${r === radius ? ' radius_dropdown_option_active' : ''}`}
                  role="menuitem"
                  onClick={() => handleRadiusSelect(r)}
                >
                  {r} {r === 1 ? 'mile' : 'miles'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="one_search_group">
        <div className="date_dropdown_wrapper" ref={dateRef}>
          <button
            className="btn_show_event_options nearby_dropdown__select"
            type="button"
            aria-haspopup="true"
            aria-expanded={dateOpen}
            onClick={() => setDateOpen(prev => !prev)}
          >
            <Calendar size={16} />
            <span className="date_button_text">
              {dateFilter === 'any' ? 'Any Date'
                : dateFilter === 'today' ? 'Today'
                : dateFilter === 'tomorrow' ? 'Tomorrow'
                : dateFilter === 'weekend' ? 'This Weekend'
                : customDate || 'Pick a date'}
            </span>
            <ChevronDown size={16} className="lucide_chevron_down" />
          </button>
          {dateOpen && (
            <div className="dropdown_show_event_options" role="menu">
              {DATE_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  className={`date_dropdown_option${dateFilter === preset.value ? ' date_dropdown_option_active' : ''}`}
                  role="menuitem"
                  onClick={() => handleDateSelect(preset.value)}
                >
                  {preset.label}
                </button>
              ))}
              <div className="date_dropdown_divider" role="separator" />
              <div className="date_dropdown_custom">
                <label className="date_dropdown_date_label">
                  <span>Pick a date</span>
                  <input
                    type="date"
                    className="date_dropdown_date_input"
                    value={customDate}
                    onChange={(e) => {
                      setCustomDate(e.target.value);
                      setDateFilter('custom');
                      setDateOpen(false);
                    }}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      <button type="button" className="btn_reset button btn_clear" onClick={clearControls}>
        <RotateCcw size={16} />
        <span>Clear</span>
      </button>
    </div>
  );

  // Result card (shared between search and by-type modes)
  const renderResultCard = (poi, options = {}) => (
    <Link to={getPOIUrl(poi)} key={poi.id} className="map_result_single_style_1 box_style_1">
      <div className="map_result_single_title">{poi.name}</div>
      {poi.poi_type && (
        <div className="map_result_single_type_amenities">
          <span className="map_result_single_type">{poi.poi_type}</span>
        </div>
      )}
      {!options.hideDistance && poi.distance !== undefined && (
        <div className="map_result_single_distance">
          {poi.distance < 1
            ? `${(poi.distance * 5280).toFixed(0)} ft away`
            : `${poi.distance.toFixed(1)} mi away`
          }
        </div>
      )}
      {poi.address_city && (
        <div className="map_result_single_city">{poi.address_city}</div>
      )}
    </Link>
  );

  // =====================================================================
  // RENDER: Search results mode (?q=...)
  // =====================================================================
  if (isSearchMode) {
    const poisWithDistance = addDistances(searchResults);

    return (
      <div className="explore explore--results explore--keyword">
        <div className="explore_results_header">
          <div className="wrapper_default">
            <div className="explore_results_header_top">
              <Link to="/explore" className="filtered__back" aria-label="Back to explore">
                <X size={20} />
              </Link>
              <h1 className="explore_results_title">
                Results for &ldquo;{urlQuery}&rdquo;
              </h1>
            </div>

            {/* Filter pills */}
            <div className="explore_filters_row">
              <NearbyFilters
                selectedFilter={activeFilter}
                onFilterChange={handleFilterChange}
                variant="light"
                filters={EXPLORE_FILTERS}
              />
            </div>

            {/* Search bar pre-filled with query */}
            <div className="explore_search_row">
              <div className="search_input_wrapper" style={{flex: 1}}>
                <SearchBar
                  ref={searchBarRef}
                  placeholder="Search..."
                  initialQuery={urlQuery}
                  onSearch={handleExploreSearch}
                  selectedType={FILTER_TYPE_MAP[activeFilter]}
                />
              </div>
            </div>

            {renderControls()}
          </div>
        </div>

        {searchLoading ? (
          <div className="explore__loading"><p>Searching...</p></div>
        ) : poisWithDistance.length > 0 ? (
          <div id="map_results_layout_1">
            <div className="map_results_layout_1_left_col">
              {poisWithDistance.map(poi => renderResultCard(poi, { hideDistance: true }))}
            </div>
            <div className="map_results_layout_1_right_col">
              <Map currentPOI={poisWithDistance[0]} nearbyPOIs={poisWithDistance.slice(1)} />
            </div>
          </div>
        ) : (
          <div className="explore__empty">
            <p>No results found for &ldquo;{urlQuery}&rdquo;</p>
            <Link to={`/claim-business?name=${encodeURIComponent(urlQuery)}`} className="filtered__suggest-link">
              Suggest this place
            </Link>
          </div>
        )}
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
      <div className="explore explore--results">
        <div className="explore_results_header">
          <div className="wrapper_default">
            <div className="explore_results_header_top">
              <Link to="/explore" className="filtered__back" aria-label="Back to explore">
                <X size={20} />
              </Link>
              <h1 className="explore_results_title">{selectedCategory.name}</h1>
            </div>

            <div className="explore_search_row">
              <div className="search_input_wrapper">
                <Search size={20} className="search_icon_inline" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  className="search_input_inline"
                />
                {localSearchQuery && (
                  <button onClick={() => setLocalSearchQuery('')} className="search_clear_inline">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {renderControls()}
          </div>
        </div>

        {poisWithDistance.length > 0 ? (
          <div id="map_results_layout_1">
            <div className="map_results_layout_1_left_col">
              {poisWithDistance.map(renderResultCard)}
            </div>
            <div className="map_results_layout_1_right_col">
              {poisWithDistance[0].location ? (
                <Map currentPOI={poisWithDistance[0]} nearbyPOIs={poisWithDistance.slice(1)} />
              ) : (
                <div className="map_placeholder">
                  <p>No location data available</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="explore__empty">
            <p>No results found.</p>
          </div>
        )}
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
          <Link to="/events-calendar" className="explore__calendar-link">
            View Calendar
          </Link>
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
