import axios from 'axios';

// This connects your app to your own backend API
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Automatically attach the user's auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('clerk-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Generic helpers for each database operation
export const db = {
  list:   (entity, sort, limit) => api.get(`/entities/${entity}`, { params: { sort, limit } }).then(r => r.data),
  filter: (entity, query)       => api.get(`/entities/${entity}`, { params: query }).then(r => r.data),
  get:    (entity, id)          => api.get(`/entities/${entity}/${id}`).then(r => r.data),
  create: (entity, data)        => api.post(`/entities/${entity}`, data).then(r => r.data),
  update: (entity, id, data)    => api.patch(`/entities/${entity}/${id}`, data).then(r => r.data),
  delete: (entity, id)          => api.delete(`/entities/${entity}/${id}`).then(r => r.data),
};

export default api;