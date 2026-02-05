// Relationship types and validation utilities
// Shared across RelationshipSearch, RelationshipManager, and other relationship components

export const RELATIONSHIP_TYPES = [
  { value: 'venue', label: 'Venue (Event → Business/Park)', description: 'Where an event takes place' },
  { value: 'trail_in_park', label: 'Trail in Park (Trail → Park)', description: 'Trail located within a park' },
  { value: 'service_provider', label: 'Service Provider (Business → Park/Trail)', description: 'Business that provides services to outdoor locations' },
  { value: 'vendor', label: 'Vendor (Business → Event)', description: 'Business selling goods/services at an event' },
  { value: 'sponsor', label: 'Sponsor (Business → Event)', description: 'Business sponsoring an event' },
  { value: 'related', label: 'Related (General)', description: 'General relationship between POIs' }
];

// Define valid relationship combinations based on POI types
export const VALID_RELATIONSHIPS = {
  EVENT: {
    venue: ['BUSINESS', 'PARK'],
    vendor: ['BUSINESS'],
    sponsor: ['BUSINESS'],
    related: ['BUSINESS', 'PARK', 'TRAIL', 'EVENT']
  },
  TRAIL: {
    trail_in_park: ['PARK'],
    service_provider: ['BUSINESS'],
    related: ['BUSINESS', 'PARK', 'TRAIL', 'EVENT']
  },
  PARK: {
    service_provider: ['BUSINESS'],
    related: ['BUSINESS', 'PARK', 'TRAIL', 'EVENT']
  },
  BUSINESS: {
    service_provider: ['PARK', 'TRAIL'],
    vendor: ['EVENT'],
    sponsor: ['EVENT'],
    related: ['BUSINESS', 'PARK', 'TRAIL', 'EVENT']
  }
};

// Helper function to get valid relationship types for a source POI type
export const getValidRelationshipTypes = (sourcePoiType) => {
  return VALID_RELATIONSHIPS[sourcePoiType] || { related: ['BUSINESS', 'PARK', 'TRAIL', 'EVENT'] };
};

// Helper function to check if a relationship is valid
export const isValidRelationship = (sourcePoiType, targetPoiType, relationshipType) => {
  const validRelationships = getValidRelationshipTypes(sourcePoiType);
  const validTargetTypes = validRelationships[relationshipType];
  
  if (!validTargetTypes) {
    return false;
  }
  
  return validTargetTypes.includes(targetPoiType);
};

// Helper function to get available relationship types for a specific target POI
export const getAvailableRelationshipTypes = (sourcePoiType, targetPoiType) => {
  const validRelationships = getValidRelationshipTypes(sourcePoiType);
  const availableTypes = [];
  
  Object.entries(validRelationships).forEach(([type, validTargets]) => {
    if (validTargets.includes(targetPoiType)) {
      availableTypes.push(type);
    }
  });
  
  return availableTypes;
};

// Helper function to get relationship label
export const getRelationshipLabel = (relationshipType) => {
  const type = RELATIONSHIP_TYPES.find(t => t.value === relationshipType);
  return type ? type.label : relationshipType;
};

// Helper function to get relationship color
export const getRelationshipColor = (relationshipType) => {
  const colors = {
    venue: 'blue',
    trail_in_park: 'green',
    service_provider: 'orange',
    vendor: 'purple',
    sponsor: 'red',
    related: 'gray'
  };
  return colors[relationshipType] || 'gray';
}; 