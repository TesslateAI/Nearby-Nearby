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
├── POIForm.jsx              # Main form component
├── hooks/
│   ├── usePOIForm.js        # Form state (Mantine useForm)
│   ├── usePOIHandlers.jsx   # CRUD operations
│   └── useAutoSave.js       # Auto-save logic
├── constants/
│   ├── initialValues.js     # Default values
│   ├── validationRules.js   # Validation schema
│   ├── fieldOptions.js      # Field configurations
│   └── helpers.js           # Helper functions
└── sections/
    ├── CoreInformationSection.jsx
    ├── CategoriesSection.jsx
    ├── ContactSection.jsx
    ├── LocationSection.jsx
    ├── BusinessDetailsSection.jsx
    ├── BusinessGallerySection.jsx
    ├── FacilitiesSection.jsx
    ├── TrailSpecificSections.jsx
    ├── EventSpecificSections.jsx
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

### Location Map

```jsx
// components/LocationMap.jsx

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

function LocationMap({ value, onChange }) {
  return (
    <MapContainer
      center={value || [35.7198, -79.1772]}
      zoom={13}
      style={{ height: 400 }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {value && <Marker position={value} />}
      <MapClickHandler onChange={onChange} />
    </MapContainer>
  );
}

function MapClickHandler({ onChange }) {
  useMapEvents({
    click: (e) => {
      onChange([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}
```

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

## Best Practices

1. **Use Mantine hooks** - useForm, useDisclosure, etc.
2. **Modular form sections** - Separate by concern
3. **Debounce inputs** - Prevent excessive API calls
4. **Handle loading states** - Show indicators
5. **Validate on submit** - Not on every change
6. **Use notifications** - Provide feedback
