-- ================================================
-- CHATFLOW PRO - ROW LEVEL SECURITY (RLS) POLICIES
-- Migration: 002_rls_policies
-- Descripción: Implementación de políticas de seguridad a nivel de fila
-- Fecha: 2025-11-19
-- ================================================

-- ================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- ================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;

-- ================================================
-- FUNCIÓN HELPER PARA OBTENER ORGANIZATION_ID DEL JWT
-- ================================================

CREATE OR REPLACE FUNCTION auth.organization_id() RETURNS UUID AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'organization_id',
    (SELECT organization_id::text FROM users WHERE id = auth.uid())
  )::uuid;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.user_role() RETURNS TEXT AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'role',
    (SELECT role FROM users WHERE id = auth.uid())
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- ================================================
-- POLÍTICAS: ORGANIZATIONS
-- ================================================

-- Usuarios pueden ver su propia organización
CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (id = auth.organization_id());

-- Solo admins pueden actualizar la organización
CREATE POLICY "Admins can update organization"
  ON organizations FOR UPDATE
  USING (id = auth.organization_id() AND auth.user_role() = 'admin');

-- ================================================
-- POLÍTICAS: USERS
-- ================================================

-- Usuarios pueden ver otros usuarios de su organización
CREATE POLICY "Users can view organization members"
  ON users FOR SELECT
  USING (organization_id = auth.organization_id());

-- Admins pueden crear nuevos usuarios
CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() = 'admin'
  );

-- Admins pueden actualizar usuarios
CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (
    organization_id = auth.organization_id()
    AND auth.user_role() = 'admin'
  );

-- Admins pueden eliminar usuarios
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  USING (
    organization_id = auth.organization_id()
    AND auth.user_role() = 'admin'
  );

-- ================================================
-- POLÍTICAS: CONTACTS
-- ================================================

-- Todos los usuarios pueden ver contactos de su organización
CREATE POLICY "Users can view organization contacts"
  ON contacts FOR SELECT
  USING (organization_id = auth.organization_id());

-- Admins y users pueden crear contactos
CREATE POLICY "Users can insert contacts"
  ON contacts FOR INSERT
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

-- Admins y users pueden actualizar contactos
CREATE POLICY "Users can update contacts"
  ON contacts FOR UPDATE
  USING (organization_id = auth.organization_id())
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

-- Solo admins pueden eliminar contactos
CREATE POLICY "Admins can delete contacts"
  ON contacts FOR DELETE
  USING (
    organization_id = auth.organization_id()
    AND auth.user_role() = 'admin'
  );

-- ================================================
-- POLÍTICAS: TAGS
-- ================================================

CREATE POLICY "Users can view organization tags"
  ON tags FOR SELECT
  USING (organization_id = auth.organization_id());

CREATE POLICY "Users can insert tags"
  ON tags FOR INSERT
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

CREATE POLICY "Users can update tags"
  ON tags FOR UPDATE
  USING (organization_id = auth.organization_id())
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

CREATE POLICY "Users can delete tags"
  ON tags FOR DELETE
  USING (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

-- ================================================
-- POLÍTICAS: CONTACT_TAGS
-- ================================================

CREATE POLICY "Users can view contact tags"
  ON contact_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_tags.contact_id
      AND contacts.organization_id = auth.organization_id()
    )
  );

CREATE POLICY "Users can insert contact tags"
  ON contact_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_tags.contact_id
      AND contacts.organization_id = auth.organization_id()
    )
    AND auth.user_role() IN ('admin', 'user')
  );

CREATE POLICY "Users can delete contact tags"
  ON contact_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_tags.contact_id
      AND contacts.organization_id = auth.organization_id()
    )
    AND auth.user_role() IN ('admin', 'user')
  );

-- ================================================
-- POLÍTICAS: CONTACT_LISTS
-- ================================================

CREATE POLICY "Users can view organization lists"
  ON contact_lists FOR SELECT
  USING (organization_id = auth.organization_id());

CREATE POLICY "Users can insert lists"
  ON contact_lists FOR INSERT
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

CREATE POLICY "Users can update lists"
  ON contact_lists FOR UPDATE
  USING (organization_id = auth.organization_id())
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

CREATE POLICY "Users can delete lists"
  ON contact_lists FOR DELETE
  USING (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

-- ================================================
-- POLÍTICAS: CONTACT_LIST_MEMBERS
-- ================================================

CREATE POLICY "Users can view list members"
  ON contact_list_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contact_lists
      WHERE contact_lists.id = contact_list_members.list_id
      AND contact_lists.organization_id = auth.organization_id()
    )
  );

