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

function NearbyFilters({ selectedFilter, onFilterChange }) {
  const filters = ['All', 'Businesses', 'Events', 'Parks', 'Trails', 'Youth Events'];

  return (
    <div className="nearby-filters">
      <div className="nearby-filters__scroll">
        {filters.map(filter => {
          const Icon = filterIcons[filter];
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
