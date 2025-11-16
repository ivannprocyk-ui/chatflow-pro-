-- ================================================
-- CHATFLOW PRO - ESQUEMA COMPLETO DE BASE DE DATOS
-- Para Supabase PostgreSQL
-- ================================================

-- ================================================
-- 1. AUTENTICACIÓN Y ORGANIZACIONES
-- ================================================

-- Tabla de organizaciones (multi-tenant)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  -- Configuración de Meta API
  meta_phone_number_id VARCHAR(255),
  meta_waba_id VARCHAR(255),
  meta_access_token TEXT,
  -- Branding
  branding_app_name VARCHAR(255) DEFAULT 'ChatFlow Pro',
  branding_logo_url TEXT,
  branding_primary_color VARCHAR(20) DEFAULT '#3b82f6',
  branding_secondary_color VARCHAR(20) DEFAULT '#8b5cf6',
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Tabla de usuarios (extiende auth.users de Supabase)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'operator', 'viewer')),
  avatar_url TEXT,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- ================================================
-- 2. CONTACTOS Y LISTAS
-- ================================================

-- Tabla de contactos
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  -- Información básica
  phone VARCHAR(50) NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  company VARCHAR(255),
  -- CRM fields
  status VARCHAR(50) DEFAULT 'lead' CHECK (status IN ('lead', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  assigned_to UUID REFERENCES users(id),
  tags TEXT[], -- Array de tags
  notes TEXT,
  -- Métricas
  total_messages INTEGER DEFAULT 0,
  total_campaigns INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  -- Custom fields (JSONB para flexibilidad)
  custom_fields JSONB DEFAULT '{}',
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(organization_id, phone)
);

-- Tabla de listas de contactos
CREATE TABLE contact_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(20) DEFAULT '#3b82f6',
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(organization_id, name)
);

-- Tabla relacional: contactos en listas (many-to-many)
CREATE TABLE contact_list_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_list_id UUID REFERENCES contact_lists(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_list_id, contact_id)
);

-- ================================================
-- 3. PLANTILLAS DE WHATSAPP
-- ================================================

CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  -- Meta template info
  meta_template_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  language VARCHAR(10) DEFAULT 'es',
  category VARCHAR(50) CHECK (category IN ('MARKETING', 'UTILITY', 'AUTHENTICATION')),
  status VARCHAR(50) CHECK (status IN ('APPROVED', 'PENDING', 'REJECTED')),
  -- Template content
  header_type VARCHAR(20) CHECK (header_type IN ('TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'NONE')),
  header_text TEXT,
  header_media_url TEXT,
  body_text TEXT NOT NULL,
  footer_text TEXT,
  buttons JSONB, -- Array of button objects
  variables JSONB, -- Variables in template {{1}}, {{2}}
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(organization_id, meta_template_id)
);

-- ================================================
-- 4. CAMPAÑAS Y ENVÍOS
-- ================================================

-- Tabla de campañas
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  -- Información de campaña
  name VARCHAR(255) NOT NULL,
  template_id UUID REFERENCES whatsapp_templates(id),
  template_name VARCHAR(255), -- Guardado para histórico
  -- Destinatarios
  contact_list_id UUID REFERENCES contact_lists(id),
  total_recipients INTEGER DEFAULT 0,
  -- Estado
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'completed', 'failed', 'cancelled')),
  -- Progreso
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  -- Configuración
  delay_between_messages INTEGER DEFAULT 2000, -- milisegundos
  variables_mapping JSONB, -- Mapeo de variables del template
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de logs de envío
CREATE TABLE send_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  -- Destinatario
  contact_id UUID REFERENCES contacts(id),
  phone VARCHAR(50) NOT NULL,
  name VARCHAR(255),
  -- Mensaje
  template_name VARCHAR(255),
  message_content TEXT,
  -- Estado
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  error_message TEXT,
  -- WhatsApp IDs
  whatsapp_message_id VARCHAR(255),
  -- Metadata
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 5. MENSAJES PROGRAMADOS
-- ================================================

