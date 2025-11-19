-- ================================================
-- CHATFLOW PRO - SEED DATA
-- Migration: 003_seed_data
-- Descripción: Datos iniciales para testing y demo
-- Fecha: 2025-11-19
-- ================================================

-- ================================================
-- ORGANIZACIÓN DEMO
-- ================================================

-- Insertar organización demo
INSERT INTO organizations (id, name, slug, plan, is_active, ai_enabled, whatsapp_connected)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo Organization',
  'demo-org',
  'pro',
  true,
  true,
  false
) ON CONFLICT (slug) DO NOTHING;

-- ================================================
-- USUARIO DEMO
-- ================================================

-- Insertar usuario admin demo (password: demo123)
-- Nota: Este es un hash bcrypt de "demo123"
INSERT INTO users (
  id,
  organization_id,
  email,
  password_hash,
  full_name,
  role,
  is_active
) VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'demo@chatflow.pro',
  '$2b$10$YourHashedPasswordHere',  -- Reemplazar con hash real
  'Usuario Demo',
  'admin',
  true
) ON CONFLICT (email) DO NOTHING;

-- ================================================
-- TAGS PREDEFINIDOS
-- ================================================

INSERT INTO tags (organization_id, name, color) VALUES
  ('00000000-0000-0000-0000-000000000001', 'VIP', '#8B5CF6'),
  ('00000000-0000-0000-0000-000000000001', 'Cliente Nuevo', '#10B981'),
  ('00000000-0000-0000-0000-000000000001', 'Seguimiento Urgente', '#EF4444'),
  ('00000000-0000-0000-0000-000000000001', 'Inactivo', '#6B7280'),
  ('00000000-0000-0000-0000-000000000001', 'Prospecto Caliente', '#F59E0B'),
  ('00000000-0000-0000-0000-000000000001', 'Interesado', '#3B82F6'),
  ('00000000-0000-0000-0000-000000000001', 'No Interesado', '#EF4444')
ON CONFLICT (organization_id, name) DO NOTHING;

-- ================================================
-- CRM FIELDS POR DEFECTO
-- ================================================

INSERT INTO crm_fields (organization_id, name, label, field_type, required, visible, "order") VALUES
  ('00000000-0000-0000-0000-000000000001', 'name', 'Nombre', 'text', true, true, 1),
  ('00000000-0000-0000-0000-000000000001', 'phone', 'Teléfono', 'phone', true, true, 2),
  ('00000000-0000-0000-0000-000000000001', 'email', 'Email', 'email', false, true, 3),
  ('00000000-0000-0000-0000-000000000001', 'company', 'Empresa', 'text', false, true, 4),
  ('00000000-0000-0000-0000-000000000001', 'position', 'Cargo', 'text', false, true, 5),
  ('00000000-0000-0000-0000-000000000001', 'cost', 'Costo/Valor', 'currency', false, true, 6),
  ('00000000-0000-0000-0000-000000000001', 'notes', 'Notas', 'textarea', false, true, 7)
ON CONFLICT (organization_id, name) DO NOTHING;

-- ================================================
-- CRM STATUSES POR DEFECTO
-- ================================================

INSERT INTO crm_statuses (organization_id, name, label, color, "order") VALUES
  ('00000000-0000-0000-0000-000000000001', 'lead', 'Lead', 'blue', 1),
  ('00000000-0000-0000-0000-000000000001', 'contacted', 'Contactado', 'yellow', 2),
  ('00000000-0000-0000-0000-000000000001', 'qualified', 'Calificado', 'purple', 3),
  ('00000000-0000-0000-0000-000000000001', 'proposal', 'Propuesta', 'orange', 4),
  ('00000000-0000-0000-0000-000000000001', 'negotiation', 'Negociación', 'pink', 5),
  ('00000000-0000-0000-0000-000000000001', 'won', 'Ganado', 'green', 6),
  ('00000000-0000-0000-0000-000000000001', 'lost', 'Perdido', 'red', 7),
  ('00000000-0000-0000-0000-000000000001', 'customer', 'Cliente', 'purple', 8),
  ('00000000-0000-0000-0000-000000000001', 'active', 'Activo', 'green', 9),
  ('00000000-0000-0000-0000-000000000001', 'inactive', 'Inactivo', 'yellow', 10),
  ('00000000-0000-0000-0000-000000000001', 'blocked', 'Bloqueado', 'red', 11)
ON CONFLICT (organization_id, name) DO NOTHING;

-- ================================================
-- CONTACTOS DEMO (OPCIONAL)
-- ================================================

