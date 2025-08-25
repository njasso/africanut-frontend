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
  timeout: 15000, // 15 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token and log requests
apiClient.interceptors.request.use(
  (config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log the request for debugging
    console.log('🚀 Making request:', {
      url: config.baseURL + config.url,
      method: config.method?.toUpperCase(),
      headers: config.headers,
      data: config.data,
    });
    
    // Ensure data is properly serialized
    if (config.data && typeof config.data === 'object') {
      try {
        // Axios should handle this automatically, but let's be explicit
        config.data = JSON.stringify(config.data);
        console.log('📦 Serialized data:', config.data);
      } catch (error) {
        console.error('❌ Failed to serialize data:', error);
        throw new Error('Failed to serialize request data');
      }
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ Response received:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error);
    
    if (error.response) {
      // Server responded with error status
      const { status, data, config } = error.response;
      
      console.error('❌ Server error details:', {
        status,
        data,
        url: config?.url,
        method: config?.method,
      });
      
      if (status === 401) {
        setToken(null);
        console.warn('🔓 Token invalide ou expiré. Déconnexion automatique.');
      }
      
      // Create meaningful error messages
      let errorMessage = 'Une erreur est survenue';
      
      if (status === 400) {
        errorMessage = data?.error || data?.message || 'Données invalides';
      } else if (status === 401) {
        errorMessage = 'Non autorisé. Veuillez vous reconnecter.';
      } else if (status === 403) {
        errorMessage = 'Accès interdit.';
      } else if (status === 404) {
        errorMessage = 'Endpoint non trouvé.';
      } else if (status === 422) {
        errorMessage = 'Données de validation incorrectes';
      } else if (status === 500) {
        errorMessage = data?.error || data?.message || 'Erreur serveur interne.';
      } else if (data?.message) {
        errorMessage = data.message;
      } else if (data?.error) {
        errorMessage = data.error;
      }
      
      const apiError = {
        status,
        message: errorMessage,
        data: data,
        originalError: error.response,
      };
      
      return Promise.reject(apiError);
    } else if (error.request) {
      // Network error or no response
      console.error('🌐 Network error:', error.request);
      return Promise.reject({
        message: 'Erreur de connexion réseau. Vérifiez votre connexion internet.',
        status: 0,
        originalError: error,
      });
    } else {
      // Something else happened
      console.error('⚠️ Unexpected error:', error);
      return Promise.reject({
        message: error.message || 'Une erreur inattendue est survenue',
        status: 0,
        originalError: error,
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
    // Clean the path
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    const config = {
      url: cleanPath,
      method: options.method || 'GET',
      ...options,
    };

    // Handle request body - let axios handle the serialization
    if (options.body && ['POST', 'PUT', 'PATCH'].includes(config.method.toUpperCase())) {
      // Don't stringify here - let the interceptor handle it
      config.data = options.body;
    }

    // Remove body from config as axios uses 'data'
    delete config.body;

    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    console.error('🔥 API call failed:', error);
    throw error;
  }
}

// -----------------------------
// Fonctions helper spécifiques
// -----------------------------
export async function login(credentials) {
  try {
    console.log('🔑 Attempting login with:', { 
      email: credentials.email, 
      passwordLength: credentials.password?.length 
    });
    
    // Ensure credentials are clean objects
    const cleanCredentials = {
      email: String(credentials.email || '').trim(),
      password: String(credentials.password || ''),
    };
    
    console.log('🧹 Clean credentials:', { 
      email: cleanCredentials.email, 
      passwordLength: cleanCredentials.password.length 
    });
    
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: cleanCredentials,
    });
    
    // Sauvegarde automatique du token reçu
    if (data.token) {
      setToken(data.token);
      console.log('💾 Token saved successfully');
    }
    
    return data;
  } catch (error) {
    console.error('🔑 Login failed:', error);
    throw error;
  }
}

export async function register(userData) {
  try {
    console.log('📝 Attempting registration');
    
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: userData,
    });
    
    return data;
  } catch (error) {
    console.error('📝 Registration failed:', error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const data = await api('/api/auth/me');
    return data;
  } catch (error) {
    console.error('👤 Get current user failed:', error);
    throw error;
  }
}

// Direct fetch test function for debugging
export async function testLoginDirect(credentials) {
  const url = `${API_URL}/api/auth/login`;
  
  try {
    console.log('🧪 Direct test login to:', url);
    console.log('🧪 Credentials:', { 
      email: credentials.email, 
      passwordLength: credentials.password?.length 
    });
    
    const body = JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    });
    
    console.log('🧪 Request body:', body);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body,
    });
    
    console.log('🧪 Response status:', response.status);
    console.log('🧪 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('🧪 Raw response:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('🧪 JSON parse error:', parseError);
      responseData = { rawResponse: responseText };
    }
    
    return {
      success: response.ok,
      status: response.status,
      data: responseData,
      rawResponse: responseText,
    };
  } catch (error) {
    console.error('🧪 Direct test failed:', error);
    throw error;
  }
}
