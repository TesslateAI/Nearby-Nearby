# Admin Frontend (nearby-admin)

## Overview

The admin frontend is a React application built with Vite and Mantine UI. It provides the interface for managing POIs, categories, images, and users.

**Tech Stack:**
- React 18
- Vite (build tool)
- Mantine v8 (UI components)
- React Router (navigation)
- TipTap (rich text editor)
- React-Leaflet (maps)
- Sentry (`@sentry/react`) for error tracking
- Vitest + React Testing Library (test infrastructure)

**Key Directories:**
```
nearby-admin/frontend/src/
├── components/      # Reusable components
│   └── common/      # Shared reusable components (POISearchSelect)
├── hooks/           # Custom React hooks (useEventStatuses)
├── pages/           # Page components
├── test/            # Test setup (setup.js)
├── utils/           # Utilities and helpers
├── main.jsx         # Entry point with Sentry init
└── App.jsx          # Root component
```

---

## Application Structure

### Entry Point

```jsx
// nearby-admin/frontend/src/App.jsx

import { MantineProvider, AppShell } from '@mantine/core';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './utils/AuthContext';

function App() {
  return (
    <MantineProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppShell
            header={{ height: 60 }}
            navbar={{ width: 250, breakpoint: 'sm' }}
          >
            <AppShell.Header>
              <Header />
            </AppShell.Header>
            <AppShell.Navbar>
              <Navigation />
            </AppShell.Navbar>
            <AppShell.Main>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <POIList />
                  </ProtectedRoute>
                } />
                <Route path="/poi/:id" element={
                  <ProtectedRoute>
                    <POIForm />
                  </ProtectedRoute>
                } />
                <Route path="/categories" element={
                  <ProtectedRoute>
                    <CategoryList />
                  </ProtectedRoute>
                } />
                {/* More routes */}
              </Routes>
            </AppShell.Main>
          </AppShell>
        </BrowserRouter>
      </AuthProvider>
    </MantineProvider>
  );
}
```

---

## POI Form System

The POI form is the most complex component, using a modular accordion-based architecture.

### Form Structure

```
components/POIForm/
├── POIForm.jsx              # Main form component (accordion visibility logic)
├── ImageIntegration.jsx     # Image upload components with context-based grouping
├── hooks/
│   ├── usePOIForm.js        # Form state (Mantine useForm)
│   ├── usePOIHandlers.jsx   # CRUD operations
│   └── useAutoSave.js       # Auto-save logic
├── constants/
│   ├── initialValues.js     # Default values (includes playground_locations, primary_parking, mobility_access, recurring event fields)
│   ├── validationRules.js   # Validation schema
│   ├── fieldOptions.js      # Field configurations
│   └── helpers.js           # Helper functions
├── components/
│   ├── VenueSelector.jsx    # Venue search & data copy for events (Task 45)
│   ├── RescheduleModal.jsx  # Modal for rescheduling events (new start/end datetime pickers)
│   ├── CheckboxGroupSection.jsx
│   └── FormActions.jsx
└── sections/
    ├── CoreInformationSection.jsx       # Name, teaser, short desc, lat/long flag, recurring event placeholder
    ├── CategoriesSection.jsx            # Category tree (1-cat limit for free biz)
    ├── ContactSection.jsx
    ├── LocationSection.jsx              # Per-lot parking photos, primary parking location, parking/transit fields
    ├── BusinessDetailsSection.jsx
    ├── BusinessGallerySection.jsx
    ├── FacilitiesSection.jsx            # Wheelchair & mobility access, multi-restroom cards, pay phone, rentals
    ├── OutdoorFeaturesSection.jsx       # Exports: OutdoorFeaturesSection, HuntingFishingSection, PetPolicySection, PlaygroundSection
    ├── TrailSpecificSections.jsx        # Trail experience removed
    ├── MiscellaneousSections.jsx        # Exports: InternalContactSection, PricingMembershipsSection, ConnectionsSection, CommunityConnectionsSection, CorporateComplianceSection
    ├── EventSpecificSections.jsx        # EventStatusSection, EventVendorsSection, EventVenueSection, EventOrganizerSection, EventSponsorsSection, EventCostSection, EventMapsSection, EventAmenitiesSection
    ├── VenueInheritanceControls.jsx     # Per-section venue data inheritance (as_is / use_and_add / do_not_use)
    ├── RecurringEventSection.jsx        # Repeating event schedule, excluded/manual dates, preview
    └── FormActions.jsx
```

### Main Form Component

