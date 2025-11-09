-- ============================================
-- CHATFLOW PRO - SCHEMA DE BASE DE DATOS
-- PostgreSQL - Multi-tenant Architecture
-- ============================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLA: organizations (Multi-tenant)
-- ============================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,

    -- Meta WhatsApp API credentials
    meta_access_token TEXT,
    meta_waba_id VARCHAR(100),
    meta_phone_number_id VARCHAR(100),
    meta_api_version VARCHAR(20) DEFAULT 'v21.0',

    -- Plan y límites
    plan VARCHAR(50) DEFAULT 'free', -- free, basic, pro, enterprise
    max_contacts INTEGER DEFAULT 1000,
    max_messages_per_month INTEGER DEFAULT 1000,

    -- Status
    is_active BOOLEAN DEFAULT true,
    trial_ends_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_organizations_slug (slug),
    INDEX idx_organizations_is_active (is_active)
);

-- ============================================
-- TABLA: users (Usuarios del sistema)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Autenticación
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,

    -- Información personal
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),

    -- Rol y permisos
    role VARCHAR(50) DEFAULT 'user', -- admin, manager, user, viewer
    permissions JSONB DEFAULT '[]',

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    email_verification_token TEXT,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP,

    -- Sesión
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(45),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_users_email (email),
    INDEX idx_users_organization_id (organization_id),
    INDEX idx_users_role (role)
);

-- ============================================
-- TABLA: crm_fields (Campos personalizados)
-- ============================================
CREATE TABLE crm_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- text, number, email, phone, date, select
    required BOOLEAN DEFAULT false,
    options JSONB, -- Para campos tipo select
    position INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_crm_fields_organization_id (organization_id),
    UNIQUE(organization_id, name)
);

-- ============================================
-- TABLA: crm_statuses (Estados personalizados)
-- ============================================
CREATE TABLE crm_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    color VARCHAR(20) DEFAULT 'blue',
    position INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_crm_statuses_organization_id (organization_id),
    UNIQUE(organization_id, name)
);

-- ============================================
-- TABLA: contacts (Contactos CRM)
-- ============================================
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Datos básicos
    phone VARCHAR(20) NOT NULL,
    status VARCHAR(100),

    -- Campos personalizados (JSON flexible)
    custom_fields JSONB DEFAULT '{}',

    -- Métricas
    messages_sent INTEGER DEFAULT 0,
    messages_received INTEGER DEFAULT 0,
    last_contact_at TIMESTAMP,

    -- Tags
    tags TEXT[] DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_contacts_organization_id (organization_id),
    INDEX idx_contacts_phone (phone),
    INDEX idx_contacts_status (status),
    INDEX idx_contacts_created_by (created_by),
    INDEX idx_contacts_last_contact_at (last_contact_at),
    UNIQUE(organization_id, phone)
);

-- ============================================
-- TABLA: contact_lists (Listas de contactos)
-- ============================================
CREATE TABLE contact_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,

    name VARCHAR(255) NOT NULL,
    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_contact_lists_organization_id (organization_id),
    INDEX idx_contact_lists_created_by (created_by)
);

-- ============================================
-- TABLA: contact_list_members (Relación N:M)
-- ============================================
CREATE TABLE contact_list_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID NOT NULL REFERENCES contact_lists(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_contact_list_members_list_id (list_id),
    INDEX idx_contact_list_members_contact_id (contact_id),
    UNIQUE(list_id, contact_id)
);

-- ============================================
-- TABLA: message_templates (Plantillas)
-- ============================================
CREATE TABLE message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Meta template info
    meta_template_id VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    language VARCHAR(10) DEFAULT 'es',
    category VARCHAR(50),
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED

    -- Template content
    components JSONB,

    -- Métricas
    times_used INTEGER DEFAULT 0,

    -- Sync
    last_synced_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_message_templates_organization_id (organization_id),
    INDEX idx_message_templates_status (status),
    INDEX idx_message_templates_meta_template_id (meta_template_id)
);

-- ============================================
-- TABLA: messages (Historial de mensajes)
-- ============================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
    sent_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Meta message info
    meta_message_id VARCHAR(100),

    -- Message data
    direction VARCHAR(20) DEFAULT 'outbound', -- outbound, inbound
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, read, failed

    -- Content
    template_name VARCHAR(255),
    message_content TEXT,

    -- Metadata
    campaign_name VARCHAR(255),
    metadata JSONB,

    -- Error info
    error_message TEXT,

    -- Timestamps
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    failed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_messages_organization_id (organization_id),
    INDEX idx_messages_contact_id (contact_id),
    INDEX idx_messages_template_id (template_id),
    INDEX idx_messages_sent_by (sent_by),
    INDEX idx_messages_status (status),
    INDEX idx_messages_sent_at (sent_at),
    INDEX idx_messages_meta_message_id (meta_message_id)
);