-- Insertar algunos contactos de ejemplo
INSERT INTO contacts (
  organization_id,
  phone,
  name,
  email,
  status,
  lead_score,
  custom_fields
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '5491123456789',
    'Juan Pérez',
    'juan.perez@example.com',
    'lead',
    75,
    '{"company": "Acme Corp", "position": "CEO"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    '5491187654321',
    'María García',
    'maria.garcia@example.com',
    'customer',
    90,
    '{"company": "Tech Solutions", "position": "CTO"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    '5491155555555',
    'Carlos Rodríguez',
    'carlos.rodriguez@example.com',
    'contacted',
    60,
    '{"company": "Startup Inc", "position": "Founder"}'::jsonb
  )
ON CONFLICT (organization_id, phone) DO NOTHING;

-- ================================================
-- LISTAS DE CONTACTOS DEMO
-- ================================================

INSERT INTO contact_lists (
  organization_id,
  name,
  description,
  contact_count
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Clientes VIP',
    'Lista de clientes premium con alto valor',
    0
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Prospectos Calientes',
    'Leads con alta probabilidad de conversión',
    0
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Campaña Black Friday 2024',
    'Contactos para campaña de Black Friday',
    0
  );

-- ================================================
-- BOT CONFIG INICIAL
-- ================================================

INSERT INTO bot_configs (
  organization_id,
  connection_type,
  connection_status,
  agent_type,
  business_name,
  language,
  tone,
  bot_enabled
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'evolution_api',
  'disconnected',
  'vendedor',
  'Demo Business',
  'es',
  'professional',
  false
) ON CONFLICT (organization_id) DO NOTHING;

-- ================================================
-- FUNCIONES HELPER PARA ESTADÍSTICAS
-- ================================================

-- Función para calcular estadísticas de contactos
CREATE OR REPLACE FUNCTION calculate_contact_stats(org_id UUID)
RETURNS TABLE (
  total_contacts BIGINT,
  active_contacts BIGINT,
  leads BIGINT,
  customers BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_contacts,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT as active_contacts,
    COUNT(*) FILTER (WHERE status = 'lead')::BIGINT as leads,
    COUNT(*) FILTER (WHERE status = 'customer')::BIGINT as customers
  FROM contacts
  WHERE organization_id = org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para calcular estadísticas de mensajes
CREATE OR REPLACE FUNCTION calculate_message_stats(org_id UUID, days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_sent BIGINT,
  total_delivered BIGINT,
  total_read BIGINT,
  total_failed BIGINT,
  delivery_rate NUMERIC,
  read_rate NUMERIC
) AS $$
DECLARE
  total BIGINT;
BEGIN
  SELECT COUNT(*) INTO total
  FROM messages
  WHERE organization_id = org_id
    AND sent_at >= NOW() - INTERVAL '1 day' * days;

  RETURN QUERY
  SELECT
    total as total_sent,
    COUNT(*) FILTER (WHERE status = 'delivered')::BIGINT as total_delivered,
    COUNT(*) FILTER (WHERE status = 'read')::BIGINT as total_read,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as total_failed,
    CASE WHEN total > 0
      THEN ROUND((COUNT(*) FILTER (WHERE status IN ('delivered', 'read'))::NUMERIC / total * 100), 2)
      ELSE 0
    END as delivery_rate,
    CASE WHEN total > 0
      THEN ROUND((COUNT(*) FILTER (WHERE status = 'read')::NUMERIC / total * 100), 2)
      ELSE 0
    END as read_rate
  FROM messages
  WHERE organization_id = org_id
    AND sent_at >= NOW() - INTERVAL '1 day' * days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- VISTA PARA DASHBOARD ANALYTICS
-- ================================================

CREATE OR REPLACE VIEW dashboard_analytics AS
SELECT
  o.id as organization_id,
  o.name as organization_name,
  o.plan,
  COUNT(DISTINCT c.id) as total_contacts,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'lead') as total_leads,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'customer') as total_customers,
  COUNT(DISTINCT m.id) as total_messages,
  COUNT(DISTINCT m.id) FILTER (WHERE m.sent_at >= NOW() - INTERVAL '7 days') as messages_last_7_days,
  COUNT(DISTINCT m.id) FILTER (WHERE m.sent_at >= NOW() - INTERVAL '30 days') as messages_last_30_days,
  COUNT(DISTINCT camp.id) as total_campaigns,
  COUNT(DISTINCT camp.id) FILTER (WHERE camp.status = 'running') as active_campaigns,
  COUNT(DISTINCT a.id) as total_automations,
  COUNT(DISTINCT a.id) FILTER (WHERE a.active = true) as active_automations
FROM organizations o
LEFT JOIN contacts c ON c.organization_id = o.id
LEFT JOIN messages m ON m.organization_id = o.id
LEFT JOIN campaigns camp ON camp.organization_id = o.id
LEFT JOIN automations a ON a.organization_id = o.id
GROUP BY o.id, o.name, o.plan;

