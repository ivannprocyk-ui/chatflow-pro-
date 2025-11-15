# 🚀 PLAN DE ACCIÓN INMEDIATO - CHATFLOW PRO AI BOT

**Fecha inicio:** 2025-11-14
**Estado:** LISTO PARA IMPLEMENTAR

---

## ✅ INFORMACIÓN CONFIRMADA

### 🔴 FLOWISE
- **URL:** Pendiente (creará enseguida)
- **Workflow:** El cliente lo crea
- **Modelo LLM:** Grok (no OpenAI)
- **Ubicación:** Mismo VPS que Evolution API

### 🔴 CHATWOOT
- **Arquitectura:** Multi-tenant (cada cliente = 1 cuenta)
- **Inbox:** Cada cliente tiene su propio inbox
- **Identificación:** Evolution API crea ID ChatWoot automáticamente
- **Diferenciación:** Por inbox_id

### 🔴 BACKEND
- **Stack:** NestJS (ya existe en el repo)
- **Auth:** JWT ya implementado
- **Multi-tenant:** Sistema de Organizations ya funcionando
- **Hosting:** VPS con Coolify
- **Estado:** ✅ Backend base listo, solo extender

### 🔴 EVOLUTION API
- **Ubicación:** Mismo VPS que Flowise
- **URL:** http://evo-o8osgcwwo0wcc8s480o4k888.173.249.14.83.sslip.io/manager/
- **Webhooks:** Disponibles (CONNECTION_UPDATE, QRCODE_UPDATED, etc.)

### 🔴 CLIENTES
- **Auth:** Login diferente por cliente
- **Sistema:** Multi-tenant con auth
- **Arquitectura:** 1 cliente = 1 organización = 1 cuenta

---

## 🏗️ ARQUITECTURA FINAL CONFIRMADA

```
┌─────────────────────────────────────────────────────────────┐
│                    STACK COMPLETO                            │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  CLIENTE FINAL   │ (Usuario de WhatsApp)
│   (WhatsApp)     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  EVOLUTION API   │ (Conexión WhatsApp no oficial)
│  o META API      │ (Conexión WhatsApp oficial)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    CHATWOOT      │ (Inbox, almacena mensajes)
│  (por cliente)   │
└────────┬─────────┘
         │ webhook: message_created
         ▼
┌──────────────────┐
│  CHATFLOW API    │ (Backend NestJS)
│   (Nuestro)      │
└────────┬─────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌──────────────┐   ┌──────────────┐
│   FLOWISE    │   │  TRACKING    │
│  (Grok AI)   │   │  (Métricas)  │
└──────────────┘   └──────────────┘
         │
         │ Respuesta IA
         ▼
┌──────────────────┐
│    CHATWOOT      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  EVOLUTION/META  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  CLIENTE FINAL   │
│   (WhatsApp)     │
└──────────────────┘
```

---

## 📦 MÓDULOS A DESARROLLAR

### ✅ BACKEND (NestJS)

#### 1. **BotConfig Module** (NUEVO)
```
backend/src/bot-config/
├── bot-config.module.ts
├── bot-config.controller.ts
├── bot-config.service.ts
└── dto/
    ├── create-bot-config.dto.ts
    └── update-bot-config.dto.ts
```

**Responsabilidades:**
- Guardar configuración del bot por organización
- Variables del negocio
- Tipo de agente (vendedor/asistente/secretaria)
- Prompt personalizado
- URL Flowise

#### 2. **EvolutionAPI Module** (NUEVO)
```
backend/src/evolution-api/
├── evolution-api.module.ts
├── evolution-api.controller.ts
├── evolution-api.service.ts
└── dto/
    ├── connect-instance.dto.ts
    └── instance-status.dto.ts
```

**Responsabilidades:**
- Conectar/desconectar instancia
- Generar QR code
- Verificar estado de conexión
- Recibir webhooks de Evolution

#### 3. **ChatWoot Integration Module** (NUEVO)
```
backend/src/chatwoot/
├── chatwoot.module.ts
├── chatwoot.controller.ts
├── chatwoot.service.ts
└── dto/
    ├── chatwoot-webhook.dto.ts
    └── send-message.dto.ts
```

**Responsabilidades:**
- Recibir webhook `message_created`
- Enviar mensaje a ChatWoot
- Gestión de inbox

#### 4. **Flowise Integration Module** (NUEVO)
```
backend/src/flowise/
├── flowise.module.ts
├── flowise.service.ts
└── dto/
    ├── flowise-request.dto.ts
    └── flowise-response.dto.ts
```

**Responsabilidades:**
- Construir prompt dinámico
- Enviar mensaje + contexto a Flowise
- Recibir respuesta
- Manejo de errores

