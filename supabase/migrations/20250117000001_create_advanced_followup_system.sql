-- =====================================================
-- SISTEMA DE SEGUIMIENTO AVANZADO - MIGRATIONS
-- Autor: ChatFlow Pro Team
-- Fecha: 2025-01-17
-- Descripción: Sistema inteligente y contextual de seguimiento
--              con mensajes múltiples y triggers configurables
-- =====================================================

-- =====================================================
-- 1. TABLA: follow_up_sequences
-- Secuencias de seguimiento configurables por organización
-- =====================================================

CREATE TABLE IF NOT EXISTS follow_up_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Identificación
  name VARCHAR(255) NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,

  -- Configuración de activación (TRIGGERS)
  trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN (
    'keyword',           -- Palabra clave detectada
    'variable',          -- Variable capturada
    'conversation_state',-- Estado de conversación
    'bot_stage',         -- Etapa específica del bot
    'time_based',        -- Basado en tiempo
    'action'             -- Acción realizada (envío doc, cotización, etc.)
  )),

  -- Configuración específica del trigger (JSON)
  trigger_config JSONB DEFAULT '{}'::jsonb,
  -- Ejemplos:
  -- keyword: {"keywords": ["precio", "cotización", "información"]}
  -- variable: {"variable_name": "producto", "value_exists": true}
  -- conversation_state: {"bot_sent_info": true, "no_response_minutes": 30}
  -- bot_stage: {"stage_id": "quotation_sent", "no_response_minutes": 30}
  -- time_based: {"no_response_minutes": 60}
  -- action: {"action_type": "document_sent", "no_response_minutes": 30}

  -- Estrategia de agresividad
  strategy VARCHAR(20) DEFAULT 'moderate' CHECK (strategy IN ('passive', 'moderate', 'aggressive')),

  -- Condiciones adicionales
  conditions JSONB DEFAULT '{}'::jsonb,
  -- Ejemplos:
  -- {"min_conversation_messages": 3, "max_follow_ups_per_contact": 5, "business_hours_only": true}

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,

  -- Estadísticas
  total_executions INTEGER DEFAULT 0,
  successful_conversions INTEGER DEFAULT 0,

  CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Índices para optimizar búsquedas
CREATE INDEX idx_sequences_org ON follow_up_sequences(organization_id);
CREATE INDEX idx_sequences_enabled ON follow_up_sequences(enabled) WHERE enabled = true;
CREATE INDEX idx_sequences_trigger ON follow_up_sequences(trigger_type);

-- =====================================================
-- 2. TABLA: follow_up_messages
-- Mensajes individuales de cada secuencia
-- =====================================================

CREATE TABLE IF NOT EXISTS follow_up_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL,

  -- Orden en la secuencia
  step_order INTEGER NOT NULL, -- 1, 2, 3, etc.

  -- Configuración de timing
  delay_amount INTEGER NOT NULL, -- Número (15, 30, 60, etc.)
  delay_unit VARCHAR(20) NOT NULL CHECK (delay_unit IN ('minutes', 'hours', 'days')),

  -- Contenido del mensaje
  message_template TEXT NOT NULL,
  -- Soporta variables: "Hola {nombre}, ¿recibiste la info de {producto}?"

  -- Variables disponibles para este mensaje
  available_variables JSONB DEFAULT '[]'::jsonb,
  -- Ejemplo: ["nombre", "producto", "precio", "fecha"]

  -- Condiciones para enviar este mensaje específico (opcional)
  send_conditions JSONB DEFAULT '{}'::jsonb,
  -- Ejemplo: {"previous_message_opened": false, "contact_active": true}

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_sequence FOREIGN KEY (sequence_id) REFERENCES follow_up_sequences(id) ON DELETE CASCADE,
  CONSTRAINT unique_sequence_step UNIQUE (sequence_id, step_order)
);

-- Índices
CREATE INDEX idx_messages_sequence ON follow_up_messages(sequence_id);
CREATE INDEX idx_messages_order ON follow_up_messages(sequence_id, step_order);

-- =====================================================
-- 3. TABLA: follow_up_executions
-- Ejecuciones activas de seguimiento por contacto
-- =====================================================

CREATE TABLE IF NOT EXISTS follow_up_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL,
  organization_id UUID NOT NULL,

  -- Contacto objetivo
  contact_phone VARCHAR(50) NOT NULL, -- Formato: +5491123456789
  contact_name VARCHAR(255),

  -- Estado de la ejecución
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
    'active',      -- Activa, enviando mensajes
    'paused',      -- Pausada temporalmente
    'completed',   -- Completada exitosamente (cliente respondió)
    'abandoned',   -- Abandonada (cliente no respondió a ninguno)
    'cancelled'    -- Cancelada manualmente
  )),

  -- Progreso
  current_step INTEGER DEFAULT 0, -- Último paso ejecutado
  next_scheduled_at TIMESTAMPTZ, -- Cuándo enviar el próximo mensaje

  -- Contexto capturado
  conversation_context JSONB DEFAULT '{}'::jsonb,
  -- Almacena variables capturadas: {"nombre": "Juan", "producto": "Plan Premium", "precio": "$99"}

  trigger_data JSONB DEFAULT '{}'::jsonb,
  -- Datos que activaron la secuencia: {"keyword": "precio", "timestamp": "2025-01-17T10:30:00Z"}

  -- Metadata
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_message_sent_at TIMESTAMPTZ,

  -- Resultado
  converted BOOLEAN DEFAULT false, -- Cliente respondió positivamente
  total_messages_sent INTEGER DEFAULT 0,

  CONSTRAINT fk_execution_sequence FOREIGN KEY (sequence_id) REFERENCES follow_up_sequences(id) ON DELETE CASCADE,
  CONSTRAINT fk_execution_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_executions_org ON follow_up_executions(organization_id);