CREATE TABLE scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  -- Información de campaña
  campaign_name VARCHAR(255) NOT NULL,
  template_id UUID REFERENCES whatsapp_templates(id),
  template_name VARCHAR(255),
  -- Programación
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  timezone VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires',
  -- Destinatarios
  contact_list_id UUID REFERENCES contact_lists(id),
  recipients JSONB, -- Array de {phone, name, variables}
  total_recipients INTEGER DEFAULT 0,
  -- Estado
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'completed', 'failed', 'cancelled')),
  -- Resultados
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  execution_started_at TIMESTAMPTZ,
  execution_completed_at TIMESTAMPTZ,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 6. BOT IA - CONFIGURACIÓN
-- ================================================

CREATE TABLE bot_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  -- Conexión
  connection_type VARCHAR(50) DEFAULT 'evolution_api' CHECK (connection_type IN ('evolution_api', 'meta_api')),
  connection_status VARCHAR(50) DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'connecting', 'error')),
  -- Evolution API
  evolution_api_url TEXT,
  evolution_api_key TEXT,
  evolution_instance_name VARCHAR(255),
  -- Meta API (reutiliza organization config)
  -- Bot settings
  agent_type VARCHAR(50) DEFAULT 'asistente' CHECK (agent_type IN ('vendedor', 'asistente', 'secretaria', 'custom')),
  business_name VARCHAR(255),
  business_description TEXT,
  custom_prompt TEXT,
  bot_enabled BOOLEAN DEFAULT false,
  -- AI Config
  ai_provider VARCHAR(50) DEFAULT 'openai' CHECK (ai_provider IN ('openai', 'anthropic', 'local')),
  ai_model VARCHAR(100) DEFAULT 'gpt-4',
  ai_api_key TEXT,
  ai_base_url TEXT,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 500,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- ================================================
-- 7. BOT IA - TRACKING Y LOGS
-- ================================================

-- Logs de mensajes procesados por bot
CREATE TABLE bot_message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  bot_config_id UUID REFERENCES bot_configs(id) ON DELETE CASCADE,
  -- Mensaje
  conversation_id VARCHAR(255), -- Para agrupar conversaciones
  direction VARCHAR(20) CHECK (direction IN ('inbound', 'outbound')),
  from_phone VARCHAR(50),
  to_phone VARCHAR(50),
  message_text TEXT,
  media_url TEXT,
  -- Procesamiento por bot
  bot_processed BOOLEAN DEFAULT false,
  bot_responded BOOLEAN DEFAULT false,
  bot_response_text TEXT,
  bot_skipped BOOLEAN DEFAULT false,
  bot_skip_reason VARCHAR(255),
  -- Métricas
  processing_time_ms INTEGER,
  response_time_ms INTEGER,
  ai_tokens_input INTEGER,
  ai_tokens_output INTEGER,
  ai_cost DECIMAL(10,6),
  -- Error handling
  error_occurred BOOLEAN DEFAULT false,
  error_code VARCHAR(100),
  error_message TEXT,
  -- Metadata
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ
);

-- Métricas agregadas de bot (para dashboard)
CREATE TABLE bot_tracking_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  bot_config_id UUID REFERENCES bot_configs(id) ON DELETE CASCADE,
  -- Periodo
  period_type VARCHAR(20) CHECK (period_type IN ('day', 'week', 'month')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  -- Métricas de mensajes
  total_messages INTEGER DEFAULT 0,
  inbound_messages INTEGER DEFAULT 0,
  outbound_messages INTEGER DEFAULT 0,
  bot_processed_count INTEGER DEFAULT 0,
  bot_responded_count INTEGER DEFAULT 0,
  bot_skipped_count INTEGER DEFAULT 0,
  bot_failed_count INTEGER DEFAULT 0,
  -- Tasas
  success_rate DECIMAL(5,2) DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 0,
  -- Performance
  avg_processing_time_ms INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER DEFAULT 0,
  max_processing_time_ms INTEGER DEFAULT 0,
  max_response_time_ms INTEGER DEFAULT 0,
  -- Conversaciones
  total_conversations INTEGER DEFAULT 0,
  active_conversations INTEGER DEFAULT 0,
  -- Errores
  error_count INTEGER DEFAULT 0,
  top_errors JSONB, -- [{code, count}]
  -- Metadata
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, period_type, period_start)
);

