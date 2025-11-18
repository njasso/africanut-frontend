// src/services/api.js
import axios from 'axios';
import { appwrite, ID } from '/appwrite.js';

// Configuration Appwrite
const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '6917d60c001a8ea43024';
const APPWRITE_FUNCTION_ID = '6917e2c70008c7f35ac9';

// URLs des fonctions Appwrite
const APPWRITE_FUNCTION_URL = `${APPWRITE_ENDPOINT}/functions/${APPWRITE_FUNCTION_ID}/execution`;

// Debug
if (import.meta.env.DEV) {
  console.log('🔧 Configuration Appwrite + Neon:', {
    endpoint: APPWRITE_ENDPOINT,
    project: APPWRITE_PROJECT_ID,
    function: APPWRITE_FUNCTION_ID
  });
}

// Gestion de l'authentification Appwrite
export const auth = {
  // Token JWT classique (optionnel)
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
  },

  // Authentification Appwrite (recommandé)
  async login(email, password) {
    try {
      const session = await appwrite.account.createEmailSession(email, password);
      const user = await appwrite.account.get();
      
      // Stocker les infos utilisateur
      localStorage.setItem('africanut_user', JSON.stringify(user));
      
      return { user, session };
    } catch (error) {
      throw new Error(`Connexion échouée: ${error.message}`);
    }
  },

  async register(email, password, name) {
    try {
      const user = await appwrite.account.create(ID.unique(), email, password, name);
      return user;
    } catch (error) {
      throw new Error(`Inscription échouée: ${error.message}`);
    }
  },

  async logout() {
    try {
      await appwrite.account.deleteSession('current');
      localStorage.removeItem('africanut_user');
      this.removeToken();
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  },

  async getCurrentUser() {
    try {
      const user = await appwrite.account.get();
      return user;
    } catch (error) {
      return null;
    }
  }
};

// Client Axios pour Appwrite Functions
export const appwriteClient = axios.create({
  baseURL: APPWRITE_ENDPOINT,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': APPWRITE_PROJECT_ID
  },
});

