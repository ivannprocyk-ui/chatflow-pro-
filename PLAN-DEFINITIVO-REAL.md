# 🎯 PLAN DEFINITIVO - ChatFlow Pro REAL

**Fecha:** 2025-11-17
**Arquitectura Real:** Chatwoot + Flowise + Evolution API/Meta API
**Frontend:** React + TypeScript
**Backend:** NestJS + Supabase
**Multi-tenant:** Login independiente por cliente

---

## 🏗️ ARQUITECTURA REAL

```
┌──────────────────────────────────────────────────────────┐
│                    FLUJO COMPLETO                         │
└──────────────────────────────────────────────────────────┘

Cliente en WhatsApp
      │
      ▼
┌─────────────┐
│ WhatsApp    │ ◄──────┐
│ (Evolution  │        │
│  o Meta)    │        │
└─────────────┘        │
      │                │
      ▼                │
┌─────────────┐        │
│  CHATWOOT   │        │ (5) Respuesta
│  (Inbox +   │        │     a WhatsApp
│   Webhook)  │        │
└─────────────┘        │
      │                │
      │ (1) Mensaje    │
      ▼                │
┌─────────────┐        │
│ ChatFlow    │        │
│ Backend     │        │
│ (Webhook    │        │
│  Receiver)  │        │
└─────────────┘        │
      │                │
      │ (2) Enviar     │
      ▼                │
┌─────────────┐        │
│  FLOWISE    │        │
│  (IA Bot +  │        │
│   Prompt    │        │
│   Config)   │        │
└─────────────┘        │
      │                │
      │ (3) Respuesta  │
      │     de IA      │
      ▼                │
┌─────────────┐        │
│ ChatFlow    │        │
│ Backend     │────────┘
│ (Procesar)  │ (4) Enviar a
└─────────────┘     Chatwoot
      │
      │ (6) Tracking
      ▼
┌─────────────┐
│  ChatFlow   │
│  Frontend   │
│  (Dashboard │
│   Métricas) │
└─────────────┘
```

---

## ✅ LO QUE YA ESTÁ

1. ✅ **Supabase Schema** - 20 tablas configuradas
2. ✅ **Frontend UI** - 18 módulos listos
3. ✅ **Backend NestJS** - Estructura básica
4. ✅ **Backend AI Service** - Integración OpenAI/Claude
5. ✅ **BotConfiguration.tsx** - UI lista (necesita conectar)
6. ✅ **BotAnalytics.tsx** - UI lista (necesita conectar)

---

## ❌ LO QUE FALTA (CRÍTICO)

### 1. **BASE DE DATOS OPERATIVA** 🔴
**Estado:** Schema existe, pero no está conectada

**Necesita:**
- [ ] Configurar Supabase en backend
- [ ] Crear tablas en Supabase dashboard
- [ ] RLS policies activas
- [ ] Seed data inicial

### 2. **LOGIN MULTI-TENANT** 🔴
**Estado:** No implementado

**Necesita:**
- [ ] Sistema de organizaciones
- [ ] Login/Register funcional
- [ ] JWT + Refresh tokens
- [ ] Cada cliente ve solo sus datos

### 3. **FLOWISE INTEGRATION** 🔴
**Estado:** No conectado

**Necesita:**
- [ ] Service para conectar con Flowise
- [ ] Enviar prompts dinámicos
- [ ] Recibir respuestas
- [ ] Manejo de errores

### 4. **CHATWOOT INTEGRATION** 🔴
**Estado:** No conectado

**Necesita:**
- [ ] Webhook receiver (mensajes entrantes)
- [ ] API client para enviar respuestas
- [ ] Capturar datos de contactos
- [ ] Sincronizar con Supabase

### 5. **AUTOMATIZACIONES OPERATIVAS** 🔴
**Estado:** UI existe pero no funciona

**Necesita:**
- [ ] Sistema de seguimiento de mensajes
- [ ] Detectar si cliente no responde
- [ ] Enviar mensaje automático
- [ ] Configurar tiempo de espera
- [ ] Mensaje con IA o plantilla

---

## 🎯 PLAN DE IMPLEMENTACIÓN (3 SEMANAS)

---

### **SEMANA 1: BASE + LOGIN + CHATWOOT**

#### **Día 1-2: Base de Datos + Login**

##### **A) Configurar Supabase**
```bash
# 1. Crear proyecto en Supabase
# 2. Ejecutar supabase-schema.sql
# 3. Configurar RLS policies
# 4. Verificar tablas

# Backend
backend/.env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx
DATABASE_URL=postgresql://xxx

backend/src/database/
  ├── supabase.module.ts
  ├── supabase.service.ts
  └── migrations/
      └── 001_initial.sql
```

