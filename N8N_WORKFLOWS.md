# 🤖 ChatFlow Pro - n8n Workflows

## Automatizaciones Poderosas para tu CRM

---

## 📋 ÍNDICE

1. [Setup Inicial](#setup-inicial)
2. [Workflow 1: Auto-respuesta Inteligente con IA](#workflow-1-auto-respuesta-inteligente)
3. [Workflow 2: Follow-up Automático](#workflow-2-follow-up-automático)
4. [Workflow 3: Calificación de Leads](#workflow-3-calificación-de-leads)
5. [Workflow 4: Alertas de Mensajes Fallidos](#workflow-4-alertas-mensajes-fallidos)
6. [Workflow 5: Sincronización con CRM Externo](#workflow-5-sync-crm-externo)
7. [Workflow 6: Reportes Automáticos](#workflow-6-reportes-automáticos)
8. [Workflow 7: Recuperación de Carritos Abandonados](#workflow-7-recuperación-carritos)
9. [Workflow 8: Recordatorios de Citas](#workflow-8-recordatorios-citas)

---

## 🎯 SETUP INICIAL

### Paso 1: Conectar n8n con ChatFlow Pro

En n8n, crear las siguientes **Credentials**:

#### 1.1. ChatFlow API Credential

```
Credential Type: HTTP Header Auth
Name: ChatFlow API
Header Name: Authorization
Header Value: Bearer {{API_TOKEN}}
```

Para obtener el API_TOKEN:

```bash
# Login en ChatFlow y obtener token
curl -X POST https://api.chatflow.tudominio.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tuorg.com",
    "password": "tu-password"
  }'
# Copiar el "accessToken" de la respuesta
```

#### 1.2. PostgreSQL Credential

```
Credential Type: Postgres
Host: chatflow-postgres (nombre del servicio en Coolify)
Database: chatflow_prod
User: chatflow_user
Password: [tu-password]
Port: 5432
SSL: Disable (si es red interna) o Enable (si es externa)
```

#### 1.3. Flowise API Credential

```
Credential Type: HTTP Header Auth
Name: Flowise API
Header Name: Authorization
Header Value: Bearer {{FLOWISE_API_KEY}}
```

### Paso 2: Variables de Entorno en n8n

Ir a **Settings** → **Environments** y agregar:

```bash
CHATFLOW_API_URL=https://api.chatflow.tudominio.com
FLOWISE_API_URL=https://flowise.tudominio.com/api/v1
FLOWISE_FLOW_ID=tu-flow-id-aqui
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
```

---

## 🤖 WORKFLOW 1: Auto-respuesta Inteligente

**Objetivo:** Cuando llega un mensaje de WhatsApp, responder automáticamente usando Flowise AI.

### Flujo

```
Mensaje WhatsApp → Webhook → Guardar en DB → Consultar IA → Enviar Respuesta
```

### Configuración Paso a Paso

#### Nodo 1: Webhook Trigger

```
Type: Webhook
HTTP Method: POST
Path: chatflow/message
```

**Body esperado:**

```json
{
  "from": "+1234567890",
  "message": "Hola, necesito información sobre sus productos",
  "organizationId": "org-uuid-aqui",
  "timestamp": "2024-01-01T10:00:00Z"
}
```

#### Nodo 2: PostgreSQL - Guardar Mensaje Entrante

```
Operation: Execute Query
Query:
INSERT INTO messages (
  organization_id,
  contact_id,
  direction,
  message_content,
  status
)
SELECT
  '{{$json.organizationId}}',
  c.id,
  'inbound',
  '{{$json.message}}',
  'received'
FROM contacts c
WHERE c.phone = '{{$json.from}}'
  AND c.organization_id = '{{$json.organizationId}}'
RETURNING id;
```

#### Nodo 3: PostgreSQL - Obtener Contexto del Contacto

```
Operation: Execute Query
Query:
SELECT
  c.phone,
  c.custom_fields->>'name' as name,
  c.custom_fields->>'email' as email,
  c.custom_fields->>'company' as company,
  c.status,
  c.messages_sent,
  o.name as organization_name
FROM contacts c
JOIN organizations o ON c.organization_id = o.id
WHERE c.phone = '{{$json.from}}'
  AND c.organization_id = '{{$json.organizationId}}'
LIMIT 1;
```

#### Nodo 4: Flowise - Obtener Respuesta IA

```
Method: POST
URL: {{$env.FLOWISE_API_URL}}/prediction/{{$env.FLOWISE_FLOW_ID}}
Authentication: Use Credential "Flowise API"

Headers:
{
  "Content-Type": "application/json"
}

Body:
{
  "question": "{{$json.message}}",
  "overrideConfig": {
    "sessionId": "{{$json.from}}",
    "vars": {
      "customer_name": "{{$node.Get Contact.json.name || 'Cliente'}}",
      "organization": "{{$node.Get Contact.json.organization_name}}",
      "customer_status": "{{$node.Get Contact.json.status}}"
    }
  }
}
```

#### Nodo 5: Function - Personalizar Respuesta

```javascript
// Obtener datos
const aiResponse = $input.item.json.text;
const contactName = $node["Get Contact"].json.name || "Cliente";

// Personalizar
let finalMessage = aiResponse;

// Si es primera interacción, agregar saludo personalizado
if ($node["Get Contact"].json.messages_sent === 0) {
  finalMessage = `¡Hola ${contactName}! 👋\n\n${aiResponse}`;
}

// Retornar
return {
  json: {
    message: finalMessage,
    phone: $json.from,
    organizationId: $json.organizationId
  }
};
```

#### Nodo 6: HTTP Request - Enviar Respuesta por WhatsApp

```
Method: POST
URL: {{$env.CHATFLOW_API_URL}}/messages/send
Authentication: Use Credential "ChatFlow API"

Body:
{
  "phone": "{{$json.phone}}",
  "message": "{{$json.message}}",
  "organizationId": "{{$json.organizationId}}",
  "isAutoReply": true
}
```

#### Nodo 7: PostgreSQL - Actualizar Última Interacción

```
Operation: Execute Query
Query:
UPDATE contacts
SET
  last_contact_at = NOW(),
  messages_received = messages_received + 1
WHERE phone = '{{$json.phone}}'
  AND organization_id = '{{$json.organizationId}}';
```

### Activar Workflow

1. Click en **Active** toggle (arriba derecha)
2. Copiar la URL del webhook
3. Configurar en tu backend de ChatFlow para llamar a esta URL cuando lleguen mensajes

---

## 📅 WORKFLOW 2: Follow-up Automático

**Objetivo:** Enviar mensajes de seguimiento a leads que no han sido contactados en X días.

### Flujo

```
Schedule (diario) → Buscar Leads → Loop → Enviar Mensaje → Actualizar DB
```

### Configuración

#### Nodo 1: Schedule Trigger

```
Mode: Every Day
Hour: 10
Minute: 0
```

#### Nodo 2: PostgreSQL - Buscar Leads sin Contacto

```
Operation: Execute Query
Query:
SELECT
  c.id,
  c.phone,
  c.custom_fields->>'name' as name,
  c.status,
  c.organization_id,
  o.name as organization_name,
  EXTRACT(DAY FROM NOW() - c.last_contact_at) as days_since_contact
FROM contacts c
JOIN organizations o ON c.organization_id = o.id
WHERE c.status IN ('lead', 'contacted')
  AND c.last_contact_at < NOW() - INTERVAL '3 days'
  AND c.messages_sent < 3
  AND o.is_active = true
ORDER BY c.last_contact_at ASC
LIMIT 100;
```

#### Nodo 3: Function - Determinar Mensaje según Días

```javascript
const daysSince = $json.days_since_contact;
const name = $json.name || "Cliente";
let template = '';
let variables = {};

if (daysSince >= 3 && daysSince < 7) {
  // First follow-up
  template = 'follow_up_day_3';
  variables = {
    name: name,
    days: '3'
  };
} else if (daysSince >= 7 && daysSince < 14) {
  // Second follow-up
  template = 'follow_up_day_7';
  variables = {
    name: name,
    offer: 'descuento especial del 10%'
  };
} else {
  // Final follow-up
  template = 'follow_up_final';
  variables = {
    name: name
  };
}

return {
  json: {
    ...$json,
    template: template,
    variables: variables
  }
};
```

#### Nodo 4: Split In Batches

```
Batch Size: 10
Options:
  - Keep Input Data: true
```

#### Nodo 5: HTTP Request - Enviar Mensaje Template

```
Method: POST
URL: {{$env.CHATFLOW_API_URL}}/messages/send-template
Authentication: Use Credential "ChatFlow API"

Body:
{
  "phone": "{{$json.phone}}",
  "templateName": "{{$json.template}}",
  "variables": {{$json.variables}},
  "organizationId": "{{$json.organization_id}}",
  "campaignName": "Follow-up Automático"
}
```

#### Nodo 6: Wait

```
Amount: 5
Unit: Seconds
```

*Esperar entre mensajes para evitar spam*

#### Nodo 7: PostgreSQL - Actualizar Contacto

```
Operation: Execute Query
Query:
UPDATE contacts
SET
  last_contact_at = NOW(),
  messages_sent = messages_sent + 1
WHERE id = '{{$json.id}}';
```

#### Nodo 8: PostgreSQL - Log de Actividad

```
Operation: Execute Query
Query:
INSERT INTO activity_logs (
  organization_id,
  action,
  entity_type,
  entity_id,
  description
)
VALUES (
  '{{$json.organization_id}}',
  'auto_followup_sent',
  'contact',
  '{{$json.id}}',
  'Follow-up automático enviado después de {{$json.days_since_contact}} días'
);
```

---

## 🎯 WORKFLOW 3: Calificación de Leads

**Objetivo:** Analizar conversaciones con IA y asignar score a leads automáticamente.

### Flujo

```
Webhook (nueva conversación) → Analizar con IA → Calcular Score → Actualizar Lead → Notificar Sales
```

### Configuración

#### Nodo 1: Webhook Trigger

```
Type: Webhook
HTTP Method: POST
Path: chatflow/conversation-ended
```

#### Nodo 2: PostgreSQL - Obtener Historial de Conversación

```
Operation: Execute Query
Query:
SELECT
  m.message_content,
  m.direction,
  m.sent_at,
  c.phone,
  c.custom_fields
FROM messages m
JOIN contacts c ON m.contact_id = c.id
WHERE c.id = '{{$json.contactId}}'
  AND m.sent_at >= NOW() - INTERVAL '24 hours'
ORDER BY m.sent_at ASC;
```

#### Nodo 3: Function - Preparar Conversación para IA

```javascript
const messages = $input.all();
let conversation = '';

messages.forEach(msg => {
  const direction = msg.json.direction === 'inbound' ? 'Cliente' : 'Bot';
  conversation += `${direction}: ${msg.json.message_content}\n`;
});

return {
  json: {
    conversation: conversation,
    contactId: $json.contactId,
    phone: messages[0].json.phone
  }
};
```

#### Nodo 4: HTTP Request - Analizar con OpenAI

```
Method: POST
URL: https://api.openai.com/v1/chat/completions
Authentication: Bearer Token (tu OpenAI API key)

Body:
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "Eres un experto en calificación de leads. Analiza la siguiente conversación y determina: 1) Nivel de interés (1-10), 2) Probabilidad de compra (%), 3) Pain points identificados, 4) Budget estimado (bajo/medio/alto), 5) Timeline de compra (inmediato/corto/largo plazo)."
    },
    {
      "role": "user",
      "content": "Conversación:\n{{$json.conversation}}"
    }
  ],
  "temperature": 0.3
}
```

#### Nodo 5: Function - Calcular Lead Score

```javascript
const aiAnalysis = JSON.parse($json.choices[0].message.content);

// Score de 0-100
let score = 0;

// Interés (40%)
score += (aiAnalysis.interes_nivel || 5) * 4;

// Probabilidad compra (30%)
score += (aiAnalysis.probabilidad_compra || 50) * 0.3;

// Budget (20%)
const budgetScores = { bajo: 5, medio: 15, alto: 20 };
score += budgetScores[aiAnalysis.budget] || 10;

// Timeline (10%)
const timelineScores = { inmediato: 10, corto: 7, largo: 3 };
score += timelineScores[aiAnalysis.timeline] || 5;

// Clasificación
let leadStatus = 'cold';
if (score >= 70) leadStatus = 'hot';
else if (score >= 40) leadStatus = 'warm';

return {
  json: {
    contactId: $node["Webhook"].json.contactId,
    score: Math.round(score),
    status: leadStatus,
    analysis: aiAnalysis
  }
};
```

#### Nodo 6: PostgreSQL - Actualizar Lead

```
Operation: Execute Query
Query:
UPDATE contacts
SET
  status = '{{$json.status}}',
  custom_fields = jsonb_set(
    custom_fields,
    '{lead_score}',
    '{{$json.score}}'
  ),
  custom_fields = jsonb_set(
    custom_fields,
    '{ai_analysis}',
    '{{JSON.stringify($json.analysis)}}'
  )
WHERE id = '{{$json.contactId}}';
```

#### Nodo 7: IF - Score Alto?

```
Condition: Number
Value 1: {{$json.score}}
Operation: Larger
Value 2: 70
```

#### Nodo 8A: Slack - Notificar a Sales (si score alto)

```
Webhook URL: {{$env.SLACK_WEBHOOK_URL}}

Message:
{
  "text": "🔥 *LEAD CALIENTE DETECTADO* 🔥",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Lead Score:* {{$json.score}}/100\n*Teléfono:* {{$node.Webhook.json.phone}}\n*Probabilidad de Compra:* {{$json.analysis.probabilidad_compra}}%\n*Timeline:* {{$json.analysis.timeline}}"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Ver en ChatFlow"
          },
          "url": "https://chatflow.tudominio.com/contacts/{{$json.contactId}}"
        }
      ]
    }
  ]
}
```

---

## 🚨 WORKFLOW 4: Alertas de Mensajes Fallidos

**Objetivo:** Notificar inmediatamente cuando un mensaje falla.

### Flujo

```
Webhook (mensaje fallido) → Verificar intentos → Slack/Email Notification
```

### Configuración

#### Nodo 1: Webhook Trigger

```
Type: Webhook
HTTP Method: POST
Path: chatflow/message-failed
```

**Body esperado:**

```json
{
  "messageId": "msg-uuid",
  "phone": "+1234567890",
  "error": "Invalid phone number",
  "organizationId": "org-uuid",
  "attemptNumber": 1
}
```

#### Nodo 2: PostgreSQL - Obtener Info del Mensaje

```
Operation: Execute Query
Query:
SELECT
  m.id,
  m.template_name,
  m.campaign_name,
  c.phone,
  c.custom_fields->>'name' as contact_name,
  o.name as organization_name
FROM messages m
JOIN contacts c ON m.contact_id = c.id
JOIN organizations o ON m.organization_id = o.id
WHERE m.id = '{{$json.messageId}}';
```

#### Nodo 3: IF - ¿Es tercer intento fallido?

```
Condition: Number
Value 1: {{$json.attemptNumber}}
Operation: Larger Equal
Value 2: 3
```

#### Nodo 4A: Slack - Alerta Crítica (3+ intentos)

```
Webhook URL: {{$env.SLACK_WEBHOOK_URL}}

Message:
{
  "text": "🚨 *ALERTA CRÍTICA: Mensaje Fallido Múltiples Veces*",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Organización:* {{$node.Get Message Info.json.organization_name}}\n*Contacto:* {{$node.Get Message Info.json.contact_name}} ({{$node.Get Message Info.json.phone}})\n*Template:* {{$node.Get Message Info.json.template_name}}\n*Error:* {{$json.error}}\n*Intentos:* {{$json.attemptNumber}}"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "⚠️ *Este mensaje ha fallado {{$json.attemptNumber}} veces. Requiere atención manual.*"
      }
    }
  ]
}
```

#### Nodo 4B: Email - Notificación Simple (1-2 intentos)

```
To: support@tuempresa.com
Subject: Mensaje fallido en ChatFlow Pro
Body:
Mensaje fallido:

Organización: {{$node.Get Message Info.json.organization_name}}
Contacto: {{$node.Get Message Info.json.contact_name}}
Teléfono: {{$node.Get Message Info.json.phone}}
Error: {{$json.error}}
Intento: {{$json.attemptNumber}}

El sistema reintentará automáticamente.
```

#### Nodo 5: PostgreSQL - Log del Error

```
Operation: Execute Query
Query:
INSERT INTO activity_logs (
  organization_id,
  action,
  entity_type,
  entity_id,
  description,
  metadata
)
VALUES (
  '{{$json.organizationId}}',
  'message_failed',
  'message',
  '{{$json.messageId}}',
  'Mensaje fallido: {{$json.error}}',
  '{"attemptNumber": {{$json.attemptNumber}}, "error": "{{$json.error}}"}'::jsonb
);
```

---

## 🔄 WORKFLOW 5: Sincronización con CRM Externo

**Objetivo:** Sincronizar contactos bidireccional con HubSpot/Salesforce.

### Flujo

```
Schedule → Obtener Contactos Nuevos/Actualizados → Sync a HubSpot → Update Local DB
```

### Configuración para HubSpot

#### Nodo 1: Schedule Trigger

```
Mode: Every 15 Minutes
```

#### Nodo 2: PostgreSQL - Contactos Modificados

```
Operation: Execute Query
Query:
SELECT
  id,
  phone,
  custom_fields->>'name' as firstname,
  custom_fields->>'email' as email,
  custom_fields->>'company' as company,
  status,
  updated_at,
  custom_fields->>'hubspot_id' as hubspot_id
FROM contacts
WHERE updated_at >= NOW() - INTERVAL '15 minutes'
  AND organization_id = 'tu-org-id-aqui';
```

#### Nodo 3: IF - ¿Ya existe en HubSpot?

```
Condition: String
Value 1: {{$json.hubspot_id}}
Operation: Is Not Empty
```

#### Nodo 4A: HubSpot - Actualizar Contacto Existente

```
Method: PATCH
URL: https://api.hubapi.com/crm/v3/objects/contacts/{{$json.hubspot_id}}
Authentication: Bearer Token (tu HubSpot API key)

Body:
{
  "properties": {
    "phone": "{{$json.phone}}",
    "firstname": "{{$json.firstname}}",
    "email": "{{$json.email}}",
    "company": "{{$json.company}}",
    "lifecyclestage": "{{$json.status}}",
    "chatflow_id": "{{$json.id}}"
  }
}
```

#### Nodo 4B: HubSpot - Crear Nuevo Contacto

```
Method: POST
URL: https://api.hubapi.com/crm/v3/objects/contacts
Authentication: Bearer Token (tu HubSpot API key)

Body:
{
  "properties": {
    "phone": "{{$json.phone}}",
    "firstname": "{{$json.firstname}}",
    "email": "{{$json.email}}",
    "company": "{{$json.company}}",
    "lifecyclestage": "{{$json.status}}",
    "chatflow_id": "{{$json.id}}"
  }
}
```

#### Nodo 5: PostgreSQL - Guardar HubSpot ID

```
Operation: Execute Query
Query:
UPDATE contacts
SET custom_fields = jsonb_set(
  custom_fields,
  '{hubspot_id}',
  '"{{$json.id}}"'
)
WHERE id = '{{$node.Get Contacts.json.id}}';
```

#### Nodo 6: PostgreSQL - Log de Sync

```
Operation: Execute Query
Query:
INSERT INTO activity_logs (
  organization_id,
  action,
  entity_type,
  entity_id,
  description
)
VALUES (
  'tu-org-id-aqui',
  'hubspot_sync',
  'contact',
  '{{$node.Get Contacts.json.id}}',
  'Contacto sincronizado con HubSpot ID: {{$json.id}}'
);
```

---

## 📊 WORKFLOW 6: Reportes Automáticos

**Objetivo:** Enviar reporte semanal por email con métricas clave.

### Flujo

```
Schedule (semanal) → Query Métricas → Generar HTML → Enviar Email
```

### Configuración

#### Nodo 1: Schedule Trigger

```
Mode: Weekday(s)
Weekday: Monday
Hour: 9
Minute: 0
```

#### Nodo 2: PostgreSQL - Métricas de la Semana

```
Operation: Execute Query
Query:
WITH week_stats AS (
  SELECT
    COUNT(DISTINCT c.id) as new_contacts,
    COUNT(m.id) as total_messages,
    SUM(CASE WHEN m.status = 'delivered' THEN 1 ELSE 0 END) as delivered,
    SUM(CASE WHEN m.status = 'failed' THEN 1 ELSE 0 END) as failed,
    COUNT(DISTINCT m.contact_id) as active_contacts
  FROM contacts c
  LEFT JOIN messages m ON m.contact_id = c.id
    AND m.sent_at >= NOW() - INTERVAL '7 days'
  WHERE c.organization_id = 'tu-org-id-aqui'
    AND c.created_at >= NOW() - INTERVAL '7 days'
)
SELECT
  *,
  ROUND((delivered::numeric / NULLIF(total_messages, 0)) * 100, 2) as delivery_rate
FROM week_stats;
```

#### Nodo 3: PostgreSQL - Top Contactos

```
Operation: Execute Query
Query:
SELECT
  c.custom_fields->>'name' as name,
  c.phone,
  COUNT(m.id) as message_count,
  MAX(m.sent_at) as last_message
FROM contacts c
JOIN messages m ON m.contact_id = c.id
WHERE m.sent_at >= NOW() - INTERVAL '7 days'
  AND c.organization_id = 'tu-org-id-aqui'
GROUP BY c.id, c.custom_fields->>'name', c.phone
ORDER BY message_count DESC
LIMIT 10;
```

#### Nodo 4: Function - Generar HTML del Reporte

```javascript
const stats = $node["Métricas"].json;
const topContacts = $input.all();

const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .header { background: #4F46E5; color: white; padding: 20px; }
    .metric { display: inline-block; margin: 20px; text-align: center; }
    .metric-value { font-size: 48px; font-weight: bold; color: #4F46E5; }
    .metric-label { color: #666; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f3f4f6; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Reporte Semanal - ChatFlow Pro</h1>
    <p>Semana del ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()} al ${new Date().toLocaleDateString()}</p>
  </div>

  <div style="padding: 20px;">
    <h2>Métricas Generales</h2>

    <div class="metric">
      <div class="metric-value">${stats.new_contacts}</div>
      <div class="metric-label">Nuevos Contactos</div>
    </div>

    <div class="metric">
      <div class="metric-value">${stats.total_messages}</div>
      <div class="metric-label">Mensajes Enviados</div>
    </div>

    <div class="metric">
      <div class="metric-value">${stats.delivery_rate}%</div>
      <div class="metric-label">Tasa de Entrega</div>
    </div>

    <div class="metric">
      <div class="metric-value">${stats.active_contacts}</div>
      <div class="metric-label">Contactos Activos</div>
    </div>

    <h2>Top 10 Contactos Más Activos</h2>
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Teléfono</th>
          <th>Mensajes</th>
          <th>Último Contacto</th>
        </tr>
      </thead>
      <tbody>
        ${topContacts.map(contact => `
          <tr>
            <td>${contact.json.name || 'Sin nombre'}</td>
            <td>${contact.json.phone}</td>
            <td>${contact.json.message_count}</td>
            <td>${new Date(contact.json.last_message).toLocaleDateString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <p style="margin-top: 40px; color: #666; font-size: 12px;">
      Este es un reporte automático generado por ChatFlow Pro.
    </p>
  </div>
</body>
</html>
`;

return {
  json: {
    html: html,
    stats: stats
  }
};
```

#### Nodo 5: Send Email

```
To: admin@tuempresa.com
Subject: 📊 Reporte Semanal ChatFlow Pro - {{new Date().toLocaleDateString()}}
Body Type: HTML
Body: {{$json.html}}
```

---

## 🛒 WORKFLOW 7: Recuperación de Carritos Abandonados

**Objetivo:** Detectar carritos abandonados en tu e-commerce y enviar recordatorios.

*(Requiere integración con tu plataforma de e-commerce)*

### Flujo

```
Webhook (carrito abandonado) → Esperar 1 hora → Enviar Recordatorio → Esperar 24h → Ofrecer Descuento
```

### Configuración

#### Nodo 1: Webhook Trigger

```
Type: Webhook
HTTP Method: POST
Path: chatflow/cart-abandoned
```

**Body desde tu e-commerce:**

```json
{
  "cartId": "cart-123",
  "phone": "+1234567890",
  "customerName": "Juan Pérez",
  "items": [
    {"name": "Producto A", "price": 50},
    {"name": "Producto B", "price": 30}
  ],
  "total": 80,
  "abandonedAt": "2024-01-01T15:30:00Z"
}
```

#### Nodo 2: Wait

```
Amount: 1
Unit: Hours
```

#### Nodo 3: HTTP Request - Verificar si Completó Compra

```
Method: GET
URL: https://tu-ecommerce.com/api/carts/{{$json.cartId}}
```

#### Nodo 4: IF - ¿Carrito Aún Abandonado?

```
Condition: String
Value 1: {{$json.status}}
Operation: Equal
Value 2: abandoned
```

#### Nodo 5: ChatFlow API - Enviar Recordatorio Suave

```
Method: POST
URL: {{$env.CHATFLOW_API_URL}}/messages/send-template
Authentication: Use Credential "ChatFlow API"

Body:
{
  "phone": "{{$node.Webhook.json.phone}}",
  "templateName": "cart_reminder",
  "variables": {
    "name": "{{$node.Webhook.json.customerName}}",
    "items_count": "{{$node.Webhook.json.items.length}}",
    "total": "{{$node.Webhook.json.total}}"
  },
  "organizationId": "tu-org-id"
}
```

#### Nodo 6: Wait

```
Amount: 24
Unit: Hours
```

#### Nodo 7: HTTP Request - Verificar de Nuevo

*(Repetir Nodo 3)*

#### Nodo 8: IF - ¿Sigue Abandonado?

*(Repetir Nodo 4)*

#### Nodo 9: ChatFlow API - Enviar con Descuento

```
Method: POST
URL: {{$env.CHATFLOW_API_URL}}/messages/send-template

Body:
{
  "phone": "{{$node.Webhook.json.phone}}",
  "templateName": "cart_reminder_discount",
  "variables": {
    "name": "{{$node.Webhook.json.customerName}}",
    "discount": "10%",
    "expiry": "24 horas"
  },
  "organizationId": "tu-org-id"
}
```

#### Nodo 10: PostgreSQL - Log de Conversión

```
Operation: Execute Query
Query:
INSERT INTO activity_logs (
  organization_id,
  action,
  description,
  metadata
)
VALUES (
  'tu-org-id',
  'cart_recovery_attempted',
  'Carrito {{$node.Webhook.json.cartId}} - 2 recordatorios enviados',
  '{"cartId": "{{$node.Webhook.json.cartId}}", "total": {{$node.Webhook.json.total}}}'::jsonb
);
```

---

## 📅 WORKFLOW 8: Recordatorios de Citas

**Objetivo:** Enviar recordatorios automáticos 24h y 1h antes de citas.

### Flujo

```
Schedule (cada hora) → Buscar Citas Próximas → Enviar Recordatorio
```

### Configuración

#### Nodo 1: Schedule Trigger

```
Mode: Every Hour
```

#### Nodo 2: PostgreSQL - Citas en 24 horas

```
Operation: Execute Query
Query:
SELECT
  e.id,
  e.title,
  e.start_time,
  c.phone,
  c.custom_fields->>'name' as customer_name,
  e.organization_id,
  EXTRACT(HOUR FROM e.start_time - NOW()) as hours_until
FROM calendar_events e
JOIN contacts c ON e.contact_id = c.id
WHERE e.start_time BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '25 hours'
  AND e.reminder_sent = false
  AND e.organization_id = 'tu-org-id';
```

#### Nodo 3: Loop Over Items

```
Batch Size: 1
```

#### Nodo 4: ChatFlow API - Enviar Recordatorio 24h

```
Method: POST
URL: {{$env.CHATFLOW_API_URL}}/messages/send-template

Body:
{
  "phone": "{{$json.phone}}",
  "templateName": "appointment_reminder_24h",
  "variables": {
    "name": "{{$json.customer_name}}",
    "appointment": "{{$json.title}}",
    "date": "{{new Date($json.start_time).toLocaleDateString()}}",
    "time": "{{new Date($json.start_time).toLocaleTimeString()}}"
  },
  "organizationId": "{{$json.organization_id}}"
}
```

#### Nodo 5: PostgreSQL - Marcar como Enviado

```
Operation: Execute Query
Query:
UPDATE calendar_events
SET reminder_sent = true
WHERE id = '{{$json.id}}';
```

#### Nodo 6: PostgreSQL - Citas en 1 hora

```
Operation: Execute Query
Query:
SELECT
  e.id,
  e.title,
  e.start_time,
  c.phone,
  c.custom_fields->>'name' as customer_name,
  e.organization_id
FROM calendar_events e
JOIN contacts c ON e.contact_id = c.id
WHERE e.start_time BETWEEN NOW() + INTERVAL '50 minutes' AND NOW() + INTERVAL '70 minutes'
  AND e.organization_id = 'tu-org-id'
  AND NOT EXISTS (
    SELECT 1 FROM messages m
    WHERE m.contact_id = c.id
      AND m.template_name = 'appointment_reminder_1h'
      AND m.sent_at >= NOW() - INTERVAL '2 hours'
  );
```

#### Nodo 7: ChatFlow API - Recordatorio 1h

```
Method: POST
URL: {{$env.CHATFLOW_API_URL}}/messages/send-template

Body:
{
  "phone": "{{$json.phone}}",
  "templateName": "appointment_reminder_1h",
  "variables": {
    "name": "{{$json.customer_name}}",
    "appointment": "{{$json.title}}",
    "time": "{{new Date($json.start_time).toLocaleTimeString()}}"
  },
  "organizationId": "{{$json.organization_id}}"
}
```

---

## 🎯 TIPS Y MEJORES PRÁCTICAS

### 1. Error Handling

Siempre agregar nodos de **Error Trigger** para capturar errores:

```
Error Trigger → Log a Database → Send Alert
```

### 2. Rate Limiting

Agregar nodos **Wait** entre envíos masivos:

```
Split In Batches (10) → Send Message → Wait (5 seconds)
```

### 3. Testing

Crear una organización de "test" en ChatFlow y probar workflows ahí primero.

### 4. Monitoring

Crear dashboard en Metabase para monitorear:
- Workflows ejecutados por día
- Tasa de éxito/fallo
- Tiempo promedio de ejecución

### 5. Documentación

Agregar notas en cada workflow explicando qué hace y cuándo se activa.

---

## 📚 RECURSOS

- [n8n Docs](https://docs.n8n.io/)
- [n8n Community Workflows](https://n8n.io/workflows)
- [ChatFlow Pro API Docs](https://api.chatflow.tudominio.com/docs)

---

¡Con estos 8 workflows tu ChatFlow Pro estará **súper automatizado**! 🚀

Cada workflow es modular y puedes combinarlos o modificarlos según tus necesidades específicas.
