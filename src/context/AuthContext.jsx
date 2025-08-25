// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken, getToken, login, getCurrentUser } from '../services/api';

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
          const data = await getCurrentUser();
          setUser(data.user || data); // Handle different response structures
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Erreur lors de la vérification du jeton:', error.message);
          setToken(null); // Supprimer le jeton invalide
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  const loginUser = async (email, password) => {
    try {
      setLoading(true);
      const data = await login({ email, password });
      
      // Handle different response structures
      const userData = data.user || data;
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      
      // Provide specific error messages based on the error
      let errorMessage = 'Échec de la connexion';
      
      if (error.message.includes('404')) {
        errorMessage = 'Service non disponible. Veuillez vérifier la configuration de l\'API.';
      } else if (error.message.includes('401')) {
        errorMessage = 'Email ou mot de passe incorrect.';
      } else if (error.message.includes('réseau') || error.message.includes('network')) {
        errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Helper function to refresh user data
  const refreshUser = async () => {
    if (!isAuthenticated) return;
    
    try {
      const data = await getCurrentUser();
      setUser(data.user || data);
    } catch (error) {
      console.error('Error refreshing user:', error);
      // If refresh fails, log out the user
      logout();
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login: loginUser,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
