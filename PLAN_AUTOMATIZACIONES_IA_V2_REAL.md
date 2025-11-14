# 🤖 PLAN AUTOMATIZACIONES IA - VERSION REAL SIMPLIFICADA

**Fecha:** 2025-11-14
**Arquitectura:** ChatWoot + Flowise + Evolution/Meta API
**Almacenamiento chats:** ChatWoot (no en nuestra plataforma)

---

## 🎯 OBJETIVO REAL

Crear un **panel para el cliente** donde pueda:
1. ✅ Conectar su instancia WhatsApp (Meta API o Evolution API)
2. ✅ Configurar el bot (tipo: vendedor/asistente/secretaria)
3. ✅ Ver estadísticas del bot (mensajes, errores, métricas)
4. ✅ **Cambiar el prompt sin depender de ti**
5. ✅ Tener independencia para ajustes básicos

**NO necesitamos:**
- ❌ Almacenar conversaciones completas
- ❌ Sistema de billing (por ahora)
- ❌ Context manager complejo
- ❌ Mostrar contenido de mensajes

---

## 🏗️ ARQUITECTURA SIMPLIFICADA

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO COMPLETO                            │
└─────────────────────────────────────────────────────────────┘

1. Cliente conecta WhatsApp → Evolution API o Meta API
2. Mensaje llega → ChatWoot recibe el mensaje
3. ChatWoot webhook → Envía a Flowise
4. Flowise procesa → Con prompt personalizado del cliente
5. Flowise responde → Envía respuesta a ChatWoot
6. ChatWoot → Envía mensaje al usuario por WhatsApp
7. Tracking → Nuestra plataforma registra metadata (no contenido)

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   WhatsApp   │─────▶│   ChatWoot   │─────▶│   Flowise    │
│  (Cliente)   │◀─────│  (Mensajes)  │◀─────│  (IA + Bot)  │
└──────────────┘      └──────────────┘      └──────────────┘
                             │
                             ▼
                      ┌──────────────┐
                      │  ChatFlow    │
                      │  (Tracking + │
                      │   Métricas)  │
                      └──────────────┘
