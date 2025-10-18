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

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Filter categories to only show those the user has selected
  const availableCategories = React.useMemo(() => {
    if (selectedCategories.length === 0) {
      return [];
    }

    return allCategories
      .filter(cat => selectedCategories.includes(cat.id))
      .map(cat => ({
        value: cat.id,
        label: cat.name
      }));
  }, [allCategories, selectedCategories]);

  return (
    <div>
      <Group justify="space-between" mb="xs" align="flex-end">
        <div style={{ flex: 1 }}>
          <Select
            label="Main Category"
            description="Choose which category should be the primary one (from your selections above). You can save as draft and choose this later."
            placeholder={selectedCategories.length === 0 ? "First select categories above" : "Choose main category"}
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