##### **B) Implementar Auth Multi-tenant**
```typescript
backend/src/auth/
  ├── auth.module.ts
  ├── auth.controller.ts
  ├── auth.service.ts
  ├── jwt.strategy.ts
  ├── dto/
  │   ├── register.dto.ts
  │   └── login.dto.ts
  └── guards/
      ├── jwt-auth.guard.ts
      └── organization.guard.ts

Endpoints:
POST /api/auth/register    → Crear cuenta + organización
POST /api/auth/login       → Login + JWT
POST /api/auth/refresh     → Refresh token
GET  /api/auth/me          → Usuario actual

Supabase Tables:
- organizations (id, name, created_at)
- users (id, email, password_hash, organization_id)
- refresh_tokens (id, user_id, token, expires_at)
```

##### **C) Frontend Auth**
```typescript
src/react-app/contexts/AuthContext.tsx
src/react-app/pages/Login.tsx (actualizar)
src/react-app/pages/Register.tsx (actualizar)
src/react-app/utils/api.ts (axios + interceptor)

Features:
- Login con email/password
- Registro crea organización
- Guardar JWT en localStorage
- Interceptor añade token a requests
- Redirect si no autenticado
```

#### **Día 3-4: Chatwoot Integration**

##### **A) Chatwoot Service**
```typescript
backend/src/chatwoot/
  ├── chatwoot.module.ts
  ├── chatwoot.service.ts
  ├── chatwoot.controller.ts
  ├── dto/
  │   ├── chatwoot-webhook.dto.ts
  │   └── send-message.dto.ts
  └── interfaces/
      ├── conversation.interface.ts
      └── contact.interface.ts

Methods:
async sendMessage(params):
  - accountId
  - conversationId
  - content

async getContact(contactId):
  - Obtener datos del contacto

async getConversation(conversationId):
  - Obtener historial (últimos 10 mensajes)

async updateContactCustomAttributes():
  - Actualizar datos en Chatwoot

Endpoints:
POST /webhooks/chatwoot    → Recibir mensajes
POST /api/chatwoot/send    → Enviar mensaje (manual)
GET  /api/chatwoot/contacts/:id → Obtener contacto
```

##### **B) Webhook Receiver**
```typescript
// backend/src/chatwoot/chatwoot.controller.ts

@Post('webhooks/chatwoot')
async handleWebhook(@Body() payload: ChatwootWebhookDto) {

  if (payload.event === 'message_created' && payload.message_type === 'incoming') {

    // 1. Trackear mensaje recibido
    await this.trackingService.trackMessageReceived({
      conversationId: payload.conversation.id,
      contactId: payload.sender.id,
      timestamp: new Date(),
    });

    // 2. Obtener config del bot para esta organización
    const botConfig = await this.botConfigService.findByInboxId(payload.inbox.id);

    if (!botConfig || !botConfig.botEnabled) {
      return; // Bot desactivado
    }

    // 3. Verificar si debe responder automáticamente
    const shouldRespond = await this.shouldBotRespond(payload.conversation.id);

    if (!shouldRespond) {
      return; // Ya respondió o está en seguimiento humano
    }

    // 4. Enviar a Flowise
    const response = await this.flowiseService.sendMessage({
      message: payload.content,
      contactId: payload.sender.id,
      botConfig: botConfig,
    });

    // 5. Enviar respuesta a Chatwoot
    await this.chatwootService.sendMessage({
      accountId: botConfig.chatwootAccountId,
      conversationId: payload.conversation.id,
      content: response.answer,
    });

    // 6. Trackear mensaje enviado
    await this.trackingService.trackMessageSent({
      conversationId: payload.conversation.id,
      responseTime: response.responseTime,
      success: true,
    });
  }
}
```

#### **Día 5: Testing + Integración Frontend**
```typescript
// Frontend calls
src/react-app/services/chatwootService.ts

async getContactData(contactId: string): Promise<Contact>
async getConversationHistory(conversationId: string): Promise<Message[]>

// Mostrar en dashboard
src/react-app/pages/Dashboard.tsx
  → Actualizar con datos reales de Chatwoot
```

---

### **SEMANA 2: FLOWISE + BOT CONFIG + TRACKING**

#### **Día 1-2: Flowise Integration**

