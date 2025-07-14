// Secure token storage utility
class SecureTokenStorage {
  constructor() {
    this.tokenKey = 'auth_token';
    this.userKey = 'user_data';
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  // Store token securely
  setToken(token, userData) {
    try {
      // For now using localStorage with additional validation
      // In production, consider using httpOnly cookies
      localStorage.setItem(this.tokenKey, token);
      localStorage.setItem(this.userKey, JSON.stringify(userData));
      
      // Set token expiration check
      const payload = this.parseJWT(token);
      if (payload && payload.exp) {
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        localStorage.setItem('token_exp', expirationTime.toString());
      }
    } catch (error) {
      console.error('Failed to store token:', error);
      throw new Error('Failed to store authentication token');
    }
  }

  // Get token with validation
  getToken() {
    try {
      const token = localStorage.getItem(this.tokenKey);
      if (!token) return null;

      // Check if token is expired
      if (this.isTokenExpired()) {
        this.clearToken();
        return null;
      }

      return token;
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      this.clearToken();
      return null;
    }
  }

  // Get user data
  getUserData() {
    try {
      const userData = localStorage.getItem(this.userKey);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to parse user data:', error);
      return null;
    }
  }

  // Clear all authentication data
  clearToken() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem('token_exp');
  }

  // Check if token is expired
  isTokenExpired() {
    try {
      const expiration = localStorage.getItem('token_exp');
      if (!expiration) return true;

      const expirationTime = parseInt(expiration, 10);
      const currentTime = Date.now();
      
      // Add 5 minute buffer to refresh before actual expiration
      return currentTime >= (expirationTime - 5 * 60 * 1000);
    } catch (error) {
      console.error('Failed to check token expiration:', error);
      return true;
    }
  }

  // Parse JWT payload (client-side only for expiration check)
  parseJWT(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to parse JWT:', error);
      return null;
    }
  }

  // Validate token format
  isValidTokenFormat(token) {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    return parts.length === 3;
  }
}

export const secureTokenStorage = new SecureTokenStorage();
export default secureTokenStorage;
