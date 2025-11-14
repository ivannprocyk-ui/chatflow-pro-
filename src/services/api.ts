import axios from 'axios';

const API_URL = 'https://chatflow-backend-vj8o.onrender.com/api'; // Hardcoded for production

console.log('[API] Using API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      localStorage.removeItem('organization');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  register: (data: { email: string; password: string; organizationName: string }) =>
    api.post('/auth/register', data),

  me: () =>
    api.get('/auth/me'),
};

export const conversationsAPI = {
  getAll: () => api.get('/conversations'),
  getById: (id: string) => api.get(`/conversations/${id}`),
  create: (data: any) => api.post('/conversations', data),
  getMessages: (id: string) => api.get(`/conversations/${id}/messages`),
  sendMessage: (id: string, data: any) => api.post(`/conversations/${id}/messages`, data),
};

export const whatsappAPI = {
  getTemplates: () => api.get('/whatsapp/templates'),
  bulkSend: (data: any) => api.post('/whatsapp/bulk-send', data),
};

export const contactsAPI = {
  getLists: () => api.get('/contact-lists'),
  createList: (data: any) => api.post('/contact-lists', data),
  addContacts: (listId: string, data: any) => api.post(`/contact-lists/${listId}/contacts`, data),
};

export default api;
