import axios from 'axios';

// 1. Mettez à jour avec votre nouvelle URL Render
const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://africanut-backend-postgres.onrender.com';

console.log('API_URL configured as:', API_URL);

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(t) {
  localStorage.setItem('token', t);
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// CORRECTION ICI : Ajout des backticks autour de Bearer
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

export async function api(path, options = {}) {
  const headers = options.headers || {};
  if (getToken()) headers['Authorization'] = 'Bearer ' + getToken();
  headers['Content-Type'] = 'application/json';

  const res = await fetch(API_URL + path, { ...options, headers });

  if (!res.ok) {
    const errorText = await res.text();
    // CORRECTION ICI : Ajout des backticks autour de Erreur API
    throw new Error(errorText || `Erreur API: ${res.status}`);
  }

  return res.headers
    .get('content-type')
    ?.includes('application/json')
    ? res.json()
    : res.text();
}
