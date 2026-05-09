import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5003/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Attach token automatically to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ttm_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle API errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0]?.msg ||
      error.message ||
      'Something went wrong';

    // Logout if unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('ttm_token');

      delete api.defaults.headers.common[
        'Authorization'
      ];

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject({
      ...error,
      message,
    });
  }
);

export default api;