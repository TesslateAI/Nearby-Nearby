import { useState, useRef } from 'react';
import {
  TextInput,
  Paper,
  Text,
  Badge,
  Loader,
  Group,
  Stack,
  Box,
} from '@mantine/core';
import api from '../../utils/api';

/**
 * POISearchSelect
 *
 * Reusable component for searching and selecting POIs from the database.
 *
 * Props:
 *   onSelect      (fn)      - Called with { id, name, slug, poi_type, address_city } on selection
 *   placeholder   (string)  - Input placeholder text
 *   filterTypes   (string[])- Optional array of POI type strings to restrict results
 *   label         (string)  - Optional label rendered above the input
 */
export default function POISearchSelect({
  onSelect,
  placeholder = 'Search POIs...',
  filterTypes,
  label,
}) {
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const debounceRef = useRef(null);

  function buildUrl(query) {
    const params = new URLSearchParams();
    params.set('search', query);
    params.set('limit', '10');

    if (filterTypes && filterTypes.length > 0) {
      filterTypes.forEach((type) => params.append('poi_type', type));
    }

    return `/pois/?${params.toString()}`;
  }

  async function fetchResults(query) {
    if (!query.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(buildUrl(query));
      if (response && response.ok) {
        const data = await response.json();
        const items = data.items ?? [];
        setResults(items);
        setShowDropdown(true);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(event) {
    const value = event.currentTarget.value;
    setInputValue(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value.trim()) {
      setResults([]);
      setShowDropdown(false);
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchResults(value);
    }, 300);
  }

  function handleSelect(poi) {
    onSelect({
      id: poi.id,
      name: poi.name,
      slug: poi.slug,
      poi_type: poi.poi_type,
      address_city: poi.address_city,
    });
    setInputValue(poi.name);
    setShowDropdown(false);
    setResults([]);
  }

  function handleBlur() {
    // Small delay so click events on dropdown items fire before hiding
    setTimeout(() => setShowDropdown(false), 150);
  }

  function handleFocus() {
    if (results.length > 0) {
      setShowDropdown(true);
    }
  }

  return (
    <Box style={{ position: 'relative' }}>
      <TextInput
        label={label}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        rightSection={loading ? <Loader size="xs" /> : null}
      />

      {showDropdown && (
        <Paper
          shadow="md"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 200,
            marginTop: 2,
            maxHeight: 300,
            overflowY: 'auto',
          }}
        >
          {results.length === 0 ? (
            <Box p="sm">
              <Text size="sm" c="dimmed">
                No results found
              </Text>
            </Box>
          ) : (
            <Stack gap={0}>
              {results.map((poi) => (
                <Box
                  key={poi.id}
                  p="sm"
                  style={{
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--mantine-color-gray-2)',
                  }}
                  onMouseDown={() => handleSelect(poi)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      'var(--mantine-color-gray-0)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '';
                  }}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Stack gap={2}>
                      <Text size="sm" fw={500} lineClamp={1}>
                        {poi.name}
                      </Text>
                      {poi.address_city && (
                        <Text size="xs" c="dimmed">
                          {poi.address_city}
                        </Text>
                      )}
                    </Stack>
                    <Badge size="xs" variant="light" style={{ flexShrink: 0 }}>
                      {poi.poi_type}
                    </Badge>
                  </Group>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>
      )}
    </Box>
  );
}
