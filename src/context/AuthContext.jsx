// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken, getToken, login } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier l'authentification en appelant le backend
    const verifyToken = async () => {
      const token = getToken();
      if (token) {
        try {
          const data = await api('/api/auth/me', { method: 'GET' });
          setUser(data.user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Erreur lors de la vérification du jeton:', error.message);
          setToken(null); // Supprimer le jeton invalide
        }
      }
      setLoading(false);
    };
    verifyToken();
  }, []);

  const loginUser = async (email, password) => {
    try {
      const data = await login({ email, password });
      setUser(data.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Échec de la connexion' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login: loginUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