CREATE INDEX idx_executions_status ON follow_up_executions(status) WHERE status = 'active';
CREATE INDEX idx_executions_scheduled ON follow_up_executions(next_scheduled_at) WHERE status = 'active';
CREATE INDEX idx_executions_contact ON follow_up_executions(contact_phone, organization_id);

-- =====================================================
-- 4. TABLA: follow_up_message_logs
-- Log de todos los mensajes enviados
-- =====================================================

CREATE TABLE IF NOT EXISTS follow_up_message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL,
  message_id UUID NOT NULL,

  -- Detalles del envío
  step_number INTEGER NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contenido enviado (con variables reemplazadas)
  message_sent TEXT NOT NULL,

  -- Estado del mensaje
  delivery_status VARCHAR(20) DEFAULT 'sent' CHECK (delivery_status IN (
    'sent',       -- Enviado
    'delivered',  -- Entregado
    'read',       -- Leído
    'failed'      -- Falló
  )),

  -- Respuesta del contacto
  contact_responded BOOLEAN DEFAULT false,
  response_received_at TIMESTAMPTZ,
  response_text TEXT,

  -- Metadata de WhatsApp
  whatsapp_message_id VARCHAR(255),
  error_message TEXT,

  CONSTRAINT fk_log_execution FOREIGN KEY (execution_id) REFERENCES follow_up_executions(id) ON DELETE CASCADE,
  CONSTRAINT fk_log_message FOREIGN KEY (message_id) REFERENCES follow_up_messages(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_logs_execution ON follow_up_message_logs(execution_id);
CREATE INDEX idx_logs_sent_at ON follow_up_message_logs(sent_at);
CREATE INDEX idx_logs_status ON follow_up_message_logs(delivery_status);

-- =====================================================
-- 5. FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para follow_up_sequences
CREATE TRIGGER update_sequences_updated_at
    BEFORE UPDATE ON follow_up_sequences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para follow_up_messages
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON follow_up_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. VISTAS ÚTILES
-- =====================================================

-- Vista: Resumen de secuencias con estadísticas
CREATE OR REPLACE VIEW follow_up_sequences_summary AS
SELECT
  s.id,
  s.organization_id,
  s.name,
  s.description,
  s.enabled,
  s.trigger_type,
  s.strategy,
  s.total_executions,
  s.successful_conversions,
  CASE
    WHEN s.total_executions > 0 THEN
      ROUND((s.successful_conversions::NUMERIC / s.total_executions) * 100, 2)
    ELSE 0
  END as conversion_rate,
  COUNT(m.id) as total_messages,
  COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'active') as active_executions
FROM follow_up_sequences s
LEFT JOIN follow_up_messages m ON m.sequence_id = s.id
LEFT JOIN follow_up_executions e ON e.sequence_id = s.id
GROUP BY s.id;

-- Vista: Ejecuciones pendientes para procesar
CREATE OR REPLACE VIEW follow_up_pending_executions AS
SELECT
  e.id as execution_id,
  e.sequence_id,
  e.organization_id,
  e.contact_phone,
  e.contact_name,
  e.current_step,
  e.next_scheduled_at,
  e.conversation_context,
  s.name as sequence_name,
  s.strategy,
  m.id as next_message_id,
  m.message_template,
  m.delay_amount,
  m.delay_unit
FROM follow_up_executions e
INNER JOIN follow_up_sequences s ON s.id = e.sequence_id
INNER JOIN follow_up_messages m ON m.sequence_id = s.id
  AND m.step_order = (e.current_step + 1)
WHERE e.status = 'active'
  AND e.next_scheduled_at <= NOW()
  AND s.enabled = true
ORDER BY e.next_scheduled_at ASC;

-- =====================================================
-- 7. DATOS DE EJEMPLO (OPCIONAL - COMENTADO)
-- =====================================================

-- INSERT INTO follow_up_sequences (organization_id, name, description, trigger_type, trigger_config, strategy)
-- VALUES (
--   '00000000-0000-0000-0000-000000000000', -- Reemplazar con org ID real
--   'Cotización no contestada',
--   'Seguimiento cuando el cliente pide precio pero no responde',
--   'keyword',
--   '{"keywords": ["precio", "cotización", "cuanto"]}'::jsonb,
--   'moderate'
-- ) RETURNING id;

-- =====================================================
-- FIN DE MIGRATION
-- =====================================================

-- Comentarios adicionales:
-- 1. Las tablas están optimizadas con índices para búsquedas rápidas
-- 2. Se usan constraints para mantener integridad referencial
-- 3. Las vistas facilitan consultas comunes
-- 4. El sistema soporta variables dinámicas en mensajes
-- 5. Tracking completo de conversiones y estadísticas
