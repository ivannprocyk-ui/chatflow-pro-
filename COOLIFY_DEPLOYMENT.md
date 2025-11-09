# 🚀 ChatFlow Pro - Deployment en Coolify

## Guía Completa de Despliegue Multi-Tenant

---

## 📋 PRE-REQUISITOS

✅ **Coolify instalado y funcionando**
✅ **n8n instalado** (para automatizaciones)
✅ **Flowise instalado** (para chatbot IA)
✅ **Metabase instalado** (para analíticas)
✅ **Dominio configurado** (opcional pero recomendado)

---

## 🎯 ARQUITECTURA EN COOLIFY

```
┌─────────────────────────────────────────────────────────────┐
│                    COOLIFY SERVER                            │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   ChatFlow   │  │     n8n      │  │   Flowise    │     │
│  │   Pro App    │  │ Workflows    │  │  AI Chatbot  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                  │              │
│         └─────────────────┴──────────────────┘              │
│                           │                                 │
│                  ┌────────▼────────┐                        │
│                  │   PostgreSQL    │                        │
│                  │    Database     │                        │
│                  └────────┬────────┘                        │
│                           │                                 │
│                  ┌────────▼────────┐                        │
│                  │    Metabase     │                        │
│                  │   Analytics     │                        │
│                  └─────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 PASO 1: PREPARAR EL PROYECTO

### 1.1. Crear estructura de Backend

```bash
cd /ruta/a/tu/proyecto/chatflow-pro

# Crear directorio backend
mkdir -p backend

# Crear archivo Dockerfile para backend
cat > backend/Dockerfile << 'EOF'
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Build
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copiar solo lo necesario
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
EOF
```

### 1.2. Crear Dockerfile para Frontend

```bash
cat > Dockerfile.frontend << 'EOF'
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Argumentos de build
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Build
RUN npm run build

# Production stage
FROM nginx:alpine

