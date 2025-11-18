import axios from 'axios';

// Use local backend in development, production URL in production
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001/api'
  : 'https://chatflow-backend-vj8o.onrender.com/api';

console.log('[API] Using API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token and organization ID to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add organization ID if available
  const organization = localStorage.getItem('organization');
  if (organization) {
    try {
      const orgData = JSON.parse(organization);
      if (orgData.id) {
        config.headers['x-organization-id'] = orgData.id;
      }
    } catch (e) {
      // If not found, use a default demo organization ID
      config.headers['x-organization-id'] = 'demo-org-123';
    }
  } else {
    // Use a default demo organization ID for development
    config.headers['x-organization-id'] = 'demo-org-123';
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

export const botConfigAPI = {
  // Bot Configuration
  get: () => api.get('/bot-config'),
  upsert: (data: any) => api.post('/bot-config', data),
  toggleBot: () => api.patch('/bot-config/toggle'),

  // Evolution API - WhatsApp Connection
  connectInstance: (data: any) => api.post('/evolution-api/instance', data),
  getQRCode: () => api.get('/evolution-api/qrcode'),
  getStatus: () => api.get('/evolution-api/status'),
  disconnect: () => api.post('/evolution-api/disconnect'),
  deleteInstance: () => api.delete('/evolution-api/instance'),
  setWebhook: (data: any) => api.post('/evolution-api/webhook', data),
};

export const botTrackingAPI = {
  // Bot Metrics & Analytics
  getMetrics: (period: 'day' | 'week' | 'month' | 'all' = 'all') =>
    api.get(`/bot-tracking/metrics?period=${period}`),
  getMetricsByAgentType: (period: 'day' | 'week' | 'month' | 'all' = 'all') =>
    api.get(`/bot-tracking/metrics/by-agent-type?period=${period}`),
  getLogs: (params?: { limit?: number; offset?: number; status?: string }) =>
    api.get('/bot-tracking/logs', { params }),
  getConversationLogs: (conversationId: string) =>
    api.get(`/bot-tracking/conversation/${conversationId}`),
  getSuccessRate: (period: 'day' | 'week' | 'month' | 'all' = 'all') =>
    api.get(`/bot-tracking/success-rate?period=${period}`),
};

export const organizationsAPI = {
  getCurrent: () => api.get('/organizations/current'),
  update: (data: any) => api.put('/organizations/current', data),
};

export const aiAPI = {
  getConfig: () => api.get('/ai/config'),
  updateConfig: (data: any) => api.put('/ai/config', data),
  testConnection: () => api.post('/ai/test'),
};

export const followUpsAPI = {
  // Secuencias
  getAllSequences: () => api.get('/follow-ups/sequences').then(res => res.data),
  getSequence: (id: string) => api.get(`/follow-ups/sequences/${id}`).then(res => res.data),
  createSequence: (data: any) => api.post('/follow-ups/sequences', data).then(res => res.data),
  updateSequence: (id: string, data: any) => api.put(`/follow-ups/sequences/${id}`, data).then(res => res.data),
  deleteSequence: (id: string) => api.delete(`/follow-ups/sequences/${id}`).then(res => res.data),
  getSequenceStats: (id: string) => api.get(`/follow-ups/sequences/${id}/stats`).then(res => res.data),

  // Ejecuciones
  startExecution: (data: any) => api.post('/follow-ups/executions/start', data).then(res => res.data),
  getAllExecutions: (filters?: any) => api.get('/follow-ups/executions', { params: filters }).then(res => res.data),
  cancelExecution: (id: string) => api.put(`/follow-ups/executions/${id}/cancel`).then(res => res.data),
  markAsConverted: (id: string) => api.put(`/follow-ups/executions/${id}/convert`).then(res => res.data),

  // Procesamiento
  processPending: () => api.post('/follow-ups/process-pending').then(res => res.data),
};

export default api;
