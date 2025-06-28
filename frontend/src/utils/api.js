import { useAuth } from './AuthContext';

// Base API URL - adjust based on your backend configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Mock data for demo mode
const mockPois = [
  {
    id: 1,
    name: "Downtown Coffee Shop",
    poi_type: "business",
    address_city: "Pittsboro",
    is_verified: true,
    description_short: "Cozy coffee shop in the heart of downtown",
    address_full: "123 Main St, Pittsboro, NC 27312"
  },
  {
    id: 2,
    name: "Jordan Lake State Park",
    poi_type: "park",
    address_city: "Apex",
    is_verified: true,
    description_short: "Beautiful state park with hiking trails and lake access",
    address_full: "280 State Park Rd, Apex, NC 27523"
  },
  {
    id: 3,
    name: "Chatham County Farmers Market",
    poi_type: "event",
    address_city: "Pittsboro",
    is_verified: false,
    description_short: "Weekly farmers market featuring local produce",
    address_full: "45 Hillsboro St, Pittsboro, NC 27312"
  },
  {
    id: 4,
    name: "Haw River Trail",
    poi_type: "trail",
    address_city: "Saxapahaw",
    is_verified: true,
    description_short: "Scenic hiking trail along the Haw River",
    address_full: "Haw River Trail, Saxapahaw, NC 27340"
  }
];

const mockCategories = [
  { id: 1, name: "Restaurants", parent_id: null, applicable_to: ["business"] },
  { id: 2, name: "Coffee Shops", parent_id: 1, applicable_to: ["business"] },
  { id: 3, name: "State Parks", parent_id: null, applicable_to: ["park"] },
  { id: 4, name: "Hiking Trails", parent_id: null, applicable_to: ["trail"] },
  { id: 5, name: "Farmers Markets", parent_id: null, applicable_to: ["event"] }
];

const mockAttributes = [
  { id: 1, name: "Pet Friendly", type: "AMENITY", applicable_to: ["business", "park"] },
  { id: 2, name: "Wheelchair Accessible", type: "AMENITY", applicable_to: ["business", "park", "trail"] },
  { id: 3, name: "Free Parking", type: "AMENITY", applicable_to: ["business", "park"] },
  { id: 4, name: "Credit Card", type: "PAYMENT_METHOD", applicable_to: ["business"] },
  { id: 5, name: "Cash Only", type: "PAYMENT_METHOD", applicable_to: ["business"] }
];

// Helper function to check if we're in demo mode
const isDemoMode = () => {
  const token = localStorage.getItem('authToken');
  return token === 'demo-token';
};

// Mock response creator
const createMockResponse = (data, status = 200) => {
  return Promise.resolve({
    ok: status < 400,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data))
  });
};

export const api = {
  // Helper function to get auth headers
  getAuthHeaders: () => {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && token !== 'demo-token' && { 'Authorization': `Bearer ${token}` }),
    };
  },

  // Generic request function
  request: async (endpoint, options = {}) => {
    // If in demo mode, return mock data
    if (isDemoMode()) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Route mock data based on endpoint
      if (endpoint.includes('/pois')) {
        if (options.method === 'DELETE') {
          return createMockResponse({ message: 'POI deleted successfully' });
        }
        return createMockResponse(mockPois);
      }
      
      if (endpoint.includes('/categories')) {
        return createMockResponse(mockCategories);
      }
      
      if (endpoint.includes('/attributes')) {
        return createMockResponse(mockAttributes);
      }
      
      // Default mock response
      return createMockResponse({ message: 'Demo mode - no actual API call made' });
    }

    // Real API call
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: api.getAuthHeaders(),
      ...options,
    };

    const response = await fetch(url, config);
    
    if (response.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('userEmail');
      window.location.href = '/login';
      return;
    }

    return response;
  },

  // GET request
  get: (endpoint) => api.request(endpoint),

  // POST request
  post: (endpoint, data) => api.request(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // PUT request
  put: (endpoint, data) => api.request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // DELETE request
  delete: (endpoint) => api.request(endpoint, {
    method: 'DELETE',
  }),
};

export default api; 