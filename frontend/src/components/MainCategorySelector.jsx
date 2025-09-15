import { useState, useEffect } from 'react';
import { Select } from '@mantine/core';
import api from '../utils/api';

export function MainCategorySelector({ value, onChange, poiType, error }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!poiType) return;
    
    const fetchCategories = async () => {
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
    };

    fetchCategories();
  }, [poiType]);

  return (
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
  );
}

export default MainCategorySelector;