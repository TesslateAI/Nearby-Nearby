import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './SearchDropdown.css';

function SearchDropdown({
  visible,
  anchorEl,
  isLoading,
  results,
  selectedIndex,
  onItemClick,
  onItemHover,
  onClose,
}) {
  const portalRootRef = useRef(null);
  const [position, setPosition] = useState(null);

  // Create a container for the portal if it doesn't exist
  if (!portalRootRef.current) {
    const div = document.createElement('div');
    div.setAttribute('id', 'search-dropdown-portal');
    portalRootRef.current = div;
  }

  useEffect(() => {
    const el = portalRootRef.current;
    document.body.appendChild(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  // Recalculate position when visible, on scroll, and on resize
  useEffect(() => {
    const updatePosition = () => {
      if (!anchorEl) return;
      const rect = anchorEl.getBoundingClientRect();
      setPosition({
        top: Math.round(rect.bottom + 8 + window.scrollY),
        left: Math.round(rect.left + window.scrollX),
        width: Math.round(rect.width),
      });
    };

    if (visible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [visible, anchorEl]);

  useEffect(() => {
    const onDocMouseDown = (e) => {
      const portalEl = portalRootRef.current;
      if (!portalEl) return;
      const clickedInsidePortal = portalEl.contains(e.target);
      const clickedInAnchor = anchorEl && anchorEl.contains && anchorEl.contains(e.target);
      if (!clickedInsidePortal && !clickedInAnchor) {
        onClose?.();
      }
    };
    if (visible) {
      document.addEventListener('mousedown', onDocMouseDown);
    }
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [visible, anchorEl, onClose]);

  if (!visible || !position) return null;

  const style = {
    position: 'absolute',
    top: position.top,
    left: position.left,
    width: position.width,
    zIndex: 10000,
  };

  const content = (
    <div className="search-dropdown" style={style} role="listbox">
      {isLoading ? (
        <div className="search-dropdown__state">Searching...</div>
      ) : results && results.length > 0 ? (
        <ul className="search-dropdown__list">
          {results.map((poi, index) => (
            <li
              key={poi.id}
              className={`search-dropdown__item ${index === selectedIndex ? 'search-dropdown__item--selected' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onItemClick?.(poi); }}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onItemClick?.(poi); }}
              onMouseEnter={() => onItemHover?.(index)}
            >
              <div className="search-dropdown__content">
                <div className="search-dropdown__name">{poi.name}</div>
                {(poi.address_city || poi.address_state) && (
                  <div className="search-dropdown__city">
                    {[
                      poi.address_city,
                      poi.address_state === 'NC' ? 'North Carolina' : poi.address_state
                    ].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="search-dropdown__state">No results found</div>
      )}
    </div>
  );

  return createPortal(content, portalRootRef.current);
}

export default SearchDropdown;