```jsx
// components/POIForm/POIForm.jsx

function POIForm() {
  const { id } = useParams();
  const { form, loading, error } = usePOIForm(id);
  const { handleSave, handleDelete, handlePublish } = usePOIHandlers(form, id);

  if (loading) return <LoadingOverlay visible />;
  if (error) return <Alert color="red">{error}</Alert>;

  const poiType = form.values.poi_type;

  return (
    <form onSubmit={form.onSubmit(handleSave)}>
      <Accordion multiple defaultValue={['core', 'location']}>

        <Accordion.Item value="core">
          <Accordion.Control>Core Information</Accordion.Control>
          <Accordion.Panel>
            <CoreInformationSection form={form} />
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="categories">
          <Accordion.Control>Categories</Accordion.Control>
          <Accordion.Panel>
            <CategoriesSection form={form} poiType={poiType} />
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="location">
          <Accordion.Control>Location</Accordion.Control>
          <Accordion.Panel>
            <LocationSection form={form} />
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="contact">
          <Accordion.Control>Contact</Accordion.Control>
          <Accordion.Panel>
            <ContactSection form={form} />
          </Accordion.Panel>
        </Accordion.Item>

        {/* Type-specific sections */}
        {poiType === 'BUSINESS' && (
          <>
            <Accordion.Item value="business">
              <Accordion.Control>Business Details</Accordion.Control>
              <Accordion.Panel>
                <BusinessDetailsSection form={form} />
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="gallery">
              <Accordion.Control>Gallery</Accordion.Control>
              <Accordion.Panel>
                <BusinessGallerySection form={form} poiId={id} />
              </Accordion.Panel>
            </Accordion.Item>
          </>
        )}

        {poiType === 'TRAIL' && (
          <Accordion.Item value="trail">
            <Accordion.Control>Trail Details</Accordion.Control>
            <Accordion.Panel>
              <TrailSpecificSections form={form} />
            </Accordion.Panel>
          </Accordion.Item>
        )}

        {poiType === 'EVENT' && (
          <Accordion.Item value="event">
            <Accordion.Control>Event Details</Accordion.Control>
            <Accordion.Panel>
              <EventSpecificSections form={form} />
            </Accordion.Panel>
          </Accordion.Item>
        )}

      </Accordion>

      <FormActions
        onSave={handleSave}
        onDelete={handleDelete}
        onPublish={handlePublish}
        isNew={!id}
        status={form.values.publication_status}
      />
    </form>
  );
}
```

### Form Hook

```jsx
// components/POIForm/hooks/usePOIForm.js

import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';
import { initialValues } from '../constants/initialValues';
import { validationRules } from '../constants/validationRules';

export function usePOIForm(poiId) {
  const [loading, setLoading] = useState(!!poiId);
  const [error, setError] = useState(null);

  const form = useForm({
    initialValues,
    validate: validationRules
  });

  useEffect(() => {
    if (poiId) {
      fetchPOI(poiId);
    }
  }, [poiId]);

  const fetchPOI = async (id) => {
    try {
      const response = await fetch(`/api/pois/${id}`);
      if (!response.ok) throw new Error('POI not found');
      const data = await response.json();
      form.setValues(transformApiToForm(data));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { form, loading, error };
}
```

### Handlers Hook

```jsx
// components/POIForm/hooks/usePOIHandlers.jsx

import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { apiRequest } from '../../../utils/api';

export function usePOIHandlers(form, poiId) {
  const navigate = useNavigate();

  const handleSave = async (values) => {
    try {
      const method = poiId ? 'PUT' : 'POST';
      const url = poiId ? `/api/pois/${poiId}` : '/api/pois/';

      const response = await apiRequest(url, {
        method,
        body: JSON.stringify(transformFormToApi(values))
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail);
      }

      const data = await response.json();
      notifications.show({
        title: 'Success',
        message: poiId ? 'POI updated' : 'POI created',
        color: 'green'
      });

      if (!poiId) {
        navigate(`/poi/${data.id}`);
      }
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err.message,
        color: 'red'
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this POI?')) return;

    const response = await apiRequest(`/api/pois/${poiId}`, { method: 'DELETE' });
    if (response.ok) {
      navigate('/');
    }
  };

  const handlePublish = async () => {
    form.setFieldValue('publication_status', 'published');
    await handleSave({ ...form.values, publication_status: 'published' });
  };

  return { handleSave, handleDelete, handlePublish };
}
```

---

## Key Components

### POI List

