import { Client, Account, Databases, Storage, ID } from 'appwrite';

// Configuration Appwrite
const client = new Client();

client
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('6917d60c001a8ea43024');

// Services Appwrite
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { ID };

// Configuration des bases de données
export const DATABASE_CONFIG = {
  MAIN: '6917e2c70008c7f35ac9',
  COLLECTIONS: {
    USERS: 'users',
    COMPANIES: 'companies',
    PRODUCTS: 'products',
    ORDERS: 'orders',
    EMPLOYEES: 'employees',
    PROJECTS: 'projects'
  }
};

// Fonctions utilitaires
export const appwriteService = {
  // Test de connexion
  async healthCheck() {
    try {
      const response = await databases.listDocuments(
        DATABASE_CONFIG.MAIN,
        DATABASE_CONFIG.COLLECTIONS.COMPANIES,
        []
      );
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Récupérer toutes les companies
  async getCompanies() {
    return await databases.listDocuments(
      DATABASE_CONFIG.MAIN,
      DATABASE_CONFIG.COLLECTIONS.COMPANIES
    );
  },

  // Créer une company
  async createCompany(companyData) {
    return await databases.createDocument(
      DATABASE_CONFIG.MAIN,
      DATABASE_CONFIG.COLLECTIONS.COMPANIES,
      ID.unique(),
      companyData
    );
  }
};

export default client;