CREATE POLICY "Users can insert list members"
  ON contact_list_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contact_lists
      WHERE contact_lists.id = contact_list_members.list_id
      AND contact_lists.organization_id = auth.organization_id()
    )
    AND auth.user_role() IN ('admin', 'user')
  );

CREATE POLICY "Users can delete list members"
  ON contact_list_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM contact_lists
      WHERE contact_lists.id = contact_list_members.list_id
      AND contact_lists.organization_id = auth.organization_id()
    )
    AND auth.user_role() IN ('admin', 'user')
  );

-- ================================================
-- POLÍTICAS: MESSAGES
-- ================================================

CREATE POLICY "Users can view organization messages"
  ON messages FOR SELECT
  USING (organization_id = auth.organization_id());

CREATE POLICY "Users can insert messages"
  ON messages FOR INSERT
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

CREATE POLICY "Users can update messages"
  ON messages FOR UPDATE
  USING (organization_id = auth.organization_id())
  WITH CHECK (organization_id = auth.organization_id());

-- ================================================
-- POLÍTICAS: CAMPAIGNS
-- ================================================

CREATE POLICY "Users can view organization campaigns"
  ON campaigns FOR SELECT
  USING (organization_id = auth.organization_id());

CREATE POLICY "Users can insert campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

CREATE POLICY "Users can update campaigns"
  ON campaigns FOR UPDATE
  USING (organization_id = auth.organization_id())
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

CREATE POLICY "Admins can delete campaigns"
  ON campaigns FOR DELETE
  USING (
    organization_id = auth.organization_id()
    AND auth.user_role() = 'admin'
  );

-- ================================================
-- POLÍTICAS: TEMPLATES
-- ================================================

CREATE POLICY "Users can view organization templates"
  ON templates FOR SELECT
  USING (organization_id = auth.organization_id());

CREATE POLICY "Users can insert templates"
  ON templates FOR INSERT
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

CREATE POLICY "Users can update templates"
  ON templates FOR UPDATE
  USING (organization_id = auth.organization_id())
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

-- ================================================
-- POLÍTICAS: SCHEDULED_MESSAGES
-- ================================================

CREATE POLICY "Users can view organization scheduled messages"
  ON scheduled_messages FOR SELECT
  USING (organization_id = auth.organization_id());

CREATE POLICY "Users can insert scheduled messages"
  ON scheduled_messages FOR INSERT
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

CREATE POLICY "Users can update scheduled messages"
  ON scheduled_messages FOR UPDATE
  USING (organization_id = auth.organization_id())
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

CREATE POLICY "Users can delete scheduled messages"
  ON scheduled_messages FOR DELETE
  USING (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

-- ================================================
-- POLÍTICAS: CALENDAR_EVENTS
-- ================================================

CREATE POLICY "Users can view organization events"
  ON calendar_events FOR SELECT
  USING (organization_id = auth.organization_id());

CREATE POLICY "Users can insert events"
  ON calendar_events FOR INSERT
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

CREATE POLICY "Users can update events"
  ON calendar_events FOR UPDATE
  USING (organization_id = auth.organization_id())
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

CREATE POLICY "Users can delete events"
  ON calendar_events FOR DELETE
  USING (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

-- ================================================
-- POLÍTICAS: AUTOMATIONS
-- ================================================

CREATE POLICY "Users can view organization automations"
  ON automations FOR SELECT
  USING (organization_id = auth.organization_id());

CREATE POLICY "Users can insert automations"
  ON automations FOR INSERT
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

CREATE POLICY "Users can update automations"
  ON automations FOR UPDATE
  USING (organization_id = auth.organization_id())
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

CREATE POLICY "Admins can delete automations"
  ON automations FOR DELETE
  USING (
    organization_id = auth.organization_id()
    AND auth.user_role() = 'admin'
  );

-- ================================================
-- POLÍTICAS: AUTOMATION_EXECUTIONS
-- ================================================

CREATE POLICY "Users can view organization automation executions"
  ON automation_executions FOR SELECT
  USING (organization_id = auth.organization_id());

CREATE POLICY "System can insert automation executions"
  ON automation_executions FOR INSERT
  WITH CHECK (organization_id = auth.organization_id());

CREATE POLICY "System can update automation executions"
  ON automation_executions FOR UPDATE
  USING (organization_id = auth.organization_id())
  WITH CHECK (organization_id = auth.organization_id());

-- ================================================
-- POLÍTICAS: BOT_CONFIGS
-- ================================================

CREATE POLICY "Users can view organization bot config"
  ON bot_configs FOR SELECT
  USING (organization_id = auth.organization_id());

CREATE POLICY "Admins can insert bot config"
  ON bot_configs FOR INSERT
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() = 'admin'
  );

CREATE POLICY "Admins can update bot config"
  ON bot_configs FOR UPDATE
  USING (organization_id = auth.organization_id())
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() = 'admin'
  );

