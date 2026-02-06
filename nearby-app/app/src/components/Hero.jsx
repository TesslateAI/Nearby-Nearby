import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar';
import NearbyFilters from './nearby-feature/NearbyFilters';
import './Hero.css';

const TYPE_MAP = {
  All: null,
  Businesses: 'BUSINESS',
  Events: 'EVENT',
  Parks: 'PARK',
  Trails: 'TRAIL',
};

const HERO_FILTERS = ['All', 'Businesses', 'Events', 'Parks', 'Trails'];

export default function Hero() {
  const [selectedType, setSelectedType] = useState('All');
  const searchBarRef = useRef(null);
  const navigate = useNavigate();

  const handleSearch = (query) => {
    const params = new URLSearchParams({ q: query });
    const apiType = TYPE_MAP[selectedType];
    if (apiType) params.set('type', apiType);
    navigate(`/explore?${params.toString()}`);
  };

  const handleSearchButton = (e) => {
    e.preventDefault();
    const query = searchBarRef.current?.getQuery?.()?.trim();
    if (query) handleSearch(query);
  };

  return (
    <section className="nn-hero">
      <div className="nn-hero__inner wrapper_default">
        <h1 className="nn-title">Nearby Nearby</h1>
        <p className="nn-subtitle">What's Actually Nearby</p>

        <p className="nn-lede">
          No Ads. No Clutter.
          <br />
          A true picture of your community, right at your fingertips.
        </p>

        <div className="nn-search-card">
          <p className="nn-support">
            One Search shows local businesses, events, parks, trails and more. All verified and based on what's actually nearby.
          </p>

          <div className="nn-hero-filters">
            <NearbyFilters
              selectedFilter={selectedType}
              onFilterChange={setSelectedType}
              variant="light"
              filters={HERO_FILTERS}
            />
          </div>

          <form className="nn-search" onSubmit={handleSearchButton} role="search" aria-label="Nearby search">
            <SearchBar
              ref={searchBarRef}
              placeholder="What's nearby? Search for locations or interests..."
              onSearch={handleSearch}
              selectedType={TYPE_MAP[selectedType]}
            />
            <button className="button btn_search" type="submit">Search</button>
          </form>

          <p className="nn-terms">
            By clicking Search, you agree to our{' '}
            <Link to="/terms-of-service" className="nn-terms__link">Terms of Service</Link>.
          </p>
        </div>

        <div className="nn-doodle" aria-hidden="true" />
      </div>
    </section>
  );
}
