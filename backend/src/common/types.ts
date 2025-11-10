// Common types used across the application

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'pro' | 'business' | 'enterprise';
  isActive: boolean;

  // AI Configuration
  aiEnabled: boolean;
  aiRole: 'vendedor' | 'asistente' | 'soporte' | 'agendador';
  aiCompanyInfo: string;
  aiProductsInfo: string;
  aiObjective: string;
  aiBusinessHoursOnly: boolean;

  // WhatsApp Configuration
  whatsappMethod: 'qr' | 'meta_api';
  whatsappInstanceId?: string;
  whatsappConnected: boolean;
  whatsappPhone?: string;

  // Meta API (optional)
  metaAccessToken?: string;
  metaWabaId?: string;

  // Follow-ups
  followupEnabled: boolean;
  followupConfig?: any;

  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  organizationId: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'user' | 'viewer';
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

export interface Contact {
  id: string;
  organizationId: string;
  phone: string;
  status: 'lead' | 'contacted' | 'customer' | 'churned';
  customFields: Record<string, any>;
  messagesReceived: number;
  messagesSent: number;
  lastContactAt?: Date;
  leadScore: number;
  followupCount: number;
  lastFollowupAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  organizationId: string;
  contactId: string;
  direction: 'inbound' | 'outbound';
  messageContent: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  isAutoReply: boolean;
  templateName?: string;
  campaignName?: string;
  metadata?: Record<string, any>;
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
}

export interface JwtPayload {
  sub: string; // user id
  email: string;
  organizationId: string;
  role: string;
}
