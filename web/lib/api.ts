import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: { email: string; password: string; fullName: string; phone?: string; role: string }) =>
    api.post('/auth/register', data),

  getProfile: () =>
    api.get('/auth/profile'),
};

// Hubs API
export const hubsApi = {
  getAll: () => api.get('/hubs'),
  getById: (id: string) => api.get(`/hubs/${id}`),
  create: (data: any) => api.post('/hubs', data),
  update: (id: string, data: any) => api.put(`/hubs/${id}`, data),
};

// Packages API
export const packagesApi = {
  getAll: () => api.get('/packages'),
  getById: (id: string) => api.get(`/packages/${id}`),
  track: (trackingNumber: string) => api.get(`/packages/track/${trackingNumber}`),
};

export default api;