#### 5. **Bot Tracking Module** (NUEVO)
```
backend/src/bot-tracking/
├── bot-tracking.module.ts
├── bot-tracking.controller.ts
├── bot-tracking.service.ts
└── entities/
    └── bot-message-tracking.entity.ts
```

**Responsabilidades:**
- Trackear metadata de mensajes
- Calcular métricas
- Detectar errores
- Alertas

#### 6. **Extender Webhooks Module**
```
backend/src/webhooks/
├── webhooks.controller.ts (EXTENDER)
│   ├── POST /webhooks/chatwoot
│   ├── POST /webhooks/evolution
│   └── POST /webhooks/meta
└── webhooks.service.ts (EXTENDER)
```

---

### ✅ FRONTEND (React)

#### 1. **Bot Configuration Page** (NUEVO)
```
src/react-app/pages/BotConfiguration.tsx
```

**Componentes:**
- Conexión WhatsApp (Evolution/Meta)
- Selector tipo de agente
- Variables del negocio
- Prompt personalizado
- Probar bot

#### 2. **Bot Analytics Page** (NUEVO)
```
src/react-app/pages/BotAnalytics.tsx
```

**Componentes:**
- Cards de métricas
- Gráficos (líneas, pastel, barras)
- Tabla de errores
- Alertas

#### 3. **Bot Service** (NUEVO)
```
src/react-app/services/botService.ts
```

**Funciones:**
- getBotConfig()
- updateBotConfig()
- connectInstance()
- getQRCode()
- getMetrics()
- getErrors()

#### 4. **Evolution Service** (NUEVO)
```
src/react-app/services/evolutionService.ts
```

**Funciones:**
- createInstance()
- getInstanceStatus()
- generateQR()
- disconnectInstance()

#### 5. **Actualizar AppNew.tsx**
```
src/react-app/AppNew.tsx
```

**Agregar rutas:**
- /bot/config → BotConfiguration
- /bot/analytics → BotAnalytics

#### 6. **Actualizar Sidebar.tsx**
```
src/react-app/components/Sidebar.tsx
```

**Agregar menú:**
- 🤖 Bot Configuration
- 📊 Bot Analytics

---

## 🗄️ ESTRUCTURA DE DATOS

### Backend (NestJS)

```typescript
// bot-config.entity.ts
interface BotConfig {
  id: string;
  organizationId: string;

  // WhatsApp Connection
  connectionType: 'evolution_api' | 'meta_api';
  connectionStatus: 'connected' | 'disconnected' | 'connecting';

  // Evolution API
  evolutionApiUrl?: string;
  evolutionInstanceName?: string;
  evolutionApiKey?: string; // Encriptado

  // Meta API
  metaBusinessAccountId?: string;
  metaAccessToken?: string; // Encriptado
  metaPhoneNumberId?: string;

  // ChatWoot
  chatwootInboxId?: string;
  chatwootAccountId?: string;

  // Bot Configuration
  agentType: 'vendedor' | 'asistente' | 'secretaria' | 'custom';
  businessName: string;
  businessDescription: string;
  products: string;
  businessHours: string;
  language: 'es' | 'en' | 'pt';
  tone: 'formal' | 'casual' | 'professional';
  customPrompt?: string;

  // Flowise (global, pero puede override por org)
  flowiseUrl?: string;

  // Estado
  botEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// bot-message-tracking.entity.ts
interface BotMessageTracking {
  id: string;
  organizationId: string;
  timestamp: Date;

  // Origen
  source: 'evolution_api' | 'meta_api';
  instanceId: string;

  // Direccion
  direction: 'inbound' | 'outbound';

  // Estado
  status: 'received' | 'processing' | 'sent' | 'failed';

  // Tiempos
  receivedAt?: Date;
  processedAt?: Date;
  sentAt?: Date;
  responseTime?: number; // ms

  // Procesamiento
  handledBy: 'ai' | 'human' | 'error';

  // Error
  error?: {
    type: string;
    message: string;
    code?: string;
  };

  // Contacto (solo ID)
  contactId: string;
  conversationId: string;
}

// bot-metrics.entity.ts (agregado)
interface BotMetrics {
  organizationId: string;
  period: 'hour' | 'day' | 'week' | 'month';
  startDate: Date;
  endDate: Date;

  // Métricas
  totalMessages: number;
  successfulMessages: number;
  failedMessages: number;
  avgResponseTime: number;
  activeConversations: number;

  // Por tipo
  aiHandled: number;
  humanHandled: number;

  // Errores
  errorCount: number;
  errorRate: number;
}
```

---

## 🔄 FLUJO COMPLETO DE MENSAJE

### 1. Usuario envía mensaje a WhatsApp

```
Usuario: "Hola, tienen iPhones?"
```

