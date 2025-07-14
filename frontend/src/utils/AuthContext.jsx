import { createContext, useContext, useState, useEffect } from 'react';
import { secureTokenStorage } from './secureStorage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in on app start
    const token = secureTokenStorage.getToken();
    const userData = secureTokenStorage.getUserData();
    
    if (token && userData && !secureTokenStorage.isTokenExpired()) {
      setIsAuthenticated(true);
      setUser(userData);
    } else {
      // Clear invalid/expired tokens
      secureTokenStorage.clearToken();
    }
    
    setLoading(false);
  }, []);

  const login = (token, email, role = 'user') => {
    const userData = { email, role };
    secureTokenStorage.setToken(token, userData);
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    secureTokenStorage.clearToken();
    setIsAuthenticated(false);
    setUser(null);
  };

  const getAuthToken = () => {
    return secureTokenStorage.getToken();
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    getAuthToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 