-- ============================================
-- TABLA: campaigns (Campañas de envío)
-- ============================================
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,

    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,

    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, running, completed, failed

    -- Targeting
    target_list_id UUID REFERENCES contact_lists(id) ON DELETE SET NULL,
    target_filter JSONB, -- Filtros avanzados

    -- Scheduling
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Métricas
    total_recipients INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    messages_delivered INTEGER DEFAULT 0,
    messages_read INTEGER DEFAULT 0,
    messages_failed INTEGER DEFAULT 0,

    -- Config
    delay_between_messages INTEGER DEFAULT 5, -- segundos

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_campaigns_organization_id (organization_id),
    INDEX idx_campaigns_created_by (created_by),
    INDEX idx_campaigns_status (status),
    INDEX idx_campaigns_scheduled_at (scheduled_at)
);

-- ============================================
-- TABLA: calendar_events (Eventos)
-- ============================================
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,

    title VARCHAR(255) NOT NULL,
    description TEXT,

    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    all_day BOOLEAN DEFAULT false,

    event_type VARCHAR(50) DEFAULT 'general', -- general, call, meeting, follow_up
    color VARCHAR(20) DEFAULT 'blue',

    -- Relacionado con
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

    -- Recordatorios
    reminder_minutes INTEGER, -- 15, 30, 60, etc.
    reminder_sent BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_calendar_events_organization_id (organization_id),
    INDEX idx_calendar_events_created_by (created_by),
    INDEX idx_calendar_events_start_time (start_time),
    INDEX idx_calendar_events_contact_id (contact_id)
);

-- ============================================
-- TABLA: activity_logs (Logs de actividad)
-- ============================================
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    action VARCHAR(100) NOT NULL, -- login, create_contact, send_message, etc.
    entity_type VARCHAR(100), -- contact, message, campaign, etc.
    entity_id UUID,

    -- Detalles
    description TEXT,
    metadata JSONB,

    -- IP y user agent
    ip_address VARCHAR(45),
    user_agent TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_activity_logs_organization_id (organization_id),
    INDEX idx_activity_logs_user_id (user_id),
    INDEX idx_activity_logs_action (action),
    INDEX idx_activity_logs_created_at (created_at)
);

-- ============================================
-- TABLA: api_usage (Tracking de uso de API)
-- ============================================
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,

    -- Métricas
    response_time_ms INTEGER,
    status_code INTEGER,

    -- Contadores mensuales
    messages_sent_this_month INTEGER DEFAULT 0,
    api_calls_this_month INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_api_usage_organization_id (organization_id),
    INDEX idx_api_usage_created_at (created_at)
);

-- ============================================
-- TRIGGERS para updated_at automático
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_lists_updated_at BEFORE UPDATE ON contact_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON message_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DATOS DE EJEMPLO (Seed)
-- ============================================

-- Organización de ejemplo
INSERT INTO organizations (id, name, slug, plan)
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Organization', 'demo-org', 'pro');

-- Usuario admin de ejemplo (password: admin123)
INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, role, is_email_verified)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'admin@demo.com',
    '$2b$10$rKQb8YxkzZxVxH/YiVLTYeYd.xJYYd7lBx5EwZv5uQbZvCl0qN0Gu', -- admin123
    'Admin',
    'User',
    'admin',
    true
);

-- Estados CRM por defecto
INSERT INTO crm_statuses (organization_id, name, label, color, position)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'lead', 'Lead', 'blue', 1),
    ('00000000-0000-0000-0000-000000000001', 'contacted', 'Contactado', 'yellow', 2),
    ('00000000-0000-0000-0000-000000000001', 'qualified', 'Calificado', 'purple', 3),
    ('00000000-0000-0000-0000-000000000001', 'customer', 'Cliente', 'green', 4),
    ('00000000-0000-0000-0000-000000000001', 'inactive', 'Inactivo', 'gray', 5);

-- Campos CRM por defecto
INSERT INTO crm_fields (organization_id, name, label, type, required, position)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'name', 'Nombre', 'text', true, 1),
    ('00000000-0000-0000-0000-000000000001', 'email', 'Email', 'email', false, 2),
    ('00000000-0000-0000-0000-000000000001', 'company', 'Empresa', 'text', false, 3),
    ('00000000-0000-0000-0000-000000000001', 'notes', 'Notas', 'text', false, 4);
