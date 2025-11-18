-- ============================================
-- CHATFLOW PRO - DATABASE INITIALIZATION
-- ============================================
-- This script creates all tables, indexes, triggers, and initial data
-- for ChatFlow Pro multi-tenant architecture

-- ============================================
-- 1. ENABLE EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. CREATE UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. CREATE TABLES
-- ============================================

-- 3.1 Table: organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'business', 'enterprise')),
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- AI Configuration
    ai_enabled BOOLEAN NOT NULL DEFAULT false,
    ai_role VARCHAR(50) DEFAULT 'vendedor' CHECK (ai_role IN ('vendedor', 'asistente', 'soporte', 'agendador')),
    ai_company_info TEXT,
    ai_products_info TEXT,
    ai_objective TEXT,
    ai_business_hours_only BOOLEAN DEFAULT true,

    -- WhatsApp Configuration
    whatsapp_method VARCHAR(50) DEFAULT 'qr' CHECK (whatsapp_method IN ('qr', 'meta_api')),
    whatsapp_instance_id VARCHAR(255),
    whatsapp_connected BOOLEAN DEFAULT false,
    whatsapp_phone VARCHAR(50),

    -- Meta API (optional)
    meta_access_token TEXT,
    meta_waba_id VARCHAR(255),

    -- Follow-ups
    followup_enabled BOOLEAN DEFAULT false,
    followup_config JSONB,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_is_active ON public.organizations(is_active);

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.2 Table: users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Metadata
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_organization_id ON public.users(organization_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_is_active ON public.users(is_active);

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.3 Table: contacts
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    phone VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'lead' CHECK (status IN ('lead', 'contacted', 'customer', 'churned')),

    -- Custom fields (flexible JSON storage)
    custom_fields JSONB DEFAULT '{}',

    -- Metrics
    messages_received INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    last_contact_at TIMESTAMP WITH TIME ZONE,
    lead_score INTEGER DEFAULT 0,
    followup_count INTEGER DEFAULT 0,
    last_followup_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraint: phone único por organización
    CONSTRAINT unique_phone_per_org UNIQUE (organization_id, phone)
);

CREATE INDEX idx_contacts_organization_id ON public.contacts(organization_id);
CREATE INDEX idx_contacts_phone ON public.contacts(phone);
CREATE INDEX idx_contacts_status ON public.contacts(status);
CREATE INDEX idx_contacts_last_contact_at ON public.contacts(last_contact_at);
CREATE INDEX idx_contacts_custom_fields ON public.contacts USING GIN (custom_fields);

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.4 Table: messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,

    -- Message details
    direction VARCHAR(50) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    message_content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),

    -- Auto-reply & Templates
    is_auto_reply BOOLEAN DEFAULT false,
    template_name VARCHAR(255),
    campaign_name VARCHAR(255),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- WhatsApp IDs
    whatsapp_message_id VARCHAR(255),
    error_message TEXT,

    -- Timestamps
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_organization_id ON public.messages(organization_id);
CREATE INDEX idx_messages_contact_id ON public.messages(contact_id);
CREATE INDEX idx_messages_direction ON public.messages(direction);
CREATE INDEX idx_messages_status ON public.messages(status);
CREATE INDEX idx_messages_sent_at ON public.messages(sent_at DESC);
CREATE INDEX idx_messages_whatsapp_message_id ON public.messages(whatsapp_message_id);

-- 3.5 Table: bot_configs
CREATE TABLE IF NOT EXISTS public.bot_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- WhatsApp Connection
    connection_type VARCHAR(50) DEFAULT 'evolution_api' CHECK (connection_type IN ('evolution_api', 'meta_api')),
    connection_status VARCHAR(50) DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'connecting')),

    -- Evolution API Configuration
    evolution_api_url VARCHAR(500),
    evolution_instance_name VARCHAR(255),
    evolution_api_key TEXT,

    -- Meta API Configuration
    meta_business_account_id VARCHAR(255),
    meta_access_token TEXT,
    meta_phone_number_id VARCHAR(255),

    -- ChatWoot Configuration
    chatwoot_inbox_id VARCHAR(255),
    chatwoot_account_id VARCHAR(255),

    -- Bot Agent Configuration
    agent_type VARCHAR(50) DEFAULT 'vendedor' CHECK (agent_type IN ('vendedor', 'asistente', 'secretaria', 'custom')),
    business_name VARCHAR(255) NOT NULL,
    business_description TEXT,
    products TEXT,
    business_hours VARCHAR(255),
    language VARCHAR(10) DEFAULT 'es' CHECK (language IN ('es', 'en', 'pt')),
    tone VARCHAR(50) DEFAULT 'professional' CHECK (tone IN ('formal', 'casual', 'professional')),
    custom_prompt TEXT,

    -- Flowise Configuration (optional override per org)
    flowise_url VARCHAR(500),
    flowise_api_key TEXT,

    -- Bot Status
    bot_enabled BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraint: una configuración por organización
    CONSTRAINT unique_bot_config_per_org UNIQUE (organization_id)
);

