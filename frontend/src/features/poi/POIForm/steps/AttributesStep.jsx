import { useState, useEffect, useCallback } from 'react';
import { TextInput, Stack, Divider, Checkbox, Text, Group, Badge, LoadingOverlay } from '@mantine/core';
import { api } from '../../../../services';

function AttributesStep({ form }) {
  const [loading, setLoading] = useState(false);
  const [groupedAttributes, setGroupedAttributes] = useState({});
  
  const poiType = form.values.poi_type;
  const attributeValue = form.values.amenities || {};

  const fetchAttributes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/attributes/for-poi-type/${poiType}`);
      const data = await response.json();
      const activeAttributes = data.filter(attr => attr.is_active);
      
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
  }, [poiType]);

  useEffect(() => {
    if (poiType) {
      fetchAttributes();
    }
  }, [poiType, fetchAttributes]);

  const formatAttributeType = (type) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleAttributeChange = (type, selectedValues) => {
    const newValue = { ...attributeValue };
    newValue[type] = selectedValues;
    form.setFieldValue('amenities', newValue);
  };

  return (
    <Stack mt="xl" p="md">
      <Divider my="md" label="Dynamic Attributes" />
      
      {loading ? (
        <LoadingOverlay visible />
      ) : Object.keys(groupedAttributes).length === 0 ? (
        <Text c="dimmed" size="sm">
          No attributes configured for {poiType} type POIs.
        </Text>
      ) : (
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
                value={attributeValue[type] || []}
                onChange={(selectedValues) => handleAttributeChange(type, selectedValues)}
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
      )}

      <Divider my="md" label="Photos" />
      <TextInput label="Featured Image URL" {...form.getInputProps('photos.featured')} />
    </Stack>
  );
}

export default AttributesStep;