##### **A) Flowise Service**
```typescript
backend/src/flowise/
  ├── flowise.module.ts
  ├── flowise.service.ts
  ├── prompt-builder.service.ts
  └── dto/
      ├── flowise-request.dto.ts
      └── flowise-response.dto.ts

// flowise.service.ts
async sendMessage(params: {
  message: string;
  contactId: string;
  botConfig: BotConfig;
}): Promise<FlowiseResponse> {

  const prompt = this.promptBuilder.buildPrompt(botConfig);

  const response = await axios.post(process.env.FLOWISE_URL, {
    question: params.message,
    overrideConfig: {
      systemMessage: prompt,
    },
  });

  return {
    answer: response.data.text || response.data.answer,
    responseTime: response.data.responseTime,
  };
}

// prompt-builder.service.ts
buildPrompt(config: BotConfig): string {
  const templates = {
    vendedor: `Eres un vendedor profesional de {business_name}.
Tu objetivo es ayudar a los clientes a encontrar productos y cerrar ventas.

Información del negocio:
- Vendemos: {products}
- Horarios: {hours}
- Descripción: {description}

Tono: {tone}
Idioma: {language}

Instrucciones:
- Sé amable y proactivo
- Ofrece productos relacionados
- Si no sabes algo, deriva con un humano
- Siempre despídete preguntando si necesita algo más`,

    asistente: `...`,
    secretaria: `...`,
  };

  let prompt = config.agentType === 'custom'
    ? config.customPrompt
    : templates[config.agentType];

  return prompt
    .replace(/{business_name}/g, config.businessName)
    .replace(/{products}/g, config.products)
    .replace(/{hours}/g, config.businessHours)
    .replace(/{description}/g, config.businessDescription)
    .replace(/{tone}/g, config.tone)
    .replace(/{language}/g, config.language);
}
```

##### **B) Testing Panel**
```typescript
// Endpoint para testing en vivo
POST /api/flowise/test

@Post('test')
async testBot(@Body() dto: TestBotDto) {
  const response = await this.flowiseService.sendMessage({
    message: dto.message,
    contactId: 'test-user',
    botConfig: dto.botConfig,
  });

  return response;
}

// Frontend component
src/react-app/components/bot/BotTester.tsx
  → Panel de prueba con chat simulado
```

#### **Día 3-4: Bot Configuration Backend**

```typescript
backend/src/bot-config/
  ├── bot-config.module.ts
  ├── bot-config.controller.ts
  ├── bot-config.service.ts
  └── entities/
      └── bot-config.entity.ts

// Supabase table: bot_configs
CREATE TABLE bot_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),

  -- WhatsApp Connection
  connection_type VARCHAR(50), -- 'evolution_api' | 'meta_api'
  connection_status VARCHAR(50) DEFAULT 'disconnected',

  -- Evolution API
  evolution_api_url VARCHAR(255),
  evolution_instance_name VARCHAR(255),
  evolution_api_key VARCHAR(255),

  -- Meta API
  meta_business_account_id VARCHAR(255),
  meta_access_token TEXT,
  meta_phone_number_id VARCHAR(255),

  -- Chatwoot
  chatwoot_inbox_id VARCHAR(255),
  chatwoot_account_id VARCHAR(255),

  -- Bot Config
  agent_type VARCHAR(50) DEFAULT 'vendedor',
  business_name VARCHAR(255),
  business_description TEXT,
  products TEXT,
  business_hours VARCHAR(255),
  language VARCHAR(10) DEFAULT 'es',
  tone VARCHAR(50) DEFAULT 'casual',
  custom_prompt TEXT,

  -- Status
  bot_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

Endpoints:
GET    /api/bot-config                → Obtener config de org
POST   /api/bot-config                → Guardar config
PATCH  /api/bot-config/toggle         → Activar/desactivar bot
POST   /api/bot-config/test-prompt    → Probar prompt
```

#### **Día 5-7: Bot Tracking**