-- ================================================
-- 8. CALENDARIO Y EVENTOS
-- ================================================

CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  contact_id UUID REFERENCES contacts(id),
  -- Evento
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'call', 'follow_up', 'deadline', 'other')),
  -- Fecha y hora
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  -- Recordatorios
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_minutes INTEGER DEFAULT 30,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ================================================
-- 9. AUTOMATIZACIONES Y FLUJOS
-- ================================================

-- Tabla de automatizaciones
CREATE TABLE automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  -- Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  -- Trigger
  trigger_type VARCHAR(50) CHECK (trigger_type IN ('new_contact', 'message_received', 'tag_added', 'schedule', 'webhook')),
  trigger_config JSONB,
  -- Estado
  enabled BOOLEAN DEFAULT false,
  -- Estadísticas
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  last_execution_at TIMESTAMPTZ,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Flujos visuales (Flow Builder)
CREATE TABLE automation_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  automation_id UUID REFERENCES automations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  -- Flow data (ReactFlow format)
  name VARCHAR(255) NOT NULL,
  nodes JSONB NOT NULL, -- Array of nodes
  edges JSONB NOT NULL, -- Array of edges
  viewport JSONB, -- {x, y, zoom}
  -- Estado
  enabled BOOLEAN DEFAULT false,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ================================================
-- 10. ADMIN PANEL - GESTIÓN SAAS
-- ================================================

-- Tabla de clientes SaaS (organizaciones como clientes)
CREATE TABLE saas_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  -- Info básica
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  client_company VARCHAR(255),
  -- Plan y facturación
  plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
  status VARCHAR(50) DEFAULT 'trial' CHECK (status IN ('active', 'paused', 'trial', 'cancelled')),
  billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  monthly_price DECIMAL(10,2) DEFAULT 0,
  -- Fechas
  signup_date TIMESTAMPTZ DEFAULT NOW(),
  trial_end_date TIMESTAMPTZ,
  last_payment_date TIMESTAMPTZ,
  next_payment_date TIMESTAMPTZ,
  cancellation_date TIMESTAMPTZ,
  -- Límites del plan
  limit_messages INTEGER DEFAULT 1000,
  limit_tokens INTEGER DEFAULT 100000,
  limit_agents INTEGER DEFAULT 1,
  limit_contacts INTEGER DEFAULT 500,
  -- Notas y gestión
  notes TEXT,
  account_manager VARCHAR(255),
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Tabla de pagos
CREATE TABLE saas_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES saas_clients(id) ON DELETE CASCADE,
  -- Pago
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue', 'cancelled', 'refunded')),
  payment_method VARCHAR(50) CHECK (payment_method IN ('credit_card', 'bank_transfer', 'paypal', 'stripe', 'mercadopago', 'other')),
  payment_type VARCHAR(50) DEFAULT 'subscription' CHECK (payment_type IN ('subscription', 'one_time', 'upgrade', 'additional')),
  -- Referencias
  invoice_number VARCHAR(100) UNIQUE,
  external_payment_id VARCHAR(255), -- ID de Stripe/PayPal/etc
  -- Metadata
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de uso (consumo de recursos)
CREATE TABLE saas_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES saas_clients(id) ON DELETE CASCADE,
  -- Periodo
  period VARCHAR(10) NOT NULL, -- "2024-11"
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  -- Uso de recursos
  messages_sent INTEGER DEFAULT 0,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  active_agents INTEGER DEFAULT 0,
  active_contacts INTEGER DEFAULT 0,
  storage_mb DECIMAL(10,2) DEFAULT 0,
  -- Costos
  api_costs DECIMAL(10,4) DEFAULT 0,
  infrastructure_costs DECIMAL(10,4) DEFAULT 0,
  total_costs DECIMAL(10,4) DEFAULT 0,
  -- Features usadas
  features_used JSONB, -- Array de features
  -- Metadata
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, period)
);

