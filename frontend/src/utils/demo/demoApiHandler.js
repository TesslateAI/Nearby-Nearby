import { mockPois, mockCategories, mockAttributes } from './mockData';
import { createMockResponse, simulateNetworkDelay } from './demoUtils';

// Demo API handler - routes requests to appropriate mock data
export const handleDemoRequest = async (endpoint, options = {}) => {
  // Simulate network delay for realistic demo experience
  await simulateNetworkDelay();
  
  // Route mock data based on endpoint
  if (endpoint.includes('/pois')) {
    if (options.method === 'DELETE') {
      return createMockResponse({ message: 'POI deleted successfully' });
    }
    if (options.method === 'POST') {
      return createMockResponse({ message: 'POI created successfully', id: Date.now() });
    }
    if (options.method === 'PUT') {
      return createMockResponse({ message: 'POI updated successfully' });
    }
    return createMockResponse(mockPois);
  }
  
  if (endpoint.includes('/categories')) {
    if (options.method === 'DELETE') {
      return createMockResponse({ message: 'Category deleted successfully' });
    }
    if (options.method === 'POST') {
      return createMockResponse({ message: 'Category created successfully', id: Date.now() });
    }
    if (options.method === 'PUT') {
      return createMockResponse({ message: 'Category updated successfully' });
    }
    return createMockResponse(mockCategories);
  }
  
  if (endpoint.includes('/attributes')) {
    if (options.method === 'DELETE') {
      return createMockResponse({ message: 'Attribute deleted successfully' });
    }
    if (options.method === 'POST') {
      return createMockResponse({ message: 'Attribute created successfully', id: Date.now() });
    }
    if (options.method === 'PUT') {
      return createMockResponse({ message: 'Attribute updated successfully' });
    }
    return createMockResponse(mockAttributes);
  }
  
  // Default mock response for unknown endpoints
  return createMockResponse({ 
    message: 'Demo mode - no actual API call made',
    endpoint,
    method: options.method || 'GET'
  });
}; 