import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
};

export const projectAPI = {
  create: (data: any) => api.post('/projects', data),
  getAll: () => api.get('/projects'),
  getOne: (id: string) => api.get(`/projects/${id}`),
  getBudget: (id: string) => api.get(`/projects/${id}/budget`),
  getUtilization: (id: string) => api.get(`/projects/${id}/utilization`),
};

export const staffingAPI = {
  create: (projectId: string, data: any) =>
    api.post(`/projects/${projectId}/staffing`, data),
  getAll: (projectId: string) => api.get(`/projects/${projectId}/staffing`),
};

export const phaseAPI = {
  create: (projectId: string, data: any) =>
    api.post(`/projects/${projectId}/phases`, data),
  getAll: (projectId: string) => api.get(`/projects/${projectId}/phases`),
};

export const taskAPI = {
  create: (phaseId: string, data: any) =>
    api.post(`/phases/${phaseId}/tasks`, data),
  getOne: (id: string) => api.get(`/tasks/${id}`),
  getMyTasks: () => api.get('/users/me/tasks'),
  assign: (taskId: string, data: any) =>
    api.post(`/tasks/${taskId}/assignments`, data),
  logTime: (taskId: string, data: any) =>
    api.post(`/tasks/${taskId}/time-entries`, data),
};

export const invoiceAPI = {
  create: (data: any) => api.post('/invoices', data),
  getAll: () => api.get('/invoices'),
};

export default api;