CREATE INDEX idx_bot_configs_organization_id ON public.bot_configs(organization_id);
CREATE INDEX idx_bot_configs_bot_enabled ON public.bot_configs(bot_enabled);

CREATE TRIGGER update_bot_configs_updated_at BEFORE UPDATE ON public.bot_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.6 Table: bot_message_logs
CREATE TABLE IF NOT EXISTS public.bot_message_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Message metadata (NO content for privacy)
    message_id VARCHAR(255),
    conversation_id VARCHAR(255),
    inbox_id VARCHAR(255),
    direction VARCHAR(50) NOT NULL CHECK (direction IN ('inbound', 'outbound')),

    -- Bot processing data
    bot_enabled BOOLEAN DEFAULT false,
    bot_processed BOOLEAN DEFAULT false,
    bot_responded BOOLEAN DEFAULT false,

    -- Performance metrics
    processing_time_ms INTEGER,
    response_time_ms INTEGER,

    -- AI data (NO prompts or actual content)
    ai_provider VARCHAR(100),
    ai_model VARCHAR(100),
    agent_type VARCHAR(50),

    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'skipped')),
    error_message TEXT,
    error_code VARCHAR(100),

    -- Timestamps
    received_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bot_message_logs_organization_id ON public.bot_message_logs(organization_id);
CREATE INDEX idx_bot_message_logs_status ON public.bot_message_logs(status);
CREATE INDEX idx_bot_message_logs_received_at ON public.bot_message_logs(received_at DESC);
CREATE INDEX idx_bot_message_logs_conversation_id ON public.bot_message_logs(conversation_id);

-- 3.7 Table: follow_up_sequences
CREATE TABLE IF NOT EXISTS public.follow_up_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Identificación
    name VARCHAR(255) NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT true,

    -- Configuración de activación (TRIGGERS)
    trigger_type VARCHAR(100) NOT NULL CHECK (trigger_type IN (
        'time_based', 'keyword', 'conversation_state', 'bot_stage', 'variable', 'action',
        'no_response', 'abandoned_cart', 'quote_sent', 'meeting_scheduled', 'form_incomplete', 'custom'
    )),
    trigger_config JSONB DEFAULT '{}',

    -- Estrategia
    strategy VARCHAR(50) DEFAULT 'moderate' CHECK (strategy IN ('passive', 'moderate', 'aggressive')),

    -- Condiciones adicionales
    conditions JSONB DEFAULT '{}',

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Estadísticas
    total_executions INTEGER DEFAULT 0,
    successful_conversions INTEGER DEFAULT 0
);

CREATE INDEX idx_follow_up_sequences_organization_id ON public.follow_up_sequences(organization_id);
CREATE INDEX idx_follow_up_sequences_enabled ON public.follow_up_sequences(enabled);
CREATE INDEX idx_follow_up_sequences_trigger_type ON public.follow_up_sequences(trigger_type);

CREATE TRIGGER update_follow_up_sequences_updated_at BEFORE UPDATE ON public.follow_up_sequences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.8 Table: follow_up_messages
CREATE TABLE IF NOT EXISTS public.follow_up_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sequence_id UUID NOT NULL REFERENCES public.follow_up_sequences(id) ON DELETE CASCADE,

    -- Orden en la secuencia
    step_order INTEGER NOT NULL,

    -- Configuración de timing
    delay_amount INTEGER NOT NULL,
    delay_unit VARCHAR(50) NOT NULL CHECK (delay_unit IN ('minutes', 'hours', 'days')),

    -- Contenido del mensaje
    message_template TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'fixed' CHECK (message_type IN ('fixed', 'ai_generated')),
    ai_context_instructions TEXT,
    image_url TEXT,

    -- Variables disponibles
    available_variables JSONB DEFAULT '[]',

    -- Condiciones para enviar este mensaje (opcional)
    send_conditions JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraint: step_order único por secuencia
    CONSTRAINT unique_step_order_per_sequence UNIQUE (sequence_id, step_order)
);

CREATE INDEX idx_follow_up_messages_sequence_id ON public.follow_up_messages(sequence_id);
CREATE INDEX idx_follow_up_messages_step_order ON public.follow_up_messages(step_order);

