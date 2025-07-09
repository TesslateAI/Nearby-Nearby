import { useState, useEffect } from 'react';
import { Checkbox, Stack, Text, Divider, Group, Badge, LoadingOverlay } from '@mantine/core';
import api from '../utils/api';

function DynamicAttributeForm({ poiType, value = {}, onChange }) {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupedAttributes, setGroupedAttributes] = useState({});

  useEffect(() => {
    if (poiType) {
      fetchAttributes();
    }
  }, [poiType]);

  const fetchAttributes = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/attributes/for-poi-type/${poiType}`);
      const data = await response.json();
      const activeAttributes = data.filter(attr => attr.is_active);
      setAttributes(activeAttributes);
      
      // Group attributes by type
      const grouped = activeAttributes.reduce((acc, attr) => {
        if (!acc[attr.type]) {
          acc[attr.type] = [];
        }
        acc[attr.type].push(attr);
        return acc;
      }, {});
      
      setGroupedAttributes(grouped);
    } catch (error) {
      console.error('Failed to fetch attributes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttributeChange = (attributeType, attributeName, checked) => {
    const newValue = { ...value };
    
    if (!newValue[attributeType]) {
      newValue[attributeType] = [];
    }
    
    if (checked) {
      if (!newValue[attributeType].includes(attributeName)) {
        newValue[attributeType] = [...newValue[attributeType], attributeName];
      }
    } else {
      newValue[attributeType] = newValue[attributeType].filter(name => name !== attributeName);
    }
    
    onChange(newValue);
  };

  const formatAttributeType = (type) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return <LoadingOverlay visible />;
  }

  if (Object.keys(groupedAttributes).length === 0) {
    return (
      <Text c="dimmed" size="sm">
        No attributes configured for {poiType} type POIs.
      </Text>
    );
  }

  return (
    <Stack gap="md">
      <Text size="sm" fw={500} c="dimmed">
        Select applicable attributes for this {poiType.toLowerCase()}:
      </Text>
      
      {Object.entries(groupedAttributes).map(([type, typeAttributes]) => (
        <div key={type}>
          <Group gap="xs" mb="xs">
            <Text size="sm" fw={500}>
              {formatAttributeType(type)}
            </Text>
            <Badge size="xs" variant="light">
              {typeAttributes.length}
            </Badge>
          </Group>
          
          <Checkbox.Group
            value={value[type] || []}
            onChange={(selectedValues) => {
              const newValue = { ...value };
              newValue[type] = selectedValues;
              onChange(newValue);
            }}
          >
            <Stack gap="xs">
              {typeAttributes
                .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                .map((attribute) => (
                  <Checkbox
                    key={attribute.id}
                    value={attribute.name}
                    label={attribute.name}
                    size="sm"
                  />
                ))}
            </Stack>
          </Checkbox.Group>
          
          <Divider my="md" />
        </div>
      ))}
    </Stack>
  );
}

export default DynamicAttributeForm; 