// appwrite.js (à la racine)
import { Client, Account, Databases, Storage, ID, Query } from 'appwrite';

const client = new Client();
client
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('6917d60c001a8ea43024');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { ID, Query };

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

// Service Appwrite principal - CECI DOIT ÊTRE EXPORTÉ
export const appwrite = {
  client,
  account,
  databases,
  storage,
  config: DATABASE_CONFIG,
  
  // Méthodes utilitaires
  async healthCheck() {
    try {
      const result = await this.databases.listDocuments(
        this.config.MAIN,
        this.config.COLLECTIONS.COMPANIES,
        [Query.limit(1)]
      );
      return { 
        status: 'connected', 
        documents: result.total
      };
    } catch (error) {
      return { 
        status: 'error', 
        message: error.message 
      };
    }
  },

  async getCompanies(queries = []) {
    return await this.databases.listDocuments(
      this.config.MAIN,
      this.config.COLLECTIONS.COMPANIES,
      queries
    );
  },

  async createCompany(companyData) {
    return await this.databases.createDocument(
      this.config.MAIN,
      this.config.COLLECTIONS.COMPANIES,
      ID.unique(),
      {
        ...companyData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    );
  }
};

// Export par défaut
export default appwrite;
