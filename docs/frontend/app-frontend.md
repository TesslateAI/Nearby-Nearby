# App Frontend (nearby-app)

## Overview

The user-facing frontend is a React application built with Vite. It provides search, discovery, and POI detail viewing for public users.

**Tech Stack:**
- React 18
- Vite (build tool)
- React Router (navigation)
- React-Leaflet (maps)
- Custom CSS (no UI framework)

**Key Directories:**
```
nearby-app/app/src/
├── components/           # Reusable components
│   ├── common/           # Shared components (HoursDisplay, etc.)
│   ├── details/          # POI detail components
│   ├── nearby-feature/   # Nearby feature components
│   ├── seo/              # SEO components
│   ├── MobileNavBar.jsx  # Mobile bottom navigation
│   ├── AnnouncementBanner.jsx  # Top announcement bar
│   ├── SearchOverlay.jsx # Full-screen search overlay
│   ├── Overlay.jsx       # Backdrop overlay component
│   └── NNLogo.jsx        # Logo component
├── pages/                # Page components
│   ├── Home.jsx
│   ├── Explore.jsx       # Browse + URL-driven search results
│   ├── POIDetail.jsx     # Smart router to type-specific detail
│   ├── CommunityInterest.jsx  # Community interest form
│   ├── Contact.jsx       # Contact form
│   ├── Feedback.jsx      # Feedback with file uploads
│   └── ClaimBusiness.jsx # Business claim form
├── hooks/                # Custom hooks
│   ├── useOverlay.js     # Shared overlay state management
│   └── usePWAInstall.js  # PWA install prompt
├── styles/               # Shared CSS styles
├── utils/                # Utilities (hoursUtils, slugify, etc.)
└── App.jsx               # Root component with overlay system
```

---

## Application Structure

### Entry Point

```jsx
// nearby-app/app/src/App.jsx

import { Routes, Route, Navigate } from 'react-router-dom';
import useOverlay from './hooks/useOverlay';

function App() {
  const navOverlay = useOverlay('nav_overlay', { skipDesktop: true });
  const searchOverlay = useOverlay('search_overlay', { focusTargetId: 'one_search' });

  return (
    <>
      <a className="skip-main" href="#main_content">Skip to main content</a>
      <MobileNavBar searchOverlay={searchOverlay} navOverlay={navOverlay} />
      <AnnouncementBanner />
      <Navbar navOverlay={navOverlay} searchOverlay={searchOverlay} />
      <SearchOverlay isOpen={searchOverlay.isOpen} onClose={searchOverlay.close} panelRef={searchOverlay.panelRef} />

      <main id="main_content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/poi/:id" element={<POIDetail />} />
          <Route path="/places/:slug" element={<POIDetail />} />
          <Route path="/events/:slug" element={<POIDetail />} />
          <Route path="/parks/:slug" element={<POIDetail />} />
          <Route path="/trails/:slug" element={<POIDetail />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/services" element={<Services />} />
          <Route path="/community-interest" element={<CommunityInterest />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/claim-business" element={<ClaimBusiness />} />
          <Route path="/suggest-place" element={<Navigate to="/claim-business" replace />} />
        </Routes>
      </main>

      <Footer />
    </>
  );
}
```

### Routing by POI Type

| Route | POI Type | Example URL |
|-------|----------|-------------|
| `/places/:slug` | BUSINESS | `/places/joes-coffee-pittsboro` |
| `/parks/:slug` | PARK | `/parks/jordan-lake` |
| `/trails/:slug` | TRAIL | `/trails/lakeshore-loop` |
| `/events/:slug` | EVENT | `/events/food-festival` |
| `/poi/:id` | Any (UUID) | `/poi/550e8400-...` |
| `/community-interest` | CommunityInterest | Community interest form |
| `/contact` | Contact | Contact form |
| `/feedback` | Feedback | Feedback with file uploads |
| `/claim-business` | ClaimBusiness | Business claim form |
| `/suggest-place` | Redirect | Redirects to `/claim-business` |
| `/services` | Services | Services page |