```

---

## 📋 COMPONENTES A DESARROLLAR

### 1. **PANEL DE CONFIGURACIÓN DEL BOT** 🔴 CRÍTICO

**Archivo:** `src/react-app/pages/BotConfiguration.tsx`

**Funcionalidades:**

#### A) Conexión de Instancia

**Para Meta API (oficial):**
- Campo: WhatsApp Business Account ID
- Campo: Access Token
- Campo: Phone Number ID
- Botón: "Verificar Conexión"
- Botón: "Guardar"
- Estado: 🟢 Conectado / 🔴 Desconectado

**Para Evolution API (no oficial):**
- Campo: URL de Evolution API
- Campo: API Key de Evolution
- Campo: Nombre de instancia
- Botón: "Generar QR" → Abre modal con QR code
- Botón: "Verificar Estado" → Verifica si está conectado
- Estado: 🟢 Conectado / 🟡 Esperando escaneo / 🔴 Desconectado

**Detección automática de conexión:**
- Evolution API envía webhook `CONNECTION_UPDATE` cuando se conecta
- Nuestra plataforma recibe el webhook y actualiza estado
- Cliente ve en tiempo real "✅ Instancia conectada"

#### B) Configuración del Agente IA

**Selector de tipo de agente:**
```
┌────────────────────────────────────────────────┐
│ Tipo de Agente:                                │
│                                                 │
│ ( ) 🛍️ Vendedor                                │
│     Enfocado en cerrar ventas y ofrecer       │
│     productos/servicios                        │
│                                                 │
│ ( ) 🤝 Asistente de Atención al Cliente       │
│     Responde dudas, ayuda con problemas       │
│                                                 │
│ ( ) 📅 Secretaria Virtual                      │
│     Agenda citas, organiza reuniones          │
│                                                 │
│ ( ) 💬 Personalizado                           │
│     Define tu propio prompt                    │
└────────────────────────────────────────────────┘
```

**Variables básicas del negocio:**
```
┌────────────────────────────────────────────────┐
│ Información del Negocio                        │
│                                                 │
│ Nombre del negocio:                            │
│ ┌────────────────────────────────────────────┐│
│ │ TechStore                                   ││
│ └────────────────────────────────────────────┘│
│                                                 │
│ Descripción breve:                             │
│ ┌────────────────────────────────────────────┐│
│ │ Venta de electrónicos y accesorios         ││
│ └────────────────────────────────────────────┘│
│                                                 │
│ Productos/Servicios principales:               │
│ ┌────────────────────────────────────────────┐│
│ │ Laptops, celulares, tablets, auriculares   ││
│ └────────────────────────────────────────────┘│
│                                                 │
│ Horarios de atención:                          │
│ ┌────────────────────────────────────────────┐│
│ │ Lunes a Viernes 9am - 6pm                  ││
│ └────────────────────────────────────────────┘│
│                                                 │
│ Idioma: [Español ▼]                            │
│                                                 │
│ Tono: [ ] Formal  [✓] Casual  [ ] Profesional │
└────────────────────────────────────────────────┘
```

**Si selecciona "Personalizado":**
```
┌────────────────────────────────────────────────┐
│ Prompt Personalizado                           │
│ ┌────────────────────────────────────────────┐│
│ │ Eres un asistente virtual de TechStore.   ││
│ │ Tu objetivo es ayudar a los clientes con  ││
│ │ información sobre productos electrónicos. ││
│ │                                            ││
│ │ Siempre sé amable y ofrece ayuda.        ││
│ │ Si no sabes algo, deriva con un humano.  ││
│ │                                            ││
│ │ Variables disponibles:                    ││
│ │ {business_name} - Nombre del negocio      ││
│ │ {products} - Lista de productos           ││
│ │ {hours} - Horarios de atención            ││
│ └────────────────────────────────────────────┘│
│                                                 │
│ 🧪 Probar Prompt                               │
└────────────────────────────────────────────────┘
```

#### C) Testing en Vivo

**Panel de prueba:**
```
┌────────────────────────────────────────────────┐
│ 🧪 Probar Bot                                  │
│                                                 │
│ Usuario: ┌───────────────────────────────────┐│
│          │ Hola, tienen iPhones?             ││
│          └───────────────────────────────────┘│
│                                 [Enviar]       │
│                                                 │
│ Bot:     ┌───────────────────────────────────┐│
│          │ ¡Hola! 😊 Sí, en TechStore       ││
│          │ tenemos varios modelos de iPhone. ││
│          │ Estamos abiertos de Lun-Vie      ││
│          │ 9am-6pm. ¿Qué modelo buscas?     ││
│          └───────────────────────────────────┘│
│                                                 │
│ [Limpiar Chat] [Nueva Prueba]                 │
└────────────────────────────────────────────────┘
```

**Botones de acción:**
- 💾 Guardar Configuración
- 🧪 Probar Bot
- 🔄 Restablecer a Default
- ⚡ Activar/Desactivar Bot

---

### 2. **DASHBOARD DE MÉTRICAS DEL BOT** 🔴 CRÍTICO

**Archivo:** `src/react-app/pages/BotAnalytics.tsx`

**Métricas a mostrar:**

#### A) Tarjetas de Resumen (Cards)

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ 📨 Mensajes     │ │ ✅ Respondidos  │ │ ❌ Errores      │
│ Procesados      │ │                 │ │                 │
│                 │ │                 │ │                 │
│     1,234       │ │      1,187      │ │       47        │
│   +12% vs ayer  │ │   96.2% tasa   │ │   3.8% tasa    │
└─────────────────┘ └─────────────────┘ └─────────────────┘

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ ⚡ Tiempo Resp. │ │ 💬 Conversac.   │ │ 🤖 Estado Bot   │
│ Promedio        │ │ Activas         │ │                 │
│                 │ │                 │ │                 │
│    1.2 seg      │ │       23        │ │  🟢 ACTIVO     │
│   -0.3s vs ayer │ │   +5 vs ayer   │ │  Sin errores   │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

#### B) Gráficos

**Gráfico 1: Mensajes por Hora (Line Chart)**
```
Mensajes procesados (últimas 24 horas)
120│                                    •
100│                              •   •
 80│                        •   •
 60│                  •   •
 40│            •   •
 20│      •   •
  0│•───•────────────────────────────────────
   0  2  4  6  8 10 12 14 16 18 20 22 24h
```

**Gráfico 2: Distribución de Respuestas (Pie Chart)**
```
       Respondidas por IA: 87%
       Escaladas a humano: 10%
       Errores: 3%
