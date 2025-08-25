import { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken } from '../services/api';

// Correctly export the context for direct use elsewhere if needed
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Use a single, synchronous initialization based on localStorage
  const initialUser = JSON.parse(localStorage.getItem('user')) || null;
  const initialToken = localStorage.getItem('token') || null;

  const [user, setUser] = useState(initialUser);
  const [isAuthenticated, setIsAuthenticated] = useState(!!initialUser && !!initialToken);
  const [loading, setLoading] = useState(false); // Initial state is false as we've already checked localStorage

  // If a token exists from localStorage, set it for API calls
  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
    }
  }, [initialToken]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { token, user: userData } = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(token);
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
