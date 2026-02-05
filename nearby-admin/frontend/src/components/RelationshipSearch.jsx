import { useState, useEffect } from 'react';
import { 
  Paper, Text, Group, Stack, Badge, Button, TextInput, Select, Divider 
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconSearch } from '@tabler/icons-react';
import api from '../utils/api';
import { 
  RELATIONSHIP_TYPES, 
  isValidRelationship, 
  getAvailableRelationshipTypes 
} from './relationships';

function RelationshipSearch({ 
  poiId, 
  poiType, 
  poiName, 
  onRelationshipAdded, 
  existingRelationships = [] 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedRelationshipType, setSelectedRelationshipType] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedTargetPoi, setSelectedTargetPoi] = useState(null);

  // Search for POIs to relate to
  const searchPois = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await api.get(`/pois/?search=${encodeURIComponent(query)}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        // Filter out the current POI and already related POIs
        const filteredResults = data.filter(poi => 
          poi.id !== poiId && !isPoiRelated(poi.id)
        );
        setSearchResults(filteredResults);
      } else {
        throw new Error('Failed to search POIs');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to search POIs',
        color: 'red',
      });
    } finally {
      setSearchLoading(false);
    }
  };

  // Add a new relationship
  const addRelationship = async (targetPoiId, relationshipType) => {
    // Prevent self-relationships
    if (targetPoiId === poiId) {
      notifications.show({
        title: 'Error',
        message: 'Cannot create a relationship with itself',
        color: 'red',
      });
      return;
    }

    // Check if relationship already exists
    if (isPoiRelated(targetPoiId)) {
      notifications.show({
        title: 'Error',
        message: 'This POI is already related',
        color: 'red',
      });
      return;
    }

    // Get target POI details for validation
    const targetPoi = searchResults.find(poi => poi.id === targetPoiId);
    if (!targetPoi) {
      notifications.show({
        title: 'Error',
        message: 'Target POI not found',
        color: 'red',
      });
      return;
    }

    // Validate relationship based on POI types
    if (!isValidRelationship(poiType, targetPoi.poi_type, relationshipType)) {
      const validTypes = getAvailableRelationshipTypes(poiType, targetPoi.poi_type);
      const validTypeLabels = validTypes.map(type => 
        RELATIONSHIP_TYPES.find(t => t.value === type)?.label || type
      ).join(', ');
      
      notifications.show({
        title: 'Invalid Relationship',
        message: `Cannot create a "${relationshipType}" relationship between a ${poiType} and a ${targetPoi.poi_type}. Valid types: ${validTypeLabels}`,
        color: 'red',
      });
      return;
    }

    try {
      const response = await api.post(`/relationships/?source_poi_id=${poiId}&target_poi_id=${targetPoiId}&relationship_type=${relationshipType}`);
      
      if (response.ok) {
        notifications.show({
          title: 'Success',
          message: 'Relationship added successfully',
          color: 'green',
        });
        onRelationshipAdded();
        setSearchQuery('');
        setSelectedRelationshipType('');
        setSelectedTargetPoi(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to add relationship');
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to add relationship',
        color: 'red',
      });
    }
  };

  // Check if a POI is already related
  const isPoiRelated = (poiId) => {
    return existingRelationships.some(rel => 
      (rel.source_poi_id === poiId || rel.target_poi_id === poiId)
    );
  };

  // Handle target POI selection
  const handleTargetPoiSelect = (poi) => {
    setSelectedTargetPoi(poi);
    setSelectedRelationshipType('');
    
    // Get available relationship types for this target POI
    const availableTypes = getAvailableRelationshipTypes(poiType, poi.poi_type);
    
    if (availableTypes.length === 0) {
      notifications.show({
        title: 'No Valid Relationships',
        message: `No valid relationship types between a ${poiType} and a ${poi.poi_type}`,
        color: 'orange',
      });
    }
  };

  // Get available relationship types for selected target POI
  const getAvailableRelationshipTypesForTarget = () => {
    if (!selectedTargetPoi) return [];
    
    const availableTypes = getAvailableRelationshipTypes(poiType, selectedTargetPoi.poi_type);
    return RELATIONSHIP_TYPES.filter(type => availableTypes.includes(type.value));
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      searchPois(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Search for a POI to create a relationship with "{poiName}" ({poiType})
      </Text>

      <TextInput
        label="Search POIs"
        placeholder="Enter POI name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        leftSection={<IconSearch size={16} />}
      />

      {searchLoading ? (
        <Text c="dimmed" ta="center" py="md">Searching...</Text>
      ) : searchResults.length > 0 ? (
        <Stack gap="sm">
          <Text size="sm" fw={500}>Search Results:</Text>
          {searchResults.map((poi) => (
            <Paper 
              key={poi.id} 
              p="sm" 
              withBorder
              style={{ 
                cursor: 'pointer',
                backgroundColor: selectedTargetPoi?.id === poi.id ? 'var(--mantine-color-blue-0)' : undefined
              }}
              onClick={() => handleTargetPoiSelect(poi)}
            >
              <Group justify="space-between">
                <Stack gap="xs">
                  <Text fw={500}>{poi.name}</Text>
                  <Group gap="xs">
                    <Badge size="sm" variant="light">{poi.main_category?.name || poi.poi_type}</Badge>
                    {poi.address_city && (
                      <Text size="sm" c="dimmed">{poi.address_city}</Text>
                    )}
                  </Group>
                </Stack>
                {selectedTargetPoi?.id === poi.id && (
                  <Badge size="sm" color="blue">Selected</Badge>
                )}
              </Group>
            </Paper>
          ))}
        </Stack>
      ) : searchQuery && !searchLoading ? (
        <Text c="dimmed" ta="center" py="md">No POIs found matching your search.</Text>
      ) : null}

      {selectedTargetPoi && (
        <>
          <Divider />
          <Stack gap="sm">
            <Text size="sm" fw={500}>
              Available relationship types for {selectedTargetPoi.name} ({selectedTargetPoi.poi_type}):
            </Text>
            <Select
              label="Relationship Type"
              placeholder="Select relationship type"
              data={getAvailableRelationshipTypesForTarget().map(type => ({
                value: type.value,
                label: type.label,
                description: type.description
              }))}
              value={selectedRelationshipType}
              onChange={setSelectedRelationshipType}
              required
            />
            {selectedRelationshipType && (
              <Button
                fullWidth
                onClick={() => addRelationship(selectedTargetPoi.id, selectedRelationshipType)}
              >
                Add Relationship
              </Button>
            )}
          </Stack>
        </>
      )}
    </Stack>
  );
}

export default RelationshipSearch; 