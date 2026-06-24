import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../SearchBar';
import Map from '../Map';
import NearbyCard from './NearbyCard';
import NearbyFilters from './NearbyFilters';
import DirectionsModal from '../common/DirectionsModal';
import { getApiUrl } from '../../config';
import { getPOIUrl } from '../../utils/slugify';

// Helper to get date presets
const getDatePresets = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // This weekend (Saturday and Sunday)
  const dayOfWeek = today.getDay();
  const saturday = new Date(today);
  saturday.setDate(today.getDate() + (6 - dayOfWeek));
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);

  // Next week (next Monday)
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + (8 - dayOfWeek) % 7 || 7);

  return {
    today: today.toISOString().split('T')[0],
    tomorrow: tomorrow.toISOString().split('T')[0],
    saturday: saturday.toISOString().split('T')[0],
    sunday: sunday.toISOString().split('T')[0],
    nextMonday: nextMonday.toISOString().split('T')[0]
  };
};

function NearbySection({ currentPOI }) {
  const navigate = useNavigate();
  const [nearbyPOIs, setNearbyPOIs] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [radiusMiles, setRadiusMiles] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [selectedDate, setSelectedDate] = useState(''); // New date state
  const [highlightedCardId, setHighlightedCardId] = useState(null); // For map-card connection
  const [searchFilteredIds, setSearchFilteredIds] = useState(null); // IDs from hybrid search filter
  const cardRefs = useRef({}); // Refs for card scrolling
  const resultsTopRef = useRef(null); // Top of cards section — used to scroll on pagination

  // Wrap setCurrentPage so a click also scrolls the freshly-rendered cards into view.
  // Without this the user is sitting at the pagination row and the new page renders above —
  // visually it looks like the click did nothing.
  const goToPage = (num) => {
    setCurrentPage(num);
    requestAnimationFrame(() => {
      resultsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  useEffect(() => {
    if (currentPOI) {
      fetchNearbyPOIs();
    }
  }, [currentPOI, radiusMiles]);

  const fetchNearbyPOIs = async () => {
    setNearbyLoading(true);
    try {
      const response = await fetch(getApiUrl(`api/pois/${currentPOI.id}/nearby?radius_miles=${radiusMiles}`));
      if (response.ok) {
        const data = await response.json();
        setNearbyPOIs(data);
      }
    } catch (err) {
      console.error('Failed to fetch nearby POIs:', err);
    } finally {
      setNearbyLoading(false);
    }
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setSelectedFilter('All');
    setRadiusMiles(5);
    setSelectedDate('');
    setSearchFilteredIds(null);
    setCurrentPage(1);
  };

  // Handle search filter callback from SearchBar
  const handleSearchFilter = (filteredIds) => {
    setSearchFilteredIds(filteredIds);
    setCurrentPage(1); // Reset to first page when search changes
  };


  // Filter POIs by type, search, and exclude past events
  const filteredNearbyPOIs = nearbyPOIs.filter(nearbyPoi => {
    // Apply hybrid search filter first (if active)
    if (searchFilteredIds !== null) {
      if (!searchFilteredIds.includes(nearbyPoi.id)) {
        return false;
      }
    }

    // Filter by POI type
    if (selectedFilter !== 'All') {
      const filterMap = {
        'Businesses': 'business',
        'Events': 'event',
        'Parks': 'park',
        'Trails': 'trail',
      };

      const expectedType = filterMap[selectedFilter];
      if (expectedType && nearbyPoi.poi_type?.toLowerCase() !== expectedType) {
        return false;
      }
    }

    // Filter out past events
    if (nearbyPoi.poi_type?.toLowerCase() === 'event' && nearbyPoi.event?.end_datetime) {
      const eventEnd = new Date(nearbyPoi.event.end_datetime);
      const now = new Date();
      if (eventEnd < now) {
        return false; // Exclude past events
      }
    }

    // If date is selected, filter based on whether POI is open on that date
    if (selectedDate && nearbyPoi.poi_type?.toLowerCase() !== 'event') {
      // For non-events, check if they're open on the selected date
      const selectedDateObj = new Date(selectedDate + 'T12:00:00');
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = days[selectedDateObj.getDay()];

      if (nearbyPoi.hours?.regular?.[dayName]) {
        const dayHours = nearbyPoi.hours.regular[dayName];
        if (dayHours.status === 'closed') {
          return false;
        }
      }
    }

    // For events with date filter, check if event is on that date
    if (selectedDate && nearbyPoi.poi_type?.toLowerCase() === 'event' && nearbyPoi.event?.start_datetime) {
      const eventDate = new Date(nearbyPoi.event.start_datetime).toISOString().split('T')[0];
      const filterDate = selectedDate;
      if (eventDate !== filterDate) {
        return false;
      }
    }

    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredNearbyPOIs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPOIs = filteredNearbyPOIs.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter, nearbyPOIs, selectedDate, searchFilteredIds]);

  const handleDirectionsClick = (poi) => {
    setSelectedPOI(poi);
    setShowDirectionsModal(true);
    setCopiedText(null);
  };

  // Handle map marker click - scroll to card
  const handleMarkerClick = (poiId, index) => {
    setHighlightedCardId(poiId);

    // Find which page this POI is on
    const poiIndex = filteredNearbyPOIs.findIndex(p => p.id === poiId);
    if (poiIndex !== -1) {
      const targetPage = Math.floor(poiIndex / itemsPerPage) + 1;
      if (targetPage !== currentPage) {
        setCurrentPage(targetPage);
      }

      // Scroll to card after a short delay to allow page change
      setTimeout(() => {
        const cardElement = cardRefs.current[poiId];
        if (cardElement) {
          cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }

    // Remove highlight after 3 seconds
    setTimeout(() => setHighlightedCardId(null), 3000);
  };

  // Handle View Details click - scroll to top
  const handleDetailsClick = (poi) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate(getPOIUrl(poi));
  };

  const renderPagination = () => {
    if (totalPages <= 1 || filteredNearbyPOIs.length <= 1) return null;

    const pageNumbers = [];
    const maxVisible = 6;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="nearby-pagination">
        <button
          type="button"
          onClick={() => goToPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="nearby-pagination__btn"
        >
          &lt;
        </button>
        {pageNumbers.map(num => (
          <button
            type="button"
            key={num}
            onClick={() => goToPage(num)}
            className={`nearby-pagination__num ${currentPage === num ? 'active' : ''}`}
          >
            {num}
          </button>
        ))}
        <button
          type="button"
          onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="nearby-pagination__btn"
        >
          &gt;
        </button>
      </div>
    );
  };

  return (
    <div className="nearby-section">
      {/* Title area — wrapper_default */}
      <div className="wrapper_default">
        <h2 className="nearby-section__title">Nearby</h2>
        <div className="nearby-section__count">
          {filteredNearbyPOIs.length} {filteredNearbyPOIs.length === 1 ? 'Listing' : 'Listings'}
        </div>
      </div>

      {/* Controls wrapper — wrapper_default */}
      <div className="wrapper_default nearby-section__controls-wrapper">
        {/* Filter pills */}
        <NearbyFilters
          selectedFilter={selectedFilter}
          onFilterChange={handleFilterChange}
        />

        {/* Search + controls */}
        <div className="nearby-section__search-controls">
          {/* Search container — input + gold button */}
          <div className="nearby-search-container">
            <SearchBar
              placeholder="What's nearby? Search for locations or interests..."
              openInNewTab={true}
              nearbyPoiIds={nearbyPOIs.map(poi => poi.id)}
              onFilterNearby={handleSearchFilter}
            />
            <button type="button" className="nearby-search-btn" onClick={() => {}}>
              Search
            </button>
          </div>

          {/* Controls row — radius, date, clear, add location */}
          <div className="nearby-controls__row">
            <div className="nearby-controls__group">
              <label className="visually_hidden" htmlFor="radius_select">Search Radius:</label>
              <select
                id="radius_select"
                value={radiusMiles}
                onChange={(e) => setRadiusMiles(Number(e.target.value))}
                className="nearby-dropdown__select"
                aria-label="Select radius"
              >
                <option value={1}>1 mile</option>
                <option value={3}>3 miles</option>
                <option value={5}>5 miles</option>
                <option value={10}>10 miles</option>
                <option value={15}>15 miles</option>
              </select>
            </div>

            <div className="nearby-controls__group">
              <label className="visually_hidden" htmlFor="date_filter">Filter by Date:</label>
              <input
                type="date"
                id="date_filter"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getDatePresets().today}
                className="nearby-dropdown__select"
                aria-label="Filter by date"
              />
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="nearby-clear-btn"
              aria-label="Clear all filters"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
              </svg>
              <span>Clear</span>
            </button>

            <a href="/claim-business" className="nearby-add-location-link" aria-label="Add a new location to the directory">Add Location</a>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <Map
        currentPOI={currentPOI}
        nearbyPOIs={filteredNearbyPOIs}
        radiusMiles={radiusMiles}
        onMarkerClick={handleMarkerClick}
        highlightedId={highlightedCardId}
      />

      {/* Nearby Results — nn-templates .one_search_map_results_group */}
      <div className="nearby-results wrapper_wide" ref={resultsTopRef}>
        {nearbyLoading ? (
          <div className="nearby-results__loading">Loading nearby locations...</div>
        ) : paginatedPOIs.length > 0 ? (
          <>
            {paginatedPOIs.map((nearbyPoi, index) => (
              <NearbyCard
                key={nearbyPoi.id}
                ref={(el) => cardRefs.current[nearbyPoi.id] = el}
                poi={nearbyPoi}
                index={startIndex + index}
                totalCount={filteredNearbyPOIs.length}
                onDetailsClick={() => handleDetailsClick(nearbyPoi)}
                onDirectionsClick={handleDirectionsClick}
                isHighlighted={highlightedCardId === nearbyPoi.id}
                selectedDate={selectedDate}
              />
            ))}
          </>
        ) : (
          <div className="nearby-results__empty">No nearby locations found</div>
        )}
      </div>

      {/* Pagination */}
      {renderPagination()}

      {/* Directions Modal */}
      <DirectionsModal
        isOpen={showDirectionsModal && !!selectedPOI}
        onClose={() => setShowDirectionsModal(false)}
        poiName={selectedPOI?.name}
        coords={
          selectedPOI?.location?.coordinates
            ? { lat: selectedPOI.location.coordinates[1], lng: selectedPOI.location.coordinates[0] }
            : null
        }
        poi={selectedPOI}
      />
    </div>
  );
}

export default NearbySection;
