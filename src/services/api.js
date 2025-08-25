// src/services/api.js
import axios from 'axios';

// Get the API URL from environment variables, or use the fallback
const API_URL = import.meta.env.VITE_API_URL || 'https://africanut-backend-postgres-production.up.railway.app';
console.log('API_URL configured as:', API_URL);

/**
 * Retrieves the authentication token from local storage.
 * @returns {string | null} The token string or null if not found.
 */
export function getToken() {
  return localStorage.getItem('token');
}

/**
 * Sets the authentication token in local storage.
 * @param {string} t The token string to set.
 */
export function setToken(t) {
  localStorage.setItem('token', t);
}

/**
 * A helper function to make authenticated API requests.
 * @param {string} path The API endpoint path (e.g., '/api/employees').
 * @param {object} options Optional fetch configuration object.
 * @returns {Promise<object | string>} A promise that resolves to the JSON data or response text.
 */
export async function api(path, options = {}) {
  // Ensure the options object exists and merge headers securely
  const mergedOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Add the Authorization header if a token exists
  const token = getToken();
  if (token) {
    mergedOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(API_URL + path, mergedOptions);

    if (!res.ok) {
      // Handle non-OK responses
      const errorText = await res.text();
      let errorMessage = `API Error: ${res.status} ${res.statusText}`;
      
      // Try to parse JSON error message if available
      try {
        const jsonError = JSON.parse(errorText);
        errorMessage = jsonError.error || errorMessage;
      } catch (e) {
        // If parsing fails, use the raw text
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    // Check content type to decide how to parse the response
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    } else {
      return await res.text();
    }
  } catch (error) {
    console.error("Fetch API call failed:", error);
    throw error;
  }
}
