/**
 * ChatFlow Pro - Database Schema Types
 *
 * Este archivo contiene todas las interfaces TypeScript que mapean
 * exactamente con el esquema de Supabase.
 *
 * IMPORTANTE: Estos types están sincronizados con /supabase/migrations/
 *
 * Generado: 2025-11-19
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type UUID = string;
export type Timestamp = string; // ISO 8601

// ============================================================================
// ORGANIZATION
// ============================================================================

export interface Organization {
  id: UUID;
  name: string;
  slug: string;
  plan: 'starter' | 'pro' | 'business' | 'enterprise';
  is_active: boolean;

  // AI Configuration
  ai_enabled: boolean;
  ai_role: 'vendedor' | 'asistente' | 'soporte' | 'agendador';
  ai_company_info?: string;
  ai_products_info?: string;
  ai_objective?: string;
  ai_business_hours_only: boolean;

  // WhatsApp Configuration
  whatsapp_method: 'qr' | 'meta_api';
  whatsapp_instance_id?: string;
  whatsapp_connected: boolean;
  whatsapp_phone?: string;
  meta_access_token?: string;
  meta_waba_id?: string;
  meta_phone_number_id?: string;

  // Follow-ups
  followup_enabled: boolean;
  followup_config?: Record<string, any>;

  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// USER
// ============================================================================

export interface User {
  id: UUID;
  organization_id: UUID;
  email: string;
  password_hash?: string; // Opcional: Supabase Auth maneja contraseñas
  full_name?: string;
  role: 'admin' | 'user' | 'viewer';
  is_active: boolean;
  last_login_at?: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// CONTACT - CON TODOS LOS CAMPOS
// ============================================================================

export interface Contact {
  id: UUID;
  organization_id: UUID;

  // Basic Info
  phone: string;
  name?: string;
  email?: string;
  company?: string;
  position?: string;

  // Status
  status: string; // Definido en crm_statuses

  // Custom Fields (JSONB)
  custom_fields: Record<string, any>;

  // Message Stats ⚠️ IMPORTANTE - AGREGADOS
  messages_sent: number;
  messages_received: number;
  last_contact_at?: Timestamp;

  // Lead Scoring ⚠️ IMPORTANTE - AGREGADO
  lead_score: number;

  // Notes ⚠️ IMPORTANTE - AGREGADO
  notes?: string;

  // Timestamps
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// TAG
// ============================================================================

export interface Tag {
  id: UUID;
  organization_id: UUID;
  name: string;
  color: string; // HEX color
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ContactTag {
  id: UUID;
  contact_id: UUID;
  tag_id: UUID;
  created_at: Timestamp;
}

// ============================================================================
// CONTACT LIST
// ============================================================================

export interface ContactList {
  id: UUID;
  organization_id: UUID;
  name: string;
  description?: string;
  contact_count: number; // Actualizado automáticamente por trigger
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ContactListMember {
  id: UUID;
  list_id: UUID;
  contact_id: UUID;
  added_at: Timestamp;
}

// ============================================================================
// MESSAGE - CON TODOS LOS CAMPOS
// ============================================================================

export interface Message {
  id: UUID;
  organization_id: UUID;
  contact_id: UUID;

  // Direction ⚠️ CRÍTICO - AGREGADO
  direction: 'inbound' | 'outbound';

  // Status
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

  // Template Info
  template_name?: string;
  template_id?: string;
  message_content?: string; // Puede estar vacío por privacidad

  // WhatsApp ID
  whatsapp_message_id?: string;

  // Campaign Info
  campaign_id?: UUID;
  campaign_name?: string;
  list_id?: UUID;
  list_name?: string;

  // Error Info
  error_message?: string;

  // Metadata
  metadata: Record<string, any>;

  // Timestamps ⚠️ IMPORTANTE - AGREGADOS delivered_at y read_at
  sent_at?: Timestamp;
  delivered_at?: Timestamp;
  read_at?: Timestamp;
  created_at: Timestamp;
}

// ============================================================================
// CAMPAIGN - CON TODOS LOS CAMPOS
// ============================================================================

export interface Campaign {
  id: UUID;
  organization_id: UUID;

  // Basic Info
  name: string;
  description?: string; // ⚠️ AGREGADO

  // Template
  template_name?: string;
  template_id?: string; // ⚠️ AGREGADO

  // Status
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';

  // Metrics ⚠️ AGREGADOS delivered_count y read_count
  total_contacts: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;

  // Dates ⚠️ AGREGADOS scheduled_at, started_at, completed_at
  scheduled_at?: Timestamp;
  started_at?: Timestamp;
  completed_at?: Timestamp;

  // Timestamps
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// TEMPLATE
// ============================================================================

export interface Template {
  id: UUID;
  organization_id: UUID;
  whatsapp_template_id?: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string; // ISO 639-1 (es, en, pt, etc.)
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  components: any[]; // JSON array de componentes WhatsApp
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// SCHEDULED MESSAGE - INTERFACE COMPLETA
// ============================================================================

export interface ScheduledMessage {
  id: UUID;
  organization_id: UUID;
  contact_id: UUID;

  // Message Info
  template_name?: string;
  template_id?: string;
  message_content?: string;

  // Schedule
  scheduled_for: Timestamp;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  repeat_type: 'once' | 'daily' | 'weekly' | 'monthly';

  // Result
  sent_at?: Timestamp;
  error_message?: string;

  // Timestamps
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// CALENDAR EVENT - INTERFACE COMPLETA
// ============================================================================

export interface CalendarEvent {
  id: UUID;
  organization_id: UUID;
  contact_id?: UUID;

  // Event Info
  title: string;
  description?: string;
  event_type: 'reminder' | 'meeting' | 'call' | 'followup' | 'other';

  // Date/Time
  start_date: Timestamp;
  end_date?: Timestamp;
  all_day: boolean;

  // Reminder
  reminder_sent: boolean;

  // Timestamps
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// AUTOMATION
// ============================================================================

export interface AutomationNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay';
  position: { x: number; y: number };
  data: any;
}

export interface AutomationEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Automation {
  id: UUID;
  organization_id: UUID;

  // Basic Info
  name: string;
  description?: string;
  active: boolean;

  // Flow Definition (JSONB)
  nodes: AutomationNode[];
  edges: AutomationEdge[];

  // Statistics
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  last_executed_at?: Timestamp;

  // Timestamps
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface AutomationExecution {
  id: UUID;
  organization_id: UUID;
  automation_id: UUID;
  automation_name: string;

  // Contact Info
  contact_id: UUID;
  contact_name: string;

  // Execution State
  status: 'pending' | 'running' | 'completed' | 'failed';
  current_node_id?: string;
  execution_path: string[]; // JSONB array

  // Scheduling
  scheduled_for?: Timestamp;

  // Timing
  started_at: Timestamp;
  completed_at?: Timestamp;

  // Results
  error?: string;
  results: Array<{
    nodeId: string;
    nodeType: string;
    success: boolean;
    message?: string;
    executedAt: Timestamp;
  }>; // JSONB array

  created_at: Timestamp;
}

// ============================================================================
// BOT CONFIG
// ============================================================================

export interface BotConfig {
  id: UUID;
  organization_id: UUID; // UNIQUE - 1 config por organización

  // Connection
  connection_type: 'evolution_api' | 'meta_api';
  connection_status: 'connected' | 'disconnected' | 'connecting';

  // Evolution API
  evolution_api_url?: string;
  evolution_instance_name?: string;
  evolution_api_key?: string; // Encrypted

  // Meta API
  meta_business_account_id?: string;
  meta_access_token?: string; // Encrypted
  meta_phone_number_id?: string;

  // ChatWoot
  chatwoot_inbox_id?: string;
  chatwoot_account_id?: string;

  // Bot Agent Configuration
  agent_type: 'vendedor' | 'asistente' | 'secretaria' | 'custom';
  business_name: string;
  business_description?: string;
  products?: string;
  business_hours?: string;
  language: 'es' | 'en' | 'pt';
  tone: 'formal' | 'casual' | 'professional';
  custom_prompt?: string;

  // Flowise
  flowise_url?: string;
  flowise_api_key?: string; // Encrypted

  // Status
  bot_enabled: boolean;

  // Timestamps
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// BOT MESSAGE LOG
// ============================================================================

export interface BotMessageLog {
  id: UUID;
  organization_id: UUID;

  // Message Identification (NO content por privacidad)
  whatsapp_message_id?: string;
  conversation_id?: string;
  inbox_id?: string;
  direction: 'inbound' | 'outbound';

  // Bot Processing
  bot_enabled: boolean;
  bot_processed: boolean;
  bot_responded: boolean;

  // Performance Metrics
  processing_time_ms?: number;
  response_time_ms?: number;

  // AI Info (NO prompts o contenido)
  ai_provider?: string; // 'flowise', 'openai', etc.
  ai_model?: string; // 'grok-1', 'gpt-4', etc.
  agent_type?: string;

  // Status
  status: 'pending' | 'success' | 'failed' | 'skipped';
  error_message?: string;
  error_code?: string;

  // Timestamps
  received_at: Timestamp;
  processed_at?: Timestamp;
  sent_at?: Timestamp;
  created_at: Timestamp;
}

// ============================================================================
// CRM FIELDS
// ============================================================================

export interface CRMField {
  id: UUID;
  organization_id: UUID;

  // Field Definition
  name: string; // Technical name (unique per org)
  label: string; // Display name
  field_type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'select' | 'currency' | 'textarea';

  // Validation
  required: boolean;
  options?: string[]; // JSONB - For select fields
  currency_type?: string; // USD, ARS, EUR, etc.
  default_value?: string;

  // Display
  visible: boolean;
  order: number;

  // Timestamps
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// CRM STATUSES - CON ORDEN AGREGADO
// ============================================================================

export interface CRMStatus {
  id: UUID;
  organization_id: UUID;

  // Status Definition
  name: string; // Technical name (unique per org)
  label: string; // Display name
  color: string; // Color name: green, blue, red, etc.
  icon?: string;

  // Display ⚠️ AGREGADO
  order: number;

  // Timestamps
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// SEGMENTS (FASE 3)
// ============================================================================

export interface Segment {
  id: UUID;
  organization_id: UUID;

  // Basic Info
  name: string;
  description?: string;
  type: 'static' | 'dynamic';

  // Filter Configuration (JSONB)
  filters: {
    field: string;
    operator: string;
    value: any;
    logic?: 'AND' | 'OR';
  }[];

  // Cached Results
  contact_count: number;
  last_calculated_at?: Timestamp;

  // Timestamps
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// A/B TESTS (FASE 4)
// ============================================================================

export interface ABTest {
  id: UUID;
  organization_id: UUID;

  // Basic Info
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'completed' | 'cancelled';

  // Test Configuration (JSONB)
  variants: Array<{
    id: string;
    name: string;
    template_id: string;
    template_name: string;
    percentage: number;
  }>;

  sample_size: number;
  metric_goal: 'open_rate' | 'click_rate' | 'conversion_rate';

  // Results
  winner_variant_id?: string;
  confidence_level?: number; // 0-100

  // Timing
  started_at?: Timestamp;
  ended_at?: Timestamp;

  // Timestamps
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Insert types - Para crear nuevos registros
 * Omite campos autogenerados como id, created_at, updated_at
 */