---

## Pages

### Home Page

```jsx
// pages/Home.jsx

function Home() {
  return (
    <div className="home">
      <Navbar />
      <Hero />
      <SearchBar />
      <SignupBar />
      <InfoSection />
      <Footer />
    </div>
  );
}
```

### Explore Page

```jsx
// pages/Explore.jsx

function Explore() {
  const [categories, setCategories] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [pois, setPois] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedType) {
      fetchPOIsByType(selectedType);
    }
  }, [selectedType]);

  return (
    <div className="explore">
      <Navbar />

      <div className="explore-categories">
        {['BUSINESS', 'PARK', 'TRAIL', 'EVENT'].map(type => (
          <CategoryCard
            key={type}
            type={type}
            count={getCategoryCount(type)}
            selected={selectedType === type}
            onClick={() => setSelectedType(type)}
          />
        ))}
      </div>

      {selectedType && (
        <div className="explore-results">
          <POIGrid pois={pois} />
        </div>
      )}

      <Footer />
    </div>
  );
}
```

### POI Detail Page (Smart Router)

The POIDetail page acts as a **smart router** that dispatches to type-specific detail components based on POI type. This architecture allows each POI type to have its own specialized layout and features.

```jsx
// pages/POIDetail.jsx

function POIDetail() {
  const { id, slug } = useParams();
  const navigate = useNavigate();
  const [poi, setPoi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPOI();
  }, [id, slug]);

  // ... fetch logic ...

  if (loading) return <LoadingSpinner />;
  if (!poi) return <NotFound />;

  // Smart router: dispatch to type-specific detail component
  const DetailComponent = {
    'BUSINESS': BusinessDetail,
    'PARK': ParkDetail,
    'TRAIL': TrailDetail,
    'EVENT': EventDetail,
  }[poi.poi_type] || GenericDetail;  // GenericDetail as fallback

  return <DetailComponent poi={poi} />;
}
```

### Type-Specific Detail Components

Each POI type has a specialized detail component in `components/details/`:

| Component | File | POI Type |
|-----------|------|----------|
| BusinessDetail | `BusinessDetail.jsx` | BUSINESS |
| ParkDetail | `ParkDetail.jsx` | PARK |
| TrailDetail | `TrailDetail.jsx` | TRAIL |
| EventDetail | `EventDetail.jsx` | EVENT |
| GenericDetail | `GenericDetail.jsx` | Fallback for all other types |

All detail components now use the shared `HoursDisplay` component for consistent hours rendering.

---

## Components

### Search Bar

```jsx
// components/SearchBar.jsx

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();

  // Debounced search
  const debouncedSearch = useDebouncedCallback(async (q) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const response = await fetch(
      `/api/pois/hybrid-search?q=${encodeURIComponent(q)}&limit=8`
    );
    const data = await response.json();
    setResults(data);
    setLoading(false);
  }, 300);

  useEffect(() => {
    debouncedSearch(query);
  }, [query]);

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          navigateToPOI(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  };

  const navigateToPOI = (poi) => {
    const url = getPOIUrl(poi);
    navigate(url);
    setShowDropdown(false);
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search places, parks, trails, events..."
      />
      {loading && <span className="loading-indicator" />}

      {showDropdown && results.length > 0 && (
        <SearchDropdown
          results={results}
          selectedIndex={selectedIndex}
          onSelect={navigateToPOI}
          onClose={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
```

### Search Dropdown

