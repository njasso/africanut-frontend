import { createContext, useContext, useState, useEffect } from 'react'
import { api, setToken, getToken } from '../services/api'

export const AuthContext = createContext(null) // ✅ Le contexte est maintenant exporté directement

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })
  const [isAuthenticated, setIsAuthenticated] = useState(!!user); // ✅ Ajout d'un état pour l'authentification
  const [loading, setLoading] = useState(true); // ✅ Ajout d'un état de chargement

  useEffect(() => {
    // Vérifier l'authentification au chargement de l'application
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const { token, user } = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
  
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
