// src/services/api.js
import axios from 'axios';

// Configuration Appwrite
const API_URL = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6917d60c001a8ea43024';
const FUNCTION_ID = '6917e2c70008c7f35ac9';

// Gestion des tokens - EXPORTEZ CES FONCTIONS
export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token) {
  localStorage.setItem('token', token);
}

export function removeToken() {
  localStorage.removeItem('token');
}

// Instance axios avec configuration automatique
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': PROJECT_ID
  },
});

// Intercepteur pour ajouter automatiquement le token
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper générique (compatible avec votre AuthContext existant)
export async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': PROJECT_ID,
    ...options.headers
  };

  // Ajouter le token si disponible
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Si c'est une route d'authentification, utiliser Appwrite Functions
  if (path.startsWith('/api/auth/')) {
    const functionPath = path.replace('/api/', '');
    
    const response = await fetch(
      `${API_URL}/functions/${FUNCTION_ID}/execution`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          path: functionPath,
          method: options.method || 'GET',
          body: options.body ? JSON.parse(options.body) : undefined
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `API Error: ${response.status}`);
    }

    return response.json();
  }

  // Pour les autres routes, utiliser fetch normal
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API Error: ${response.status}`);
  }

  return response.headers.get('content-type')?.includes('application/json')
    ? response.json()
    : response.text();
}

// Service moderne (optionnel)
export const apiService = {
  // Auth via Appwrite Functions
  async login(credentials) {
    const result = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    if (result.token) {
      setToken(result.token);
    }
    
    return result;
  },

  async register(userData) {
    return await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async getProfile() {
    return await api('/api/auth/me');
  },

  // Companies via Appwrite Functions
  async getCompanies() {
    const result = await api('/api/companies');
    return result.data || result;
  },

  async createCompany(companyData) {
    const result = await api('/api/companies', {
      method: 'POST',
      body: JSON.stringify(companyData)
    });
    return result.data || result;
  },

  // Health check
  async healthCheck() {
    return await api('/api/health');
  }
};

export default apiService;
