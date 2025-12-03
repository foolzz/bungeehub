import axios from 'axios';

// API URL configuration:
// - Combined mode (default): Uses relative path /api/v1 (same server)
// - Separated mode: Set NEXT_PUBLIC_API_URL in .env.local to point to API server
// - Production: Uses relative path when deployed to same domain
const getApiUrl = () => {
  // If explicitly set, use it (for separated mode)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // For browser environment in production, use relative path
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `${window.location.origin}/api/v1`;
  }

  // For localhost development, use explicit URL
  return 'http://localhost:8080/api/v1';
};

const API_URL = getApiUrl();

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
  getMyHubs: () => api.get('/hubs/my-hubs'),
  getById: (id: string) => api.get(`/hubs/${id}`),
  getMetrics: (id: string, days?: number) => api.get(`/hubs/${id}/metrics`, { params: { days } }),
  create: (data: any) => api.post('/hubs', data),
  update: (id: string, data: any) => api.put(`/hubs/${id}`, data),
};

// Packages API
export const packagesApi = {
  getAll: (params?: any) => api.get('/packages', { params }),
  getById: (id: string) => api.get(`/packages/${id}`),
  track: (trackingNumber: string) => api.get(`/packages/tracking/${trackingNumber}`),
  create: (data: any) => api.post('/packages', data),
  update: (id: string, data: any) => api.put(`/packages/${id}`, data),
  delete: (id: string) => api.delete(`/packages/${id}`),
};

// Admin API
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getPendingApplications: (page?: number, limit?: number) =>
    api.get('/admin/applications/pending', { params: { page, limit } }),
  getApplicationDetails: (hubId: string) => api.get(`/admin/applications/${hubId}`),
  reviewApplication: (hubId: string, data: any) => api.post(`/admin/applications/${hubId}/review`, data),
};

export default api;