```

**Gráfico 3: Conversaciones por Día (Bar Chart)**
```
       ▓▓▓▓▓▓▓░  145
       ▓▓▓▓▓▓▓▓  167
       ▓▓▓▓▓░░░  98
       ▓▓▓▓▓▓░░  124
       ▓▓▓▓▓▓▓▓  189
       ▓▓▓▓▓▓▓░  152
       ▓▓▓▓▓░░░  87
       Lu Ma Mi Ju Vi Sa Do
```

**Gráfico 4: Tasa de Éxito (Area Chart)**
```
Tasa de respuestas exitosas (7 días)
100%│░░░░░░░░░░░░░░░░░░░░░░░░░░░
 90%│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░
 80%│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░
    └────────────────────────────
     Lu Ma Mi Ju Vi Sa Do
```

#### C) Tabla de Errores Recientes

```
┌────────────────────────────────────────────────────────────┐
│ Errores Recientes                                          │
├──────────────┬─────────────────┬─────────────────┬─────────┤
│ Fecha/Hora   │ Tipo Error      │ Descripción     │ Estado  │
├──────────────┼─────────────────┼─────────────────┼─────────┤
│ 14:32:15     │ Flowise Timeout │ No response     │ ⚠️ Nuevo│
│ 12:15:43     │ WhatsApp API    │ Rate limit      │ 🔄 Retry│
│ 11:08:22     │ Invalid Format  │ Bad JSON        │ ✅ Fixed│
└──────────────┴─────────────────┴─────────────────┴─────────┘
```

#### D) Alertas Activas

```
⚠️ ALERTAS ACTIVAS:
┌────────────────────────────────────────────────────────────┐
│ • Tasa de error superior al 5% en la última hora          │
│ • Tiempo de respuesta aumentó 200% vs promedio            │
└────────────────────────────────────────────────────────────┘

✅ TODO NORMAL:
┌────────────────────────────────────────────────────────────┐
│ • Bot funcionando correctamente                            │
│ • Conexión estable con Flowise                            │
│ • WhatsApp API respondiendo OK                            │
└────────────────────────────────────────────────────────────┘
```

---

### 3. **SISTEMA DE TRACKING DE MENSAJES** 🟡 ALTA

**Archivo:** `src/react-app/utils/botMessageTracker.ts`

**QUÉ trackear (solo metadata, NO contenido):**

```typescript
interface BotMessageTracking {
  id: string;
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

  // Error (si aplica)
  error?: {
    type: string;
    message: string;
    code?: string;
  };

  // Contacto (solo ID, no datos personales)
  contactId: string;

  // NO guardamos el contenido del mensaje
  // Solo metadata para estadísticas
}
```

**Funciones:**

```typescript
// Trackear mensaje recibido
trackMessageReceived(instanceId: string, contactId: string): string

// Trackear que se envió a Flowise
trackSentToFlowise(trackingId: string): void

// Trackear respuesta de Flowise
trackFlowiseResponse(trackingId: string, success: boolean): void

// Trackear envío a WhatsApp
trackSentToWhatsApp(trackingId: string, success: boolean, error?: any): void

// Obtener métricas
getBotMetrics(timeRange: 'hour' | 'day' | 'week' | 'month'): BotMetrics

// Obtener errores recientes
getRecentErrors(limit: number): BotMessageTracking[]
```

---

### 4. **INTEGRACIÓN CON FLOWISE** 🔴 CRÍTICO

**Archivo:** `src/react-app/services/flowiseService.ts`

**Flujo de integración:**

```typescript
// 1. Cliente configura bot en panel
const botConfig = {
  agentType: 'vendedor', // o 'asistente', 'secretaria', 'custom'
  businessName: 'TechStore',
  businessDescription: 'Venta de electrónicos',
  products: 'Laptops, celulares, tablets',
  hours: 'Lun-Vie 9am-6pm',
  language: 'es',
  tone: 'casual',
  customPrompt?: string, // si tipo = 'custom'
};