```jsx
// components/SearchDropdown.jsx

import { createPortal } from 'react-dom';

function SearchDropdown({ results, selectedIndex, onSelect, onClose }) {
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.search-bar')) {
        onClose();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return createPortal(
    <div className="search-dropdown">
      {results.map((result, index) => (
        <button
          key={result.id}
          className={`search-result ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => onSelect(result)}
        >
          <span className="result-icon">
            {getTypeIcon(result.poi_type)}
          </span>
          <div className="result-content">
            <span className="result-name">{result.name}</span>
            <span className="result-meta">
              {result.poi_type} • {result.address_city}
            </span>
          </div>
        </button>
      ))}
    </div>,
    document.body
  );
}
```

### Map Component

```jsx
// components/Map.jsx

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom marker icons
const createIcon = (color, label) => L.divIcon({
  html: `<svg viewBox="0 0 24 24" width="32" height="32">
    <circle cx="12" cy="12" r="10" fill="${color}" stroke="#fff" stroke-width="2"/>
    ${label ? `<text x="12" y="16" text-anchor="middle" fill="white" font-size="12">${label}</text>` : ''}
  </svg>`,
  className: 'custom-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

function Map({ center, markers, zoom = 13, showNearby = false }) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="map-container"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      {markers.map((poi, index) => (
        <Marker
          key={poi.id}
          position={[
            poi.location?.coordinates[1] || poi.latitude,
            poi.location?.coordinates[0] || poi.longitude
          ]}
          icon={createIcon(
            index === 0 ? '#FFD700' : '#8B5CF6',
            showNearby && index > 0 ? index : null
          )}
        >
          <Popup>
            <strong>{poi.name}</strong>
            {poi.distance_miles && (
              <div>{poi.distance_miles.toFixed(1)} miles</div>
            )}
          </Popup>
        </Marker>
      ))}

      <FitBounds markers={markers} />
    </MapContainer>
  );
}

function FitBounds({ markers }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length > 1) {
      const bounds = L.latLngBounds(
        markers.map(m => [
          m.location?.coordinates[1] || m.latitude,
          m.location?.coordinates[0] || m.longitude
        ])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers, map]);

  return null;
}
```

### Nearby Section

```jsx
// components/nearby-feature/NearbySection.jsx

function NearbySection({ poi, nearbyPois: initialNearby }) {
  const [nearby, setNearby] = useState(initialNearby);
  const [radius, setRadius] = useState(5);
  const [typeFilter, setTypeFilter] = useState(null);
  const [page, setPage] = useState(0);
  const itemsPerPage = 6;

  useEffect(() => {
    if (radius !== 5) {
      fetchNearby();
    }
  }, [radius]);

  const fetchNearby = async () => {
    const response = await fetch(
      `/api/pois/${poi.id}/nearby?radius_miles=${radius}`
    );
    const data = await response.json();
    setNearby(data);
  };

  const filtered = typeFilter
    ? nearby.filter(p => p.poi_type === typeFilter)
    : nearby;

  const paginated = filtered.slice(
    page * itemsPerPage,
    (page + 1) * itemsPerPage
  );

  return (
    <section className="nearby-section">
      <h2>Nearby Places</h2>

      <NearbyFilters
        radius={radius}
        onRadiusChange={setRadius}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
      />

      <div className="nearby-layout">
        <div className="nearby-list">
          {paginated.map((nearbyPoi, index) => (
            <NearbyCard
              key={nearbyPoi.id}
              poi={nearbyPoi}
              index={page * itemsPerPage + index}
            />
          ))}
        </div>

        <div className="nearby-map">
          <Map
            center={[
              poi.location.coordinates[1],
              poi.location.coordinates[0]
            ]}
            markers={[poi, ...paginated]}
            showNearby
          />
        </div>
      </div>

      {filtered.length > itemsPerPage && (
        <Pagination
          page={page}
          total={Math.ceil(filtered.length / itemsPerPage)}
          onChange={setPage}
        />
      )}
    </section>
  );
}
```

### Nearby Card

```jsx
// components/nearby-feature/NearbyCard.jsx