-- ================================================
-- TRIGGERS ADICIONALES
-- ================================================

-- Trigger para actualizar contact_count en contact_lists
CREATE OR REPLACE FUNCTION update_contact_list_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE contact_lists
    SET contact_count = contact_count + 1,
        updated_at = NOW()
    WHERE id = NEW.list_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE contact_lists
    SET contact_count = GREATEST(contact_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.list_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_list_count_on_member_change
AFTER INSERT OR DELETE ON contact_list_members
FOR EACH ROW EXECUTE FUNCTION update_contact_list_count();

-- Trigger para actualizar estadísticas de campaigns
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE campaigns
    SET
      sent_count = (
        SELECT COUNT(*) FROM messages
        WHERE campaign_id = NEW.campaign_id
      ),
      delivered_count = (
        SELECT COUNT(*) FROM messages
        WHERE campaign_id = NEW.campaign_id AND status = 'delivered'
      ),
      read_count = (
        SELECT COUNT(*) FROM messages
        WHERE campaign_id = NEW.campaign_id AND status = 'read'
      ),
      failed_count = (
        SELECT COUNT(*) FROM messages
        WHERE campaign_id = NEW.campaign_id AND status = 'failed'
      ),
      updated_at = NOW()
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_stats_on_message
AFTER INSERT OR UPDATE ON messages
FOR EACH ROW
WHEN (NEW.campaign_id IS NOT NULL)
EXECUTE FUNCTION update_campaign_stats();

-- Trigger para actualizar messages_sent en contacts
CREATE OR REPLACE FUNCTION update_contact_message_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.direction = 'outbound' THEN
      UPDATE contacts
      SET
        messages_sent = messages_sent + 1,
        last_contact_at = NEW.sent_at,
        updated_at = NOW()
      WHERE id = NEW.contact_id;
    ELSE
      UPDATE contacts
      SET
        messages_received = messages_received + 1,
        last_contact_at = NEW.sent_at,
        updated_at = NOW()
      WHERE id = NEW.contact_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_stats_on_message
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_contact_message_count();

-- Trigger para actualizar estadísticas de automations
CREATE OR REPLACE FUNCTION update_automation_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE automations
    SET
      total_executions = (
        SELECT COUNT(*) FROM automation_executions
        WHERE automation_id = NEW.automation_id
      ),
      successful_executions = (
        SELECT COUNT(*) FROM automation_executions
        WHERE automation_id = NEW.automation_id AND status = 'completed'
      ),
      failed_executions = (
        SELECT COUNT(*) FROM automation_executions
        WHERE automation_id = NEW.automation_id AND status = 'failed'
      ),
      last_executed_at = GREATEST(
        last_executed_at,
        COALESCE(NEW.started_at, NOW())
      ),
      updated_at = NOW()
    WHERE id = NEW.automation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_automation_stats_on_execution
AFTER INSERT OR UPDATE ON automation_executions
FOR EACH ROW EXECUTE FUNCTION update_automation_stats();

-- ================================================
-- ÍNDICES ADICIONALES PARA PERFORMANCE
-- ================================================

-- Índice para búsqueda de contactos por nombre
CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm ON contacts USING gin (name gin_trgm_ops);

-- Índice para búsqueda de contactos por email
CREATE INDEX IF NOT EXISTS idx_contacts_email_trgm ON contacts USING gin (email gin_trgm_ops);

-- Extensión para búsqueda de texto (trigrams)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ================================================
-- COMENTARIOS EN TABLAS
-- ================================================

COMMENT ON TABLE organizations IS 'Organizaciones multi-tenant - cada una tiene sus datos aislados';
COMMENT ON TABLE users IS 'Usuarios del sistema con roles: admin, user, viewer';
COMMENT ON TABLE contacts IS 'Contactos del CRM con campos personalizables en JSONB';
COMMENT ON TABLE messages IS 'Historial de mensajes enviados/recibidos de WhatsApp';
COMMENT ON TABLE campaigns IS 'Campañas de envío masivo con tracking de estadísticas';
COMMENT ON TABLE automations IS 'Flujos de automatización visual (React Flow)';
COMMENT ON TABLE bot_configs IS 'Configuración del bot IA conversacional por organización';
COMMENT ON TABLE segments IS 'Segmentos dinámicos de contactos con filtros avanzados';
COMMENT ON TABLE ab_tests IS 'Tests A/B para optimizar campañas';

-- ================================================
-- DATOS GENERADOS
-- ================================================

-- Log de finalización
DO $$
BEGIN
  RAISE NOTICE 'Seed data insertado correctamente.';
  RAISE NOTICE 'Organización demo: demo-org';
  RAISE NOTICE 'Usuario demo: demo@chatflow.pro (password: demo123)';
END $$;
