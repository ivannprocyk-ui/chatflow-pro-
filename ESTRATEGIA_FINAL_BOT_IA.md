# 🚀 ESTRATEGIA FINAL - BOT IA DESDE CERO

**Fecha:** 2025-11-14
**Decisión:** Automatizaciones NO FUNCIONA → Ignorar y crear Bot IA limpio

---

## ✅ CLARIFICACIÓN IMPORTANTE

### ❌ Automatizaciones actuales:
- **NO FUNCIONA** ✗
- Solo cáscara visual
- Lleno de bugs y fixes
- Canvas con nodos que no andan
- **IGNORAR COMPLETAMENTE**

### ✅ Lo que SÍ vamos a hacer:
- **BOT IA CONVERSACIONAL desde cero**
- Backend limpio
- Frontend funcional
- Integración real con Flowise + ChatWoot + Evolution

---

## 🎯 NUEVA ESTRATEGIA SIMPLIFICADA

### **NO tocar/usar:**
- ❌ `Automations.tsx`
- ❌ `FlowBuilder.tsx`
- ❌ `automationStorage.ts`
- ❌ `flowEngine.ts`

**→ Los dejamos ahí pero NO los usamos**

### **Crear TODO NUEVO:**
- ✅ Backend: Módulos de Bot IA
- ✅ Frontend: BotConfiguration + BotAnalytics
- ✅ Integración completa funcional

---

## 🏗️ ARQUITECTURA LIMPIA

### **Backend NestJS (Extender lo que YA FUNCIONA):**

```
backend/src/
├── ai/                      ✅ YA EXISTE - FUNCIONA
│   ├── ai.service.ts        → Extender con nuevos métodos
│   └── prompt-templates.ts  → Ya tiene templates por rol
│
├── bot-config/              🆕 NUEVO - Crear desde cero
│   ├── bot-config.module.ts
│   ├── bot-config.controller.ts
│   ├── bot-config.service.ts
│   └── entities/bot-config.entity.ts
│
├── evolution-api/           🆕 NUEVO - Crear desde cero
│   ├── evolution-api.module.ts
│   ├── evolution-api.controller.ts
│   └── evolution-api.service.ts
│
├── chatwoot/                🆕 NUEVO - Crear desde cero
│   ├── chatwoot.module.ts
│   ├── chatwoot.controller.ts
│   └── chatwoot.service.ts
│
└── bot-tracking/            🆕 NUEVO - Crear desde cero
    ├── bot-tracking.module.ts
    ├── bot-tracking.controller.ts
    ├── bot-tracking.service.ts
    └── entities/bot-message-tracking.entity.ts
```

### **Frontend React (TODO NUEVO):**

```
src/react-app/pages/
├── BotConfiguration.tsx     🆕 NUEVO - Panel config bot
└── BotAnalytics.tsx         🆕 NUEVO - Dashboard métricas

src/react-app/services/
├── botService.ts            🆕 NUEVO - API calls
└── evolutionService.ts      🆕 NUEVO - Evolution API

src/react-app/components/bot/
├── ConnectionPanel.tsx      🆕 NUEVO - Conectar WhatsApp
├── AgentSelector.tsx        🆕 NUEVO - Tipo de agente
├── PromptEditor.tsx         🆕 NUEVO - Editar prompt
└── MetricsCard.tsx          🆕 NUEVO - Tarjetas métricas
```

---

## 📊 MENÚ FINAL DE LA PLATAFORMA

```
📱 CHATFLOW PRO

📊 Dashboard
💬 Chat
📧 Mensajes Masivos
📅 Calendario
👥 CRM
📋 Listas de Contactos
📝 Plantillas
📜 Historial de Campañas

━━━━━━━━━━━━━━━━━━━━━━━━

🤖 BOT IA                    ← NUEVO (LO QUE VAMOS A HACER)
├── ⚙️ Configuración
│   ├── Conectar WhatsApp (Evolution/Meta)
│   ├── Tipo de Agente (Vendedor/Asistente/Secretaria)
│   ├── Variables del Negocio
│   └── Prompt Personalizado
│
└── 📊 Métricas
    ├── Mensajes procesados
    ├── Tasa de éxito
    ├── Errores
    └── Tiempo de respuesta

━━━━━━━━━━━━━━━━━━━━━━━━

(Automatizaciones - Ignorar por ahora)
```

