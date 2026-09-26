import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('clinic_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Standardize error extraction and handle 401
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const errorResponse = {
      success: false,
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      statusCode: error.response?.status || 500,
      errors: error.response?.data?.errors || null,
    };

    // If unauthorized, clear local session if needed
    if (error.response?.status === 401) {
      // Don't auto-redirect on health check or login attempts
      const isLoginOrAuth = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/health');
      if (!isLoginOrAuth) {
        localStorage.removeItem('clinic_token');
        localStorage.removeItem('clinic_user');
      }
    }

    return Promise.reject(errorResponse);
  }
);

export default api;
