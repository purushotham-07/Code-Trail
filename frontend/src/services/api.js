import axios from 'axios';

/**
 * API client configuration.
 *
 * - Local development: .env file sets VITE_API_URL=http://localhost:5000/api
 * - Vercel (production frontend): set VITE_API_URL env var to your Render
 *   backend URL (e.g. https://codetrail-api.onrender.com/api)
 * - Fallback '/api' works when frontend & backend share the same origin.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach the stored token to every request automatically.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('codetrail_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default api;
