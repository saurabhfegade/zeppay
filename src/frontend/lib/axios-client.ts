import axios from 'axios';
import { useAuthStore } from '../store/auth-store'; // Import the auth store

const apiClient = axios.create({
  baseURL: '/api', // Adjust if your API base URL is different
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token from Zustand store
apiClient.interceptors.request.use(
  (config) => {
    // Get token from Zustand store
    // Note: This runs outside of React components, so we use getState()
    const token = useAuthStore.getState().sessionToken;
    // console.log('[Axios Interceptor] Running for path:', config.url, 'Token from store:', token ? 'found' : 'not found');

    if (token) {
      // console.log('[Axios Interceptor] Token found in store, adding to headers for:', config.url);
      if (config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else {
      console.warn('[Axios Interceptor] No token found in Zustand store for:', config.url);
    }
    return config;
  },
  (error) => {
    // console.error('[Axios Interceptor] Request error:', error);
    return Promise.reject(error);
  }
);

export default apiClient; 