### 2. Evolution API recibe mensaje

```
Evolution API → Envía a ChatWoot
```

### 3. ChatWoot recibe mensaje

```
ChatWoot almacena el mensaje en inbox del cliente
```

### 4. ChatWoot envía webhook a nuestro backend

```http
POST http://chatflow-api.com/webhooks/chatwoot
Content-Type: application/json

{
  "event": "message_created",
  "id": "msg-123",
  "content": "Hola, tienen iPhones?",
  "inbox": {
    "id": "inbox-456",
    "name": "TechStore WhatsApp"
  },
  "conversation": {
    "id": "conv-789"
  },
  "sender": {
    "id": "contact-999",
    "phone_number": "+5491112345678"
  },
  "message_type": "incoming"
}
```

### 5. Nuestro backend procesa

```typescript
// webhooks.controller.ts
@Post('chatwoot')
async handleChatWootWebhook(@Body() webhook: ChatWootWebhookDto) {
  if (webhook.event !== 'message_created') return;
  if (webhook.message_type !== 'incoming') return;

  // 1. Identificar organización por inbox_id
  const botConfig = await this.botConfigService.findByInboxId(webhook.inbox.id);
  if (!botConfig || !botConfig.botEnabled) return;

  // 2. Trackear mensaje recibido
  const tracking = await this.trackingService.trackReceived({
    organizationId: botConfig.organizationId,
    contactId: webhook.sender.id,
    conversationId: webhook.conversation.id,
    source: botConfig.connectionType,
  });

  // 3. Construir prompt
  const prompt = await this.flowiseService.buildPrompt(
    botConfig,
    botConfig.agentType
  );

  // 4. Enviar a Flowise
  const aiResponse = await this.flowiseService.sendMessage({
    message: webhook.content,
    systemPrompt: prompt,
  });

  // 5. Trackear procesamiento
  await this.trackingService.trackProcessed(tracking.id, {
    success: true,
    responseTime: Date.now() - tracking.receivedAt.getTime(),
  });

  // 6. Enviar respuesta a ChatWoot
  await this.chatwootService.sendMessage({
    accountId: botConfig.chatwootAccountId,
    conversationId: webhook.conversation.id,
    content: aiResponse.answer,
  });

  // 7. Trackear envío
  await this.trackingService.trackSent(tracking.id, {
    success: true,
  });
}
```

### 6. ChatWoot recibe respuesta

```
ChatWoot → Envía a Evolution API → Envía a WhatsApp
```

### 7. Usuario recibe respuesta

```
Bot: "¡Hola! Sí, en TechStore tenemos varios modelos de iPhone disponibles..."
```

---

## 🎯 PLAN DE IMPLEMENTACIÓN - ORDEN DE DESARROLLO

### **FASE 1: BACKEND - BOT CONFIG** (2 días)
**Prioridad:** 🔴 CRÍTICA

- [ ] Crear BotConfig Module
- [ ] Crear entidad BotConfig
- [ ] CRUD endpoints:
  - GET /api/bot-config
  - POST /api/bot-config
  - PUT /api/bot-config
  - DELETE /api/bot-config
- [ ] Validaciones
- [ ] Testing

**Entregable:** API para guardar/cargar config del bot

---

### **FASE 2: BACKEND - EVOLUTION API** (2-3 días)
**Prioridad:** 🔴 CRÍTICA

- [ ] Crear EvolutionAPI Module
- [ ] Service para llamar Evolution API:
  - createInstance()
  - fetchQRCode()
  - getInstanceInfo()
  - logout()
- [ ] Webhook receiver:
  - POST /webhooks/evolution
  - Manejar CONNECTION_UPDATE
  - Manejar QRCODE_UPDATED
- [ ] Testing con Evolution API real

**Entregable:** Integración Evolution API completa

---

### **FASE 3: BACKEND - FLOWISE** (2 días)
**Prioridad:** 🔴 CRÍTICA

- [ ] Crear Flowise Module
- [ ] buildPrompt() según tipo de agente
- [ ] sendMessage() a Flowise
- [ ] Manejo de errores y timeouts
- [ ] Testing con Flowise real (cuando tengas URL)

**Entregable:** Integración Flowise funcional

---

### **FASE 4: BACKEND - CHATWOOT** (2-3 días)
**Prioridad:** 🔴 CRÍTICA

- [ ] Crear ChatWoot Module
- [ ] Webhook receiver:
  - POST /webhooks/chatwoot
  - Manejar message_created
- [ ] sendMessage() a ChatWoot
- [ ] Orquestar flujo completo:
  - Recibir → Flowise → Responder
- [ ] Testing end-to-end

**Entregable:** Flujo completo funcionando

---

