import { secureTokenStorage } from './secureStorage';

// Base API URL - should include /api suffix
// e.g., http://localhost:8003/api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = {
  // Helper function to get auth headers
  getAuthHeaders: (contentType = 'application/json') => {
    const token = secureTokenStorage.getToken();
    const headers = {
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
    
    // Only add Content-Type if it's not FormData (browser will set it automatically)
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    
    return headers;
  },

  // Generic request function
  request: async (endpoint, options = {}) => {
    // Real API call
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Handle different content types
    const isFormData = options.body instanceof FormData;
    const headers = isFormData 
      ? api.getAuthHeaders(null) // Don't set Content-Type for FormData
      : api.getAuthHeaders();
    
    const config = {
      headers: {
        ...headers,
        ...options.headers, // Allow overriding headers
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (response.status === 401) {
      // Token expired or invalid, redirect to login
      secureTokenStorage.clearToken();
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