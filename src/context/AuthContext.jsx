// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, getCurrentUser, setToken, getToken } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Vérifie le token au démarrage
  useEffect(() => {
    const verifyToken = async () => {
      const token = getToken();
      if (token) {
        try {
          const data = await getCurrentUser();
          setUser(data.user || data); // backend peut renvoyer { user }
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Erreur token invalide:', err);
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };
    verifyToken();
  }, []);

  // Fonction login
  const login = async (email, password) => {
    try {
      setLoading(true);
      const data = await apiLogin({ email, password });

      if (data.token) setToken(data.token);

      const userData = data.user || data;
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (err) {
      console.error('Login failed:', err);
      let message = 'Échec de la connexion';
      if (err.status === 401) message = 'Email ou mot de passe incorrect';
      if (err.status === 404) message = 'Service non disponible';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Fonction logout
  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Rafraîchir les infos utilisateur
  const refreshUser = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await getCurrentUser();
      setUser(data.user || data);
    } catch (err) {
      console.error('Refresh user failed:', err);
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personnalisé
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
