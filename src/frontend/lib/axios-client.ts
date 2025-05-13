import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { supabase } from './supabase-client'; // To get the current session token
import type { ApiErrorResponse, ApiSuccessResponse } from '../../common/types/api'; // Changed to relative path and added ApiSuccessResponse

const apiClient = axios.create({
  baseURL: '/api', // All API calls will be prefixed with /api
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for centralized error handling (optional, can also be handled in react-query)
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiSuccessResponse>) => response, // Added type for response
  (error: AxiosError<ApiErrorResponse>) => {
    // You can handle specific error codes or types here globally if needed
    // For example, redirect to login on 401, etc.
    // For now, we'll just let react-query handle the error object
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.data);
      // Return the error response data to be caught by react-query's onError
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API No Response:', error.request);
      return Promise.reject({ success: false, message: 'No response from server. Check network connection.' } as ApiErrorResponse);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Request Setup Error:', error.message);
      return Promise.reject({ success: false, message: error.message || 'Error setting up API request.' } as ApiErrorResponse);
    }
    // Default fallback if somehow none of the above are met.
    // return Promise.reject(error);
  }
);

export default apiClient; 