function NearbyCard({ poi, index }) {
  return (
    <Link to={getPOIUrl(poi)} className="nearby-card">
      <div className="nearby-card-index">{index + 1}</div>

      <div className="nearby-card-content">
        <h3>{poi.name}</h3>

        <div className="nearby-card-meta">
          <span className="type-badge">{poi.poi_type}</span>
          <span className="distance">
            {poi.distance_miles?.toFixed(1)} miles
          </span>
        </div>

        {poi.address_city && (
          <p className="address">{poi.address_city}, {poi.address_state}</p>
        )}
      </div>
    </Link>
  );
}
```

---

## New Components

### Overlay System

The app uses a shared overlay system via `useOverlay` hook for consistent modal/overlay behavior:

```jsx
// hooks/useOverlay.js
const navOverlay = useOverlay('nav_overlay', { skipDesktop: true });
const searchOverlay = useOverlay('search_overlay', { focusTargetId: 'one_search' });
```

- **MobileNavBar**: Bottom navigation bar for mobile with hamburger menu and search toggle
- **SearchOverlay**: Full-screen search overlay with focus management
- **AnnouncementBanner**: Dismissible top banner for announcements
- **Overlay**: Backdrop component used by both nav and search overlays

### Form Pages

Four form pages following a consistent pattern (card layout, success state, error handling):

| Page | Route | API Endpoint | Key Feature |
|------|-------|-------------|-------------|
| `CommunityInterest.jsx` | `/community-interest` | `POST /api/community-interest` | Multi-select checkbox for roles |
| `Contact.jsx` | `/contact` | `POST /api/contact` | Simple 3-field form |
| `Feedback.jsx` | `/feedback` | `POST /api/feedback` | Drag-and-drop file upload with preview |
| `ClaimBusiness.jsx` | `/claim-business` | `POST /api/business-claims` | Chatham County gate (Yes/No) |

See [Forms System](../systems/forms.md) for full backend documentation.

### SEO Component

```jsx
// components/seo/SEO.jsx

import { Helmet } from 'react-helmet-async';

function SEO({ title, description, image, url, type = 'website' }) {
  const siteName = 'Nearby Nearby';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      {image && <meta property="og:image" content={image} />}
      {url && <meta property="og:url" content={url} />}
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {url && <link rel="canonical" href={url} />}
    </Helmet>
  );
}
```

---

## Common Components

### HoursDisplay Component

A reusable component for displaying POI hours with support for multiple formats and special cases.

```jsx
// components/common/HoursDisplay.jsx

function HoursDisplay({ poi }) {
  const weekHours = getWeekHours(poi.hours);
  const holidays = getUpcomingHolidays(poi.hours);

  return (
    <div className="hours-display">
      {/* Regular weekly hours */}
      <div className="week-hours">
        {weekHours.map(day => (
          <div key={day.name} className="day-row">
            <span className="day-name">{day.name}</span>
            <span className="day-hours">{day.hours}</span>
          </div>
        ))}
      </div>

      {/* Holiday hours */}
      {holidays.length > 0 && (
        <div className="holiday-hours">
          <h4>Holiday Hours</h4>
          {holidays.map(holiday => (
            <div key={holiday.date}>{holiday.name}: {holiday.status}</div>
          ))}
        </div>
      )}

      {/* Appointment booking */}
      {poi.appointment_url && (
        <a href={poi.appointment_url} className="appointment-link">
          Book Appointment
        </a>
      )}
    </div>
  );
}
```

**Features:**
- Regular weekly hours (new structured format)
- Legacy hours format support
- Holiday/special hours display
- Appointment booking links
- "See More/See Less" toggle for holiday list

### GenericDetail Component

A fallback detail view for POI types without specialized pages.

```jsx
// components/details/GenericDetail.jsx

function GenericDetail({ poi }) {
  return (
    <div className="generic-detail">
      <header>
        <h1>{poi.name}</h1>
        <StatusBadge status={poi.publication_status} />
      </header>

      <QuickInfo poi={poi} />
      <PhotoGrid images={poi.images} />
      <HoursDisplay poi={poi} />

      {/* Collapsible sections for all POI attributes */}
      <CollapsibleSections poi={poi} />

      <NearbySection poi={poi} />
    </div>
  );
}
```

**Features:**
- Collapsible sections for various POI attributes
- Dynamic info rows with label-value pairs
- Status and verified badges
- Photo grid with lazy loading
- Amenities display

### PhotoLightbox Component

A full-screen image gallery lightbox for viewing photos.

```jsx
// components/details/PhotoLightbox.jsx