-- ================================================
-- POLÍTICAS: BOT_MESSAGE_LOGS
-- ================================================

CREATE POLICY "Users can view organization bot logs"
  ON bot_message_logs FOR SELECT
  USING (organization_id = auth.organization_id());

CREATE POLICY "System can insert bot logs"
  ON bot_message_logs FOR INSERT
  WITH CHECK (organization_id = auth.organization_id());

-- ================================================
-- POLÍTICAS: CRM_FIELDS
-- ================================================

CREATE POLICY "Users can view organization crm fields"
  ON crm_fields FOR SELECT
  USING (organization_id = auth.organization_id());

CREATE POLICY "Admins can insert crm fields"
  ON crm_fields FOR INSERT
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() = 'admin'
  );

CREATE POLICY "Admins can update crm fields"
  ON crm_fields FOR UPDATE
  USING (organization_id = auth.organization_id())
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() = 'admin'
  );

CREATE POLICY "Admins can delete crm fields"
  ON crm_fields FOR DELETE
  USING (
    organization_id = auth.organization_id()
    AND auth.user_role() = 'admin'
  );

-- ================================================
-- POLÍTICAS: CRM_STATUSES
-- ================================================

CREATE POLICY "Users can view organization crm statuses"
  ON crm_statuses FOR SELECT
  USING (organization_id = auth.organization_id());

CREATE POLICY "Admins can insert crm statuses"
  ON crm_statuses FOR INSERT
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() = 'admin'
  );

CREATE POLICY "Admins can update crm statuses"
  ON crm_statuses FOR UPDATE
  USING (organization_id = auth.organization_id())
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() = 'admin'
  );

CREATE POLICY "Admins can delete crm statuses"
  ON crm_statuses FOR DELETE
  USING (
    organization_id = auth.organization_id()
    AND auth.user_role() = 'admin'
  );

-- ================================================
-- POLÍTICAS: SEGMENTS (FASE 3)
-- ================================================

CREATE POLICY "Users can view organization segments"
  ON segments FOR SELECT
  USING (organization_id = auth.organization_id());

CREATE POLICY "Users can insert segments"
  ON segments FOR INSERT
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

CREATE POLICY "Users can update segments"
  ON segments FOR UPDATE
  USING (organization_id = auth.organization_id())
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

CREATE POLICY "Users can delete segments"
  ON segments FOR DELETE
  USING (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

-- ================================================
-- POLÍTICAS: AB_TESTS (FASE 4)
-- ================================================

CREATE POLICY "Users can view organization ab tests"
  ON ab_tests FOR SELECT
  USING (organization_id = auth.organization_id());

CREATE POLICY "Users can insert ab tests"
  ON ab_tests FOR INSERT
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

CREATE POLICY "Users can update ab tests"
  ON ab_tests FOR UPDATE
  USING (organization_id = auth.organization_id())
  WITH CHECK (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

CREATE POLICY "Users can delete ab tests"
  ON ab_tests FOR DELETE
  USING (
    organization_id = auth.organization_id()
    AND auth.user_role() IN ('admin', 'user')
  );

-- ================================================
-- COMENTARIOS SOBRE LAS POLÍTICAS
-- ================================================

COMMENT ON POLICY "Users can view their own organization" ON organizations IS
  'Los usuarios solo pueden ver su propia organización';

COMMENT ON POLICY "Users can view organization contacts" ON contacts IS
  'Los usuarios pueden ver todos los contactos de su organización';

COMMENT ON POLICY "Admins can delete contacts" ON contacts IS
  'Solo los administradores pueden eliminar contactos de forma permanente';

-- ================================================
-- POLÍTICAS PARA SERVICE ROLE (BYPASS RLS)
-- ================================================

-- El service role puede hacer todo (para operaciones de backend)
-- Esto se configura automáticamente en Supabase usando service_role key