---

## 🚀 PLAN DE DESARROLLO LIMPIO

### **FASE 1: BACKEND - BOT CONFIG** (2 días)
**Objetivo:** Guardar configuración del bot por organización

**Crear:**
```typescript
// backend/src/bot-config/entities/bot-config.entity.ts
export interface BotConfig {
  id: string;
  organizationId: string;

  // Conexión WhatsApp
  connectionType: 'evolution_api' | 'meta_api';
  connectionStatus: 'connected' | 'disconnected' | 'connecting';

  // Evolution API
  evolutionApiUrl?: string;
  evolutionInstanceName?: string;
  evolutionApiKey?: string;

  // Meta API
  metaBusinessAccountId?: string;
  metaAccessToken?: string;
  metaPhoneNumberId?: string;

  // ChatWoot
  chatwootInboxId?: string;

  // Configuración del Bot
  agentType: 'vendedor' | 'asistente' | 'secretaria' | 'custom';
  businessName: string;
  businessDescription: string;
  products: string;
  businessHours: string;
  language: 'es' | 'en' | 'pt';
  tone: 'formal' | 'casual' | 'professional';
  customPrompt?: string;

  // Estado
  botEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Endpoints
GET    /api/bot-config                    → Obtener config
POST   /api/bot-config                    → Crear/actualizar config
DELETE /api/bot-config                    → Eliminar config
PATCH  /api/bot-config/toggle             → Activar/desactivar bot
```

**Entregable:** API para configurar el bot ✅

---

### **FASE 2: BACKEND - EVOLUTION API** (2 días)
**Objetivo:** Conectar/desconectar instancias WhatsApp

**Crear:**
```typescript
// backend/src/evolution-api/evolution-api.service.ts

async createInstance(instanceName: string, apiKey: string): Promise<any>
async fetchQRCode(instanceName: string): Promise<string>
async getInstanceStatus(instanceName: string): Promise<ConnectionStatus>
async disconnectInstance(instanceName: string): Promise<void>

// Webhook receiver
POST /webhooks/evolution
  → Recibir CONNECTION_UPDATE
  → Recibir QRCODE_UPDATED
  → Actualizar estado en BotConfig
```

**Entregable:** Manejo completo de Evolution API ✅

---

### **FASE 3: BACKEND - EXTENDER AI SERVICE** (1 día)
**Objetivo:** Agregar método para manejar mensajes de ChatWoot

**Modificar:**
```typescript
// backend/src/ai/ai.service.ts

// MÉTODO NUEVO
async handleChatWootMessage(
  webhook: ChatWootWebhookDto
): Promise<void> {
  // 1. Identificar organización por inbox_id
  const botConfig = await this.botConfigService.findByInboxId(webhook.inbox.id);

  // 2. Verificar que bot esté habilitado
  if (!botConfig?.botEnabled) return;

  // 3. Construir prompt personalizado
  const systemPrompt = this.buildCustomPrompt(botConfig);

  // 4. Generar respuesta (usa método existente)
  const aiResponse = await this.generateResponse(
    botConfig.organizationId,
    webhook.sender.phone_number,
    webhook.content,
    []
  );

  // 5. Enviar respuesta a ChatWoot
  await this.chatwootService.sendMessage({
    accountId: botConfig.chatwootAccountId,
    conversationId: webhook.conversation.id,
    content: aiResponse
  });

  // 6. Trackear
  await this.trackingService.track({...});
}

// MÉTODO NUEVO
buildCustomPrompt(botConfig: BotConfig): string {
  // Construir prompt según agentType y variables del cliente
}
```