CREATE TRIGGER update_follow_up_messages_updated_at BEFORE UPDATE ON public.follow_up_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.9 Table: follow_up_executions
CREATE TABLE IF NOT EXISTS public.follow_up_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sequence_id UUID NOT NULL REFERENCES public.follow_up_sequences(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Contacto objetivo
    contact_phone VARCHAR(50) NOT NULL,
    contact_name VARCHAR(255),

    -- Estado de la ejecución
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned', 'cancelled')),

    -- Progreso
    current_step INTEGER DEFAULT 0,
    next_scheduled_at TIMESTAMP WITH TIME ZONE,

    -- Contexto capturado (variables del bot)
    conversation_context JSONB DEFAULT '{}',
    trigger_data JSONB DEFAULT '{}',

    -- Metadata
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_message_sent_at TIMESTAMP WITH TIME ZONE,

    -- Resultado
    converted BOOLEAN DEFAULT false,
    total_messages_sent INTEGER DEFAULT 0
);

CREATE INDEX idx_follow_up_executions_sequence_id ON public.follow_up_executions(sequence_id);
CREATE INDEX idx_follow_up_executions_organization_id ON public.follow_up_executions(organization_id);
CREATE INDEX idx_follow_up_executions_contact_phone ON public.follow_up_executions(contact_phone);
CREATE INDEX idx_follow_up_executions_status ON public.follow_up_executions(status);
CREATE INDEX idx_follow_up_executions_next_scheduled_at ON public.follow_up_executions(next_scheduled_at);

-- 3.10 Table: follow_up_message_logs
CREATE TABLE IF NOT EXISTS public.follow_up_message_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES public.follow_up_executions(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES public.follow_up_messages(id) ON DELETE CASCADE,

    -- Detalles del envío
    step_number INTEGER NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Contenido enviado (con variables reemplazadas)
    message_sent TEXT NOT NULL,

    -- Estado del mensaje
    delivery_status VARCHAR(50) DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'read', 'failed')),

    -- Respuesta del contacto
    contact_responded BOOLEAN DEFAULT false,
    response_received_at TIMESTAMP WITH TIME ZONE,
    response_text TEXT,

    -- Metadata de WhatsApp
    whatsapp_message_id VARCHAR(255),
    error_message TEXT
);

CREATE INDEX idx_follow_up_message_logs_execution_id ON public.follow_up_message_logs(execution_id);
CREATE INDEX idx_follow_up_message_logs_message_id ON public.follow_up_message_logs(message_id);
CREATE INDEX idx_follow_up_message_logs_sent_at ON public.follow_up_message_logs(sent_at DESC);
CREATE INDEX idx_follow_up_message_logs_delivery_status ON public.follow_up_message_logs(delivery_status);

-- ============================================
-- 4. CREATE COMPOSITE INDEXES FOR PERFORMANCE
-- ============================================

-- For message searches by organization and date
CREATE INDEX idx_messages_org_sent_at ON public.messages(organization_id, sent_at DESC);

-- For active contact searches by organization
CREATE INDEX idx_contacts_org_last_contact ON public.contacts(organization_id, last_contact_at DESC);

-- For pending follow-up executions
CREATE INDEX idx_executions_status_next_scheduled
ON public.follow_up_executions(status, next_scheduled_at)
WHERE status = 'active';

-- For bot logs by period
CREATE INDEX idx_bot_logs_org_received
ON public.bot_message_logs(organization_id, received_at DESC);

-- ============================================
-- 5. CREATE TRIGGERS FOR METRICS
-- ============================================

-- Trigger: Update sequence statistics
CREATE OR REPLACE FUNCTION update_sequence_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE public.follow_up_sequences
        SET
            total_executions = total_executions + 1,
            successful_conversions = CASE
                WHEN NEW.converted THEN successful_conversions + 1
                ELSE successful_conversions
            END
        WHERE id = NEW.sequence_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sequence_stats
AFTER UPDATE ON public.follow_up_executions
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_sequence_stats();

-- Trigger: Update contact metrics
CREATE OR REPLACE FUNCTION update_contact_metrics()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.contacts
    SET
        messages_received = CASE WHEN NEW.direction = 'inbound' THEN messages_received + 1 ELSE messages_received END,
        messages_sent = CASE WHEN NEW.direction = 'outbound' THEN messages_sent + 1 ELSE messages_sent END,
        last_contact_at = NEW.sent_at
    WHERE id = NEW.contact_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_metrics
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION update_contact_metrics();

-- ============================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_message_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. CREATE RLS POLICIES (Service role bypass)
-- ============================================

-- Allow service role to bypass RLS
-- Note: Application should set app.current_organization_id for user queries

-- ============================================
-- INITIALIZATION COMPLETE
-- ============================================
-- Now ready to insert initial organization and user
