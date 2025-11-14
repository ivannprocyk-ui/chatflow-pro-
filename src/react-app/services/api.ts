import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string; organizationName: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  getProfile: () =>
    api.get('/auth/me'),
};

// Organizations API
export const organizationsAPI = {
  getMe: () =>
    api.get('/organizations/me'),

  update: (data: any) =>
    api.put('/organizations/me', data),
};

// Contacts API
export const contactsAPI = {
  getAll: (filters?: any) =>
    api.get('/contacts', { params: filters }),

  getStats: () =>
    api.get('/contacts/stats'),

  getOne: (id: string) =>
    api.get(`/contacts/${id}`),

  create: (data: any) =>
    api.post('/contacts', data),

  update: (id: string, data: any) =>
    api.put(`/contacts/${id}`, data),

  delete: (id: string) =>
    api.delete(`/contacts/${id}`),
};

// Messages API
export const messagesAPI = {
  getAll: (filters?: any) =>
    api.get('/messages', { params: filters }),

  getStats: (dateRange?: any) =>
    api.get('/messages/stats', { params: dateRange }),

  getConversation: (contactId: string) =>
    api.get(`/messages/conversation/${contactId}`),

  send: (data: { contactId: string; message: string }) =>
    api.post('/messages/send', data),
};

// AI API
export const aiAPI = {
  generateResponse: (data: { contactPhone: string; message: string }) =>
    api.post('/ai/generate-response', data),

  test: (data: { message: string }) =>
    api.post('/ai/test', data),
};

// WhatsApp API
export const whatsappAPI = {
  connect: () =>
    api.post('/whatsapp/connect'),

  getQR: () =>
    api.get('/whatsapp/qr'),

  getStatus: () =>
    api.get('/whatsapp/status'),

  send: (data: { phone: string; message: string }) =>
    api.post('/whatsapp/send', data),

  disconnect: () =>
    api.delete('/whatsapp/disconnect'),
};

export default api;
