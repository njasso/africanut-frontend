// src/services/api.js
import axios from 'axios';

// Définir l'URL de l'API (Railway prod en fallback)
const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://africanut-backend-postgres-production.up.railway.app';

// Debug pour vérifier
console.log('API_URL configured as:', API_URL);

// Gestion des tokens dans le localStorage
export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(t) {
  localStorage.setItem('token', t);
}

// Instance axios avec configuration automatique
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // ⚡ Ne pas envoyer de cookies, on reste sur Bearer
});

// Intercepteur pour ajouter automatiquement le token
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = Bearer ${token};
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper générique (fetch fallback)
export async function api(path, options = {}) {
  const headers = options.headers || {};
  if (getToken()) headers['Authorization'] = 'Bearer ' + getToken();
  headers['Content-Type'] = 'application/json';

  const res = await fetch(API_URL + path, { ...options, headers });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || Erreur API: ${res.status});
  }

  return res.headers
    .get('content-type')
    ?.includes('application/json')
    ? res.json()
    : res.text();
} 
