import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect if it's a genuine auth failure on a protected route
    if (error.response?.status === 403 || error.response?.status === 401) {
      const { clearAuth } = useAuthStore.getState();
      // Check if we are already on login to avoid loop
      if (!window.location.pathname.includes('/login')) {
        clearAuth();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
