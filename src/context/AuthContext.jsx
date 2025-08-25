import { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken, getToken } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error("Failed to parse user from localStorage:", e);
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(!!user && !!getToken());
  const [loading, setLoading] = useState(false);

  // Set the token for API calls whenever the authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      const token = getToken();
      if (token) {
        setToken(token);
      }
    }
  }, [isAuthenticated]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { token, user: userData } = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);

      setUser(userData);
      setIsAuthenticated(true);
      setToken(token); // Ensure the token is set immediately

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
