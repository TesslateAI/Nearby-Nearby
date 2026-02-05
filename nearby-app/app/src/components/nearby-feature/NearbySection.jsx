import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ChevronDown, X, RotateCcw } from 'lucide-react';
import SearchBar from '../SearchBar';
import Map from '../Map';
import NearbyCard from './NearbyCard';
import NearbyFilters from './NearbyFilters';
import { getApiUrl } from '../../config';
import { getPOIUrl } from '../../utils/slugify';
import './NearbySection.css';

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

// Format date for display
const formatDateDisplay = (dateStr) => {
  if (!dateStr) return 'Any Date';
  const presets = getDatePresets();
  if (dateStr === presets.today) return 'Today';
  if (dateStr === presets.tomorrow) return 'Tomorrow';
  if (dateStr === presets.saturday || dateStr === presets.sunday) return 'This Weekend';

  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

function NearbySection({ currentPOI }) {
  const navigate = useNavigate();
  const [nearbyPOIs, setNearbyPOIs] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [radiusMiles, setRadiusMiles] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [selectedDate, setSelectedDate] = useState(''); // New date state
  const [highlightedCardId, setHighlightedCardId] = useState(null); // For map-card connection
  const [copiedText, setCopiedText] = useState(null); // Track what was copied
  const [searchFilteredIds, setSearchFilteredIds] = useState(null); // IDs from hybrid search filter
  const [showDateDropdown, setShowDateDropdown] = useState(false); // Date dropdown visibility
  const cardRefs = useRef({}); // Refs for card scrolling
  const dateDropdownRef = useRef(null); // Ref for date dropdown

  // Close date dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
        setShowDateDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  };

  const handleClear = () => {
    setSelectedFilter('All');
    setRadiusMiles(5);
    setSelectedDate('');
    setSearchFilteredIds(null);
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
        'Youth Events': 'event' // Youth events are a subset of events
      };

      const expectedType = filterMap[selectedFilter];
      if (expectedType && nearbyPoi.poi_type?.toLowerCase() !== expectedType) {
        return false;
      }

      // Additional filter for Youth Events - check if event is youth-oriented
      if (selectedFilter === 'Youth Events') {
        // Check for youth-related categories or tags
        const isYouthEvent = nearbyPoi.categories?.some(c =>
          c.category?.name?.toLowerCase().includes('youth') ||
          c.category?.name?.toLowerCase().includes('kids') ||
          c.category?.name?.toLowerCase().includes('family') ||
          c.category?.name?.toLowerCase().includes('children')
        ) || nearbyPoi.name?.toLowerCase().includes('youth') ||
           nearbyPoi.name?.toLowerCase().includes('kids');

        if (!isYouthEvent) {
          return false;
        }
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

  const handleMappingService = (service) => {
    if (!selectedPOI || !selectedPOI.location || !selectedPOI.location.coordinates) return;

    const longitude = selectedPOI.location.coordinates[0];
    const latitude = selectedPOI.location.coordinates[1];

    let url = '';
    switch (service) {
      case 'google':
        url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        break;
      case 'apple':
        url = `http://maps.apple.com/?daddr=${latitude},${longitude}`;
        break;
      case 'waze':
        url = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
        break;
      default:
        return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
    setShowDirectionsModal(false);
  };

  // Copy functions for directions modal
  const handleCopyLatLong = async () => {
    if (!selectedPOI?.location?.coordinates) return;
    const lat = selectedPOI.location.coordinates[1];
    const lng = selectedPOI.location.coordinates[0];
    try {
      await navigator.clipboard.writeText(`${lat}, ${lng}`);
      setCopiedText('latlong');
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyAddress = async () => {
    if (!selectedPOI) return;
    const address = [
      selectedPOI.address_street,
      selectedPOI.address_city,
      selectedPOI.address_state,
      selectedPOI.address_zip
    ].filter(Boolean).join(', ');

    try {
      await navigator.clipboard.writeText(address);
      setCopiedText('address');
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
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
    if (totalPages <= 1) return null;

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
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="nearby-pagination__btn"
        >
          &lt;
        </button>
        {pageNumbers.map(num => (
          <button
            key={num}
            onClick={() => setCurrentPage(num)}
            className={`nearby-pagination__num ${currentPage === num ? 'active' : ''}`}
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
      <div className="nearby-section__header">
        <h2 className="nearby-section__title">NEARBY</h2>
        <div className="nearby-section__count">
          {filteredNearbyPOIs.length} {filteredNearbyPOIs.length === 1 ? 'listing' : 'listings'}
        </div>
        <NearbyFilters
          selectedFilter={selectedFilter}
          onFilterChange={handleFilterChange}
        />
      </div>

      <div className="nearby-section__controls">
        {/* Search Bar - Full width row */}
        <div className="nearby-controls__search">
          <SearchBar
            placeholder='Search nearby... try "pet friendly" or "coffee"'
            openInNewTab={true}
            nearbyPoiIds={nearbyPOIs.map(poi => poi.id)}
            onFilterNearby={handleSearchFilter}
          />
        </div>

        {/* Control buttons row */}
        <div className="nearby-controls__row">
          {/* Radius Dropdown */}
          <div className="nearby-dropdown">
            <button
              className="nearby-dropdown__btn"
              onClick={(e) => {
                const select = e.currentTarget.nextElementSibling;
                select.focus();
                select.click();
              }}
            >
              <MapPin size={16} />
              <span>{radiusMiles} {radiusMiles === 1 ? 'mile' : 'miles'}</span>
              <ChevronDown size={14} />
            </button>
            <select
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

          {/* Date Dropdown */}
          <div className="nearby-dropdown" ref={dateDropdownRef}>
            <button
              className={`nearby-dropdown__btn ${selectedDate ? 'nearby-dropdown__btn--active' : ''}`}
              onClick={() => setShowDateDropdown(!showDateDropdown)}
            >
              <Calendar size={16} />
              <span>{formatDateDisplay(selectedDate)}</span>
              <ChevronDown size={14} />
            </button>

            {showDateDropdown && (
              <div className="nearby-dropdown__menu">
                <button
                  className={`nearby-dropdown__option ${!selectedDate ? 'nearby-dropdown__option--active' : ''}`}
                  onClick={() => { setSelectedDate(''); setShowDateDropdown(false); }}
                >
                  Any Date
                </button>
                <button
                  className={`nearby-dropdown__option ${selectedDate === getDatePresets().today ? 'nearby-dropdown__option--active' : ''}`}
                  onClick={() => { setSelectedDate(getDatePresets().today); setShowDateDropdown(false); }}
                >
                  Today
                </button>
                <button
                  className={`nearby-dropdown__option ${selectedDate === getDatePresets().tomorrow ? 'nearby-dropdown__option--active' : ''}`}
                  onClick={() => { setSelectedDate(getDatePresets().tomorrow); setShowDateDropdown(false); }}
                >
                  Tomorrow
                </button>
                <button
                  className={`nearby-dropdown__option ${selectedDate === getDatePresets().saturday ? 'nearby-dropdown__option--active' : ''}`}
                  onClick={() => { setSelectedDate(getDatePresets().saturday); setShowDateDropdown(false); }}
                >
                  This Weekend
                </button>
                <div className="nearby-dropdown__divider" />
                <label className="nearby-dropdown__date-label">
                  <span>Pick a date</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => { setSelectedDate(e.target.value); setShowDateDropdown(false); }}
                    min={getDatePresets().today}
                    className="nearby-dropdown__date-input"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Clear Button */}
          <button
            onClick={handleClear}
            className="nearby-clear-btn"
            aria-label="Clear all filters"
          >
            <RotateCcw size={16} />
            <span>Clear</span>
          </button>
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

      {/* Map Legend */}
      <div className="nearby-map-legend">
        <div className="nearby-map-legend__item">
          <span className="nearby-map-legend__marker nearby-map-legend__marker--current"></span>
          <span className="nearby-map-legend__label">Current Location</span>
        </div>
        <div className="nearby-map-legend__item">
          <span className="nearby-map-legend__marker nearby-map-legend__marker--nearby">1</span>
          <span className="nearby-map-legend__label">Nearby POI</span>
        </div>
      </div>

      {/* Nearby Results */}
      <div className="nearby-results">
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

      {/* Directions Modal - Improved */}
      {showDirectionsModal && selectedPOI && (
        <div className="directions-modal-overlay" onClick={() => setShowDirectionsModal(false)}>
          <div className="directions-modal" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowDirectionsModal(false)}
              className="directions-modal__close-x"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <h3 className="directions-modal__title">{selectedPOI.name}</h3>

            {/* Address display */}
            {selectedPOI.address_street && (
              <p className="directions-modal__address">
                {selectedPOI.address_street}
                {selectedPOI.address_city && `, ${selectedPOI.address_city}`}
                {selectedPOI.address_state && ` ${selectedPOI.address_state}`}
                {selectedPOI.address_zip && ` ${selectedPOI.address_zip}`}
              </p>
            )}

            {/* Copy buttons */}
            <div className="directions-modal__copy-section">
              <button onClick={handleCopyLatLong} className="directions-modal__copy-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {copiedText === 'latlong' ? 'Copied!' : 'Copy Lat & Long'}
              </button>
              <button onClick={handleCopyAddress} className="directions-modal__copy-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {copiedText === 'address' ? 'Copied!' : 'Copy Address'}
              </button>
            </div>

            <p className="directions-modal__subtitle">Open in:</p>

            <div className="directions-modal__buttons">
              <button
                onClick={() => handleMappingService('google')}
                className="directions-modal__btn directions-modal__btn--google"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
                </svg>
                Google Maps
              </button>
              <button
                onClick={() => handleMappingService('apple')}
                className="directions-modal__btn directions-modal__btn--apple"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83z"/>
                  <path d="M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Apple Maps
              </button>
              <button
                onClick={() => handleMappingService('waze')}
                className="directions-modal__btn directions-modal__btn--waze"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  <circle cx="8.5" cy="10.5" r="1.5"/>
                  <circle cx="15.5" cy="10.5" r="1.5"/>
                  <path d="M12 16c-1.48 0-2.75-.81-3.45-2h6.9c-.7 1.19-1.97 2-3.45 2z"/>
                </svg>
                Waze
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NearbySection;
