# 🔌 Guía de Integraciones - ChatFlow Pro

## 📋 Índice
1. [Arquitectura General](#arquitectura-general)
2. [Evolution API - WhatsApp](#evolution-api---whatsapp)
3. [Flowise - Motor IA](#flowise---motor-ia)
4. [Chatwoot - Gestión de Conversaciones](#chatwoot---gestión-de-conversaciones)
5. [Flujo Completo de Mensajes](#flujo-completo-de-mensajes)
6. [Configuración en el Frontend](#configuración-en-el-frontend)
7. [Webhooks y Eventos](#webhooks-y-eventos)
8. [Seguridad y Encriptación](#seguridad-y-encriptación)

---

## 🏗️ Arquitectura General

```
┌─────────────────┐
│   WhatsApp      │
│   (Usuario)     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              EVOLUTION API                               │
│  (Conecta WhatsApp con tu aplicación)                   │
│  - Envío/Recepción de mensajes                          │
│  - Gestión de instancias                                │
│  - Webhooks de eventos                                  │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│           CHATWOOT (Opcional)                            │
│  - Almacena conversaciones                              │
│  - Gestión de inbox                                     │
│  - Interfaz para agentes humanos                        │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│        CHATFLOW PRO BACKEND (NestJS)                    │
│  - Recibe webhooks de Evolution API                     │
│  - Procesa mensajes                                     │
│  - Decide si envía al bot o a humano                    │
│  - Gestiona follow-ups                                  │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              FLOWISE                                     │
│  - Genera respuestas con IA                             │
│  - Utiliza contexto de la conversación                  │
│  - Aplica prompt personalizado del cliente              │
└─────────────────────────────────────────────────────────┘
```

---

## 📱 Evolution API - WhatsApp

### ¿Qué es Evolution API?

Evolution API es una API open-source que permite conectar WhatsApp a tu aplicación sin usar WhatsApp Business API oficial. Funciona con WhatsApp Web usando QR Code.

**Repositorio oficial:** https://github.com/EvolutionAPI/evolution-api

### Instalación de Evolution API

#### Opción 1: Docker (Recomendado)

```bash
# Crear docker-compose.yml
version: '3.8'

services:
  evolution-api:
    image: atendai/evolution-api:latest
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    environment:
      # Configuración básica
      SERVER_URL: https://tu-dominio.com
      AUTHENTICATION_API_KEY: tu-api-key-segura-aqui

      # Database
      DATABASE_ENABLED: true
      DATABASE_PROVIDER: postgresql
      DATABASE_CONNECTION_URI: postgresql://user:password@localhost:5432/evolution

      # Webhooks
      WEBHOOK_GLOBAL_ENABLED: true
      WEBHOOK_GLOBAL_URL: https://tu-backend.com/webhooks/evolution
      WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS: true

      # Storage (para archivos)
      S3_ENABLED: false

      # Logs
      LOG_LEVEL: info
    volumes:
      - evolution_instances:/evolution/instances
      - evolution_store:/evolution/store

volumes:
  evolution_instances:
  evolution_store:
```

```bash
# Levantar el servicio
docker-compose up -d
```

#### Opción 2: Cloud (Hosting externo)

Puedes usar servicios como:
- **Railway.app** - Deploy con un click
- **Render.com** - Free tier disponible
- **Heroku** - Con PostgreSQL addon

### Configuración en ChatFlow Pro

#### 1. Guardar credenciales en Supabase

```sql
-- La tabla bot_configs ya está creada con estos campos:
-- evolution_api_url
-- evolution_instance_name
-- evolution_api_key
```

#### 2. Configurar desde el Frontend

En el módulo **Bot IA > Configuración**, el usuario ingresa:

```typescript
// Datos que el usuario completa en el frontend
{
  connectionType: 'evolution_api',
  evolutionApiUrl: 'https://tu-evolution-api.com',
  evolutionInstanceName: 'mi-empresa',
  evolutionApiKey: 'API-KEY-SEGURA'
}
```

#### 3. Backend - Crear Instancia

```typescript
// backend/src/evolution-api/evolution-api.service.ts

@Injectable()
export class EvolutionApiService {
  async createInstance(config: BotConfig): Promise<void> {
    const response = await axios.post(
      `${config.evolutionApiUrl}/instance/create`,
      {
        instanceName: config.evolutionInstanceName,
        token: config.evolutionApiKey,
        qrcode: true,
        webhook: {
          enabled: true,
          url: `${process.env.BACKEND_URL}/webhooks/evolution/${config.organizationId}`,
          webhookByEvents: true,
          events: [
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'SEND_MESSAGE',
            'CONNECTION_UPDATE'
          ]
        }
      },
      {
        headers: {
          'apikey': config.evolutionApiKey
        }
      }
    );

    return response.data;
  }

  async getQRCode(config: BotConfig): Promise<string> {
    const response = await axios.get(
      `${config.evolutionApiUrl}/instance/connect/${config.evolutionInstanceName}`,
      {
        headers: { 'apikey': config.evolutionApiKey }
      }
    );

    return response.data.qrcode.base64; // Retorna QR en base64
  }

  async sendMessage(config: BotConfig, phone: string, message: string): Promise<void> {
    await axios.post(
      `${config.evolutionApiUrl}/message/sendText/${config.evolutionInstanceName}`,
      {
        number: phone,
        text: message
      },
      {
        headers: { 'apikey': config.evolutionApiKey }
      }
    );
  }
}
```

#### 4. Webhook de Evolution API

```typescript
// backend/src/webhooks/webhooks.controller.ts

@Controller('webhooks')
export class WebhooksController {
  @Post('evolution/:organizationId')
  async handleEvolutionWebhook(
    @Param('organizationId') organizationId: string,
    @Body() payload: any
  ) {
    console.log('Webhook recibido:', payload);

    // Evento: Nuevo mensaje recibido
    if (payload.event === 'messages.upsert') {
      const message = payload.data.messages[0];

      // Si es mensaje del usuario (no del bot)
      if (!message.key.fromMe) {
        await this.messagesService.processIncomingMessage({
          organizationId,
          phone: message.key.remoteJid.replace('@s.whatsapp.net', ''),
          messageContent: message.message?.conversation ||
                         message.message?.extendedTextMessage?.text,
          whatsappMessageId: message.key.id,
          receivedAt: new Date(message.messageTimestamp * 1000)
        });
      }
    }

    // Evento: Estado de conexión
    if (payload.event === 'connection.update') {
      await this.botConfigService.updateConnectionStatus(
        organizationId,
        payload.data.state // 'open', 'close', 'connecting'
      );
    }

    return { success: true };
  }
}
```

---

## 🤖 Flowise - Motor IA

### ¿Qué es Flowise?

Flowise es una herramienta low-code para crear flujos de IA conversacional. Permite conectar LLMs (como GPT, Claude, Grok) con memoria, herramientas y bases de datos.

**Repositorio oficial:** https://github.com/FlowiseAI/Flowise

### Instalación de Flowise

#### Opción 1: Docker

```bash
docker run -d \
  --name flowise \
  -p 3000:3000 \
  -e FLOWISE_USERNAME=admin \
  -e FLOWISE_PASSWORD=tu-password-segura \
  -e DATABASE_PATH=/root/.flowise \
  -v flowise_data:/root/.flowise \
  flowiseai/flowise
```

#### Opción 2: NPM

```bash
npm install -g flowise
npx flowise start
```

### Configuración del Chatflow en Flowise

1. **Accede a Flowise UI** (http://localhost:3000)
2. **Crea un nuevo Chatflow** con estos nodos:

```
[Chat Input] → [Retrieval QA] → [LLM (Grok/GPT)] → [Chat Output]
                      ↓
              [Vector Store]
              (Documentos de la empresa)
```

3. **Configura el LLM** con el prompt del cliente:

```
System Prompt:
Eres un {agent_type} de {business_name}.

Información de la empresa:
{business_description}

Productos/Servicios:
{products}

Horarios:
{business_hours}

Tono: {tone}
Idioma: {language}

IMPORTANTE:
- Responde de forma breve y concisa
- Si no sabes algo, deriva a un humano
- No inventes información
- Mantén un tono {tone}
```

4. **Obtén la API Endpoint**:
   - Click en "API" en el chatflow
   - Copia la URL: `http://tu-flowise.com/api/v1/prediction/{chatflowId}`
   - Copia la API Key

### Integración con ChatFlow Pro Backend

```typescript
// backend/src/ai/ai.service.ts

@Injectable()
export class AIService {
  async generateResponse(
    organizationId: string,
    messageContent: string,
    conversationContext: any
  ): Promise<string> {
    // Obtener configuración del bot
    const botConfig = await this.botConfigService.findByOrganization(organizationId);

    // Llamar a Flowise
    const response = await axios.post(
      `${botConfig.flowiseUrl}/api/v1/prediction/${process.env.FLOWISE_CHATFLOW_ID}`,
      {
        question: messageContent,
        overrideConfig: {
          systemMessage: this.buildSystemPrompt(botConfig),
          sessionId: conversationContext.phone, // Mantiene memoria por contacto
          chatHistory: conversationContext.history || []
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${botConfig.flowiseApiKey}`
        }
      }
    );

    return response.data.text;
  }

  private buildSystemPrompt(config: BotConfig): string {
    return `
Eres un ${config.agentType} de ${config.businessName}.

Información de la empresa:
${config.businessDescription}

Productos/Servicios:
${config.products}

Horarios:
${config.businessHours}

Tono: ${config.tone}
Idioma: ${config.language}

${config.customPrompt || ''}
    `.trim();
  }
}
```

### Variables de Entorno

```env
# En backend/.env
FLOWISE_URL=http://localhost:3000
FLOWISE_CHATFLOW_ID=abc123-def456-ghi789
FLOWISE_API_KEY=tu-api-key-de-flowise
```

---

## 💬 Chatwoot - Gestión de Conversaciones

### ¿Qué es Chatwoot?

Chatwoot es una plataforma open-source de atención al cliente multicanal. Permite que agentes humanos tomen conversaciones cuando el bot no puede responder.

**Repositorio oficial:** https://github.com/chatwoot/chatwoot

### Instalación de Chatwoot

#### Opción 1: Cloud (Recomendado para empezar)

Usa Chatwoot Cloud: https://www.chatwoot.com/

#### Opción 2: Self-hosted con Docker

```bash
# Descargar docker-compose
wget https://raw.githubusercontent.com/chatwoot/chatwoot/develop/docker-compose.production.yaml
mv docker-compose.production.yaml docker-compose.yml

# Configurar variables
cat > .env << EOF
SECRET_KEY_BASE=$(openssl rand -hex 64)
POSTGRES_PASSWORD=postgres
REDIS_PASSWORD=redis
EOF

# Levantar
docker-compose up -d
```

### Configuración en Chatwoot

1. **Crear cuenta en Chatwoot**
2. **Crear un Inbox de tipo API**:
   - Settings > Inboxes > Add Inbox
   - Seleccionar "API"
   - Copiar el `inbox_id`

3. **Obtener Access Token**:
   - Settings > Integrations > Access Token
   - Crear nuevo token con permisos de:
     - `conversation:read`
     - `conversation:write`
     - `message:create`

4. **Configurar Webhook** (opcional):
   - Settings > Integrations > Webhooks
   - URL: `https://tu-backend.com/webhooks/chatwoot`
   - Eventos: `message_created`, `conversation_status_changed`

### Integración con Evolution API

```typescript
// backend/src/chatwoot/chatwoot.service.ts

@Injectable()
export class ChatwootService {
  private readonly chatwootUrl = 'https://app.chatwoot.com';

  async createContact(phone: string, name?: string): Promise<any> {
    const response = await axios.post(
      `${this.chatwootUrl}/api/v1/accounts/${accountId}/contacts`,
      {
        name: name || phone,
        phone_number: phone,
        identifier: phone
      },
      {
        headers: {
          'api_access_token': 'tu-access-token'
        }
      }
    );

    return response.data;
  }

  async createConversation(inboxId: string, contactId: string): Promise<any> {
    const response = await axios.post(
      `${this.chatwootUrl}/api/v1/accounts/${accountId}/conversations`,
      {
        inbox_id: inboxId,
        contact_id: contactId,
        status: 'open'
      },
      {
        headers: {
          'api_access_token': 'tu-access-token'
        }
      }
    );

    return response.data;
  }

  async sendMessage(conversationId: string, message: string, isPrivate = false): Promise<void> {
    await axios.post(
      `${this.chatwootUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`,
      {
        content: message,
        message_type: isPrivate ? 'private' : 'outgoing',
        private: isPrivate
      },
      {
        headers: {
          'api_access_token': 'tu-access-token'
        }
      }
    );
  }
}
```

### Flujo Bot → Humano

```typescript
// Cuando el bot no puede responder, crea conversación en Chatwoot
async handleBotEscalation(organizationId: string, phone: string, context: any) {
  const botConfig = await this.botConfigService.findByOrganization(organizationId);

  if (botConfig.chatwootInboxId) {
    // 1. Crear o encontrar contacto
    const contact = await this.chatwootService.createContact(phone, context.name);

    // 2. Crear conversación
    const conversation = await this.chatwootService.createConversation(
      botConfig.chatwootInboxId,
      contact.id
    );

    // 3. Agregar contexto de la conversación
    await this.chatwootService.sendMessage(
      conversation.id,
      `📋 Contexto de la conversación:\n${JSON.stringify(context, null, 2)}`,
      true // Mensaje privado para agentes
    );

    // 4. Notificar al usuario
    await this.evolutionApiService.sendMessage(
      botConfig,
      phone,
      'Un momento, te estoy conectando con un asesor humano...'
    );

    // 5. Desactivar bot para este contacto
    await this.botConfigService.disableBotForContact(organizationId, phone);
  }
}
```

---

## 🔄 Flujo Completo de Mensajes

### 1. Usuario envía mensaje por WhatsApp

```
Usuario WhatsApp → Evolution API → Webhook → Backend NestJS
```

### 2. Backend procesa el mensaje

```typescript
// backend/src/messages/messages.service.ts

async processIncomingMessage(data: IncomingMessageDto) {
  const { organizationId, phone, messageContent } = data;

  // 1. Guardar en base de datos
  const contact = await this.contactsService.findOrCreate(organizationId, phone);
  await this.messagesService.create({
    organizationId,
    contactId: contact.id,
    direction: 'inbound',
    messageContent,
    status: 'received'
  });

  // 2. Verificar si el bot está activo
  const botConfig = await this.botConfigService.findByOrganization(organizationId);

  if (!botConfig.botEnabled) {
    return; // Bot desactivado
  }

  // 3. Verificar si este contacto tiene bot desactivado
  const isBotDisabled = await this.botConfigService.isBotDisabledForContact(
    organizationId,
    phone
  );

  if (isBotDisabled) {
    // Enviar directo a Chatwoot
    await this.chatwootService.forwardMessage(organizationId, phone, messageContent);
    return;
  }

  // 4. Generar respuesta con IA
  const conversationContext = await this.getConversationContext(organizationId, phone);
  const aiResponse = await this.aiService.generateResponse(
    organizationId,
    messageContent,
    conversationContext
  );

  // 5. Verificar si la IA pide escalamiento
  if (this.requiresHumanIntervention(aiResponse)) {
    await this.handleBotEscalation(organizationId, phone, conversationContext);
    return;
  }

  // 6. Enviar respuesta del bot
  await this.evolutionApiService.sendMessage(botConfig, phone, aiResponse);

  // 7. Guardar respuesta en BD
  await this.messagesService.create({
    organizationId,
    contactId: contact.id,
    direction: 'outbound',
    messageContent: aiResponse,
    status: 'sent',
    isAutoReply: true
  });

  // 8. Registrar en bot_message_logs para métricas
  await this.botMessageLogsService.create({
    organizationId,
    direction: 'outbound',
    botEnabled: true,
    botProcessed: true,
    botResponded: true,
    aiProvider: 'flowise',
    agentType: botConfig.agentType,
    status: 'success'
  });
}
```

---

## ⚙️ Configuración en el Frontend

### Módulo Bot IA > Configuración

```typescript
// src/react-app/pages/BotConfiguration.tsx

// Usuario completa este formulario:
const [config, setConfig] = useState({
  // WhatsApp Connection
  connectionType: 'evolution_api', // o 'meta_api'

  // Evolution API
  evolutionApiUrl: 'https://mi-evolution.com',
  evolutionInstanceName: 'mi-empresa',
  evolutionApiKey: 'xxxxx',

  // Chatwoot (opcional)
  chatwootInboxId: '123',
  chatwootAccountId: '456',

  // Bot Agent
  agentType: 'vendedor',
  businessName: 'Mi Empresa SA',
  businessDescription: 'Vendemos productos...',
  products: 'Producto A, B, C',
  businessHours: 'Lunes a Viernes 9-18hs',
  language: 'es',
  tone: 'professional',

  // Flowise (puede ser global o por organización)
  flowiseUrl: 'https://mi-flowise.com',
  flowiseApiKey: 'xxxxx',

  // Estado
  botEnabled: true
});

// Al guardar, se envía al backend:
await api.post('/bot-config', config);
```

### Mostrar QR Code de WhatsApp

```typescript
// Botón "Conectar WhatsApp"
const connectWhatsApp = async () => {
  const response = await api.post('/evolution-api/connect', {
    organizationId: org.id
  });

  setQrCode(response.data.qrcode); // Base64 image
};

// Renderizar QR
{qrCode && (
  <div className="qr-container">
    <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" />
    <p>Escanea este código con WhatsApp</p>
  </div>
)}

// Escuchar evento de conexión
useEffect(() => {
  const eventSource = new EventSource(`/api/evolution-api/status/${org.id}`);

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.status === 'connected') {
      setConnectionStatus('connected');
      setQrCode(null);
    }
  };

  return () => eventSource.close();
}, []);
```

---

## 🔔 Webhooks y Eventos

### Evolution API → Backend

```typescript
// POST /webhooks/evolution/:organizationId

Eventos importantes:
- messages.upsert (nuevo mensaje)
- messages.update (mensaje actualizado - leído, entregado)
- connection.update (estado de conexión)
- qr.updated (nuevo QR generado)
```

### Chatwoot → Backend (Opcional)

```typescript
// POST /webhooks/chatwoot

Eventos importantes:
- message_created (agente respondió)
- conversation_status_changed (conversación cerrada)
- assignee_changed (conversación asignada)
```

---

## 🔐 Seguridad y Encriptación

### Encriptar API Keys en Supabase

```typescript
// backend/src/common/crypto.service.ts

import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

### Uso en los servicios

```typescript
// Antes de guardar en Supabase
await this.botConfigRepository.save({
  ...config,
  evolutionApiKey: this.cryptoService.encrypt(config.evolutionApiKey),
  flowiseApiKey: this.cryptoService.encrypt(config.flowiseApiKey),
  metaAccessToken: this.cryptoService.encrypt(config.metaAccessToken)
});

// Al leer de Supabase
const config = await this.botConfigRepository.findOne({ organizationId });
return {
  ...config,
  evolutionApiKey: this.cryptoService.decrypt(config.evolutionApiKey),
  flowiseApiKey: this.cryptoService.decrypt(config.flowiseApiKey),
  metaAccessToken: this.cryptoService.decrypt(config.metaAccessToken)
};
```

### Variables de Entorno Necesarias

```env
# Backend .env

# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx

# Encryption
ENCRYPTION_KEY=64-character-hex-string  # Generar con: openssl rand -hex 32

# Flowise (Global - puede ser sobreescrito por organización)
FLOWISE_URL=https://tu-flowise.com
FLOWISE_API_KEY=xxx

# Backend URL (para webhooks)
BACKEND_URL=https://tu-backend.com

# JWT
JWT_SECRET=tu-jwt-secret
```

---

## ✅ Checklist de Implementación

### Evolution API
- [ ] Instalar Evolution API (Docker/Cloud)
- [ ] Configurar webhook URL apuntando a tu backend
- [ ] Crear API Key segura
- [ ] Probar crear instancia desde Postman
- [ ] Verificar que webhooks llegan al backend

### Flowise
- [ ] Instalar Flowise (Docker/NPM)
- [ ] Crear Chatflow básico con LLM
- [ ] Configurar prompt del sistema
- [ ] Obtener API endpoint y key
- [ ] Probar con Postman

### Chatwoot (Opcional)
- [ ] Crear cuenta en Chatwoot Cloud
- [ ] Crear inbox de tipo API
- [ ] Obtener access token
- [ ] Configurar webhook (opcional)
- [ ] Probar crear contacto con API

### Backend
- [ ] Crear servicio de Evolution API
- [ ] Crear servicio de Flowise
- [ ] Crear servicio de Chatwoot
- [ ] Implementar webhook controller
- [ ] Implementar encriptación de API keys
- [ ] Probar flujo completo end-to-end

### Frontend
- [ ] Formulario de configuración del bot
- [ ] Mostrar QR code de WhatsApp
- [ ] Indicador de estado de conexión
- [ ] Probar guardado de configuración

---

## 🚀 Orden de Implementación Recomendado

1. **Primero**: Crear base de datos en Supabase ✅
2. **Segundo**: Instalar Evolution API y probar conexión
3. **Tercero**: Implementar webhook básico en backend
4. **Cuarto**: Instalar Flowise y probar generación de respuestas
5. **Quinto**: Integrar todo el flujo de mensajes
6. **Sexto** (opcional): Agregar Chatwoot para escalamiento humano
7. **Séptimo**: Implementar módulo de follow-ups

---

## 📞 Soporte

¿Dudas con alguna integración?

- **Evolution API**: https://doc.evolution-api.com
- **Flowise**: https://docs.flowiseai.com
- **Chatwoot**: https://www.chatwoot.com/docs

---

**Creado para:** ChatFlow Pro
**Fecha:** 2025
**Versión:** 1.0
