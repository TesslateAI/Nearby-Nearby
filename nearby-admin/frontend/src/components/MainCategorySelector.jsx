import React, { useState, useEffect, useCallback } from 'react';
import { Select, Button, Group } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import api from '../utils/api';

export const MainCategorySelector = React.memo(function MainCategorySelector({
  value,
  onChange,
  poiType,
  selectedCategories = [],
  error
}) {
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    if (!poiType) return;

    setLoading(true);
    try {
      // Fetch full category list to build paths
      const response = await api.get(`/categories/by-poi-type/${poiType}`);

      if (response.ok) {
        const data = await response.json();
        setAllCategories(data);
      } else {
        console.error('Failed to fetch categories:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, [poiType]);

  // Helper to build category path (e.g., "Food & Drinks → Restaurants → Italian")
  const buildCategoryPath = (categoryId, categories) => {
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
    const category = categoryMap.get(categoryId);
    if (!category) return '';

    const path = [category.name];
    let current = category;

    // Walk up the parent chain
    while (current.parent_id && categoryMap.has(current.parent_id)) {
      current = categoryMap.get(current.parent_id);
      path.unshift(current.name);
    }

    return path.join(' → ');
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Filter categories to only show those the user has selected, with full path
  const availableCategories = React.useMemo(() => {
    if (selectedCategories.length === 0) {
      return [];
    }

    return allCategories
      .filter(cat => selectedCategories.includes(cat.id))
      .map(cat => ({
        value: cat.id,
        label: buildCategoryPath(cat.id, allCategories)
      }));
  }, [allCategories, selectedCategories]);

  return (
    <div>
      <Group justify="space-between" mb="xs" align="flex-end">
        <div style={{ flex: 1 }}>
          <Select
            label="Primary Display Category"
            description="Choose which category to display on POI cards (from your selections above). This provides distinction - e.g., 'Cafe' instead of just 'Business'."
            placeholder={selectedCategories.length === 0 ? "First select categories above" : "Choose primary display category"}
            data={availableCategories}
            value={value}
            onChange={onChange}
            searchable
            clearable
            error={error}
            disabled={loading || !poiType || selectedCategories.length === 0}
            nothingFoundMessage="No categories selected"
          />
        </div>
        <Button
          variant="light"
          size="xs"
          onClick={fetchCategories}
          loading={loading}
          disabled={!poiType}
        >
          <IconRefresh size={16} />
        </Button>
      </Group>
    </div>
  );
});

export default MainCategorySelector;