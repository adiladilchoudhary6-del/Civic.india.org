import axios from 'axios';

// In development, Vite's proxy forwards /api and /uploads to the local backend.
// In production, set VITE_API_URL to your deployed backend's base URL
// (e.g. https://civicconnect-api.onrender.com) via an environment variable at build time.
const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL: `${API_BASE}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Resolves an uploaded file's relative path (e.g. "/uploads/xyz.jpg") into a full URL
// that works whether the frontend and backend share a domain or not.
export function resolveUploadUrl(path) {
  if (!path) return path;
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
}

export default api;
