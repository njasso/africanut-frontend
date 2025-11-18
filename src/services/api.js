// src/services/api.js
import axios from 'axios';

// Configuration Appwrite
const APPWRITE_CONFIG = {
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  projectId: '6917d60c001a8ea43024',
  functionId: '6917e2c70008c7f35ac9'
};

// Gestion de l'authentification - EXPORTEZ CES FONCTIONS
export const auth = {
  getToken() { 
    return localStorage.getItem('africanut_token'); 
  },
  setToken(token) { 
    localStorage.setItem('africanut_token', token); 
  },
  removeToken() { 
    localStorage.removeItem('africanut_token'); 
  },
  isAuthenticated() { 
    return !!this.getToken(); 
  }
};

// Exportez les fonctions individuelles pour la compatibilité
export const getToken = () => auth.getToken();
export const setToken = (token) => auth.setToken(token);
export const removeToken = () => auth.removeToken();

// Client Axios pour Appwrite Functions
export const apiClient = axios.create({
  baseURL: APPWRITE_CONFIG.endpoint,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': APPWRITE_CONFIG.projectId
  },
});

// Intercepteur pour ajouter le token
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

// Service principal
export const apiService = {
  // Exécuter une fonction Appwrite
  async executeFunction(data = {}) {
    try {
      const response = await apiClient.post(
        `/functions/${APPWRITE_CONFIG.functionId}/execution`,
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(`Appwrite Function error: ${error.response?.data?.message || error.message}`);
    }
  },

  // Auth endpoints
  async login(credentials) {
    const result = await this.executeFunction({
      path: '/auth/login',
      body: credentials
    });
    
    if (result.token) {
      setToken(result.token);
    }
    
    return result;
  },

  async register(userData) {
    const result = await this.executeFunction({
      path: '/auth/register', 
      body: userData
    });
    return result;
  },

  async logout() {
    removeToken();
    try {
      await this.executeFunction({ path: '/auth/logout' });
    } catch (error) {
      // Ignorer les erreurs de déconnexion
    }
  },

  async getProfile() {
    const result = await this.executeFunction({ path: '/auth/me' });
    return result;
  },

  // Companies
  async getCompanies() {
    const result = await this.executeFunction({ path: '/companies' });
    return result.data || result;
  },

  async createCompany(companyData) {
    const result = await this.executeFunction({
      method: 'POST',
      path: '/companies',
      body: companyData
    });
    return result.data || result;
  },

  // Health check
  async healthCheck() {
    return await this.executeFunction({ path: '/health' });
  }
};

// Export pour la compatibilité avec l'ancien code
export const api = apiService;

// Helper générique (pour compatibilité)
export async function apiCall(path, options = {}) {
  const result = await apiService.executeFunction({
    path: path,
    method: options.method || 'GET',
    body: options.body
  });
  
  return result.data || result;
}

export default apiService;