// 2. Construir prompt dinámico
function buildPrompt(config: BotConfig, agentType: string): string {
  const templates = {
    vendedor: `Eres un vendedor profesional de {business_name}.
Tu objetivo es ayudar a los clientes a encontrar productos y cerrar ventas.

Información del negocio:
- Vendemos: {products}
- Horarios: {hours}
- Descripción: {business_description}

Tono: {tone}
Idioma: {language}

Instrucciones:
- Sé amable y proactivo
- Ofrece productos relacionados
- Si no sabes algo, deriva con un humano
- Siempre despídete preguntando si necesita algo más`,

    asistente: `Eres un asistente de atención al cliente de {business_name}.
Tu objetivo es resolver dudas y problemas de los clientes.

Información del negocio:
- Servicios: {products}
- Horarios: {hours}
- Descripción: {business_description}

Tono: {tone}
Idioma: {language}

Instrucciones:
- Sé empático y paciente
- Resuelve problemas paso a paso
- Si el problema es complejo, deriva con un humano
- Siempre pregunta si quedó satisfecho`,

    secretaria: `Eres una secretaria virtual de {business_name}.
Tu objetivo es agendar citas y organizar reuniones.

Información del negocio:
- Servicios: {products}
- Horarios disponibles: {hours}
- Descripción: {business_description}

Tono: {tone}
Idioma: {language}

Instrucciones:
- Sé cordial y organizada
- Confirma todos los detalles de la cita
- Envía confirmación por escrito
- Si hay conflicto de horarios, ofrece alternativas`,
  };

  let prompt = templates[agentType] || config.customPrompt;

  // Reemplazar variables
  prompt = prompt
    .replace(/{business_name}/g, config.businessName)
    .replace(/{products}/g, config.products)
    .replace(/{hours}/g, config.hours)
    .replace(/{business_description}/g, config.businessDescription)
    .replace(/{tone}/g, config.tone)
    .replace(/{language}/g, config.language);

  return prompt;
}

// 3. Enviar a Flowise
async function sendToFlowise(
  message: string,
  contactId: string,
  flowiseUrl: string,
  config: BotConfig
): Promise<FlowiseResponse> {
  const trackingId = trackMessageReceived('instance-1', contactId);

  try {
    trackSentToFlowise(trackingId);

    const prompt = buildPrompt(config, config.agentType);

    const response = await fetch(flowiseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: message,
        overrideConfig: {
          systemMessage: prompt,
        },
      }),
    });

    const data = await response.json();

    trackFlowiseResponse(trackingId, true);

    return {
      success: true,
      answer: data.text || data.answer,
      trackingId,
    };
  } catch (error) {
    trackFlowiseResponse(trackingId, false);
    throw error;
  }
}
```

---

### 5. **WEBHOOKS RECEIVER** 🔴 CRÍTICO

**Archivo:** `backend/src/webhooks/bot-webhooks.controller.ts`

**Necesitamos crear un backend mínimo para recibir webhooks**

**Webhooks a recibir:**

#### A) ChatWoot → Nuestra Plataforma

**Evento: `message_created`**
```json
{
  "event": "message_created",
  "conversation_id": "12345",
  "contact": {
    "id": "67890",
    "phone_number": "+5491112345678"
  },
  "message": {
    "content": "Hola, tienen iPhones?",
    "incoming": true
  },
  "inbox": {
    "id": "inbox-1",
    "name": "WhatsApp Business"
  }
}
```

**Nuestra acción:**
1. Recibir webhook
2. Extraer mensaje y contactId
3. Trackear mensaje recibido
4. Enviar a Flowise
5. Recibir respuesta
6. Enviar respuesta a ChatWoot (que lo envía a WhatsApp)
7. Trackear mensaje enviado

#### B) Evolution API → Nuestra Plataforma

**Evento: `CONNECTION_UPDATE`**
```json
{
  "event": "connection.update",
  "instance": "cliente-123",
  "data": {
    "state": "open", // o "close", "connecting"
    "statusReason": "connected"
  }
}
```

**Nuestra acción:**
1. Actualizar estado de conexión del cliente
2. Si estado = "open" → Marcar instancia como ✅ Conectada
3. Si estado = "close" → Marcar instancia como 🔴 Desconectada
4. Notificar al cliente en el panel

**Evento: `QRCODE_UPDATED`**
```json
{
  "event": "qrcode.updated",
  "instance": "cliente-123",
  "data": {
    "qrcode": "data:image/png;base64,..."
  }
}
```

**Nuestra acción:**
1. Guardar QR code en cache
2. Mostrar en el modal del panel
3. Cliente escanea y se conecta

---

## 🗄️ ESTRUCTURA DE DATOS

### LocalStorage Keys:

```typescript
// Configuración del bot por cliente
chatflow_bot_config = {
  instanceId: string,
  instanceType: 'evolution_api' | 'meta_api',
  connectionStatus: 'connected' | 'disconnected' | 'connecting',

  // Config Evolution API
  evolutionApiUrl?: string,
  evolutionApiKey?: string,

  // Config Meta API
  metaBusinessAccountId?: string,
  metaAccessToken?: string,
  metaPhoneNumberId?: string,

  // Config del agente
  agentType: 'vendedor' | 'asistente' | 'secretaria' | 'custom',
  businessName: string,
  businessDescription: string,
  products: string,
  hours: string,
  language: string,
  tone: 'formal' | 'casual' | 'professional',
  customPrompt?: string,

  // Flowise
  flowiseUrl: string, // Lo configuras TU, no el cliente

  // Estado
  botEnabled: boolean,
  lastUpdated: Date,
}

