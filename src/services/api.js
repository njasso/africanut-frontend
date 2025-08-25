import axios from 'axios';

// URL de base : priorise la variable d'environnement, sinon Railway
const API_URL = import.meta.env.VITE_API_URL || 'https://africanut-backend-postgres-production.up.railway.app';

// Token stocké en mémoire + localStorage
let token = localStorage.getItem('token') || null;

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
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = {
      url: `${API_BASE_URL}${path}`,
      method: options.method || 'GET',
      headers,
      // On n'envoie le body que si ce n'est pas un GET
      ...(options.method && options.method.toUpperCase() !== 'GET' && options.body
        ? { data: options.body }
        : {}),
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    // Gestion des erreurs
    if (error.response) {
      // Si 401 => token invalide, on supprime le token
      if (error.response.status === 401) {
        setToken(null);
        console.warn('Token invalide ou expiré. Déconnexion automatique.');
      }
      console.error('API call failed:', error.response.data);
      throw error.response.data;
    } else {
      console.error('API call failed:', error.message);
      throw { message: error.message };
    }
  }
}

// -----------------------------
// Fonction helper pour login
// -----------------------------
export async function login(credentials) {
  const data = await api('/api/auth/login', {
    method: 'POST',
    body: credentials,
  });
  // Sauvegarde automatique du token reçu
  if (data.token) setToken(data.token);
  return data;
}
