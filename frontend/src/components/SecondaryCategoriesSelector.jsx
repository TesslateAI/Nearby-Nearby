import React, { useState, useEffect } from 'react';
import { MultiSelect, Text } from '@mantine/core';
import api from '../utils/api';

export const SecondaryCategoriesSelector = React.memo(function SecondaryCategoriesSelector({ value, onChange, poiType, mainCategoryId, error, maxValues, label }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!poiType) return;
    
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const endpoint = mainCategoryId 
          ? `/categories/secondary/${poiType}?parent_id=${mainCategoryId}`
          : `/categories/secondary/${poiType}`;
          
        const response = await api.get(endpoint);
        if (response.ok) {
          const data = await response.json();
          setCategories(data.map(cat => ({
            value: cat.id,
            label: cat.name
          })));
        }
      } catch (error) {
        console.error('Error fetching secondary categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [poiType, mainCategoryId]);

  // Custom label based on POI type
  const getLabel = () => {
    if (label) return label;
    
    switch(poiType) {
      case 'PARK':
        return 'Things to Do (Outdoor Features)';
      case 'TRAIL':
        return 'Trail Features';
      case 'EVENT':
        return 'Event Categories';
      case 'BUSINESS':
        return 'Additional Categories';
      default:
        return 'Secondary Categories';
    }
  };

  return (
    <>
      <MultiSelect
        label={getLabel()}
        description="Select additional categories that apply"
        placeholder="Choose categories"
        data={categories}
        value={value || []}
        onChange={onChange}
        searchable
        clearable
        error={error}
        disabled={loading || !poiType}
        nothingFoundMessage="No categories found"
        maxValues={maxValues}
      />
      {maxValues && (
        <Text size="xs" c="dimmed" mt={4}>
          Maximum {maxValues} categories allowed
        </Text>
      )}
    </>
  );
});

export default SecondaryCategoriesSelector;