```typescript
backend/src/bot-tracking/
  ├── bot-tracking.module.ts
  ├── bot-tracking.service.ts
  ├── bot-tracking.controller.ts
  └── entities/
      └── bot-message-tracking.entity.ts

// Supabase table: bot_message_logs
CREATE TABLE bot_message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),

  -- Message metadata (NO content!)
  conversation_id VARCHAR(255),
  contact_id VARCHAR(255),
  direction VARCHAR(20), -- 'inbound' | 'outbound'

  -- Processing
  received_at TIMESTAMPTZ,
  sent_to_flowise_at TIMESTAMPTZ,
  flowise_responded_at TIMESTAMPTZ,
  sent_to_chatwoot_at TIMESTAMPTZ,

  -- Performance
  response_time_ms INTEGER,

  -- Status
  status VARCHAR(50), -- 'success' | 'error' | 'timeout'
  handled_by VARCHAR(50), -- 'ai' | 'human' | 'error'

  -- Error (if any)
  error_type VARCHAR(100),
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar índices para queries rápidas
CREATE INDEX idx_bot_logs_org ON bot_message_logs(organization_id);
CREATE INDEX idx_bot_logs_created ON bot_message_logs(created_at);
CREATE INDEX idx_bot_logs_status ON bot_message_logs(status);

Methods:
async trackMessageReceived(data)
async trackSentToFlowise(trackingId)
async trackFlowiseResponse(trackingId, success, responseTime)
async trackSentToChatwoot(trackingId, success)
async getMetrics(orgId, timeRange): Promise<BotMetrics>
async getRecentErrors(orgId, limit)
```

---

### **SEMANA 3: AUTOMATIZACIONES + EVOLUTION API + POLISH**

#### **Día 1-3: Sistema de Seguimiento Automático**

##### **Automatización: Si cliente no responde, enviar mensaje**

```typescript
backend/src/bot-automation/
  ├── bot-automation.module.ts
  ├── bot-automation.service.ts
  ├── follow-up.service.ts
  └── entities/
      └── follow-up-config.entity.ts

// Supabase table: follow_up_configs
CREATE TABLE follow_up_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),

  -- Trigger
  enabled BOOLEAN DEFAULT false,
  wait_time_minutes INTEGER DEFAULT 60, -- Esperar 1 hora

  -- Mensaje
  message_type VARCHAR(50), -- 'template' | 'ai_generated'
  template_message TEXT,
  ai_prompt TEXT, -- Si es AI generated

  -- Condiciones
  only_during_business_hours BOOLEAN DEFAULT true,
  max_follow_ups INTEGER DEFAULT 1, -- Máximo de seguimientos

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

// Supabase table: pending_follow_ups
CREATE TABLE pending_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  conversation_id VARCHAR(255),
  contact_id VARCHAR(255),

  -- Schedule
  scheduled_for TIMESTAMPTZ,
  follow_up_count INTEGER DEFAULT 0,

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending' | 'sent' | 'cancelled'
  sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

// Logic
@Cron('*/5 * * * *') // Cada 5 minutos
async checkPendingFollowUps() {

  // 1. Buscar conversaciones sin respuesta
  const conversations = await this.getPendingConversations();

  for (const conv of conversations) {
    const config = await this.getFollowUpConfig(conv.organizationId);

    if (!config.enabled) continue;

    // 2. Verificar si pasó el tiempo configurado
    const lastMessage = await this.getLastMessage(conv.id);
    const minutesSince = differenceInMinutes(new Date(), lastMessage.timestamp);

    if (minutesSince < config.wait_time_minutes) continue;

    // 3. Verificar horario de negocio
    if (config.only_during_business_hours) {
      const inBusinessHours = this.isInBusinessHours(conv.organizationId);
      if (!inBusinessHours) continue;
    }

    // 4. Verificar max follow-ups
    const followUpCount = await this.getFollowUpCount(conv.id);
    if (followUpCount >= config.max_follow_ups) continue;

    // 5. Generar mensaje
    let message: string;

    if (config.message_type === 'template') {
      message = config.template_message;
    } else {
      // Generar con IA
      message = await this.flowiseService.generateFollowUp({
        conversationHistory: await this.getConversationHistory(conv.id),
        aiPrompt: config.ai_prompt,
      });
    }

    // 6. Enviar mensaje
    await this.chatwootService.sendMessage({
      conversationId: conv.id,
      content: message,
    });

    // 7. Trackear
    await this.tracking.trackFollowUpSent(conv.id);
  }
}

// Frontend config
src/react-app/pages/AutomationConfig.tsx (nuevo)
  ├── Configurar tiempo de espera
  ├── Tipo de mensaje (plantilla o IA)
  ├── Horarios de negocio
  ├── Máximo de seguimientos
  └── Preview de mensaje
```

#### **Día 4-5: Evolution API Integration**