-- Métricas mensuales agregadas (MRR, churn, etc)
CREATE TABLE saas_monthly_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Periodo
  period VARCHAR(10) NOT NULL UNIQUE, -- "2024-11"
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  -- Revenue metrics
  mrr_total DECIMAL(12,2) DEFAULT 0, -- Monthly Recurring Revenue
  mrr_new DECIMAL(12,2) DEFAULT 0,
  mrr_expansion DECIMAL(12,2) DEFAULT 0,
  mrr_contraction DECIMAL(12,2) DEFAULT 0,
  mrr_churn DECIMAL(12,2) DEFAULT 0,
  arr DECIMAL(12,2) DEFAULT 0, -- Annual Recurring Revenue
  -- Customer metrics
  total_clients INTEGER DEFAULT 0,
  active_clients INTEGER DEFAULT 0,
  new_clients INTEGER DEFAULT 0,
  churned_clients INTEGER DEFAULT 0,
  churn_rate DECIMAL(5,2) DEFAULT 0,
  -- Average metrics
  arpu DECIMAL(10,2) DEFAULT 0, -- Average Revenue Per User
  ltv_average DECIMAL(10,2) DEFAULT 0, -- Lifetime Value
  cac DECIMAL(10,2) DEFAULT 0, -- Customer Acquisition Cost
  -- Profit
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_costs DECIMAL(12,2) DEFAULT 0,
  profit_margin DECIMAL(5,2) DEFAULT 0,
  -- Metadata
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alertas personalizadas para clientes
CREATE TABLE saas_client_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  -- Alert config
  name VARCHAR(255) NOT NULL,
  alert_type VARCHAR(100) CHECK (alert_type IN ('payment_due', 'usage_limit', 'token_limit', 'agent_limit', 'low_mrr', 'churn_risk', 'custom')),
  condition JSONB NOT NULL, -- {type, value, field}
  message TEXT,
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  -- Aplicación
  apply_to VARCHAR(20) DEFAULT 'all' CHECK (apply_to IN ('all', 'specific')),
  client_ids UUID[], -- Array de client IDs si apply_to='specific'
  -- Estado
  active BOOLEAN DEFAULT true,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- ÍNDICES PARA PERFORMANCE
-- ================================================

-- Organizations & Users
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);

-- Contacts
CREATE INDEX idx_contacts_organization ON contacts(organization_id);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_tags ON contacts USING GIN(tags);
CREATE INDEX idx_contacts_deleted ON contacts(deleted_at) WHERE deleted_at IS NULL;

-- Contact Lists
CREATE INDEX idx_contact_lists_organization ON contact_lists(organization_id);
CREATE INDEX idx_contact_list_members_list ON contact_list_members(contact_list_id);
CREATE INDEX idx_contact_list_members_contact ON contact_list_members(contact_id);

-- Templates
CREATE INDEX idx_templates_organization ON whatsapp_templates(organization_id);
CREATE INDEX idx_templates_status ON whatsapp_templates(status);

-- Campaigns
CREATE INDEX idx_campaigns_organization ON campaigns(organization_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);

-- Send Logs
CREATE INDEX idx_send_logs_organization ON send_logs(organization_id);
CREATE INDEX idx_send_logs_campaign ON send_logs(campaign_id);
CREATE INDEX idx_send_logs_contact ON send_logs(contact_id);
CREATE INDEX idx_send_logs_phone ON send_logs(phone);
CREATE INDEX idx_send_logs_status ON send_logs(status);
CREATE INDEX idx_send_logs_sent_at ON send_logs(sent_at DESC);

