import { LayoutGrid, Store, Calendar, Trees, Mountain, Users } from 'lucide-react';
import './NearbyFilters.css';

// Map filter types to lucide icons
const filterIcons = {
  'All': LayoutGrid,
  'Businesses': Store,
  'Events': Calendar,
  'Parks': Trees,
  'Trails': Mountain,
  'Youth Events': Users
};

const DEFAULT_FILTERS = ['All', 'Businesses', 'Events', 'Parks', 'Trails', 'Youth Events'];

function NearbyFilters({ selectedFilter, onFilterChange, variant = 'dark', filters = null }) {
  const filterList = filters || DEFAULT_FILTERS;

  return (
    <div className={`nearby-filters nearby-filters--${variant}`}>
      <div className="nearby-filters__scroll">
        {filterList.map(filter => {
          const Icon = filterIcons[filter] || LayoutGrid;
          return (
            <button
              key={filter}
              className={`nearby-filter ${selectedFilter === filter ? 'nearby-filter--active' : ''}`}
              onClick={() => onFilterChange(filter)}
              aria-pressed={selectedFilter === filter}
            >
              <Icon size={16} />
              <span>{filter}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default NearbyFilters;