export type InsertContact = Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'messages_sent' | 'messages_received' | 'lead_score'>;
export type InsertMessage = Omit<Message, 'id' | 'created_at'>;
export type InsertCampaign = Omit<Campaign, 'id' | 'created_at' | 'updated_at' | 'total_contacts' | 'sent_count' | 'delivered_count' | 'read_count' | 'failed_count'>;
export type InsertTag = Omit<Tag, 'id' | 'created_at' | 'updated_at'>;
export type InsertAutomation = Omit<Automation, 'id' | 'created_at' | 'updated_at' | 'total_executions' | 'successful_executions' | 'failed_executions'>;

/**
 * Update types - Para actualizar registros
 * Todos los campos son opcionales excepto el ID
 */
export type UpdateContact = Partial<Omit<Contact, 'id' | 'organization_id' | 'created_at'>>;
export type UpdateMessage = Partial<Omit<Message, 'id' | 'organization_id' | 'contact_id'>>;
export type UpdateCampaign = Partial<Omit<Campaign, 'id' | 'organization_id' | 'created_at'>>;
export type UpdateAutomation = Partial<Omit<Automation, 'id' | 'organization_id' | 'created_at'>>;

// ============================================================================
// RESPONSE TYPES (Para Supabase queries)
// ============================================================================

export interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface SupabaseListResponse<T> {
  data: T[] | null;
  error: Error | null;
  count?: number;
}

// ============================================================================
// QUERY FILTERS
// ============================================================================

export interface ContactFilter {
  status?: string;
  tags?: UUID[];
  search?: string; // Search in name, phone, email
  hasMessages?: boolean;
  leadScoreMin?: number;
  leadScoreMax?: number;
}

export interface MessageFilter {
  direction?: 'inbound' | 'outbound';
  status?: Message['status'];
  campaign_id?: UUID;
  dateFrom?: Timestamp;
  dateTo?: Timestamp;
}

export interface CampaignFilter {
  status?: Campaign['status'];
  dateFrom?: Timestamp;
  dateTo?: Timestamp;
}
