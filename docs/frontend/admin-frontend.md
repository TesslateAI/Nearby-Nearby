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

**Key Directories:**
```
nearby-admin/frontend/src/
├── components/      # Reusable components
├── pages/           # Page components
├── utils/           # Utilities and helpers
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
│   ├── CheckboxGroupSection.jsx
│   └── FormActions.jsx
└── sections/
    ├── CoreInformationSection.jsx   # Name, teaser, short desc, lat/long flag, recurring event placeholder
    ├── CategoriesSection.jsx        # Category tree (1-cat limit for free biz)
    ├── ContactSection.jsx
    ├── LocationSection.jsx          # Per-lot parking photos, primary parking location, parking/transit fields
    ├── BusinessDetailsSection.jsx
    ├── BusinessGallerySection.jsx
    ├── FacilitiesSection.jsx        # Wheelchair & mobility access, multi-restroom cards, pay phone, rentals
    ├── OutdoorFeaturesSection.jsx   # Multiple playgrounds array
    ├── TrailSpecificSections.jsx    # Trail experience removed
    ├── MiscellaneousSections.jsx    # Membership pass removed from trails
    ├── EventSpecificSections.jsx    # EventVendorsSection, EventVenueSection, EventMapsSection, EventAmenitiesSection
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
| Textarea | Multi-line text |
| Select | Dropdowns |
| MultiSelect | Multi-selection |
| Checkbox | Boolean fields |
| Button | Actions |
| Badge | Status indicators |
| Modal | Confirmations |
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

The EventSpecificSections accordion includes four sub-sections:

| Sub-Section | Component | Description |
|-------------|-----------|-------------|
| Event Venue | `EventVenueSection` | Links event to a venue via `VenueSelector`; copies address, parking, accessibility, restroom, and image data |
| Event Vendors | `EventVendorsSection` | Has-vendors toggle, vendor types (grouped checkboxes), application deadline, fee, requirements |
| Event Maps & Food | `EventMapsSection` | Downloadable maps (file upload or URL), food & drink info (rich text) |
| Event Amenities | `EventAmenitiesSection` | Coat check options, food & drink info |

### FacilitiesSection Updates

- **Wheelchair section renamed** to "Wheelchair and Mobility Access" with 5 new detail fields stored in `mobility_access` JSONB.
- **Toilet types per-location**: Each restroom card in `toilet_locations` now includes a checkbox group for toilet types, rather than a single global toilet type field.
- **Restroom photos hidden** for free business listings.

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

### ImageUploadField Updates

- **Trail head/exit photo limit**: Changed from 1 to 10, allowing multiple photos for trailhead entrance and exit locations.

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