// Tracking de mensajes (solo últimas 24-48 horas)
chatflow_bot_tracking = BotMessageTracking[]

// Métricas agregadas
chatflow_bot_metrics = {
  hourly: { /* métricas por hora */ },
  daily: { /* métricas por día */ },
  weekly: { /* métricas por semana */ },
  monthly: { /* métricas por mes */ },
}
```

---

## 📊 BACKEND MÍNIMO NECESARIO

**Necesitamos un backend simple para:**

1. **Recibir webhooks** de ChatWoot y Evolution API
2. **Enviar a Flowise** (puede ser desde frontend también)
3. **Responder a ChatWoot** para que envíe mensaje a WhatsApp
4. **Almacenar tracking** (opcional, puede ser localStorage)

**Stack sugerido:** Node.js + Express (súper simple)

**Archivos necesarios:**
```
backend/
├── server.js (main)
├── routes/
│   ├── chatwoot-webhook.js
│   ├── evolution-webhook.js
│   └── flowise-proxy.js
└── package.json
```

**O podemos usar el backend NestJS que ya existe en tu repo** (más robusto)

---

## 🚀 PLAN DE IMPLEMENTACIÓN SIMPLIFICADO

### **FASE 1: PANEL DE CONFIGURACIÓN** (3-4 días)
**Prioridad:** 🔴 CRÍTICA

- [ ] Crear BotConfiguration.tsx
- [ ] Formulario de conexión (Evolution/Meta)
- [ ] Selector de tipo de agente
- [ ] Variables de negocio
- [ ] Botón "Probar Bot"
- [ ] Guardar en localStorage
- [ ] Testing

**Entregable:** Cliente puede configurar su bot

---

### **FASE 2: INTEGRACIÓN FLOWISE** (3-4 días)
**Prioridad:** 🔴 CRÍTICA

- [ ] Crear flowiseService.ts
- [ ] Función buildPrompt()
- [ ] Función sendToFlowise()
- [ ] Manejo de errores
- [ ] Testing con instancia Flowise real

**Entregable:** Bot responde con IA

---

### **FASE 3: WEBHOOKS BACKEND** (4-5 días)
**Prioridad:** 🔴 CRÍTICA

- [ ] Setup backend (Express o NestJS)
- [ ] Endpoint para ChatWoot webhook
- [ ] Endpoint para Evolution webhook
- [ ] Lógica de procesamiento
- [ ] Enviar respuesta a ChatWoot
- [ ] Actualizar estado de conexión
- [ ] Testing con webhooks reales

**Entregable:** Flujo completo automático

---

### **FASE 4: TRACKING & MÉTRICAS** (3-4 días)
**Prioridad:** 🟡 ALTA

- [ ] Crear botMessageTracker.ts
- [ ] Trackear eventos
- [ ] Calcular métricas
- [ ] Detectar errores
- [ ] Almacenar en localStorage
- [ ] Testing

**Entregable:** Sistema de tracking funcional

---

### **FASE 5: DASHBOARD MÉTRICAS** (4-5 días)
**Prioridad:** 🟡 ALTA

- [ ] Crear BotAnalytics.tsx
- [ ] Tarjetas de resumen
- [ ] Gráfico de mensajes por hora
- [ ] Gráfico de distribución
- [ ] Tabla de errores
- [ ] Alertas
- [ ] Testing

**Entregable:** Dashboard vistoso con métricas

---

### **FASE 6: DETECCIÓN AUTO CONEXIÓN** (2-3 días)
**Prioridad:** 🟢 MEDIA

- [ ] Webhook CONNECTION_UPDATE
- [ ] Actualizar UI en tiempo real
- [ ] Mostrar QR code
- [ ] Estado de conexión
- [ ] Testing

**Entregable:** Detección automática de instancias

---

## ❓ PREGUNTAS CRÍTICAS

### 🔴 Necesito respuesta AHORA:

#### 1. **Flowise:**
- ❓ ¿Cuál es la URL de tu instancia Flowise?
- ❓ ¿Ya creaste el flow o lo creo yo?
- ❓ ¿Qué modelo LLM está configurado? (GPT-4/GPT-3.5/otro)

#### 2. **ChatWoot:**
- ❓ ¿Los clientes tienen su propia cuenta ChatWoot o comparten una?
- ❓ ¿Cada cliente tiene su propio "inbox" en ChatWoot?
- ❓ ¿Cómo diferenciamos los clientes? (por inbox_id?)

#### 3. **Arquitectura:**
- ❓ ¿Preferis que use el backend NestJS que ya está en el repo o hago uno Express simple?
- ❓ ¿Dónde vas a hostear el backend? (Railway/Render/VPS)

#### 4. **Evolution API:**
- ❓ ¿Tu Evolution API está hosteada en el mismo VPS que Flowise?
- ❓ ¿URL de Evolution API?

#### 5. **Cliente:**
- ❓ ¿Cada cliente accede con login diferente o comparten la plataforma?
- ❓ ¿Necesitan sistema de usuarios/auth o un solo cliente usa la plataforma?

---

## 🎨 MOCKUP FINAL DEL PANEL

```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 CONFIGURACIÓN DEL BOT                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─ Conexión WhatsApp ────────────────────────────────────┐ │
│ │                                                          │ │
│ │ Tipo: ( ) Meta API Oficial  (•) Evolution API          │ │
│ │                                                          │ │
│ │ URL Evolution: https://evolution.midominio.com          │ │
│ │ API Key: ••••••••••••••••••••                          │ │
│ │ Instancia: cliente-techstore                            │ │
│ │                                                          │ │
│ │ Estado: 🟢 CONECTADO                                    │ │
│ │                                                          │ │
│ │ [Verificar] [Generar QR] [Desconectar]                 │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ Tipo de Agente ───────────────────────────────────────┐ │
│ │                                                          │ │
│ │ (•) 🛍️ Vendedor                                         │ │
│ │ ( ) 🤝 Asistente                                        │ │
│ │ ( ) 📅 Secretaria                                       │ │
│ │ ( ) 💬 Personalizado                                    │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ Información del Negocio ──────────────────────────────┐ │
│ │                                                          │ │
│ │ Nombre: TechStore                                       │ │
│ │ Productos: Laptops, celulares, tablets                  │ │
│ │ Horarios: Lun-Vie 9am-6pm                               │ │
│ │ Tono: Casual                                            │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ Probar Bot ───────────────────────────────────────────┐ │
│ │ [🧪 Abrir Panel de Pruebas]                            │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ [💾 Guardar]  [⚡ Activar Bot]  [🔄 Restablecer]          │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📊 MÉTRICAS DEL BOT                                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│ │ 📨 1234 │ │ ✅ 96% │ │ ❌ 47  │ │ ⚡ 1.2s│           │
│ │ Mensajes│ │ Éxito   │ │ Errores │ │ Resp.   │           │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                              │
│ [Gráfico de líneas - Mensajes por hora]                    │
│ [Gráfico de pastel - Distribución]                         │
│ [Tabla de errores recientes]                               │
│                                                              │
│ ⚠️ ALERTAS: Ninguna                                         │
│ ✅ Bot funcionando correctamente                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏱️ TIEMPO TOTAL ESTIMADO

**25-30 días de desarrollo**

**Desglose:**
- Fase 1: Panel Config → 3-4 días
- Fase 2: Flowise → 3-4 días
- Fase 3: Webhooks → 4-5 días
- Fase 4: Tracking → 3-4 días
- Fase 5: Dashboard → 4-5 días
- Fase 6: Auto-detección → 2-3 días
- **Testing & ajustes:** 5-6 días

---

## ✅ PRÓXIMO PASO

**Respondeme las 5 preguntas críticas** y arranco inmediatamente con:

1. Setup del backend (NestJS o Express)
2. FASE 1: Panel de Configuración

**¿Te parece bien este plan simplificado?**
