# ChatFlow Pro Backend API

Backend NestJS con soporte para **mock data** (sin DB) o **PostgreSQL** (producción).

## 🚀 Quick Start

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus valores
```

### 3. Iniciar en modo desarrollo

```bash
npm run start:dev
```

El servidor inicia en `http://localhost:3001`

## 📡 API Endpoints

### Authentication

- `POST /api/auth/register` - Registrar nueva organización + usuario
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Obtener perfil actual (requiere JWT)

### Organizations

- `GET /api/organizations/me` - Obtener mi organización
- `PUT /api/organizations/me` - Actualizar configuración de IA, WhatsApp, etc.

### Contacts

- `GET /api/contacts` - Listar contactos (con filtros opcionales)
- `GET /api/contacts/stats` - Estadísticas de contactos
- `GET /api/contacts/:id` - Obtener un contacto
- `POST /api/contacts` - Crear contacto
- `PUT /api/contacts/:id` - Actualizar contacto
- `DELETE /api/contacts/:id` - Eliminar contacto

### Messages

- `GET /api/messages` - Listar mensajes
- `GET /api/messages/stats` - Estadísticas de mensajes
- `POST /api/messages/send` - Enviar mensaje
- `GET /api/messages/conversation/:contactId` - Historial de conversación

### AI

- `POST /api/ai/generate-response` - Generar respuesta con Flowise

### WhatsApp

- `POST /api/whatsapp/connect` - Iniciar conexión (QR)
- `GET /api/whatsapp/qr` - Obtener QR code
- `GET /api/whatsapp/status` - Estado de conexión
- `POST /api/whatsapp/send` - Enviar mensaje

### Webhooks

- `POST /api/webhooks/evolution` - Recibir mensajes de Evolution API

### Health

- `GET /api/health` - Health check

## 🗄️ Mock Data vs PostgreSQL

### Modo Mock Data (Default)

**Archivo:** `.env`
```bash
USE_DATABASE=false
```

**Ventajas:**
- ✅ No necesitas PostgreSQL instalado
- ✅ Funciona de inmediato
- ✅ Perfecto para desarrollo y testing
- ✅ Mismo código que producción

**Desventajas:**
- ❌ Datos se pierden al reiniciar servidor
- ❌ No comparte datos entre instancias

### Modo PostgreSQL

**Archivo:** `.env`
```bash
USE_DATABASE=true
DATABASE_URL=postgresql://chatflow_user:password@localhost:5432/chatflow_prod
```

**Ventajas:**
- ✅ Datos persistentes
- ✅ Multi-instancia
- ✅ Backups automáticos
- ✅ Escalable

## 🧪 Testing

### Test de registro

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@pizzeria.com",
    "password": "test123",
    "organizationName": "Mi Pizzería"
  }'
```

**Respuesta esperada:**
```json
{
  "user": {
    "id": "...",
    "email": "test@pizzeria.com",
    "organizationId": "...",
    "role": "admin"
  },
  "organization": {
    "id": "...",
    "name": "Mi Pizzería",
    "plan": "starter",
    "aiEnabled": true
  },
  "accessToken": "eyJhbGc...",
  "expiresIn": "1h"
}
```

### Test de login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type": application/json" \
  -d '{
    "email": "test@pizzeria.com",
    "password": "test123"
  }'
```

### Test de endpoints protegidos

```bash
# Guardar el token de la respuesta anterior
TOKEN="eyJhbGc..."

# Obtener contactos
curl http://localhost:3001/api/contacts \
  -H "Authorization: Bearer $TOKEN"

# Obtener mi organización
curl http://localhost:3001/api/organizations/me \
  -H "Authorization: Bearer $TOKEN"
```

## 🤖 Configurar Flowise

1. **Obtener URL de Flowise:**
   - Tu instancia: `https://flowise.tudominio.com`

2. **Generar API Key:**
   - Flowise → Settings → API Keys → Create

3. **Crear Chatflow:**
   - Flowise → New Chatflow
   - Agregar: ChatOpenAI + Conversation Chain + Buffer Memory
   - Guardar y copiar el Flow ID

4. **Configurar .env:**
   ```bash
   FLOWISE_API_URL=https://flowise.tudominio.com/api/v1
   FLOWISE_API_KEY=sk-flowise-xxxxx
   FLOWISE_FLOW_ID=abc123-def456
   ```

## 📦 Estructura del Proyecto

```
backend/
├── src/
│   ├── auth/              # Autenticación (JWT, register, login)
│   ├── organizations/     # Gestión de organizaciones
│   ├── contacts/          # CRUD de contactos
│   ├── messages/          # CRUD de mensajes
│   ├── ai/                # Integración Flowise
│   ├── whatsapp/          # Evolution API / Meta API
│   ├── webhooks/          # Recibir mensajes entrantes
│   ├── common/            # Tipos y utilidades compartidas
│   ├── app.module.ts      # Módulo principal
│   └── main.ts            # Entry point
├── .env.example           # Template de variables
├── package.json
└── README.md
```

## 🔄 Migrar a PostgreSQL

Cuando estés listo para usar PostgreSQL:

1. **Ejecutar schema SQL:**
   ```bash
   psql postgresql://user:pass@host:5432/chatflow_prod < ../database/schema.sql
   ```

2. **Cambiar .env:**
   ```bash
   USE_DATABASE=true
   DATABASE_URL=postgresql://chatflow_user:password@localhost:5432/chatflow_prod
   ```

3. **Instalar Prisma (opcional):**
   ```bash
   npm install @prisma/client
   npx prisma generate
   ```

4. **Reiniciar servidor:**
   ```bash
   npm run start:dev
   ```

Los servicios automáticamente detectarán `USE_DATABASE=true` y usarán PostgreSQL.

## 🐛 Troubleshooting

### Error: "Cannot find module"

```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: "Port 3001 already in use"

```bash
# Cambiar puerto en .env
PORT=3002
```

### Error: Flowise no responde

1. Verificar que FLOWISE_API_URL es correcta
2. Verificar que FLOWISE_API_KEY es válida
3. Verificar que FLOWISE_FLOW_ID existe
4. Ver logs del backend para más detalles

## 📚 Más Información

- [NestJS Docs](https://docs.nestjs.com/)
- [JWT Authentication](https://docs.nestjs.com/security/authentication)
- [Flowise API](https://docs.flowiseai.com/)
