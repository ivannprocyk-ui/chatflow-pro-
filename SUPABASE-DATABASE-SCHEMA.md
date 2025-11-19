# 🗄️ ChatFlow Pro - Esquema de Base de Datos Supabase

## 📋 Índice

1. [Introducción](#introducción)
2. [Diagrama de Relaciones](#diagrama-de-relaciones)
3. [Tablas Principales](#tablas-principales)
4. [Scripts SQL](#scripts-sql)
5. [Políticas RLS (Row Level Security)](#políticas-rls)
6. [Índices y Optimizaciones](#índices-y-optimizaciones)
7. [Migraciones](#migraciones)
8. [Configuración del Cliente Supabase](#configuración-del-cliente-supabase)

---

## 🎯 Introducción

Este documento define el esquema completo de la base de datos PostgreSQL para **ChatFlow Pro** en Supabase.

### Características:
- ✅ **Multi-tenant:** Todas las tablas tienen `organization_id` para aislamiento de datos
- ✅ **Row Level Security (RLS):** Políticas de seguridad a nivel de fila
- ✅ **Timestamps automáticos:** `created_at` y `updated_at` en todas las tablas
- ✅ **Índices optimizados:** Para consultas frecuentes
- ✅ **Relaciones bien definidas:** Foreign keys con ON DELETE CASCADE/SET NULL
- ✅ **JSON fields:** Para datos flexibles (custom_fields, metadata, config)

---

## 🔗 Diagrama de Relaciones

```
organizations
    ├── users (1:N)
    ├── contacts (1:N)
    │   ├── contact_tags (N:M via tags)
    │   ├── messages (1:N)
    │   └── automation_executions (1:N)
    ├── contact_lists (1:N)
    │   └── contact_list_members (N:M via contacts)
    ├── campaigns (1:N)
    ├── templates (1:N)
    ├── scheduled_messages (1:N)
    ├── calendar_events (1:N)
    ├── tags (1:N)
    ├── automations (1:N)
    │   └── automation_executions (1:N)
    ├── bot_configs (1:1)
    ├── bot_message_logs (1:N)
    ├── crm_fields (1:N)
    ├── crm_statuses (1:N)
    └── segments (1:N) [FASE 3]
```

---

## 📊 Tablas Principales

### 1. **organizations**
Tabla principal para multi-tenant. Cada organización tiene sus propios datos aislados.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK, generado automáticamente |
| `name` | VARCHAR(255) | Nombre de la organización |
| `slug` | VARCHAR(100) | Slug único para URL |
| `plan` | VARCHAR(50) | Plan: starter, pro, business, enterprise |
| `is_active` | BOOLEAN | Si la organización está activa |
| `ai_enabled` | BOOLEAN | Si IA está habilitada |
| `ai_role` | VARCHAR(50) | Rol del bot: vendedor, asistente, soporte, agendador |
| `ai_company_info` | TEXT | Información de la empresa para IA |
| `ai_products_info` | TEXT | Información de productos para IA |
| `ai_objective` | TEXT | Objetivo del bot |
| `ai_business_hours_only` | BOOLEAN | Solo responder en horario laboral |
| `whatsapp_method` | VARCHAR(50) | Método: qr, meta_api |
| `whatsapp_instance_id` | VARCHAR(255) | ID de instancia Evolution API |
| `whatsapp_connected` | BOOLEAN | Si está conectado a WhatsApp |
| `whatsapp_phone` | VARCHAR(20) | Número de teléfono conectado |
| `meta_access_token` | TEXT | Token de Meta API (encriptado) |
| `meta_waba_id` | VARCHAR(255) | WhatsApp Business Account ID |
| `meta_phone_number_id` | VARCHAR(255) | Phone Number ID de Meta |
| `followup_enabled` | BOOLEAN | Si seguimientos automáticos están habilitados |
| `followup_config` | JSONB | Configuración de seguimientos |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Fecha de última actualización |

---

### 2. **users**
Usuarios del sistema con roles y permisos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK, generado automáticamente |
| `organization_id` | UUID | FK a organizations |
| `email` | VARCHAR(255) | Email único |
| `password_hash` | VARCHAR(255) | Hash de contraseña |
| `full_name` | VARCHAR(255) | Nombre completo |
| `role` | VARCHAR(50) | Rol: admin, user, viewer |
| `is_active` | BOOLEAN | Si el usuario está activo |
| `last_login_at` | TIMESTAMPTZ | Último login |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Fecha de última actualización |

**Índices:**
- Único en `email`
- Índice en `organization_id`

---

### 3. **contacts**
Contactos del CRM con campos personalizables.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `organization_id` | UUID | FK a organizations |
| `phone` | VARCHAR(20) | Teléfono (formato internacional) |
| `name` | VARCHAR(255) | Nombre del contacto |
| `email` | VARCHAR(255) | Email (opcional) |
| `company` | VARCHAR(255) | Empresa (opcional) |
| `position` | VARCHAR(255) | Cargo (opcional) |
| `status` | VARCHAR(50) | Estado: lead, contacted, customer, churned, etc. |
| `custom_fields` | JSONB | Campos personalizados dinámicos |
| `messages_sent` | INTEGER | Contador de mensajes enviados |
| `messages_received` | INTEGER | Contador de mensajes recibidos |
| `last_contact_at` | TIMESTAMPTZ | Última interacción |
| `lead_score` | INTEGER | Puntaje de lead (0-100) |
| `notes` | TEXT | Notas sobre el contacto |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Fecha de última actualización |

**Índices:**
- Índice en `organization_id`
- Índice en `phone` + `organization_id` (único)
- Índice en `status`
- Índice GIN en `custom_fields` para búsquedas JSON
- Índice en `last_contact_at`

---

### 4. **tags**
Etiquetas para categorizar contactos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `organization_id` | UUID | FK a organizations |
| `name` | VARCHAR(100) | Nombre del tag |
| `color` | VARCHAR(20) | Color HEX (#RRGGBB) |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Fecha de última actualización |

**Índices:**
- Índice en `organization_id`
- Único en `name` + `organization_id`

---

### 5. **contact_tags**
Relación N:M entre contacts y tags.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `contact_id` | UUID | FK a contacts (ON DELETE CASCADE) |
| `tag_id` | UUID | FK a tags (ON DELETE CASCADE) |
| `created_at` | TIMESTAMPTZ | Fecha de asignación |

**Índices:**
- Único en `contact_id` + `tag_id`
- Índice en `tag_id`

---

### 6. **contact_lists**
Listas de contactos para campañas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `organization_id` | UUID | FK a organizations |
| `name` | VARCHAR(255) | Nombre de la lista |
| `description` | TEXT | Descripción |
| `contact_count` | INTEGER | Número de contactos (calculado) |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Fecha de última actualización |

---

### 7. **contact_list_members**
Relación N:M entre contact_lists y contacts.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `list_id` | UUID | FK a contact_lists (ON DELETE CASCADE) |
| `contact_id` | UUID | FK a contacts (ON DELETE CASCADE) |
| `added_at` | TIMESTAMPTZ | Fecha de agregación |

**Índices:**
- Único en `list_id` + `contact_id`
- Índice en `contact_id`

---

### 8. **messages**
Historial de mensajes enviados/recibidos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `organization_id` | UUID | FK a organizations |
| `contact_id` | UUID | FK a contacts |
| `direction` | VARCHAR(20) | inbound, outbound |
| `status` | VARCHAR(50) | pending, sent, delivered, read, failed |
| `template_name` | VARCHAR(255) | Nombre de la plantilla usada |
| `template_id` | VARCHAR(255) | ID de plantilla de WhatsApp |
| `message_content` | TEXT | Contenido del mensaje (puede estar vacío por privacidad) |
| `whatsapp_message_id` | VARCHAR(255) | ID del mensaje en WhatsApp |
| `campaign_id` | UUID | FK a campaigns (opcional) |
| `campaign_name` | VARCHAR(255) | Nombre de campaña |
| `list_id` | UUID | FK a contact_lists (opcional) |
| `list_name` | VARCHAR(255) | Nombre de lista |
| `error_message` | TEXT | Mensaje de error si falló |
| `metadata` | JSONB | Metadatos adicionales |
| `sent_at` | TIMESTAMPTZ | Fecha de envío |
| `delivered_at` | TIMESTAMPTZ | Fecha de entrega |
| `read_at` | TIMESTAMPTZ | Fecha de lectura |
| `created_at` | TIMESTAMPTZ | Fecha de creación |

**Índices:**
- Índice en `organization_id`
- Índice en `contact_id`
- Índice en `campaign_id`
- Índice en `status`
- Índice en `sent_at` (descendente)
- Índice en `whatsapp_message_id`

---

### 9. **campaigns**
Campañas de envío masivo.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `organization_id` | UUID | FK a organizations |
| `name` | VARCHAR(255) | Nombre de la campaña |
| `description` | TEXT | Descripción |
| `template_name` | VARCHAR(255) | Plantilla usada |
| `template_id` | VARCHAR(255) | ID de plantilla de WhatsApp |
| `status` | VARCHAR(50) | draft, scheduled, running, completed, paused |
| `total_contacts` | INTEGER | Total de contactos |
| `sent_count` | INTEGER | Mensajes enviados |
| `delivered_count` | INTEGER | Mensajes entregados |
| `read_count` | INTEGER | Mensajes leídos |
| `failed_count` | INTEGER | Mensajes fallidos |
| `scheduled_at` | TIMESTAMPTZ | Fecha programada |
| `started_at` | TIMESTAMPTZ | Fecha de inicio |
| `completed_at` | TIMESTAMPTZ | Fecha de finalización |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Fecha de última actualización |

---

### 10. **templates**
Plantillas de mensajes de WhatsApp.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `organization_id` | UUID | FK a organizations |
| `whatsapp_template_id` | VARCHAR(255) | ID de Meta |
| `name` | VARCHAR(255) | Nombre de la plantilla |
| `category` | VARCHAR(100) | MARKETING, UTILITY, AUTHENTICATION |
| `language` | VARCHAR(10) | Código de idioma (es, en, pt) |
| `status` | VARCHAR(50) | APPROVED, PENDING, REJECTED |
| `components` | JSONB | Componentes de la plantilla (header, body, footer, buttons) |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Fecha de última actualización |

---

### 11. **scheduled_messages**
Mensajes programados para envío futuro.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `organization_id` | UUID | FK a organizations |
| `contact_id` | UUID | FK a contacts |
| `template_name` | VARCHAR(255) | Plantilla a usar |
| `template_id` | VARCHAR(255) | ID de plantilla |
| `message_content` | TEXT | Contenido del mensaje |
| `scheduled_for` | TIMESTAMPTZ | Fecha/hora programada |
| `status` | VARCHAR(50) | pending, sent, failed, cancelled |
| `repeat_type` | VARCHAR(50) | once, daily, weekly, monthly |
| `sent_at` | TIMESTAMPTZ | Fecha de envío real |
| `error_message` | TEXT | Error si falló |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Fecha de última actualización |

**Índices:**
- Índice en `organization_id`
- Índice en `scheduled_for` (para procesamiento cron)
- Índice en `status`

---

### 12. **calendar_events**
Eventos del calendario integrado.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `organization_id` | UUID | FK a organizations |
| `contact_id` | UUID | FK a contacts (opcional) |
| `title` | VARCHAR(255) | Título del evento |
| `description` | TEXT | Descripción |
| `event_type` | VARCHAR(50) | call, meeting, followup, reminder |
| `start_date` | TIMESTAMPTZ | Fecha/hora inicio |
| `end_date` | TIMESTAMPTZ | Fecha/hora fin |
| `all_day` | BOOLEAN | Si es todo el día |
| `reminder_sent` | BOOLEAN | Si se envió recordatorio |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Fecha de última actualización |

**Índices:**
- Índice en `organization_id`
- Índice en `start_date`
- Índice en `contact_id`

---

### 13. **automations**
Flujos de automatización (FASE 2).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `organization_id` | UUID | FK a organizations |
| `name` | VARCHAR(255) | Nombre del flow |
| `description` | TEXT | Descripción |
| `active` | BOOLEAN | Si está activo |
| `nodes` | JSONB | Nodos del flow (React Flow) |
| `edges` | JSONB | Conexiones entre nodos |
| `total_executions` | INTEGER | Total de ejecuciones |
| `successful_executions` | INTEGER | Ejecuciones exitosas |
| `failed_executions` | INTEGER | Ejecuciones fallidas |
| `last_executed_at` | TIMESTAMPTZ | Última ejecución |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Fecha de última actualización |

**Índices:**
- Índice en `organization_id`
- Índice en `active`

---

### 14. **automation_executions**
Historial de ejecuciones de automatizaciones.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `organization_id` | UUID | FK a organizations |
| `automation_id` | UUID | FK a automations |
| `automation_name` | VARCHAR(255) | Nombre del automation |
| `contact_id` | UUID | FK a contacts |
| `contact_name` | VARCHAR(255) | Nombre del contacto |
| `status` | VARCHAR(50) | pending, running, completed, failed |
| `current_node_id` | VARCHAR(255) | Nodo actual en ejecución |
| `execution_path` | JSONB | Array de node IDs ejecutados |
| `scheduled_for` | TIMESTAMPTZ | Programado para (delays) |
| `started_at` | TIMESTAMPTZ | Inicio de ejecución |
| `completed_at` | TIMESTAMPTZ | Fin de ejecución |
| `error` | TEXT | Error si falló |
| `results` | JSONB | Resultados de cada nodo |
| `created_at` | TIMESTAMPTZ | Fecha de creación |

**Índices:**
- Índice en `organization_id`
- Índice en `automation_id`
- Índice en `contact_id`
- Índice en `status`
- Índice en `scheduled_for` (para procesamiento)

---

### 15. **bot_configs**
Configuración del bot IA conversacional (1 por organización).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `organization_id` | UUID | FK a organizations (UNIQUE) |
| `connection_type` | VARCHAR(50) | evolution_api, meta_api |
| `connection_status` | VARCHAR(50) | connected, disconnected, connecting |
| `evolution_api_url` | VARCHAR(255) | URL de Evolution API |
| `evolution_instance_name` | VARCHAR(255) | Nombre de instancia |
| `evolution_api_key` | TEXT | API key (encriptada) |
| `meta_business_account_id` | VARCHAR(255) | Meta WABA ID |
| `meta_access_token` | TEXT | Token (encriptado) |
| `meta_phone_number_id` | VARCHAR(255) | Phone Number ID |
| `chatwoot_inbox_id` | VARCHAR(255) | Inbox ID de ChatWoot |
| `chatwoot_account_id` | VARCHAR(255) | Account ID de ChatWoot |
| `agent_type` | VARCHAR(50) | vendedor, asistente, secretaria, custom |
| `business_name` | VARCHAR(255) | Nombre del negocio |
| `business_description` | TEXT | Descripción |
| `products` | TEXT | Productos/servicios |
| `business_hours` | VARCHAR(255) | Horario de atención |
| `language` | VARCHAR(10) | es, en, pt |
| `tone` | VARCHAR(50) | formal, casual, professional |
| `custom_prompt` | TEXT | Prompt personalizado |
| `flowise_url` | VARCHAR(255) | URL de Flowise (opcional) |
| `flowise_api_key` | TEXT | API key (encriptada) |
| `bot_enabled` | BOOLEAN | Si el bot está habilitado |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Fecha de última actualización |

**Índices:**
- Único en `organization_id`

---

### 16. **bot_message_logs**
Logs de mensajes procesados por el bot (sin contenido por privacidad).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `organization_id` | UUID | FK a organizations |
| `whatsapp_message_id` | VARCHAR(255) | ID externo del mensaje |
| `conversation_id` | VARCHAR(255) | ID de conversación (ChatWoot) |
| `inbox_id` | VARCHAR(255) | Inbox ID (ChatWoot) |
| `direction` | VARCHAR(20) | inbound, outbound |
| `bot_enabled` | BOOLEAN | ¿Bot habilitado cuando se recibió? |
| `bot_processed` | BOOLEAN | ¿Bot lo procesó? |
| `bot_responded` | BOOLEAN | ¿Bot envió respuesta? |
| `processing_time_ms` | INTEGER | Tiempo de procesamiento (ms) |
| `response_time_ms` | INTEGER | Tiempo total de respuesta (ms) |
| `ai_provider` | VARCHAR(50) | flowise, openai, etc. |
| `ai_model` | VARCHAR(100) | Modelo usado (grok-1, gpt-4, etc.) |
| `agent_type` | VARCHAR(50) | Tipo de agente usado |
| `status` | VARCHAR(50) | pending, success, failed, skipped |
| `error_message` | TEXT | Error si falló |
| `error_code` | VARCHAR(100) | Código de error |
| `received_at` | TIMESTAMPTZ | Recibido |
| `processed_at` | TIMESTAMPTZ | Procesado |
| `sent_at` | TIMESTAMPTZ | Enviado |
| `created_at` | TIMESTAMPTZ | Fecha de creación |

**Índices:**
- Índice en `organization_id`
- Índice en `conversation_id`
- Índice en `status`
- Índice en `received_at` (descendente)

---

### 17. **crm_fields**
Campos personalizables del CRM (por organización).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `organization_id` | UUID | FK a organizations |
| `name` | VARCHAR(100) | Nombre técnico del campo |
| `label` | VARCHAR(255) | Etiqueta visible |
| `field_type` | VARCHAR(50) | text, number, email, phone, date, select, currency, textarea |
| `required` | BOOLEAN | Si es requerido |
| `options` | JSONB | Opciones para select (array) |
| `currency_type` | VARCHAR(10) | USD, ARS, EUR, etc. |
| `default_value` | VARCHAR(255) | Valor por defecto |
| `visible` | BOOLEAN | Si es visible |
| `order` | INTEGER | Orden de visualización |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Fecha de última actualización |

**Índices:**
- Índice en `organization_id`
- Único en `organization_id` + `name`

---

### 18. **crm_statuses**
Estados personalizables del CRM.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `organization_id` | UUID | FK a organizations |
| `name` | VARCHAR(100) | Nombre técnico |
| `label` | VARCHAR(255) | Etiqueta visible |
| `color` | VARCHAR(50) | Color: green, blue, red, etc. |
| `icon` | VARCHAR(100) | Nombre de icono (opcional) |
| `order` | INTEGER | Orden de visualización |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Fecha de última actualización |

**Índices:**
- Índice en `organization_id`
- Único en `organization_id` + `name`

---

### 19. **segments** (FASE 3)
Segmentos avanzados de contactos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `organization_id` | UUID | FK a organizations |
| `name` | VARCHAR(255) | Nombre del segmento |
| `description` | TEXT | Descripción |
| `type` | VARCHAR(50) | dynamic, static |
| `filters` | JSONB | Configuración de filtros |
| `contact_count` | INTEGER | Número de contactos (cache) |
| `last_calculated_at` | TIMESTAMPTZ | Última vez que se calculó |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Fecha de última actualización |

---

### 20. **ab_tests** (FASE 4)
Tests A/B para optimización de campañas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | PK |
| `organization_id` | UUID | FK a organizations |
| `name` | VARCHAR(255) | Nombre del test |
| `description` | TEXT | Descripción |
| `status` | VARCHAR(50) | draft, running, completed, cancelled |
| `variants` | JSONB | Array de variantes con templates |
| `sample_size` | INTEGER | Tamaño de muestra |
| `metric_goal` | VARCHAR(50) | open_rate, click_rate, conversion_rate |
| `winner_variant_id` | VARCHAR(255) | ID de variante ganadora |
| `confidence_level` | DECIMAL(5,2) | Nivel de confianza (%) |
| `started_at` | TIMESTAMPTZ | Inicio del test |
| `ended_at` | TIMESTAMPTZ | Fin del test |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Fecha de última actualización |

---

## 🔒 Políticas RLS (Row Level Security)

Supabase permite definir políticas de seguridad a nivel de fila para controlar el acceso a los datos.

### Estrategia RLS:
1. **Aislamiento por organización:** Cada usuario solo puede ver datos de su organización
2. **Control por roles:** admin, user, viewer tienen permisos diferentes
3. **Seguridad en cascada:** Las políticas se aplican automáticamente

### Políticas por Tabla:

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;

-- Política de lectura: solo usuarios de la misma organización
CREATE POLICY "Users can view own organization data" ON contacts
  FOR SELECT
  USING (organization_id = auth.jwt() ->> 'organization_id');

-- Política de inserción: solo admins pueden crear
CREATE POLICY "Admins can insert contacts" ON contacts
  FOR INSERT
  WITH CHECK (
    organization_id = auth.jwt() ->> 'organization_id'
    AND auth.jwt() ->> 'role' IN ('admin', 'user')
  );

-- Política de actualización: admin y user pueden editar
CREATE POLICY "Users can update own organization contacts" ON contacts
  FOR UPDATE
  USING (organization_id = auth.jwt() ->> 'organization_id')
  WITH CHECK (
    organization_id = auth.jwt() ->> 'organization_id'
    AND auth.jwt() ->> 'role' IN ('admin', 'user')
  );

-- Política de eliminación: solo admins
CREATE POLICY "Admins can delete contacts" ON contacts
  FOR DELETE
  USING (
    organization_id = auth.jwt() ->> 'organization_id'
    AND auth.jwt() ->> 'role' = 'admin'
  );
```

**Nota:** Las mismas políticas se deben aplicar a todas las tablas con `organization_id`.

---

## 📈 Índices y Optimizaciones

### Índices Compuestos Importantes:

```sql
-- Búsquedas de contactos por teléfono dentro de una org
CREATE INDEX idx_contacts_org_phone ON contacts(organization_id, phone);

-- Búsquedas de mensajes por contacto y fecha
CREATE INDEX idx_messages_contact_date ON messages(contact_id, sent_at DESC);

-- Mensajes programados pendientes
CREATE INDEX idx_scheduled_pending ON scheduled_messages(organization_id, scheduled_for)
WHERE status = 'pending';

-- Automatizaciones activas
CREATE INDEX idx_automations_active ON automations(organization_id, active)
WHERE active = true;

-- Ejecuciones programadas pendientes
CREATE INDEX idx_executions_scheduled ON automation_executions(scheduled_for)
WHERE status = 'pending';

-- Búsqueda de logs de bot por conversación
CREATE INDEX idx_bot_logs_conversation ON bot_message_logs(conversation_id, received_at DESC);

-- Búsqueda en custom_fields (JSON)
CREATE INDEX idx_contacts_custom_fields ON contacts USING GIN (custom_fields);

-- Búsqueda de campañas por estado
CREATE INDEX idx_campaigns_status ON campaigns(organization_id, status);

-- Templates aprobados
CREATE INDEX idx_templates_approved ON templates(organization_id, status)
WHERE status = 'APPROVED';
```

---

## 🚀 Scripts SQL

### Script Completo de Creación

**Archivo:** `/supabase/migrations/001_initial_schema.sql`

```sql
-- ================================================
-- CHATFLOW PRO - SCHEMA INICIAL
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
  password_hash VARCHAR(255) NOT NULL,
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

-- ================================================
-- DATOS INICIALES (DEMO)
-- ================================================

-- Organización demo
INSERT INTO organizations (name, slug, plan, is_active)
VALUES ('Demo Organization', 'demo-org', 'pro', true);

-- Tags predefinidos (para la organización demo)
INSERT INTO tags (organization_id, name, color)
SELECT id, 'VIP', '#8B5CF6' FROM organizations WHERE slug = 'demo-org'
UNION ALL
SELECT id, 'Cliente Nuevo', '#10B981' FROM organizations WHERE slug = 'demo-org'
UNION ALL
SELECT id, 'Seguimiento Urgente', '#EF4444' FROM organizations WHERE slug = 'demo-org'
UNION ALL
SELECT id, 'Inactivo', '#6B7280' FROM organizations WHERE slug = 'demo-org'
UNION ALL
SELECT id, 'Prospecto Caliente', '#F59E0B' FROM organizations WHERE slug = 'demo-org';

-- CRM Fields por defecto
INSERT INTO crm_fields (organization_id, name, label, field_type, required, visible, "order")
SELECT id, 'name', 'Nombre', 'text', true, true, 1 FROM organizations WHERE slug = 'demo-org'
UNION ALL
SELECT id, 'phone', 'Teléfono', 'phone', true, true, 2 FROM organizations WHERE slug = 'demo-org'
UNION ALL
SELECT id, 'email', 'Email', 'email', false, true, 3 FROM organizations WHERE slug = 'demo-org'
UNION ALL
SELECT id, 'company', 'Empresa', 'text', false, true, 4 FROM organizations WHERE slug = 'demo-org'
UNION ALL
SELECT id, 'position', 'Cargo', 'text', false, true, 5 FROM organizations WHERE slug = 'demo-org'
UNION ALL
SELECT id, 'cost', 'Costo/Valor', 'currency', false, true, 6 FROM organizations WHERE slug = 'demo-org'
UNION ALL
SELECT id, 'notes', 'Notas', 'textarea', false, true, 7 FROM organizations WHERE slug = 'demo-org';

-- CRM Statuses por defecto
INSERT INTO crm_statuses (organization_id, name, label, color, "order")
SELECT id, 'active', 'Activo', 'green', 1 FROM organizations WHERE slug = 'demo-org'
UNION ALL
SELECT id, 'inactive', 'Inactivo', 'yellow', 2 FROM organizations WHERE slug = 'demo-org'
UNION ALL
SELECT id, 'lead', 'Lead', 'blue', 3 FROM organizations WHERE slug = 'demo-org'
UNION ALL
SELECT id, 'customer', 'Cliente', 'purple', 4 FROM organizations WHERE slug = 'demo-org'
UNION ALL
SELECT id, 'blocked', 'Bloqueado', 'red', 5 FROM organizations WHERE slug = 'demo-org';
```

---

## 📦 Configuración del Cliente Supabase

### Instalación

```bash
npm install @supabase/supabase-js
```

### Configuración en el Frontend

**Archivo:** `/src/react-app/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Archivo:** `.env`

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Configuración en el Backend

**Archivo:** `/backend/src/database/supabase.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }
}
```

---

## 🔄 Migraciones

### Estructura de Migraciones

```
/supabase
  /migrations
    001_initial_schema.sql
    002_add_rls_policies.sql
    003_add_segments_table.sql
    004_add_ab_tests_table.sql
```

### Comandos de Migración

```bash
# Inicializar Supabase localmente
supabase init

# Crear nueva migración
supabase migration new add_segments_table

# Aplicar migraciones
supabase db push

# Ver status
supabase db status
```

---

## ✅ Checklist de Implementación

- [ ] Crear proyecto en Supabase
- [ ] Ejecutar script de creación de tablas (001_initial_schema.sql)
- [ ] Aplicar políticas RLS (002_add_rls_policies.sql)
- [ ] Configurar variables de entorno (.env)
- [ ] Instalar cliente Supabase en frontend y backend
- [ ] Migrar servicios de localStorage a Supabase
- [ ] Implementar autenticación con Supabase Auth
- [ ] Configurar Realtime para actualizaciones en vivo
- [ ] Implementar Edge Functions para webhooks
- [ ] Configurar Storage para archivos adjuntos (futuro)

---

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

---

**Fecha de creación:** 2025-11-19
**Versión:** 1.0
**Autor:** ChatFlow Pro Team
