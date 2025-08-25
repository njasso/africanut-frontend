import axios from 'axios';

// Utilisez la variable d'environnement en priorité, sinon l'URL de Railway
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://africanut-backend-postgres-production.up.railway.app';
let token = localStorage.getItem('token') || null;

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(newToken) {
  token = newToken;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

export async function api(path, options = {}) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      url: `${API_BASE_URL}${path}`,
      method: options.method || 'GET',
      headers,
      data: options.body,
    };

    const response = await axios(config);
    return response.data;

  } catch (error) {
    console.error('API call failed:', error.response?.data || error.message);
    throw error;
  }
}