**Entregable:** Flujo de mensaje completo ✅

---

### **FASE 4: BACKEND - CHATWOOT** (1-2 días)
**Objetivo:** Enviar/recibir mensajes de ChatWoot

**Crear:**
```typescript
// backend/src/chatwoot/chatwoot.service.ts

async sendMessage(params: {
  accountId: string;
  conversationId: string;
  content: string;
}): Promise<void>

// Webhook receiver
POST /webhooks/chatwoot
  → Recibir message_created
  → Llamar a ai.service.handleChatWootMessage()
```

**Entregable:** Integración ChatWoot completa ✅

---

### **FASE 5: BACKEND - TRACKING** (2 días)
**Objetivo:** Guardar métricas (sin contenido de mensajes)

**Crear:**
```typescript
// backend/src/bot-tracking/entities/bot-message-tracking.entity.ts
export interface BotMessageTracking {
  id: string;
  organizationId: string;
  timestamp: Date;
  direction: 'inbound' | 'outbound';
  status: 'received' | 'processing' | 'sent' | 'failed';
  responseTime?: number; // ms
  handledBy: 'ai' | 'human' | 'error';
  error?: { type: string; message: string };
  contactId: string;
  conversationId: string;
}

// Endpoints
GET /api/bot-metrics/:organizationId?period=day
GET /api/bot-errors/:organizationId?limit=20
```

**Entregable:** Sistema de tracking funcional ✅

---

### **FASE 6: FRONTEND - BOT CONFIGURATION** (3 días)
**Objetivo:** Panel donde cliente configura su bot

**Crear:**
```typescript
// src/react-app/pages/BotConfiguration.tsx

<BotConfiguration>
  {/* Sección 1: Conexión WhatsApp */}
  <ConnectionPanel>
    - Tipo: Evolution API / Meta API
    - Campos según tipo
    - Botón "Conectar"
    - Botón "Generar QR" (Evolution)
    - Estado de conexión en tiempo real
  </ConnectionPanel>

  {/* Sección 2: Tipo de Agente */}
  <AgentSelector>
    - Radio buttons: Vendedor / Asistente / Secretaria / Custom
    - Descripción de cada tipo
  </AgentSelector>

  {/* Sección 3: Variables del Negocio */}
  <BusinessInfo>
    - Nombre del negocio
    - Descripción
    - Productos/Servicios
    - Horarios
    - Idioma
    - Tono
  </BusinessInfo>

  {/* Sección 4: Prompt Personalizado (si Custom) */}
  <PromptEditor>
    - Textarea grande
    - Lista de variables disponibles
    - Botón "Probar Prompt"
  </PromptEditor>

  {/* Sección 5: Probar Bot */}
  <TestPanel>
    - Mini chat para probar
    - Enviar pregunta → Ver respuesta IA
  </TestPanel>

  {/* Botones de acción */}
  <Actions>
    - 💾 Guardar Configuración
    - ⚡ Activar/Desactivar Bot
    - 🔄 Restablecer a Default
  </Actions>
</BotConfiguration>
```

**Entregable:** Panel de configuración completo ✅

---

### **FASE 7: FRONTEND - BOT ANALYTICS** (2-3 días)
**Objetivo:** Dashboard de métricas del bot