```typescript
backend/src/evolution-api/
  ├── evolution-api.module.ts
  ├── evolution-api.service.ts
  ├── evolution-api.controller.ts
  └── dto/
      ├── create-instance.dto.ts
      └── webhook-event.dto.ts

Methods:
async createInstance(name, apiKey): Promise<InstanceData>
async fetchQRCode(instanceName): Promise<string>
async getInstanceStatus(instanceName): Promise<ConnectionStatus>
async disconnectInstance(instanceName): Promise<void>
async sendMessage(instanceName, phoneNumber, message): Promise<void>

// Webhooks
POST /webhooks/evolution

@Post('webhooks/evolution')
async handleEvolutionWebhook(@Body() payload) {

  switch (payload.event) {
    case 'connection.update':
      // Actualizar estado en bot_configs
      await this.botConfigService.updateConnectionStatus(
        payload.instance,
        payload.data.state
      );
      break;

    case 'qrcode.updated':
      // Guardar QR en cache (Redis)
      await this.cacheQRCode(payload.instance, payload.data.qrcode);
      break;

    case 'messages.upsert':
      // Forward to Chatwoot (si no usa Chatwoot)
      // O procesar directamente
      break;
  }
}
```

#### **Día 6-7: Frontend Integration + Polish**

```typescript
// Conectar BotConfiguration.tsx con backend
src/react-app/pages/BotConfiguration.tsx
  ├── Fetch bot config desde API
  ├── Guardar config
  ├── Botón "Generar QR"
  ├── Estado de conexión en tiempo real
  ├── Panel de prueba funcional

// Conectar BotAnalytics.tsx con backend
src/react-app/pages/BotAnalytics.tsx
  ├── Fetch métricas reales
  ├── Gráficos con datos de Supabase
  ├── Tabla de errores
  ├── Refresh cada 30 segundos

// Nuevo: AutomationConfig.tsx
src/react-app/pages/AutomationConfig.tsx
  ├── Configurar seguimiento automático
  ├── Mensaje de follow-up
  ├── Tiempo de espera
  ├── Preview
```

---

## 📊 ENTREGABLES POR SEMANA

### **Semana 1:**
- ✅ Base de datos Supabase operativa
- ✅ Login multi-tenant funcional
- ✅ Chatwoot integration completa
- ✅ Webhook receiver funcionando
- ✅ Frontend conectado a backend

### **Semana 2:**
- ✅ Flowise integration funcional
- ✅ Bot configuration guardado en Supabase
- ✅ Prompts dinámicos funcionando
- ✅ Panel de prueba operativo
- ✅ Tracking de mensajes completo
- ✅ Dashboard con métricas reales

### **Semana 3:**
- ✅ Sistema de seguimiento automático
- ✅ Mensajes de follow-up configurables
- ✅ Evolution API integration
- ✅ QR code generation
- ✅ Frontend completamente integrado
- ✅ Testing + Bug fixes

**SISTEMA COMPLETAMENTE OPERATIVO** 🎉

---

## 🔑 VARIABLES DE ENTORNO NECESARIAS

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx
DATABASE_URL=postgresql://xxx

# Flowise
FLOWISE_URL=https://tu-flowise.com/api/v1/prediction/xxx

# Chatwoot
CHATWOOT_URL=https://tu-chatwoot.com
CHATWOOT_API_KEY=xxx
CHATWOOT_ACCOUNT_ID=xxx

# Evolution API (opcional)
EVOLUTION_API_URL=https://evolution.tu-dominio.com

# JWT
JWT_SECRET=xxx
JWT_REFRESH_SECRET=xxx
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Frontend
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=xxx
VITE_SUPABASE_ANON_KEY=xxx
```

---

## ❓ PREGUNTAS CRÍTICAS

**Necesito que me respondas:**

1. **Flowise:**
   - ¿URL de tu instancia Flowise?
   - ¿Ya configuraste el flow o lo configuro?
   - ¿Qué modelo LLM? (GPT-4/GPT-3.5/Claude)

2. **Chatwoot:**
   - ¿URL de Chatwoot?
   - ¿API Key?
   - ¿Cada cliente tiene su inbox o comparten?
   - ¿Cómo identificas los clientes? (inbox_id?)

3. **Evolution API:**
   - ¿URL de Evolution API?
   - ¿Está hosteado?
   - ¿O usarán Meta API oficial?

4. **Supabase:**
   - ¿URL del proyecto?
   - ¿Ya creaste el proyecto o lo creo?

5. **Hosting:**
   - ¿Dónde hostearás el backend? (Railway/Render/VPS)
   - ¿Dominio del frontend?

---

## 🚀 PRÓXIMO PASO

**Respondeme estas preguntas y arranco INMEDIATAMENTE con:**

1. Configurar Supabase + crear tablas
2. Implementar Auth multi-tenant
3. Setup Chatwoot webhook receiver

**¿Listo para empezar?** 🎯