### **FASE 5: BACKEND - TRACKING** (2 días)
**Prioridad:** 🟡 ALTA

- [ ] Crear BotTracking Module
- [ ] Trackear eventos
- [ ] Calcular métricas
- [ ] Endpoints:
  - GET /api/bot-metrics/:period
  - GET /api/bot-errors
  - GET /api/bot-alerts
- [ ] Testing

**Entregable:** Sistema de tracking completo

---

### **FASE 6: FRONTEND - BOT CONFIG** (3 días)
**Prioridad:** 🔴 CRÍTICA

- [ ] Crear BotConfiguration.tsx
- [ ] Formulario de conexión Evolution
- [ ] Selector tipo de agente
- [ ] Variables del negocio
- [ ] Preview de prompt
- [ ] Botón "Probar bot"
- [ ] Integrar con API backend
- [ ] Testing

**Entregable:** Panel de configuración funcional

---

### **FASE 7: FRONTEND - BOT ANALYTICS** (3-4 días)
**Prioridad:** 🟡 ALTA

- [ ] Crear BotAnalytics.tsx
- [ ] Cards de métricas
- [ ] Gráficos con Recharts:
  - Mensajes por hora (Line)
  - Distribución (Pie)
  - Conversaciones por día (Bar)
  - Tasa de éxito (Area)
- [ ] Tabla de errores
- [ ] Sistema de alertas
- [ ] Integrar con API backend
- [ ] Testing

**Entregable:** Dashboard de métricas vistoso

---

### **FASE 8: INTEGRACIÓN & TESTING** (3-4 días)
**Prioridad:** 🔴 CRÍTICA

- [ ] Testing end-to-end completo
- [ ] Manejo de errores en todos los puntos
- [ ] Logs y debugging
- [ ] Performance testing
- [ ] Documentación de APIs
- [ ] Deploy a VPS (Coolify)

**Entregable:** Sistema completo en producción

---

## ⏱️ TIMELINE TOTAL

**21-25 días de desarrollo**

| Fase | Descripción | Días | Acumulado |
|------|-------------|------|-----------|
| 1 | Backend - Bot Config | 2 | 2 |
| 2 | Backend - Evolution API | 2-3 | 4-5 |
| 3 | Backend - Flowise | 2 | 6-7 |
| 4 | Backend - ChatWoot | 2-3 | 8-10 |
| 5 | Backend - Tracking | 2 | 10-12 |
| 6 | Frontend - Bot Config | 3 | 13-15 |
| 7 | Frontend - Bot Analytics | 3-4 | 16-19 |
| 8 | Integración & Testing | 3-4 | 19-23 |
| **Buffer** | Ajustes finales | 2 | **21-25** |

---

## 📋 CHECKLIST PREVIO

Antes de empezar a codear, necesitas:

### ✅ Flowise
- [ ] Crear instancia Flowise en VPS
- [ ] Crear workflow/flow en Flowise
- [ ] Configurar modelo Grok
- [ ] Obtener URL de la API (ej: `http://flowise.tudominio.com/api/v1/prediction/{flowId}`)
- [ ] Probar que funciona con Postman

### ✅ ChatWoot (por cada cliente)
- [ ] Crear cuenta ChatWoot
- [ ] Crear inbox para WhatsApp
- [ ] Conectar inbox a Evolution API
- [ ] Configurar webhook a nuestro backend
- [ ] Anotar: inbox_id, account_id

### ✅ Evolution API
- [ ] Verificar que está corriendo
- [ ] Crear API Key
- [ ] Documentar endpoints disponibles
- [ ] Configurar webhooks a nuestro backend

### ✅ VPS/Coolify
- [ ] Preparar entorno para backend NestJS
- [ ] Configurar variables de entorno
- [ ] Configurar dominio/subdomain para API
- [ ] Configurar SSL

---

## 🚀 SIGUIENTE PASO INMEDIATO

**¿Qué hacemos ahora?**

**Opción A: Empiezo a codear el backend** (recomendado)
- Empiezo con FASE 1: BotConfig Module
- Mientras tanto, preparas Flowise

**Opción B: Esperamos que tengas Flowise listo**
- Preparas instancia Flowise
- Creas el workflow
- Me pasas la URL
- Arranco con todo

**Opción C: Hago todo en paralelo**
- Backend con mock de Flowise (hardcoded response)
- Cuando tengas Flowise, lo conectamos

---

## ❓ ¿Qué opción preferís?

1. **¿Arranco con el backend ahora?** (Opción A)
2. **¿Esperamos Flowise?** (Opción B)
3. **¿Hago mock de Flowise?** (Opción C)

**Recomendación:** Opción A - Arranco con backend y mientras preparas Flowise en paralelo.

---

**Esperando tu confirmación para arrancar 🚀**
