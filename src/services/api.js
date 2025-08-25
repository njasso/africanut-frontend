// src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://africanut-backend-postgres-production.up.railway.app';
console.log('API_URL configured as:', API_URL);

let token = localStorage.getItem('token') || null;

// Axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// -----------------------------
// Interceptor request
// -----------------------------
apiClient.interceptors.request.use(
  (config) => {
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// -----------------------------
// Interceptor response
// -----------------------------
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) setToken(null);
      const msg = error.response.data?.error || error.response.data?.message || 'Erreur serveur';
      return Promise.reject({ status: error.response.status, message: msg, data: error.response.data });
    } else if (error.request) {
      return Promise.reject({ status: 0, message: 'Erreur réseau', originalError: error });
    } else {
      return Promise.reject({ status: 0, message: error.message, originalError: error });
    }
  }
);

// -----------------------------
// Token management
// -----------------------------
export const getToken = () => token;
export const setToken = (newToken) => {
  token = newToken;
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
};

// -----------------------------
// Central API function
// -----------------------------
export async function api(path, options = {}) {
  const config = { url: path.startsWith('/') ? path : `/${path}`, method: options.method || 'GET', ...options };
  if (options.body) config.data = options.body;
  delete config.body;
  const response = await apiClient(config);
  return response.data;
}

// -----------------------------
// Auth helpers
// -----------------------------
export async function login(credentials) {
  const data = await api('/api/auth/login', { method: 'POST', body: { email: credentials.email, password: credentials.password } });
  if (data.token) setToken(data.token);
  return data;
}

export async function register(userData) {
  return api('/api/auth/register', { method: 'POST', body: userData });
}

export async function getCurrentUser() {
  return api('/api/auth/me');
}

// -----------------------------
// Debug direct fetch
// -----------------------------
export async function testLoginDirect(credentials) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(credentials),
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { rawResponse: text }; }
  return { success: response.ok, status: response.status, data, rawResponse: text };
}
