// src/services/api.js
import axios from 'axios';

// URL de base : priorise la variable d'environnement, sinon Railway
const API_URL = import.meta.env.VITE_API_URL || 'https://africanut-backend-postgres-production.up.railway.app';

// Debugging: Log the API URL being used
console.log('API_URL configured as:', API_URL);

// Token stocké en mémoire + localStorage
let token = localStorage.getItem('token') || null;

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Making request to:', config.baseURL + config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (status === 401) {
        setToken(null);
        console.warn('Token invalide ou expiré. Déconnexion automatique.');
      }
      
      // Create meaningful error messages
      let errorMessage = 'Une erreur est survenue';
      
      if (status === 404) {
        errorMessage = 'Endpoint non trouvé. Vérifiez la configuration de votre API.';
      } else if (status === 401) {
        errorMessage = 'Non autorisé. Veuillez vous reconnecter.';
      } else if (status === 403) {
        errorMessage = 'Accès interdit.';
      } else if (status === 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      } else if (data?.message) {
        errorMessage = data.message;
      } else if (data?.error) {
        errorMessage = data.error;
      }
      
      const apiError = {
        status,
        message: errorMessage,
        data: data,
      };
      
      return Promise.reject(apiError);
    } else if (error.request) {
      // Network error or no response
      console.error('Network error:', error.request);
      return Promise.reject({
        message: 'Erreur de connexion réseau. Vérifiez votre connexion internet et l\'URL de l\'API.',
        status: 0,
      });
    } else {
      // Something else happened
      return Promise.reject({
        message: error.message || 'Une erreur inattendue est survenue',
        status: 0,
      });
    }
  }
);

// -----------------------------
// Gestion du token
// -----------------------------
export function getToken() {
  return token;
}

export function setToken(newToken) {
  token = newToken;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

// -----------------------------
// Fonction API centralisée
// -----------------------------
export async function api(path, options = {}) {
  try {
    const config = {
      url: path,
      method: options.method || 'GET',
      ...options,
    };

    // Handle request body
    if (options.body) {
      if (options.method && ['POST', 'PUT', 'PATCH'].includes(options.method.toUpperCase())) {
        config.data = options.body;
      }
    }

    // Remove body from config as axios uses 'data'
    delete config.body;

    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// -----------------------------
// Fonctions helper spécifiques
// -----------------------------
export async function login(credentials) {
  try {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: credentials,
    });
    
    // Sauvegarde automatique du token reçu
    if (data.token) {
      setToken(data.token);
    }
    
    return data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

export async function register(userData) {
  try {
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: userData,
    });
    
    return data;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const data = await api('/api/auth/me');
    return data;
  } catch (error) {
    console.error('Get current user failed:', error);
    throw error;
  }
}

export async function logout() {
  try {
    // Optional: Call backend logout if available
    // await api('/api/auth/logout', { method: 'POST' });
    
    setToken(null);
    return { success: true };
  } catch (error) {
    // Even if backend logout fails, clear local token
    setToken(null);
    console.error('Logout error:', error);
    return { success: true };
  }
}

// Helper function to test API connectivity
export async function testConnection() {
  try {
    const response = await apiClient.get('/api/health');
    console.log('API connection test successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('API connection test failed:', error);
    return { success: false, error: error.message };
  }
}
