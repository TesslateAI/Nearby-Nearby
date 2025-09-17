import { useState, useEffect, useCallback } from 'react';
import { Select, Button, Group } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import api from '../utils/api';

export function MainCategorySelector({ value, onChange, poiType, error }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    if (!poiType) return;

    setLoading(true);
    try {
      const response = await api.get(`/categories/main/${poiType}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.map(cat => ({
          value: cat.id,
          label: cat.name
        })));
      }
    } catch (error) {
      console.error('Error fetching main categories:', error);
    } finally {
      setLoading(false);
    }
  }, [poiType]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <div>
      <Group justify="space-between" mb="xs">
        <div style={{ flex: 1 }}>
          <Select
            label="Main Category"
            description="Select one main category for this POI"
            placeholder="Choose a main category"
            data={categories}
            value={value}
            onChange={onChange}
            searchable
            clearable
            required
            error={error}
            disabled={loading || !poiType}
            nothingFoundMessage="No categories found"
          />
        </div>
        <Button
          variant="light"
          size="xs"
          onClick={fetchCategories}
          loading={loading}
          disabled={!poiType}
          style={{ marginTop: '25px' }}
        >
          <IconRefresh size={16} />
        </Button>
      </Group>
    </div>
  );
}

export default MainCategorySelector;