-- Scheduled Messages
CREATE INDEX idx_scheduled_organization ON scheduled_messages(organization_id);
CREATE INDEX idx_scheduled_status ON scheduled_messages(status);
CREATE INDEX idx_scheduled_datetime ON scheduled_messages(scheduled_date, scheduled_time);

-- Bot Configs
CREATE INDEX idx_bot_configs_organization ON bot_configs(organization_id);

-- Bot Message Logs
CREATE INDEX idx_bot_logs_organization ON bot_message_logs(organization_id);
CREATE INDEX idx_bot_logs_config ON bot_message_logs(bot_config_id);
CREATE INDEX idx_bot_logs_conversation ON bot_message_logs(conversation_id);
CREATE INDEX idx_bot_logs_received_at ON bot_message_logs(received_at DESC);

-- Bot Metrics
CREATE INDEX idx_bot_metrics_organization ON bot_tracking_metrics(organization_id);
CREATE INDEX idx_bot_metrics_period ON bot_tracking_metrics(period_type, period_start);

-- Calendar
CREATE INDEX idx_calendar_organization ON calendar_events(organization_id);
CREATE INDEX idx_calendar_contact ON calendar_events(contact_id);
CREATE INDEX idx_calendar_datetime ON calendar_events(start_datetime);

-- Automations
CREATE INDEX idx_automations_organization ON automations(organization_id);
CREATE INDEX idx_automations_enabled ON automations(enabled);
CREATE INDEX idx_automation_flows_automation ON automation_flows(automation_id);

-- SaaS Clients
CREATE INDEX idx_saas_clients_organization ON saas_clients(organization_id);
CREATE INDEX idx_saas_clients_status ON saas_clients(status);
CREATE INDEX idx_saas_clients_plan ON saas_clients(plan);

-- SaaS Payments
CREATE INDEX idx_saas_payments_client ON saas_payments(client_id);
CREATE INDEX idx_saas_payments_status ON saas_payments(status);
CREATE INDEX idx_saas_payments_date ON saas_payments(payment_date DESC);

-- SaaS Usage
CREATE INDEX idx_saas_usage_client ON saas_usage(client_id);
CREATE INDEX idx_saas_usage_period ON saas_usage(period);

-- SaaS Alerts
CREATE INDEX idx_saas_alerts_organization ON saas_client_alerts(organization_id);
CREATE INDEX idx_saas_alerts_active ON saas_client_alerts(active);

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE send_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_tracking_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_monthly_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_client_alerts ENABLE ROW LEVEL SECURITY;

-- Función helper para obtener organization_id del usuario actual
CREATE OR REPLACE FUNCTION auth.user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Políticas RLS: Los usuarios solo ven datos de su organización
CREATE POLICY "Users can view own organization data" ON organizations
  FOR SELECT USING (id = auth.user_organization_id());

CREATE POLICY "Users can view users in own organization" ON users
  FOR SELECT USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can view contacts in own organization" ON contacts
  FOR ALL USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can view contact_lists in own organization" ON contact_lists
  FOR ALL USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can view contact_list_members in own organization" ON contact_list_members
  FOR ALL USING (
    contact_list_id IN (
      SELECT id FROM contact_lists WHERE organization_id = auth.user_organization_id()
    )
  );

CREATE POLICY "Users can view templates in own organization" ON whatsapp_templates
  FOR ALL USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can view campaigns in own organization" ON campaigns
  FOR ALL USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can view send_logs in own organization" ON send_logs
  FOR ALL USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can view scheduled_messages in own organization" ON scheduled_messages
  FOR ALL USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can view bot_configs in own organization" ON bot_configs
  FOR ALL USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can view bot_logs in own organization" ON bot_message_logs
  FOR ALL USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can view bot_metrics in own organization" ON bot_tracking_metrics
  FOR ALL USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can view calendar in own organization" ON calendar_events
  FOR ALL USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can view automations in own organization" ON automations
  FOR ALL USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can view automation_flows in own organization" ON automation_flows
  FOR ALL USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can view saas_clients in own organization" ON saas_clients
  FOR ALL USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can view saas_payments in own organization" ON saas_payments
  FOR ALL USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can view saas_usage in own organization" ON saas_usage
  FOR ALL USING (organization_id = auth.user_organization_id());

