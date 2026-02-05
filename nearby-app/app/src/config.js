// API Configuration
// Use empty string to leverage Vite proxy in dev (configured in vite.config.js)
// In production: same origin as the deployed frontend
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

// Helper function to build API URLs
export const getApiUrl = (path) => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};