# Copiar build
COPY --from=builder /app/build /usr/share/nginx/html

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF
```

### 1.3. Crear configuración de nginx

```bash
cat > nginx.conf << 'EOF'
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (opcional - si quieres proxy inverso)
    location /api {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
```

---

## 🐳 PASO 2: DEPLOYMENT EN COOLIFY

### 2.1. Crear Nuevo Proyecto en Coolify

1. **Login en Coolify** → http://tu-servidor-coolify.com
2. **Projects** → **New Project**
3. **Nombre:** `chatflow-pro`
4. **Description:** Multi-tenant WhatsApp CRM

### 2.2. Crear Servicio PostgreSQL

1. En tu proyecto → **New Resource** → **Database** → **PostgreSQL**
2. **Configuración:**
   - Name: `chatflow-postgres`
   - Version: `15`
   - Database Name: `chatflow_prod`
   - Username: `chatflow_user`
   - Password: *(auto-generada o crea una)*
3. **Deploy**
4. **Guardar la Connection String** - la necesitarás

### 2.3. Conectar Repositorio Git

1. **New Resource** → **Application** → **Docker Compose**
2. **Git Repository:**
   - URL: `https://github.com/tuusuario/chatflow-pro`
   - Branch: `main`
   - Build Pack: `Docker Compose`
3. **Docker Compose File:** Seleccionar `docker-compose.coolify.yml`

### 2.4. Configurar Variables de Entorno

En Coolify, ve a **Environment Variables** y agrega:

```bash
# Database
POSTGRES_PASSWORD=tu-password-super-seguro
DATABASE_URL=postgresql://chatflow_user:tu-password@chatflow-postgres:5432/chatflow_prod

# JWT
JWT_SECRET=genera-un-secreto-aleatorio-aqui-minimo-32-caracteres
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# URLs
FRONTEND_URL=https://chatflow.tudominio.com
BACKEND_URL=https://api.chatflow.tudominio.com

# n8n Integration
N8N_WEBHOOK_URL=https://n8n.tudominio.com/webhook/chatflow

# Flowise Integration
FLOWISE_API_URL=https://flowise.tudominio.com/api/v1
FLOWISE_API_KEY=tu-flowise-api-key

# Redis (opcional)
REDIS_PASSWORD=tu-redis-password

# Node Environment
NODE_ENV=production
PORT=3001

# CORS
CORS_ORIGIN=https://chatflow.tudominio.com
```

### 2.5. Deploy

1. **Save Environment Variables**
2. **Deploy** → Coolify construirá las imágenes
3. **Esperar** 5-10 minutos (primera vez)
4. **Ver logs** para verificar que todo inició correctamente

---

## 🔗 PASO 3: CONECTAR DOMINIOS

### 3.1. Configurar Dominios en Coolify

**Backend:**
- Domain: `api.chatflow.tudominio.com`
- Port: `3001`
- Enable SSL: ✅ (Let's Encrypt automático)

**Frontend:**
- Domain: `chatflow.tudominio.com`
- Port: `3000` (o `80` si usas nginx)
- Enable SSL: ✅

### 3.2. Configurar DNS

En tu proveedor de DNS (Cloudflare, Namecheap, etc.):

```
Tipo  | Nombre              | Valor
------|---------------------|---------------------------
A     | api.chatflow        | IP-de-tu-servidor-coolify
A     | chatflow            | IP-de-tu-servidor-coolify
```

---

## 📊 PASO 4: CONECTAR METABASE

### 4.1. Crear Conexión en Metabase

1. **Login en Metabase** → http://metabase.tudominio.com
2. **Settings** → **Admin** → **Databases** → **Add Database**

**Configuración:**

```
Database type: PostgreSQL
Name: ChatFlow Pro
Host: chatflow-postgres (nombre del servicio en Coolify)
Port: 5432
Database name: chatflow_prod
Username: chatflow_user
Password: [tu-password]
```

3. **Save** → **Test Connection** → ✅

### 4.2. Crear Dashboards Básicos

#### Dashboard 1: Overview Organizaciones

```sql
-- Query: Total Organizaciones Activas
SELECT
  COUNT(*) as total_organizations,
  SUM(CASE WHEN plan = 'free' THEN 1 ELSE 0 END) as free_plan,
  SUM(CASE WHEN plan = 'basic' THEN 1 ELSE 0 END) as basic_plan,
  SUM(CASE WHEN plan = 'pro' THEN 1 ELSE 0 END) as pro_plan,
  SUM(CASE WHEN plan = 'enterprise' THEN 1 ELSE 0 END) as enterprise_plan
FROM organizations
WHERE is_active = true;
```

#### Dashboard 2: Mensajes por Día

```sql
-- Query: Mensajes Enviados por Día (Últimos 30 días)
SELECT
  DATE(sent_at) as date,
  COUNT(*) as messages_sent,
  SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM messages
WHERE sent_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(sent_at)
ORDER BY date DESC;
```

#### Dashboard 3: Top Organizaciones por Uso

```sql
-- Query: Organizaciones con más actividad
SELECT
  o.name as organization,
  o.plan,
  COUNT(DISTINCT c.id) as total_contacts,
  COUNT(m.id) as total_messages,
  MAX(m.sent_at) as last_activity
FROM organizations o
LEFT JOIN contacts c ON c.organization_id = o.id
LEFT JOIN messages m ON m.organization_id = o.id
WHERE o.is_active = true
GROUP BY o.id, o.name, o.plan
ORDER BY total_messages DESC
LIMIT 10;
```

### 4.3. Compartir Dashboard con Clientes

**Opción 1: Dashboard Embebido**

```typescript
// En tu frontend React
<iframe
  src="https://metabase.tudominio.com/embed/dashboard/TOKEN#bordered=false&titled=false"
  frameBorder="0"
  width="100%"
  height="600"
  allowTransparency
></iframe>
```

**Opción 2: Filtrado por Organización**

```sql
-- Usar parámetro de organización
SELECT * FROM contacts
WHERE organization_id = {{organization_id}}
```

---

## 🤖 PASO 5: INTEGRAR n8n (AUTOMATIZACIONES)

### 5.1. Webhook de WhatsApp → n8n

#### Workflow 1: Auto-respuesta con IA (Flowise)

**Trigger:** Webhook POST `/webhook/chatflow/message`

```json
{
  "phone": "+1234567890",
  "message": "Hola, quiero información",
  "organizationId": "uuid-de-org"
}
```

**Nodos del Workflow:**

1. **Webhook Trigger**
   - Method: POST
   - Path: `/webhook/chatflow/message`

2. **HTTP Request → Flowise**
   - Method: POST
   - URL: `https://flowise.tudominio.com/api/v1/prediction/{{flowiseFlowId}}`
   - Headers:
     ```json
     {
       "Authorization": "Bearer {{$env.FLOWISE_API_KEY}}"
     }
     ```
   - Body:
     ```json
     {
       "question": "{{$json.message}}",
       "overrideConfig": {
         "sessionId": "{{$json.phone}}"
       }
     }
     ```

3. **ChatFlow API → Enviar Respuesta**
   - Method: POST
   - URL: `https://api.chatflow.tudominio.com/messages/send`
   - Headers:
     ```json
     {
       "Authorization": "Bearer {{$env.CHATFLOW_API_KEY}}",
       "Content-Type": "application/json"
     }
     ```
   - Body:
     ```json
     {
       "phone": "{{$json.phone}}",
       "message": "{{$node.Flowise.json.text}}",
       "organizationId": "{{$json.organizationId}}"
     }
     ```

#### Workflow 2: Follow-up Automático

**Trigger:** Schedule (daily at 10am)

```
Objetivo: Enviar follow-up a leads sin contacto en 3 días
```

**Nodos:**

1. **Schedule Trigger**
   - Cron: `0 10 * * *` (10am diario)

2. **PostgreSQL → Buscar Leads**
   ```sql
   SELECT
     c.id, c.phone, c.custom_fields->>'name' as name,
     o.id as organization_id
   FROM contacts c
   JOIN organizations o ON c.organization_id = o.id
   WHERE c.status = 'lead'
     AND c.last_contact_at < NOW() - INTERVAL '3 days'
     AND c.messages_sent < 2
   LIMIT 50;
   ```

3. **Loop → Cada Contacto**

4. **ChatFlow API → Enviar Template**
   - Template: "follow_up_lead"
   - Variables: `{{$json.name}}`

5. **PostgreSQL → Update Last Contact**
   ```sql
   UPDATE contacts
   SET last_contact_at = NOW(), messages_sent = messages_sent + 1
   WHERE id = '{{$json.id}}';
   ```

#### Workflow 3: Notificación de Mensajes Fallidos

**Trigger:** Webhook desde ChatFlow cuando mensaje falla

**Nodos:**

1. **Webhook Trigger**

2. **Slack Notification**
   - Channel: `#chatflow-alerts`
   - Message:
     ```
     ⚠️ Mensaje fallido en organización {{$json.organizationName}}

     📞 Contacto: {{$json.phone}}
     📝 Error: {{$json.errorMessage}}
     🕐 Tiempo: {{$json.timestamp}}

     [Ver en Dashboard](https://chatflow.tudominio.com/messages/{{$json.messageId}})
     ```

### 5.2. Configurar Webhooks en ChatFlow Backend

```typescript
// backend/src/webhooks/webhooks.service.ts
import { Injectable, HttpService } from '@nestjs/common';

@Injectable()
export class WebhooksService {
  constructor(private readonly httpService: HttpService) {}

  async notifyN8n(event: string, data: any) {
    const n8nUrl = process.env.N8N_WEBHOOK_URL;

    if (!n8nUrl) return;

    try {
      await this.httpService.post(`${n8nUrl}/${event}`, {
        event,
        data,
        timestamp: new Date().toISOString()
      }).toPromise();
    } catch (error) {
      console.error('Error notifying n8n:', error.message);
    }
  }

  // Usar en tus servicios
  async onMessageReceived(message: any) {
    await this.notifyN8n('message', message);
  }

  async onMessageFailed(message: any, error: string) {
    await this.notifyN8n('message-failed', {
      ...message,
      errorMessage: error
    });
  }

  async onNewContact(contact: any) {
    await this.notifyN8n('contact-created', contact);
  }
}
```

---

## 🧠 PASO 6: INTEGRAR FLOWISE (CHATBOT IA)

### 6.1. Crear Flow en Flowise

1. **Login en Flowise** → http://flowise.tudominio.com
2. **Create New Chatflow**
3. **Configuración Básica:**

```
Componentes:
1. Chat Model: OpenAI GPT-4 (o GPT-3.5-turbo)
2. Memory: Conversation Buffer Memory (para contexto)
3. Vector Store: Pinecone o Postgres (para knowledge base)
4. Document Loaders: Upload PDFs con info de productos/servicios
```

**Ejemplo de Prompt para el Chatbot:**

```
Eres un asistente virtual de {{company_name}}.

Tu rol es:
- Responder preguntas sobre nuestros productos y servicios
- Calificar leads (identificar interés y necesidades)
- Programar citas o demos
- Proporcionar información de contacto

Información de la empresa:
{{company_info}}

Productos disponibles:
{{products_list}}

IMPORTANTE:
- Sé amable y profesional
- Si no sabes algo, indica que un humano se pondrá en contacto
- Para solicitudes complejas, sugiere agendar una llamada
- Captura nombre, email y necesidad del cliente

Formato de respuesta:
- Conciso (máximo 3 párrafos)
- En español
- Usa emojis ocasionalmente para ser amigable
```

### 6.2. Conectar ChatFlow con Flowise

```typescript
// backend/src/ai/flowise.service.ts
import { Injectable, HttpService } from '@nestjs/common';

@Injectable()
export class FlowiseService {
  private readonly flowiseUrl = process.env.FLOWISE_API_URL;
  private readonly apiKey = process.env.FLOWISE_API_KEY;

  constructor(private readonly httpService: HttpService) {}

  async getChatbotResponse(
    message: string,
    sessionId: string,
    organizationId: string
  ): Promise<string> {
    try {
      const response = await this.httpService.post(
        `${this.flowiseUrl}/prediction/${this.getFlowIdByOrg(organizationId)}`,
        {
          question: message,
          overrideConfig: {
            sessionId: sessionId,
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      ).toPromise();

      return response.data.text;
    } catch (error) {
      console.error('Flowise error:', error.message);
      return 'Lo siento, hubo un error. Un agente te contactará pronto.';
    }
  }

  private getFlowIdByOrg(organizationId: string): string {
    // Podrías tener flows diferentes por organización
    // Por ahora retornamos un flow default
    return process.env.FLOWISE_DEFAULT_FLOW_ID || 'default-flow';
  }
}
```

**Uso en Messages Controller:**

```typescript
// backend/src/messages/messages.controller.ts
@Post('incoming-webhook')
async handleIncomingMessage(@Body() body: IncomingMessageDto) {
  const { phone, message, organizationId } = body;

  // 1. Guardar mensaje entrante
  await this.messagesService.saveIncomingMessage({
    phone,
    message,
    organizationId,
    direction: 'inbound'
  });

  // 2. Obtener respuesta de Flowise
  const aiResponse = await this.flowiseService.getChatbotResponse(
    message,
    phone, // sessionId
    organizationId
  );

  // 3. Enviar respuesta automática
  await this.messagesService.sendMessage({
    phone,
    message: aiResponse,
    organizationId,
    isAutoReply: true
  });

  return { success: true };
}
```

---

## 🔒 PASO 7: SEGURIDAD Y BACKUPS

### 7.1. Configurar Backups Automáticos

En Coolify, para PostgreSQL:

1. **Database Settings** → **Backups**
2. **Configurar:**
   - Frequency: Daily at 2am
   - Retention: 7 days
   - Destination: S3 bucket o local storage

**Backup Manual:**

```bash
# SSH a tu servidor Coolify
ssh user@tu-servidor-coolify.com

# Backup manual
docker exec chatflow-postgres pg_dump -U chatflow_user chatflow_prod > backup_$(date +%Y%m%d).sql

# Restaurar
docker exec -i chatflow-postgres psql -U chatflow_user chatflow_prod < backup_20240101.sql
```

### 7.2. Variables de Entorno Seguras

**NUNCA** comitees al repo:
- `JWT_SECRET`
- `POSTGRES_PASSWORD`
- `FLOWISE_API_KEY`
- Tokens de Meta API

**Usar Coolify Secrets** para almacenarlas encriptadas.

### 7.3. Rate Limiting

```typescript
// backend/src/main.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100, // 100 requests por minuto
    }),
  ],
})
```

### 7.4. CORS Configurado

```typescript
// backend/src/main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'https://chatflow.tudominio.com',
  credentials: true,
});
```

---

## 📈 PASO 8: MONITOREO

### 8.1. Health Checks

Ya están configurados en `docker-compose.coolify.yml`:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### 8.2. Logs en Coolify

Coolify automáticamente captura logs de Docker:

- **Ver logs en tiempo real:** Coolify UI → Tu app → Logs
- **Descargar logs:** Logs → Download

### 8.3. Alertas con n8n

Crear workflow para monitorear uptime:

```
Schedule (cada 5 min)
  → HTTP Request (health check)
  → IF failed → Slack/Email notification
```

---

## 🎯 PASO 9: TESTING

### 9.1. Test de Registro

```bash
curl -X POST https://api.chatflow.tudominio.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@empresa.com",
    "password": "password123",
    "organizationName": "Empresa Test"
  }'
```

### 9.2. Test de Login

```bash
curl -X POST https://api.chatflow.tudominio.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@empresa.com",
    "password": "password123"
  }'
```

### 9.3. Test de n8n Integration

```bash
# Simular mensaje entrante
curl -X POST https://n8n.tudominio.com/webhook/chatflow/message \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "message": "Hola, necesito ayuda",
    "organizationId": "uuid-aqui"
  }'
```

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot connect to database"

**Solución:**

```bash
# Verificar que PostgreSQL está corriendo
docker ps | grep postgres

# Ver logs
docker logs chatflow-postgres

# Verificar conexión
docker exec -it chatflow-postgres psql -U chatflow_user -d chatflow_prod -c "SELECT 1;"
```

### Error: "CORS policy"

**Solución:** Verificar que `CORS_ORIGIN` en backend coincide con URL del frontend.

### Error: n8n webhook no responde

**Solución:**

1. Verificar que el workflow está **activado** en n8n
2. Verificar que la URL del webhook es correcta
3. Ver logs en n8n para errores

---

## 📚 RECURSOS

- [Documentación de Coolify](https://coolify.io/docs)
- [n8n Workflows](https://n8n.io/workflows)
- [Flowise Docs](https://docs.flowiseai.com)
- [Metabase Docs](https://www.metabase.com/docs)

---

## ✅ CHECKLIST FINAL

- [ ] PostgreSQL deployed y accesible
- [ ] Backend deployed y respondiendo en `/health`
- [ ] Frontend deployed y cargando
- [ ] Dominios configurados con SSL
- [ ] Variables de entorno configuradas
- [ ] Metabase conectado a database
- [ ] n8n workflows creados y activos
- [ ] Flowise chatflow configurado
- [ ] Backups automáticos configurados
- [ ] Test de registro exitoso
- [ ] Test de login exitoso
- [ ] Test de envío de mensaje exitoso

---

¡Tu ChatFlow Pro está ahora **100% operativo** en Coolify! 🎉

**Próximos pasos:** Invitar a tus primeros clientes y comenzar a escalar.