**Crear:**
```typescript
// src/react-app/pages/BotAnalytics.tsx

<BotAnalytics>
  {/* Cards de resumen */}
  <MetricsCards>
    - 📨 Mensajes Procesados (total + % change)
    - ✅ Tasa de Éxito (96.2%)
    - ❌ Errores (47)
    - ⚡ Tiempo Respuesta Promedio (1.2s)
    - 💬 Conversaciones Activas (23)
    - 🤖 Estado del Bot (🟢 Activo)
  </MetricsCards>

  {/* Gráficos con Recharts */}
  <Charts>
    - LineChart: Mensajes por hora (últimas 24h)
    - PieChart: Distribución (AI / Humano / Error)
    - BarChart: Conversaciones por día (7 días)
    - AreaChart: Tasa de éxito (7 días)
  </Charts>

  {/* Tabla de errores */}
  <ErrorsTable>
    - Fecha/Hora
    - Tipo de error
    - Descripción
    - Estado
  </ErrorsTable>

  {/* Alertas */}
  <Alerts>
    - ⚠️ Tasa de error > 5%
    - ⚠️ Tiempo de respuesta alto
    - ✅ Todo normal
  </Alerts>
</BotAnalytics>
```

**Entregable:** Dashboard vistoso con métricas ✅

---

### **FASE 8: INTEGRACIÓN & TESTING** (2-3 días)
**Objetivo:** Todo funcionando end-to-end

**Testing:**
1. Usuario envía mensaje WhatsApp → Bot responde
2. Cambiar tipo de agente → Respuestas cambian
3. Activar/desactivar bot → Funciona
4. Métricas se actualizan en tiempo real
5. Errores se registran correctamente
6. QR code de Evolution funciona
7. Webhooks llegan correctamente

**Deploy:**
- Backend a VPS (Coolify)
- Frontend con nuevo menú
- Variables de entorno configuradas

**Entregable:** Sistema completo en producción ✅

---

## ⏱️ TIMELINE TOTAL

**14-17 días**

| Fase | Días | Acumulado |
|------|------|-----------|
| 1. Backend - Bot Config | 2 | 2 |
| 2. Backend - Evolution API | 2 | 4 |
| 3. Backend - AI Service | 1 | 5 |
| 4. Backend - ChatWoot | 1-2 | 6-7 |
| 5. Backend - Tracking | 2 | 8-9 |
| 6. Frontend - Config | 3 | 11-12 |
| 7. Frontend - Analytics | 2-3 | 13-15 |
| 8. Integration & Testing | 2 | 15-17 |

---

## 🎯 FLUJO COMPLETO (End-to-End)

```
1. Cliente configura bot en BotConfiguration.tsx:
   - Conecta Evolution API
   - Tipo: Vendedor
   - Negocio: TechStore
   - Productos: Laptops, celulares
   - Guarda y activa bot

2. Usuario final envía WhatsApp:
   "Hola, tienen iPhones?"

3. Evolution API → ChatWoot

4. ChatWoot → Webhook a nuestro backend:
   POST /webhooks/chatwoot

5. Nuestro backend:
   - Identifica organización por inbox_id
   - Construye prompt: "Eres vendedor de TechStore..."
   - Envía a Flowise (Grok)

6. Flowise responde:
   "¡Hola! Sí, en TechStore tenemos..."

7. Backend:
   - Recibe respuesta
   - Envía a ChatWoot
   - Trackea métricas

8. ChatWoot → Evolution API → WhatsApp

9. Usuario recibe respuesta del bot

10. BotAnalytics.tsx muestra:
    - +1 mensaje procesado
    - Tiempo: 1.2s
    - Estado: ✅ Éxito
```

---

## ✅ VENTAJAS de esta estrategia:

1. ✅ **Empezamos limpio** (sin código legacy bugueado)
2. ✅ **Reutilizamos** AI service que SÍ funciona
3. ✅ **Desarrollo rápido** (14-17 días)
4. ✅ **Código simple y mantenible**
5. ✅ **Funcionalidad completa y testeada**

---

## 🚀 ¿ARRANCAMOS?

**Empiezo AHORA con FASE 1:**

```
backend/src/bot-config/
├── bot-config.module.ts
├── bot-config.controller.ts
├── bot-config.service.ts
├── entities/
│   └── bot-config.entity.ts
└── dto/
    ├── create-bot-config.dto.ts
    └── update-bot-config.dto.ts
```

**¿Te parece? Arranco inmediatamente con el código** 🚀