// Intercepteur pour ajouter le JWT si disponible
appwriteClient.interceptors.request.use(
  (config) => {
    const token = auth.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (import.meta.env.DEV) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Service principal pour Appwrite Functions (connexion à Neon)
export const neonService = {
  // Exécuter une fonction Appwrite
  async executeFunction(data = {}) {
    try {
      const response = await appwriteClient.post(
        `/functions/${APPWRITE_FUNCTION_ID}/execution`,
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(`Appwrite Function error: ${error.response?.data?.message || error.message}`);
    }
  },

  // Health check
  async healthCheck() {
    return await this.executeFunction({ path: '/health' });
  },

  // Companies
  async getCompanies(limit = 50, offset = 0) {
    const result = await this.executeFunction({ 
      path: '/companies',
      query: { limit, offset }
    });
    return result.data || result;
  },

  async getCompany(slug) {
    const result = await this.executeFunction({ 
      path: '/companies',
      query: { slug }
    });
    return Array.isArray(result.data) ? result.data[0] : result.data;
  },

  async createCompany(companyData) {
    const result = await this.executeFunction({
      method: 'POST',
      path: '/companies',
      body: companyData
    });
    return result.data || result;
  },

  // Database stats
  async getDatabaseStats() {
    const result = await this.executeFunction({ action: 'stats' });
    return result;
  },

  // Synchronisation
  async syncData() {
    const result = await this.executeFunction({ path: '/sync' });
    return result;
  },

  // Generic query
  async query(queryData) {
    return await this.executeFunction(queryData);
  }
};

// Service pour Appwrite Database (données non-structurées)
export const appwriteService = {
  // Users
  async getCurrentUser() {
    return await auth.getCurrentUser();
  },

  // Companies dans Appwrite DB
  async getCompanies(queries = []) {
    return await appwrite.getCompanies(queries);
  },

  async createCompany(companyData) {
    return await appwrite.createCompany(companyData);
  },

  // Products
  async getProducts(queries = []) {
    return await appwrite.getProducts(queries);
  },

  async createProduct(productData) {
    return await appwrite.databases.createDocument(
      appwrite.config.DATABASE_ID,
      appwrite.config.COLLECTIONS.PRODUCTS,
      ID.unique(),
      {
        ...productData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    );
  },

  // Orders
  async getOrders(userId = null) {
    const queries = [];
    if (userId) {
      queries.push(appwrite.Query.equal('userId', userId));
    }
    
    return await appwrite.databases.listDocuments(
      appwrite.config.DATABASE_ID,
      appwrite.config.COLLECTIONS.ORDERS,
      queries
    );
  },

  async createOrder(orderData) {
    return await appwrite.databases.createDocument(
      appwrite.config.DATABASE_ID,
      appwrite.config.COLLECTIONS.ORDERS,
      ID.unique(),
      {
        ...orderData,
        status: 'pending',
        orderDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    );
  },

  // Media & Files
  async uploadFile(file, bucketId = 'default') {
    return await appwrite.storage.createFile(
      bucketId,
      ID.unique(),
      file
    );
  },

  async getFiles(bucketId = 'default') {
    return await appwrite.storage.listFiles(bucketId);
  },

  async getFilePreview(fileId, bucketId = 'default') {
    return await appwrite.storage.getFilePreview(bucketId, fileId);
  }
};

// Service de synchronisation entre Appwrite DB et Neon
export const syncService = {
  async syncCompanies() {
    try {
      // Récupérer depuis Neon (PostgreSQL)
      const neonCompanies = await neonService.getCompanies();
      
      // Récupérer depuis Appwrite DB
      const appwriteCompanies = await appwriteService.getCompanies();
      
      const syncResults = [];
      
      for (const neonCompany of neonCompanies) {
        const existsInAppwrite = appwriteCompanies.documents?.find(
          ac => ac.slug === neonCompany.slug
        );

        if (!existsInAppwrite) {
          try {
            const appwriteCompany = await appwriteService.createCompany(neonCompany);
            syncResults.push({
              company: neonCompany.name,
              action: 'created',
              id: appwriteCompany.$id,
              source: 'neon_to_appwrite'
            });
          } catch (error) {
            syncResults.push({
              company: neonCompany.name,
              action: 'error',
              error: error.message
            });
          }
        } else {
          syncResults.push({
            company: neonCompany.name,
            action: 'exists',
            id: existsInAppwrite.$id
          });
        }
      }

      return syncResults;
    } catch (error) {
      throw new Error(`Sync failed: ${error.message}`);
    }
  },

  async getUnifiedCompanies() {
    try {
      const [neonCompanies, appwriteCompanies] = await Promise.all([
        neonService.getCompanies(),
        appwriteService.getCompanies()
      ]);

      // Fusionner les données
      return neonCompanies.map(neonCompany => {
        const appwriteCompany = appwriteCompanies.documents?.find(
          ac => ac.slug === neonCompany.slug
        );
        
        return {
          // Données de Neon (PostgreSQL)
          ...neonCompany,
          // Métadonnées d'Appwrite
          appwriteId: appwriteCompany?.$id,
          appwriteData: appwriteCompany || null,
          synced: !!appwriteCompany,
          // Source tracking
          source: 'unified',
          neonId: neonCompany.id
        };
      });
    } catch (error) {
      console.error('Erreur companies unifiées:', error);
      // Fallback vers Neon seulement
      return await neonService.getCompanies();
    }
  }
};

// Service unifié principal
export const apiService = {
  // Authentication
  auth,

  // Data Services
  neon: neonService,        // PostgreSQL via Appwrite Functions
  appwrite: appwriteService, // Appwrite Database (NoSQL)
  sync: syncService,        // Synchronisation

  // Méthodes hybrides intelligentes
  async getCompanies(useUnified = true) {
    if (useUnified) {
      return await syncService.getUnifiedCompanies();
    }
    return await neonService.getCompanies();
  },

  async createCompany(companyData) {
    // Créer dans les deux systèmes
    const neonCompany = await neonService.createCompany(companyData);
    
    try {
      const appwriteCompany = await appwriteService.createCompany({
        ...companyData,
        neonId: neonCompany.id
      });
      return { neon: neonCompany, appwrite: appwriteCompany };
    } catch (error) {
      console.warn('Création Appwrite échouée, mais Neon OK:', error);
      return { neon: neonCompany, appwrite: null };
    }
  },

  // Health check complet
  async healthCheck() {
    const results = {
      appwrite: { status: 'unknown', latency: null },
      neon: { status: 'unknown', latency: null },
      database: { status: 'unknown', latency: null }
    };

    // Test Appwrite Auth
    try {
      const start = Date.now();
      await appwrite.account.get();
      results.appwrite = {
        status: 'connected',
        latency: Date.now() - start
      };
    } catch (error) {
      results.appwrite = {
        status: 'error',
        error: error.message,
        latency: null
      };
    }

    // Test Appwrite Functions (Neon)
    try {
      const start = Date.now();
      await neonService.healthCheck();
      results.neon = {
        status: 'connected',
        latency: Date.now() - start
      };
    } catch (error) {
      results.neon = {
        status: 'error',
        error: error.message,
        latency: null
      };
    }

    // Test Appwrite Database
    try {
      const start = Date.now();
      await appwrite.healthCheck();
      results.database = {
        status: 'connected',
        latency: Date.now() - start
      };
    } catch (error) {
      results.database = {
        status: 'error',
        error: error.message,
        latency: null
      };
    }

    return results;
  },

  // Statistiques globales
  async getStats() {
    const [health, dbStats, user] = await Promise.all([
      this.healthCheck(),
      neonService.getDatabaseStats(),
      auth.getCurrentUser()
    ]);

    return {
      health,
      database: dbStats,
      user: user ? {
        id: user.$id,
        name: user.name,
        email: user.email
      } : null,
      timestamp: new Date().toISOString()
    };
  }
};

// Export par défaut
export default apiService;

// Helper pour les requêtes génériques (compatibilité)
export async function api(path, options = {}) {
  // Si vous voulez utiliser l'ancienne syntaxe, rediriger vers Appwrite Functions
  const result = await neonService.executeFunction({
    path: path,
    method: options.method || 'GET',
    body: options.body
  });
  
  return result.data || result;
}
