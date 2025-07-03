// Demo mode utilities and constants

// Demo token identifier
export const DEMO_TOKEN = 'demo-token';

// Helper function to check if we're in demo mode
export const isDemoMode = () => {
  const token = localStorage.getItem('authToken');
  return token === DEMO_TOKEN;
};

// Mock response creator
export const createMockResponse = (data, status = 200) => {
  return Promise.resolve({
    ok: status < 400,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data))
  });
};

// Simulate network delay for more realistic demo experience
export const simulateNetworkDelay = (delay = 300) => {
  return new Promise(resolve => setTimeout(resolve, delay));
}; 