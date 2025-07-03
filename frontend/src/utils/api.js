import { useAuth } from './AuthContext';
import { isDemoMode, DEMO_TOKEN, handleDemoRequest } from './demo';

// Base API URL - using proxy configuration for Docker internal networking
const API_BASE_URL = '/api';

export const api = {
  // Helper function to get auth headers
  getAuthHeaders: () => {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && token !== DEMO_TOKEN && { 'Authorization': `Bearer ${token}` }),
    };
  },

  // Generic request function
  request: async (endpoint, options = {}) => {
    // If in demo mode, return mock data
    if (isDemoMode()) {
      return handleDemoRequest(endpoint, options);
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