-- Métricas mensuales SaaS son globales (solo admin)
CREATE POLICY "Only admins can view monthly metrics" ON saas_monthly_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view saas_alerts in own organization" ON saas_client_alerts
  FOR ALL USING (organization_id = auth.user_organization_id());

-- ================================================
-- TRIGGERS PARA UPDATED_AT
-- ================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_lists_updated_at BEFORE UPDATE ON contact_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_send_logs_updated_at BEFORE UPDATE ON send_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_messages_updated_at BEFORE UPDATE ON scheduled_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bot_configs_updated_at BEFORE UPDATE ON bot_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automations_updated_at BEFORE UPDATE ON automations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_flows_updated_at BEFORE UPDATE ON automation_flows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saas_clients_updated_at BEFORE UPDATE ON saas_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saas_alerts_updated_at BEFORE UPDATE ON saas_client_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- FUNCIONES HELPER
-- ================================================

-- Función para soft delete (marcar deleted_at en lugar de eliminar)
CREATE OR REPLACE FUNCTION soft_delete(table_name TEXT, record_id UUID)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('UPDATE %I SET deleted_at = NOW() WHERE id = $1', table_name)
  USING record_id;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular MRR de un cliente
CREATE OR REPLACE FUNCTION calculate_client_mrr(client_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  mrr DECIMAL;
BEGIN
  SELECT
    CASE
      WHEN billing_cycle = 'annual' THEN monthly_price / 12
      ELSE monthly_price
    END INTO mrr
  FROM saas_clients
  WHERE id = client_id AND status = 'active';

  RETURN COALESCE(mrr, 0);
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- DATOS DEMO (OPCIONAL - PARA TESTING)
-- ================================================

-- Insertar organización demo
INSERT INTO organizations (id, name, email, branding_app_name)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Demo Organization', 'demo@chatflow.com', 'ChatFlow Pro Demo')
ON CONFLICT DO NOTHING;

-- El usuario demo se creará con Supabase Auth
-- Después de crear el usuario en auth.users, ejecutar:
-- INSERT INTO users (id, organization_id, email, full_name, role)
-- VALUES
--   ('<user-id-from-auth>', '00000000-0000-0000-0000-000000000001', 'demo@chatflow.com', 'Demo User', 'admin');

-- Insertar contactos demo
INSERT INTO contacts (organization_id, phone, name, email, status)
VALUES
  ('00000000-0000-0000-0000-000000000001', '+5491123456789', 'Juan Pérez', 'juan@example.com', 'lead'),
  ('00000000-0000-0000-0000-000000000001', '+5491198765432', 'María García', 'maria@example.com', 'qualified'),
  ('00000000-0000-0000-0000-000000000001', '+5491156781234', 'Carlos López', 'carlos@example.com', 'won')
ON CONFLICT DO NOTHING;

-- Insertar lista demo
INSERT INTO contact_lists (id, organization_id, name, description)
VALUES
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Clientes VIP', 'Lista de clientes prioritarios')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE organizations IS 'Organizaciones multi-tenant con configuración de API y branding';
COMMENT ON TABLE contacts IS 'Contactos con CRM fields, tags y custom fields flexibles';
COMMENT ON TABLE bot_message_logs IS 'Logs detallados de cada mensaje procesado por el bot IA';
COMMENT ON TABLE saas_clients IS 'Clientes SaaS con planes, facturación y límites de uso';
COMMENT ON TABLE saas_monthly_metrics IS 'Métricas agregadas mensuales: MRR, churn, ARPU, LTV, CAC';

-- ================================================
-- FIN DEL SCHEMA
-- ================================================