```jsx
// components/POIList.jsx

function POIList() {
  const [pois, setPois] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(null);

  useEffect(() => {
    fetchPOIs();
  }, [search, typeFilter]);

  const fetchPOIs = async () => {
    const params = new URLSearchParams();
    if (search) params.append('q', search);
    if (typeFilter) params.append('poi_type', typeFilter);

    const response = await apiRequest(`/api/admin/pois/?${params}`);
    const data = await response.json();
    setPois(data);
  };

  return (
    <div>
      <Group mb="md">
        <TextInput
          placeholder="Search POIs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          placeholder="Filter by type"
          data={POI_TYPES}
          value={typeFilter}
          onChange={setTypeFilter}
          clearable
        />
        <Button component={Link} to="/poi/new">
          Add POI
        </Button>
      </Group>

      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>City</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {pois.map(poi => (
            <Table.Tr key={poi.id}>
              <Table.Td>{poi.name}</Table.Td>
              <Table.Td><Badge>{poi.poi_type}</Badge></Table.Td>
              <Table.Td>{poi.address_city}</Table.Td>
              <Table.Td>
                <Badge color={poi.publication_status === 'published' ? 'green' : 'gray'}>
                  {poi.publication_status}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Button component={Link} to={`/poi/${poi.id}`} size="xs">
                  Edit
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}
```

### Category Selector

```jsx
// components/CategorySelector.jsx

function CategorySelector({ poiType, value, onChange }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (poiType) {
      fetch(`/api/categories/tree/${poiType}`)
        .then(res => res.json())
        .then(setCategories);
    }
  }, [poiType]);

  const renderTree = (nodes, level = 0) =>
    nodes.map(node => (
      <div key={node.id} style={{ marginLeft: level * 16 }}>
        <Checkbox
          label={node.name}
          checked={value.includes(node.id)}
          onChange={() => toggleCategory(node.id)}
        />
        {node.children?.length > 0 && renderTree(node.children, level + 1)}
      </div>
    ));

  const toggleCategory = (id) => {
    const newValue = value.includes(id)
      ? value.filter(v => v !== id)
      : [...value, id];
    onChange(newValue);
  };

  return <div>{renderTree(categories)}</div>;
}
```

### Image Upload

```jsx
// components/ImageUpload/ImageUploadField.jsx

function ImageUploadField({ poiId, imageType, onUpload }) {
  const [uploading, setUploading] = useState(false);

  const handleDrop = async (files) => {
    setUploading(true);

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('image_type', imageType);

      await apiRequest(`/api/images/upload/${poiId}`, {
        method: 'POST',
        body: formData
      });
    }

    onUpload();
    setUploading(false);
  };

  return (
    <Dropzone
      onDrop={handleDrop}
      accept={IMAGE_MIME_TYPES}
      loading={uploading}
    >
      <Group justify="center" gap="xl" style={{ minHeight: 120 }}>
        <Dropzone.Accept>
          <IconUpload size={50} stroke={1.5} />
        </Dropzone.Accept>
        <Dropzone.Reject>
          <IconX size={50} stroke={1.5} />
        </Dropzone.Reject>
        <Dropzone.Idle>
          <IconPhoto size={50} stroke={1.5} />
        </Dropzone.Idle>
        <Text size="xl">Drag images here or click to select</Text>
      </Group>
    </Dropzone>
  );
}
```

### Rich Text Editor

```jsx
// components/RichTextEditor.jsx

import { RichTextEditor, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

function RichTextEditorField({ value, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit, Link],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    }
  });

  return (
    <RichTextEditor editor={editor}>
      <RichTextEditor.Toolbar>
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Bold />
          <RichTextEditor.Italic />
          <RichTextEditor.Underline />
        </RichTextEditor.ControlsGroup>
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.H2 />
          <RichTextEditor.H3 />
        </RichTextEditor.ControlsGroup>
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.BulletList />
          <RichTextEditor.OrderedList />
        </RichTextEditor.ControlsGroup>
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Link />
          <RichTextEditor.Unlink />
        </RichTextEditor.ControlsGroup>
      </RichTextEditor.Toolbar>
      <RichTextEditor.Content />
    </RichTextEditor>
  );
}
```

**Paste Truncation Fix**: The hard `CharacterCount` limit extension has been removed. Instead, a custom `handlePaste` handler truncates pasted content to fit within the remaining character budget rather than silently blocking the entire paste. This prevents the confusing behavior where paste operations appeared to do nothing when content exceeded the limit.

### Location Map

```jsx
// components/LocationMap.jsx

import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';

// Re-centers map when coordinates change (e.g., after venue selection)
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center[0], center[1]]);
  return null;
}

const LocationMap = memo(({ latitude, longitude, onLocationChange }) => {
  const currentPosition = [latitude || 35.720303, longitude || -79.177397];

  return (
    <MapContainer
      center={currentPosition}
      zoom={17}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapRecenter center={currentPosition} />
      <DraggableMarker
        position={currentPosition}
        onPositionChange={(latlng) => onLocationChange(latlng.lat, latlng.lng)}
      />
    </MapContainer>
  );
});
```

