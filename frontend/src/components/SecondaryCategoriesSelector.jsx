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
        // Fetch ALL categories applicable to this POI type, not just "secondary" ones
        // Users should be able to select any category, then choose which one is main
        const endpoint = `/categories/by-poi-type/${poiType}`;

        const response = await api.get(endpoint);
        if (response.ok) {
          const data = await response.json();
          setCategories(data.map(cat => ({
            value: cat.id,
            label: cat.name
          })));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [poiType]);

  // Custom label based on POI type
  const getLabel = () => {
    if (label) return label;

    switch(poiType) {
      case 'BUSINESS':
        return 'Business Categories';
      case 'SERVICES':
        return 'Service Categories';
      case 'PARK':
        return 'Park Categories & Things to Do';
      case 'TRAIL':
        return 'Trail Categories & Features';
      case 'EVENT':
        return 'Event Categories';
      case 'YOUTH_ACTIVITIES':
        return 'Youth Activity Categories';
      case 'JOBS':
        return 'Job Categories';
      case 'VOLUNTEER_OPPORTUNITIES':
        return 'Volunteer Opportunity Categories';
      case 'DISASTER_HUBS':
        return 'Disaster Hub Categories';
      default:
        return 'Categories';
    }
  };

  return (
    <>
      <MultiSelect
        label={getLabel()}
        description="Select all categories that apply (from any level). Then choose the primary display category below."
        placeholder="Choose categories"
        data={categories}
        value={value || []}
        onChange={onChange}
        searchable
        clearable
        error={error}
        disabled={loading || !poiType}
        nothingFoundMessage="No categories found for this POI type"
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