function PhotoLightbox({ images, initialIndex, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-content" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <button className="nav-prev" onClick={() => setCurrentIndex(i => i - 1)}>‹</button>
        <img src={images[currentIndex].storage_url} alt={images[currentIndex].alt_text} />
        <button className="nav-next" onClick={() => setCurrentIndex(i => i + 1)}>›</button>
      </div>
    </div>
  );
}
```

**Features:**
- Modal overlay
- Previous/Next navigation
- Keyboard support (arrow keys, Escape)
- Responsive image scaling

---

## Utilities

### URL Helpers

```javascript
// utils/slugify.js

export function getPOIUrl(poi) {
  const prefix = getTypePrefix(poi.poi_type);
  return `/${prefix}/${poi.slug}`;
}

export function getTypePrefix(poiType) {
  const prefixes = {
    'BUSINESS': 'places',
    'SERVICES': 'places',
    'PARK': 'parks',
    'TRAIL': 'trails',
    'EVENT': 'events'
  };
  return prefixes[poiType] || 'places';
}

export function isUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export function truncateText(text, maxLength = 155) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
```

### API Configuration

```javascript
// config.js

export const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:8000'
  : '';

export function getApiUrl(path) {
  return `${API_BASE_URL}${path}`;
}
```

### Hours Utilities

Utility functions for parsing and displaying POI hours in various formats.

```javascript
// utils/hoursUtils.js

/**
 * Parse new structured hours format into day-by-day structure
 */
export function getWeekHours(hours) {
  if (!hours) return [];
  // Returns array of { name: 'Monday', hours: '9:00 AM - 5:00 PM' }
}

/**
 * Handle legacy simple key-value hours format
 */
export function formatLegacyHours(hours) {
  // Converts { monday: '9-5', tuesday: '9-5' } to displayable format
}

/**
 * Extract upcoming holidays from hours data
 */
export function getUpcomingHolidays(hours, daysAhead = 30) {
  // Returns array of { date, name, status }
}

/**
 * Format holiday hour status for display
 */
export function formatHolidayStatus(holiday) {
  // Returns 'Closed', 'Open 10 AM - 4 PM', etc.
}
```

**Features:**
- Handles both new structured format and legacy simple format
- Support for seasonal hours and exceptions
- Upcoming holiday extraction with configurable lookahead
- Formatted display strings for UI components

---

## PWA Support

### Install Hook

```jsx
// hooks/usePWAInstall.js

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    const result = await installPrompt.userChoice;

    if (result.outcome === 'accepted') {
      setIsInstallable(false);
    }
    setInstallPrompt(null);
  };

  return { isInstallable, install };
}
```

### Install Button

```jsx
// components/InstallButton.jsx

function InstallButton() {
  const { isInstallable, install } = usePWAInstall();

  if (!isInstallable) return null;

  return (
    <button onClick={install} className="install-button">
      Install App
    </button>
  );
}
```

---

## Styling

The app uses custom CSS modules for styling:

```
src/
├── index.css          # Global styles
├── App.css            # App-level styles
└── components/
    ├── SearchBar.css
    ├── Map.css
    ├── NearbyCard.css
    └── ...
```

### CSS Variables

```css
/* index.css */

:root {
  --color-primary: #8B5CF6;
  --color-primary-dark: #7C3AED;
  --color-secondary: #FFD700;
  --color-text: #1F2937;
  --color-text-light: #6B7280;
  --color-background: #FFFFFF;
  --color-border: #E5E7EB;

  --font-family: 'Inter', sans-serif;
  --border-radius: 8px;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

---

## Best Practices

1. **SEO-friendly URLs** - Use slugs instead of UUIDs
2. **Debounce search** - 300ms delay before API call
3. **Keyboard navigation** - Arrow keys and Enter in search
4. **Loading states** - Show spinners during fetches
5. **Error handling** - Redirect to 404 on not found
6. **Responsive design** - Mobile-first approach
7. **Lazy loading** - Load images as they scroll into view
