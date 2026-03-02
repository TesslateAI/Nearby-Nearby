import './NearbyFilters.css';

const DEFAULT_FILTERS = ['All', 'Businesses', 'Events', 'Parks', 'Trails'];

function NearbyFilters({ selectedFilter, onFilterChange, variant = 'dark', filters = null }) {
  const filterList = filters || DEFAULT_FILTERS;

  return (
    <div className={`nearby-filters nearby-filters--${variant}`}>
      <div className="nearby-filters__scroll">
        {filterList.map(filter => (
          <button
            key={filter}
            className={`nearby-filter ${selectedFilter === filter ? 'nearby-filter--active' : ''}`}
            onClick={() => onFilterChange(filter)}
            aria-pressed={selectedFilter === filter}
            aria-label={`Filter by ${filter.toLowerCase()}`}
            type="button"
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
}

export default NearbyFilters;
