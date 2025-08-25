// src/services/api.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://africanut-backend-postgres-production.up.railway.app";

console.log("✅ API_URL utilisé :", API_URL);

// Création instance axios
const apiClient = axios.create({
  baseURL: API_URL, // Toutes les requêtes pointeront ici
  headers: {
    "Content-Type": "application/json",
  },
});

// 👉 Interceptor pour token
apiClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("authToken") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 👉 Interceptor réponse
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      alert("Session expirée. Veuillez vous reconnecter.");
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
