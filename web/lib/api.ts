import axios from 'axios';

// API URL configuration:
// - Combined mode (default): http://localhost:8080/api/v1 (same server)
// - Separated mode: Set NEXT_PUBLIC_API_URL in .env.local to point to API server
// - Production: Set to your actual API URL (e.g., https://api.bungeehub.com/api/v1)
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
