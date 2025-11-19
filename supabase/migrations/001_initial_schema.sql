-- ================================================
-- CHATFLOW PRO - SCHEMA INICIAL
-- Migration: 001_initial_schema
-- Descripción: Creación de todas las tablas principales
-- Fecha: 2025-11-19
-- ================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================
-- 1. ORGANIZATIONS
-- ================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  plan VARCHAR(50) NOT NULL DEFAULT 'starter',
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- AI Configuration
  ai_enabled BOOLEAN NOT NULL DEFAULT false,
  ai_role VARCHAR(50) DEFAULT 'vendedor',
  ai_company_info TEXT,
  ai_products_info TEXT,
  ai_objective TEXT,
  ai_business_hours_only BOOLEAN DEFAULT false,

  -- WhatsApp Configuration
  whatsapp_method VARCHAR(50) DEFAULT 'qr',
  whatsapp_instance_id VARCHAR(255),
  whatsapp_connected BOOLEAN DEFAULT false,
  whatsapp_phone VARCHAR(20),
  meta_access_token TEXT,
  meta_waba_id VARCHAR(255),
  meta_phone_number_id VARCHAR(255),

  -- Follow-ups
  followup_enabled BOOLEAN DEFAULT false,
  followup_config JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================
-- 2. USERS
-- ================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255), -- Nullable: Supabase Auth maneja contraseñas en auth.users
  full_name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);

-- ================================================
-- 3. CONTACTS
-- ================================================
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  company VARCHAR(255),
  position VARCHAR(255),
  status VARCHAR(50) DEFAULT 'lead',
  custom_fields JSONB DEFAULT '{}',
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  last_contact_at TIMESTAMPTZ,
  lead_score INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(organization_id, phone)
);

CREATE INDEX idx_contacts_org ON contacts(organization_id);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_last_contact ON contacts(last_contact_at DESC);
CREATE INDEX idx_contacts_custom_fields ON contacts USING GIN (custom_fields);

-- ================================================
-- 4. TAGS
-- ================================================
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(organization_id, name)
);

CREATE INDEX idx_tags_org ON tags(organization_id);

-- ================================================
-- 5. CONTACT_TAGS (N:M)
-- ================================================
CREATE TABLE contact_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(contact_id, tag_id)
);

CREATE INDEX idx_contact_tags_tag ON contact_tags(tag_id);

-- ================================================
-- 6. CONTACT_LISTS
-- ================================================
CREATE TABLE contact_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  contact_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contact_lists_org ON contact_lists(organization_id);

-- ================================================
-- 7. CONTACT_LIST_MEMBERS (N:M)
-- ================================================
CREATE TABLE contact_list_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES contact_lists(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(list_id, contact_id)
);

CREATE INDEX idx_list_members_contact ON contact_list_members(contact_id);

-- ================================================
-- 8. MESSAGES
-- ================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  direction VARCHAR(20) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  template_name VARCHAR(255),
  template_id VARCHAR(255),
  message_content TEXT,
  whatsapp_message_id VARCHAR(255),
  campaign_id UUID,
  campaign_name VARCHAR(255),
  list_id UUID,
  list_name VARCHAR(255),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_org ON messages(organization_id);
CREATE INDEX idx_messages_contact ON messages(contact_id);
CREATE INDEX idx_messages_campaign ON messages(campaign_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX idx_messages_whatsapp_id ON messages(whatsapp_message_id);

-- ================================================
-- 9. CAMPAIGNS
-- ================================================
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_name VARCHAR(255),
  template_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'draft',
  total_contacts INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaigns_org ON campaigns(organization_id);
CREATE INDEX idx_campaigns_status ON campaigns(organization_id, status);

-- ================================================
-- 10. TEMPLATES
-- ================================================
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  whatsapp_template_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'MARKETING',
  language VARCHAR(10) DEFAULT 'es',
  status VARCHAR(50) DEFAULT 'PENDING',
  components JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_templates_org ON templates(organization_id);
CREATE INDEX idx_templates_status ON templates(organization_id, status);

-- ================================================
-- 11. SCHEDULED_MESSAGES
-- ================================================
CREATE TABLE scheduled_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  template_name VARCHAR(255),
  template_id VARCHAR(255),
  message_content TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  repeat_type VARCHAR(50) DEFAULT 'once',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scheduled_org ON scheduled_messages(organization_id);
CREATE INDEX idx_scheduled_for ON scheduled_messages(scheduled_for);
CREATE INDEX idx_scheduled_status ON scheduled_messages(status);

-- ================================================
-- 12. CALENDAR_EVENTS
-- ================================================
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) DEFAULT 'reminder',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_org ON calendar_events(organization_id);
CREATE INDEX idx_events_start ON calendar_events(start_date);
CREATE INDEX idx_events_contact ON calendar_events(contact_id);