**Key features:**
- **MapRecenter**: Child component that re-centers the map when coordinates change programmatically (e.g., after venue selection copies location data). Watches `center[0]` and `center[1]` to trigger `map.setView`.
- **DraggableMarker**: Supports both click-to-place and drag-to-reposition. Does not recenter on click so the user keeps their current view.
- **Memoized**: Uses `React.memo` with custom comparison to only re-render when latitude or longitude actually change.
- **Event isolation**: Map interactions (click, mousedown, touch) are stopped from propagating to the parent form to prevent accidental form submissions.

### HoursSelector

**File**: `components/HoursSelector.jsx`

A comprehensive hours management component with four tabbed panels. Uses `memo` for performance. Accepts `value` (hours JSONB object), `onChange`, and `poiType` props.

**Data structure** stored as JSONB:
```json
{
  "regular": { "monday": { "status": "open", "periods": [...] }, ... },
  "seasonal": { "summer": { "monday": {...}, "useDateRange": false, ... }, ... },
  "holidays": { "christmas": { "name": "Christmas Day", "date": "12-25", "status": "closed" }, ... },
  "exceptions": [ { "type": "one-time", "date": "2026-03-15", "status": "closed", "reason": "..." }, ... ],
  "timezone": "America/New_York",
  "notes": ""
}
```

**Tabs:**

| Tab | Description |
|-----|-------------|
| Regular Hours | Per-day cards with `SegmentedControl` (Open / Closed / 24 Hours / By Appt). Each day supports multiple time periods for breaks. Open/close times can be fixed, dawn/dusk (with minute offset), appointment, or call-for-hours. Quick-set buttons: Mon-Fri 9-5, 24/7, By Appointment Only. Copy-hours modal to copy one day's hours to other days. |
| Seasonal Hours | Override regular hours per season (Spring, Summer, Fall, Winter with themed icons). Each season can use default month ranges or a custom start/end date range (repeats annually). Full per-day hour cards within each season. |
| Holiday Hours | Select from 21 predefined US holidays (New Year's through Valentine's Day, including floating holidays like Thanksgiving and Easter). Each holiday can be Open, Closed, or Modified with custom time periods. |
| Exceptions | One-time exceptions (specific date, open/closed/modified, with reason text) and recurring exceptions (ordinal + day-of-week + optional month filter, e.g., "closed every 3rd Wednesday"). Modified status shows editable time periods. Exceptions take highest priority over all other hours. |

**Sub-components** (internal, not exported):
- `TimePeriod` -- renders open/close time type selectors and time inputs, with support for dawn/dusk offsets and per-period notes
- `DayHours` -- card for a single day with status segmented control, multiple periods toggle, and copy-to-other-days button

**Key features:**
- **Timezone selector**: 7 US timezones (Eastern through Hawaii)
- **Copy hours modal**: Select source day, check target days, apply in one click with notification
- **Dawn/dusk offsets**: NumberInput with 15-minute step and tooltip explaining before/after
- **General hours notes**: Free-text field for notes like "Kitchen closes 1 hour before closing"

### VenueSelector

```jsx
// components/POIForm/components/VenueSelector.jsx

function VenueSelector({ form, poiId }) {
  // Fetches venues (BUSINESS or PARK) from /pois/venues/list
  // Displays grouped Select with icons (IconBuilding for business, IconTree for park)
  // On venue selection, fetches full venue data from /pois/{venueId}/venue-data
  // Presents checkboxes to choose what data to copy:
  //   Address & Location, Contact Info, Parking, Accessibility,
  //   Restrooms, Hours, Amenities, Photos (Entry, Parking, Restroom)
  // Copies selected data fields into the event form
  // Copies images via POST /images/copy/{venueId}/to/{poiId}
  // Stores venue reference: event.venue_poi_id, event.venue_name, event.venue_type
}
```

**Key features:**
- **Searchable grouped select**: Venues are grouped by POI type (BUSINESS / PARK) with type-specific icons.
- **Selective data copy**: 8 checkbox categories let the admin choose which venue data to copy. All are enabled by default.
- **Image copy via API**: When "Photos" is checked, relevant images (entry, parking, restroom) are copied server-side via `POST /images/copy/{venueId}/to/{poiId}`.
- **One-time copy**: Data is copied once -- subsequent changes to the venue do not automatically propagate to the event.
- **Venue reference display**: If an event already has a linked venue, a compact card shows the current venue name and type.

---

## Utilities

### API Client

```javascript
// utils/api.js

import { getToken, isTokenExpired, removeToken } from './secureStorage';

export async function apiRequest(url, options = {}) {
  const token = getToken();

  if (token && isTokenExpired(token)) {
    removeToken();
    window.location.href = '/login';
    return;
  }

  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(url, { ...options, headers });
}
```

