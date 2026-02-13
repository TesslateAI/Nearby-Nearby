import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../config';
import { getPOIUrl } from '../utils/slugify';
import { filterPOIsByAttributes } from '../utils/attributeFilters';
import './SearchBar.css';
import SearchDropdown from './SearchDropdown';

function SearchBar({
  placeholder = "What's nearby? Search for locations or interests...",
  openInNewTab = false,
  nearbyPoiIds = null,  // Array of POI IDs to filter against (for nearby filtering mode)
  onFilterNearby = null // Callback with filtered POI IDs when in nearby filtering mode
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // When in nearby filter mode and query is cleared, reset the filter
  useEffect(() => {
    if (nearbyPoiIds && onFilterNearby && searchQuery.trim().length === 0) {
      onFilterNearby(null); // null means show all nearby
    }
  }, [searchQuery, nearbyPoiIds, onFilterNearby]);

  // Close dropdown when clicking outside (handled in dropdown portal as well)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Ignore clicks inside the dropdown portal
      const portalEl = document.getElementById('search-dropdown-portal');
      if (portalEl && portalEl.contains(event.target)) {
        return;
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search API call
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        fetchSearchResults(searchQuery);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const fetchSearchResults = async (query) => {
    setIsLoading(true);
    try {
      // Use hybrid search (combines keyword + semantic understanding)
      // Falls back to keyword search if semantic model isn't loaded
      const response = await fetch(getApiUrl(`api/pois/hybrid-search?q=${encodeURIComponent(query)}&limit=50`)); // Get more results for filtering
      if (response.ok) {
        const data = await response.json();

        // Apply attribute-based filtering to results
        const attributeFilteredData = filterPOIsByAttributes(query, data);

        // If in nearby filter mode, filter results to only include nearby POIs
        if (nearbyPoiIds && onFilterNearby) {
          const nearbyIdSet = new Set(nearbyPoiIds);
          const filteredResults = attributeFilteredData.filter(poi => nearbyIdSet.has(poi.id));
          setSearchResults(filteredResults);
          setShowDropdown(filteredResults.length > 0);
          // Call the filter callback with matching POI IDs
          onFilterNearby(filteredResults.map(poi => poi.id));
        } else {
          setSearchResults(attributeFilteredData.slice(0, 8)); // Limit to 8 for regular search
          setShowDropdown(attributeFilteredData.length > 0);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      if (nearbyPoiIds && onFilterNearby) {
        onFilterNearby(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    setSelectedIndex(-1);
  };

  const handleResultClick = (poi) => {
    const url = getPOIUrl(poi);
    if (openInNewTab) {
      window.open(url, '_blank');
    } else {
      navigate(url);
    }
    setShowDropdown(false);
    setSearchQuery('');
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleResultClick(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
      default:
        break;
    }
  };

  return (
    <div className="search-bar-wrapper" ref={searchRef}>
      <div className="search-bar-input">
        <span className="search-bar-input__icon" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <input
          type="search"
          placeholder={placeholder}
          aria-label="Search for locations or interests"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          ref={inputRef}
        />
      </div>
      <SearchDropdown
        visible={showDropdown}
        anchorEl={inputRef.current}
        isLoading={isLoading}
        results={searchResults}
        selectedIndex={selectedIndex}
        onItemClick={handleResultClick}
        onItemHover={setSelectedIndex}
        onClose={() => setShowDropdown(false)}
      />
    </div>
  );
}

export default SearchBar;