-- ================================================
-- 13. AUTOMATIONS
-- ================================================
CREATE TABLE automations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT false,
  nodes JSONB DEFAULT '[]',
  edges JSONB DEFAULT '[]',
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_automations_org ON automations(organization_id);
CREATE INDEX idx_automations_active ON automations(organization_id, active) WHERE active = true;

-- ================================================
-- 14. AUTOMATION_EXECUTIONS
-- ================================================
CREATE TABLE automation_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  automation_name VARCHAR(255),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  contact_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  current_node_id VARCHAR(255),
  execution_path JSONB DEFAULT '[]',
  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error TEXT,
  results JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_executions_org ON automation_executions(organization_id);
CREATE INDEX idx_executions_automation ON automation_executions(automation_id);
CREATE INDEX idx_executions_contact ON automation_executions(contact_id);
CREATE INDEX idx_executions_status ON automation_executions(status);
CREATE INDEX idx_executions_scheduled ON automation_executions(scheduled_for) WHERE status = 'pending';

-- ================================================
-- 15. BOT_CONFIGS
-- ================================================
CREATE TABLE bot_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  connection_type VARCHAR(50) DEFAULT 'evolution_api',
  connection_status VARCHAR(50) DEFAULT 'disconnected',
  evolution_api_url VARCHAR(255),
  evolution_instance_name VARCHAR(255),
  evolution_api_key TEXT,
  meta_business_account_id VARCHAR(255),
  meta_access_token TEXT,
  meta_phone_number_id VARCHAR(255),
  chatwoot_inbox_id VARCHAR(255),
  chatwoot_account_id VARCHAR(255),
  agent_type VARCHAR(50) DEFAULT 'vendedor',
  business_name VARCHAR(255),
  business_description TEXT,
  products TEXT,
  business_hours VARCHAR(255),
  language VARCHAR(10) DEFAULT 'es',
  tone VARCHAR(50) DEFAULT 'professional',
  custom_prompt TEXT,
  flowise_url VARCHAR(255),
  flowise_api_key TEXT,
  bot_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================
-- 16. BOT_MESSAGE_LOGS
-- ================================================
CREATE TABLE bot_message_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  whatsapp_message_id VARCHAR(255),
  conversation_id VARCHAR(255),
  inbox_id VARCHAR(255),
  direction VARCHAR(20) NOT NULL,
  bot_enabled BOOLEAN DEFAULT false,
  bot_processed BOOLEAN DEFAULT false,
  bot_responded BOOLEAN DEFAULT false,
  processing_time_ms INTEGER,
  response_time_ms INTEGER,
  ai_provider VARCHAR(50),
  ai_model VARCHAR(100),
  agent_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  error_code VARCHAR(100),
  received_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bot_logs_org ON bot_message_logs(organization_id);
CREATE INDEX idx_bot_logs_conversation ON bot_message_logs(conversation_id, received_at DESC);
CREATE INDEX idx_bot_logs_status ON bot_message_logs(status);

-- ================================================
-- 17. CRM_FIELDS
-- ================================================
CREATE TABLE crm_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL DEFAULT 'text',
  required BOOLEAN DEFAULT false,
  options JSONB DEFAULT '[]',
  currency_type VARCHAR(10),
  default_value VARCHAR(255),
  visible BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(organization_id, name)
);

CREATE INDEX idx_crm_fields_org ON crm_fields(organization_id);

-- ================================================
-- 18. CRM_STATUSES
-- ================================================
CREATE TABLE crm_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  color VARCHAR(50) NOT NULL DEFAULT 'gray',
  icon VARCHAR(100),
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(organization_id, name)
);

CREATE INDEX idx_crm_statuses_org ON crm_statuses(organization_id);

-- ================================================
-- 19. SEGMENTS (FASE 3)
-- ================================================
CREATE TABLE segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'dynamic',
  filters JSONB DEFAULT '{}',
  contact_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_segments_org ON segments(organization_id);
CREATE INDEX idx_segments_type ON segments(type);

-- ================================================
-- 20. AB_TESTS (FASE 4)
-- ================================================
CREATE TABLE ab_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  variants JSONB DEFAULT '[]',
  sample_size INTEGER DEFAULT 100,
  metric_goal VARCHAR(50) DEFAULT 'open_rate',
  winner_variant_id VARCHAR(255),
  confidence_level DECIMAL(5,2),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ab_tests_org ON ab_tests(organization_id);
CREATE INDEX idx_ab_tests_status ON ab_tests(organization_id, status);

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
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_lists_updated_at BEFORE UPDATE ON contact_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduled_messages_updated_at BEFORE UPDATE ON scheduled_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_automations_updated_at BEFORE UPDATE ON automations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bot_configs_updated_at BEFORE UPDATE ON bot_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_fields_updated_at BEFORE UPDATE ON crm_fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_statuses_updated_at BEFORE UPDATE ON crm_statuses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_segments_updated_at BEFORE UPDATE ON segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ab_tests_updated_at BEFORE UPDATE ON ab_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