**Login Redirect Fix**: The 401 handler now checks whether the failed request was the login endpoint itself (`/api/auth/login`). If so, it skips the redirect to `/login` and instead surfaces the error to the caller. This prevents a Safari redirect loop where a failed login attempt would immediately redirect back to the login page.

### Auth Context

```jsx
// utils/AuthContext.jsx

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token && !isTokenExpired(token)) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: email, password })
    });

    if (!response.ok) throw new Error('Invalid credentials');

    const data = await response.json();
    setToken(data.access_token);
    await fetchUser();
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

---

## Mantine Components Used

| Component | Usage |
|-----------|-------|
| AppShell | Main layout structure |
| Table | POI list display |
| Accordion | Form sections |
| TextInput | Text fields |
| Textarea | Multi-line text (status explanation) |
| Select | Dropdowns |
| MultiSelect | Multi-selection |
| Checkbox | Boolean fields |
| Chip / Chip.Group | Day-of-week selection in recurring events |
| SegmentedControl | Venue inheritance mode per section |
| Switch | Toggle fields (has_vendors, link to POI, is_repeating) |
| NumberInput | Recurrence interval |
| DateTimePicker | Event dates, vendor deadlines, reschedule modal |
| DatePickerInput | Recurrence end date, excluded/manual dates |
| Button | Actions |
| Badge | Status indicators (color-coded event status) |
| Modal | Confirmations, reschedule modal |
| Notifications | User feedback |
| LoadingOverlay | Loading states |
| Dropzone | File uploads |

---

## POI Form Section Visibility

The POI form dynamically shows/hides sections based on POI type and listing type:

### Free Business Restrictions

| Section | Visible for Free Biz? | Notes |
|---------|----------------------|-------|
| Core Information | Yes | Teaser paragraph hidden |
| Categories | Yes | Limited to 1 category |
| Location / Parking | Yes | All parking fields shown |
| Facilities & Accessibility | Yes | Wheelchair & mobility access, restrooms (restroom photos hidden for free listings) |
| Public Amenities | Yes | Restroom options |
| Community Connections | No | Hidden entirely |

### Multi-Item Sections

| Section | POI Types | Feature |
|---------|-----------|---------|
| Multiple Playgrounds | Parks | Array of playground cards with types, surfaces, lat/lng, notes, per-playground photos |
| Multiple Restrooms | Parks, Trails, Events | Array of restroom cards with lat/lng, description, toilet types per-location (checkbox group), per-restroom photos |
| Per-Lot Parking Photos | All with parking | Each parking lot card includes its own photo upload |
| Primary Parking Location | All with parking | Lat/lng, area name, and photos between general parking info and additional locations |
| Pay Phone Locations | Parks, Trails | Array of pay phone locations with lat/lng |

### Event-Specific Sections

The EventSpecificSections accordion includes eight sub-sections:

| Sub-Section | Component | Description |
|-------------|-----------|-------------|
| Event Venue | `EventVenueSection` | Links event to a venue via `VenueSelector`; copies address, parking, accessibility, restroom, and image data; includes `VenueInheritanceControls` for per-section inheritance mode |
| Event Vendors | `EventVendorsSection` | Has-vendors toggle, vendor types (grouped checkboxes), **Linked Vendor POIs** sub-section with `POISearchSelect` + vendor type per row, application deadline, fee, requirements |
| Event Maps & Food | `EventMapsSection` | Downloadable maps (file upload or URL), food & drink info (rich text) |
| Event Amenities | `EventAmenitiesSection` | Coat check options, food & drink info |
| Event Status | `EventStatusSection` | **Overhauled**: color-coded `Badge` for current status + action `Button` group for valid transitions (fetched from API via `useEventStatuses` hook). Conditional fields: cancellation message, contact organizer toggle, status explanation, online event URL, reschedule modal |
| Event Organizer | `EventOrganizerSection` | "Link to POI" toggle with `POISearchSelect` for auto-fill; extended fields: email, phone, website, social media (Instagram, Facebook) |
| Event Cost | `EventCostSection` | Cost type selector (Free/Single Price/Price Range), single ticket link, pricing details (rich text), multiple ticket links array |
| Event Sponsors | `EventSponsorsSection` | Dynamic sponsor array with **per-row "Link to POI" toggle** (uses `POISearchSelect`) or manual entry (name, URL, logo URL), tier dropdown (Platinum/Gold/Silver/Bronze/Community) |
| Recurring Events | `RecurringEventSection` | Master toggle, frequency/interval, day-of-week chips (weekly/biweekly), recurrence end date, excluded dates (badge list), manual dates (badge list), next-occurrences preview panel |

### FacilitiesSection Updates

- **Wheelchair section renamed** to "Wheelchair and Mobility Access" with 5 new detail fields stored in `mobility_access` JSONB.
- **Toilet types per-location**: Each restroom card in `toilet_locations` now includes a checkbox group for toilet types, rather than a single global toilet type field.
- **Restroom photos hidden** for free business listings.

### OutdoorFeaturesSection Exports

**File**: `components/POIForm/sections/OutdoorFeaturesSection.jsx`

This file exports four named components used in park/trail accordion sections:

| Export | Description |
|--------|-------------|
| `OutdoorFeaturesSection` | Natural features checkbox group (from `NATURAL_FEATURES`), outdoor types checkbox group (from `OUTDOOR_TYPES`), night sky viewing and birding/wildlife rich text editors |
| `HuntingFishingSection` | Hunting allowed radio group with conditional hunting types checkboxes, fishing allowed radio with conditional fishing types, licenses/permits checkboxes, and additional info rich text |
| `PetPolicySection` | Pets allowed radio (yes/no), conditional pet policy options checkbox group (from `PET_OPTIONS`), additional pet policy rich text editor |
| `PlaygroundSection` | Playground available toggle, dynamic array of playground cards each with: types checkboxes (`PLAYGROUND_TYPES`), surface checkboxes (`PLAYGROUND_SURFACES`), lat/lng coordinates, notes rich text, per-playground photo upload. Normalizes legacy single-object format to array. |

### MiscellaneousSections Exports

**File**: `components/POIForm/sections/MiscellaneousSections.jsx`

This file exports five named components for internal, pricing, community, and compliance sections:

| Export | Description |
|--------|-------------|
| `InternalContactSection` | Internal-only (not public) section with main contact name/email/phone, emergency contact textarea, and emergency protocols rich text editor |
| `PricingMembershipsSection` | Cost field, gift card selector, pricing details rich text, payment methods checkbox group, discounts checkbox group, membership/pass details rich text |
| `ConnectionsSection` | Business service locations and locally-found-at placeholders, camping/lodging rich text editor. Accepts `isBusiness` and `isPark` props for conditional content |
| `CommunityConnectionsSection` | Community impact rich text editor, article links array with title/URL per row and add/remove controls |
| `CorporateComplianceSection` | Internal-only section with corporate compliance requirements rich text, comments restriction radio with conditional explanation, social media restrictions checkbox group (Facebook, Instagram, X, TikTok, LinkedIn), other social restrictions rich text, pre-approval radio with conditional lead time details, branding requirements radio with conditional guidelines |

### Removed/Cleaned Sections

| Removed | From | Reason |
|---------|------|--------|
| Trail Experience checkboxes | TrailSpecificSections | Duplicated Categories |
| Membership Pass | MiscellaneousSections (trails) | Duplicate |
| Available to Rent toggle | FacilitiesSection restrooms | Duplicate of RentalsSection |
| Rental Pricing box | FacilitiesSection | No longer used |

### Initial Values Updates

The `initialValues.js` file has been extended with:

| New Field(s) | Purpose |
|-------------|---------|
| `primary_parking_lat`, `primary_parking_lng`, `primary_parking_name` | Primary parking location coordinates and area name |
| `mobility_access` | JSONB object for wheelchair and mobility access detail fields |
| `event.venue_poi_id`, `event.venue_inheritance` | Venue inheritance for events (Task 45) |
| `event.series_id`, `event.parent_event_id`, `event.excluded_dates`, `event.recurrence_end_date`, `event.manual_dates` | Recurring event fields (Task 50) |
| `event.has_vendors`, `event.vendor_types`, `event.vendor_application_deadline`, `event.vendor_application_info`, `event.vendor_fee`, `event.vendor_requirements`, `event.vendor_poi_links` | Event vendor management fields |
| `event.event_status`, `event.cancellation_paragraph`, `event.contact_organizer_toggle`, `event.new_event_link`, `event.rescheduled_from_event_id` | Event status and rescheduling (Tasks 134-136) |
| `event.status_explanation`, `event.online_event_url` | Status explanation (max 80 chars) for Postponed/Updated/Moved Online; online event URL for Moved Online |
| `event.rescheduled_start_datetime`, `event.rescheduled_end_datetime` | New dates captured by the RescheduleModal when transitioning to Rescheduled |
| `event.primary_display_category` | Primary display category override (Task 137) |
| `event.organizer_email`, `event.organizer_phone`, `event.organizer_website`, `event.organizer_social_media`, `event.organizer_poi_id` | Extended organizer fields (Task 138) |
| `event.cost_type`, `event.ticket_links` | Event cost and ticketing (Task 139) |
| `event.sponsors` | Event sponsors array (Task 140) |

### New Constants

| Constant | Location | Description |
|----------|----------|-------------|
| `EVENT_STATUS_OPTIONS` | `nearby-admin/frontend/src/utils/constants.js` | 7 event status values |
| `EVENT_COST_TYPES` | `nearby-admin/frontend/src/utils/constants.js` | Cost type options: Free, Single Price, Price Range |
| `EVENT_DISCLAIMER` | `nearby-app/app/src/components/details/EventDetail.jsx` | Disclaimer text shown on event detail pages |
| `LISTING_TYPES` | `nearby-admin/frontend/src/utils/constants.js` | 7 listing types: free, paid, sponsor_platform/state/county/town, community_comped |
| `VENUE_INHERITANCE_SECTIONS` | `nearby-admin/frontend/src/utils/constants.js` | 7 venue data sections an event can inherit: address, parking, accessibility, restrooms, contact, hours, amenities |
| `VENUE_INHERITANCE_MODES` | `nearby-admin/frontend/src/utils/constants.js` | 3 inheritance modes per section: as_is, use_and_add, do_not_use |
| `REPEAT_FREQUENCY_OPTIONS` | `nearby-admin/frontend/src/utils/constants.js` | 5 recurrence frequencies: daily, weekly, biweekly, monthly, yearly |
| `SPONSOR_TIERS` | `nearby-admin/frontend/src/utils/constants.js` | 5 sponsor tiers: Platinum, Gold, Silver, Bronze, Community |

### Listing Type Dropdown

The Core Information section (`CoreInformationSection.jsx`) renders a dropdown for `listing_type` with 7 values. The paid features guard in `usePOIForm.js` treats `paid`, all four `sponsor_*` levels, and `community_comped` as paid listings.

### Error Tracking (Sentry)

The admin frontend initializes `@sentry/react` in `main.jsx` if `VITE_SENTRY_DSN` is set. Configuration:
- **Traces sample rate**: 0.1 (10% of transactions)
- **Environment**: derived from `import.meta.env.MODE` (development / production)
- **ErrorBoundary**: `components/ErrorBoundary.jsx` wraps child components using `Sentry.ErrorBoundary` with a fallback UI that shows a refresh button
- **Source maps**: Hidden source maps generated in production builds (`build.sourcemap: 'hidden'` in `vite.config.js`)

### ImageUploadField Updates

- **Trail head/exit photo limit**: Changed from 1 to 10, allowing multiple photos for trailhead entrance and exit locations.

### Reusable Components

#### POISearchSelect

**File**: `components/common/POISearchSelect.jsx`

A debounced search-and-select component for looking up POIs from the database. Used across multiple event sub-sections (vendors, sponsors, organizer) to link POIs without full-page navigation.

| Prop | Type | Description |
|------|------|-------------|
| `onSelect` | `function` | Called with `{ id, name, slug, poi_type, address_city }` on selection |
| `placeholder` | `string` | Input placeholder text (default: `'Search POIs...'`) |
| `filterTypes` | `string[]` | Optional array of POI type strings to restrict results (e.g., `['BUSINESS']`) |
| `label` | `string` | Optional label rendered above the input |

**Key features:**
- **300ms debounce**: Prevents excessive API calls while typing
- **Type-ahead dropdown**: Shows results in an absolute-positioned Paper with POI name, city, and type badge
- **Blur handling**: 150ms delay on blur so click events on dropdown items fire before hiding
- **API integration**: Calls `GET /pois/?search={query}&limit=10` with optional `poi_type` filter params

#### RescheduleModal

**File**: `components/POIForm/components/RescheduleModal.jsx`

A Mantine Modal with two `DateTimePicker` fields (start required, end optional) shown when the user clicks the "Reschedule" transition button in `EventStatusSection`. On confirm, it calls `onConfirm({ new_start_datetime, new_end_datetime })` and the parent sets the status to `'Rescheduled'`. Resets state on close.

#### VenueInheritanceControls

**File**: `components/POIForm/sections/VenueInheritanceControls.jsx`

Renders per-section inheritance controls when an event is linked to a venue. Returns `null` when `venue_poi_id` is falsy. For each of the 7 sections defined in `VENUE_INHERITANCE_SECTIONS`, displays a `SegmentedControl` with 3 modes:

| Mode | Label | Behavior |
|------|-------|----------|
| `as_is` | Use As Is | Show venue data read-only, no event overrides |
| `use_and_add` | Use & Add | Show venue data read-only + allow event-specific additions |
| `do_not_use` | Don't Use | Hide venue data, show only event's own fields |

Stored in `form.values.event.venue_inheritance` as a JSONB object keyed by section name.

#### RecurringEventSection

**File**: `components/POIForm/sections/RecurringEventSection.jsx`

Full recurring event configuration panel with:
- **Master toggle**: `is_repeating` Switch
- **Frequency + Interval**: Select dropdown (`REPEAT_FREQUENCY_OPTIONS`) and NumberInput (1-52)
- **Day-of-week chips**: Chip.Group for selecting specific weekdays (only shown for weekly/biweekly)
- **Recurrence end date**: Optional DatePickerInput
- **Excluded dates**: Badge list with add/remove; dates when the event does NOT occur
- **Manual dates**: Badge list with add/remove; one-off dates outside the regular schedule
- **Preview panel**: Calculates and displays the next 5 occurrences using a client-side helper (`calculateNextOccurrences`) -- no rrule dependency

### Custom Hooks

#### useEventStatuses

**File**: `hooks/useEventStatuses.js`

Fetches event status definitions from `GET /api/event-statuses` on mount and exposes:

| Return | Type | Description |
|--------|------|-------------|
| `statuses` | `array` | Raw status objects from API |
| `loading` | `boolean` | True while fetching |
| `getValidTransitions(statusName)` | `function` | Returns array of valid target status strings for the given current status |
| `getHelperText(statusName)` | `function` | Returns helper text string for the given status |

Silently fails if the API is unavailable -- component falls back to empty transitions. Uses `useCallback` for memoized lookups.

### Test Infrastructure

The admin frontend now includes a test suite using **Vitest** and **React Testing Library**.

**Configuration**: `nearby-admin/frontend/vitest.config.js`
- Environment: `jsdom`
- Setup file: `src/test/setup.js` (mocks `window.matchMedia` for Mantine)
- CSS processing disabled for speed
- Global test functions enabled (`describe`, `it`, `expect` without imports)

**Test scripts** (in `package.json`):
- `npm test` -- runs Vitest in watch mode
- `npm run test:run` -- single run (CI-friendly)

**Test files** (9 files):

| File | Component | Coverage |
|------|-----------|----------|
| `components/common/__tests__/POISearchSelect.test.jsx` | POISearchSelect | Debounce, dropdown, selection, filter |
| `hooks/__tests__/useEventStatuses.test.jsx` | useEventStatuses | API fetch, transitions, helper text |
| `components/POIForm/components/__tests__/RescheduleModal.test.jsx` | RescheduleModal | Open/close, date picking, confirm/cancel |
| `components/POIForm/sections/__tests__/EventStatusSection.test.jsx` | EventStatusSection | Badge rendering, transition buttons, conditional fields |
| `components/POIForm/sections/__tests__/VenueInheritanceControls.test.jsx` | VenueInheritanceControls | Null when no venue, segmented controls, mode changes |
| `components/POIForm/sections/__tests__/RecurringEventSection.test.jsx` | RecurringEventSection | Toggle, frequency, day chips, excluded/manual dates, preview |
| `components/POIForm/sections/__tests__/EventOrganizerSection.test.jsx` | EventOrganizerSection | POI link toggle, auto-fill, manual fields |
| `components/POIForm/sections/__tests__/EventSponsorsSection.test.jsx` | EventSponsorsSection | Add/remove sponsors, POI link toggle, tier selection |
| `components/POIForm/sections/__tests__/EventVendorsSection.test.jsx` | EventVendorsSection | Vendor toggle, POI links, vendor types |

**Dev dependencies added for testing:**

| Package | Version | Purpose |
|---------|---------|---------|
| `@testing-library/jest-dom` | ^6.6.3 | Custom DOM matchers (`toBeInTheDocument`, etc.) |
| `@testing-library/react` | ^16.1.0 | React component rendering and queries |
| `@testing-library/user-event` | ^14.5.2 | Simulated user interactions |
| `@vitest/ui` | ^2.1.8 | Browser-based test UI |
| `jsdom` | ^25.0.1 | DOM environment for Node.js |
| `vitest` | ^2.1.8 | Test runner (Vite-native) |

---

## Bug Fixes (Tasks 2-4)

| Fix | File | Root Cause |
|-----|------|------------|
| Events page blank white screen | LocationSection.jsx | Missing TextInput import |
| Add Additional Parking Location crash | LocationSection.jsx | Same missing TextInput import |
| Corporate Compliance checkboxes not clickable | MiscellaneousSections.jsx | Mantine v8 broke click handling with cursor styles on Radio components |

---

## Best Practices

1. **Use Mantine hooks** - useForm, useDisclosure, etc.
2. **Modular form sections** - Separate by concern
3. **Debounce inputs** - Prevent excessive API calls
4. **Handle loading states** - Show indicators
5. **Validate on submit** - Not on every change
6. **Use notifications** - Provide feedback
