# 🧪 TESTING FASE 1 - Bot Config Module

Guía completa para testear el módulo bot-config

---

## 📋 PREREQUISITOS

### 1. Instalar dependencias (si no lo hiciste)

```bash
cd backend
npm install
```

### 2. Crear archivo .env

```bash
cd backend
cp .env.example .env
```

Editar `.env` con estos valores mínimos:

```env
NODE_ENV=development
PORT=3001
JWT_SECRET=test-secret-key-for-development
JWT_EXPIRES_IN=1h
FLOWISE_API_URL=http://flowise-pendiente.com
FLOWISE_API_KEY=pendiente
FLOWISE_FLOW_ID=pendiente
```

---

## 🚀 PASO 1: LEVANTAR EL BACKEND

```bash
cd backend
npm run start:dev
```

**Salida esperada:**
```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] BotConfigModule dependencies initialized
[Nest] INFO [RoutesResolver] BotConfigController {/api/bot-config}:
[Nest] INFO Mapped {/api/bot-config, GET} route
[Nest] INFO Mapped {/api/bot-config, POST} route
[Nest] INFO Mapped {/api/bot-config, PUT} route
[Nest] INFO Mapped {/api/bot-config/toggle, PATCH} route
[Nest] INFO Mapped {/api/bot-config/connection-status, PATCH} route
[Nest] INFO Mapped {/api/bot-config, DELETE} route
[Nest] INFO Application is running on: http://localhost:3001
```

✅ **Si ves esto, el backend está corriendo OK**

---

## 🔐 PASO 2: OBTENER TOKEN DE AUTENTICACIÓN

**Primero necesitas autenticarte para obtener un JWT token**

### Opción A: Usuario Demo (ya existe en memoria)

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@pizzeria.com",
    "password": "demo123"
  }'
```

**Respuesta esperada:**
```json
{
  "user": {
    "id": "1",
    "organizationId": "1",
    "email": "demo@pizzeria.com",
    "role": "admin",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "organization": {
    "id": "1",
    "name": "Demo Pizzeria",
    "slug": "demo-pizzeria-..."
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "1h"
}
```

**Copia el `accessToken` para los siguientes pasos**

### Opción B: Registrar nuevo usuario

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@techstore.com",
    "password": "test123456",
    "organizationName": "TechStore"
  }'
```

---

## 📝 PASO 3: TESTEAR ENDPOINTS DE BOT-CONFIG

**Exporta el token para facilitar los tests:**

```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

(Reemplaza con el token que obtuviste en el paso anterior)

---

### TEST 1: GET - Obtener configuración (sin config aún)

```bash
curl http://localhost:3001/api/bot-config \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta esperada (sin config):**
```json
{
  "exists": false,
  "config": null
}
```

✅ **OK - No hay configuración aún**

---

### TEST 2: POST - Crear configuración del bot

```bash
curl -X POST http://localhost:3001/api/bot-config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "connectionType": "evolution_api",
    "evolutionApiUrl": "http://evo-o8osgcwwo0wcc8s480o4k888.173.249.14.83.sslip.io",
    "evolutionInstanceName": "techstore-bot",
    "evolutionApiKey": "my-secret-api-key-12345",
    "agentType": "vendedor",
    "businessName": "TechStore",
    "businessDescription": "Venta de electrónicos y accesorios tecnológicos",
    "products": "Laptops, celulares, tablets, auriculares, smartwatches",
    "businessHours": "Lunes a Viernes 9am - 6pm, Sábados 10am - 2pm",
    "language": "es",
    "tone": "casual",
    "botEnabled": false
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "config": {
    "id": "uuid-generado-automaticamente",
    "organizationId": "1",
    "connectionType": "evolution_api",
    "connectionStatus": "disconnected",
    "evolutionApiUrl": "http://evo-o8osgcwwo0wcc8s480o4k888.173.249.14.83.sslip.io",
    "evolutionInstanceName": "techstore-bot",
    "evolutionApiKey": "my-s••••••••12345",  // ← MASKED!
    "agentType": "vendedor",
    "businessName": "TechStore",
    "businessDescription": "Venta de electrónicos y accesorios tecnológicos",
    "products": "Laptops, celulares, tablets, auriculares, smartwatches",
    "businessHours": "Lunes a Viernes 9am - 6pm, Sábados 10am - 2pm",
    "language": "es",
    "tone": "casual",
    "botEnabled": false,
    "createdAt": "2025-11-14T...",
    "updatedAt": "2025-11-14T..."
  }
}
```

✅ **OK - Configuración creada**
✅ **Nota:** API Key está enmascarada en la respuesta (seguridad)

---

### TEST 3: GET - Obtener configuración (con config)

```bash
curl http://localhost:3001/api/bot-config \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta esperada:**
```json
{
  "exists": true,
  "config": {
    "id": "...",
    "organizationId": "1",
    "connectionType": "evolution_api",
    "connectionStatus": "disconnected",
    ...
    "botEnabled": false
  }
}
```

✅ **OK - Configuración existe y se devuelve**

---

### TEST 4: PUT - Actualizar configuración (parcial)

```bash
curl -X PUT http://localhost:3001/api/bot-config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "TechStore Pro",
    "products": "Laptops, celulares, tablets, auriculares, smartwatches, consolas",
    "tone": "professional"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "config": {
    ...
    "businessName": "TechStore Pro",  // ← ACTUALIZADO
    "products": "Laptops, celulares, tablets, auriculares, smartwatches, consolas",  // ← ACTUALIZADO
    "tone": "professional",  // ← ACTUALIZADO
    "updatedAt": "2025-11-14T..." // ← FECHA NUEVA
  }
}
```

✅ **OK - Campos actualizados correctamente**

---

### TEST 5: PATCH - Activar bot (toggle)

```bash
curl -X PATCH http://localhost:3001/api/bot-config/toggle \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "botEnabled": true,  // ← CAMBIA A TRUE
  "config": {
    ...
    "botEnabled": true
  }
}
```

✅ **OK - Bot activado**

**Ejecutar de nuevo para desactivar:**

```bash
curl -X PATCH http://localhost:3001/api/bot-config/toggle \
  -H "Authorization: Bearer $TOKEN"
```

```json
{
  "success": true,
  "botEnabled": false,  // ← VUELVE A FALSE
  ...
}
```

✅ **OK - Toggle funciona en ambas direcciones**

---

### TEST 6: PATCH - Actualizar estado de conexión

```bash
curl -X PATCH http://localhost:3001/api/bot-config/connection-status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "connected"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "connectionStatus": "connected",  // ← ACTUALIZADO
  "config": {
    ...
    "connectionStatus": "connected"
  }
}
```

✅ **OK - Estado de conexión actualizado**

**Probar otros estados:**

```bash
# Connecting
curl -X PATCH http://localhost:3001/api/bot-config/connection-status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "connecting"}'

# Disconnected
curl -X PATCH http://localhost:3001/api/bot-config/connection-status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "disconnected"}'
```

✅ **OK - Todos los estados funcionan**

---

### TEST 7: DELETE - Eliminar configuración

```bash
curl -X DELETE http://localhost:3001/api/bot-config \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta esperada:**
```
(Sin contenido - HTTP 204 No Content)
```

**Verificar que se eliminó:**

```bash
curl http://localhost:3001/api/bot-config \
  -H "Authorization: Bearer $TOKEN"
```

**Respuesta:**
```json
{
  "exists": false,
  "config": null
}
```

✅ **OK - Configuración eliminada correctamente**

---

## 🛡️ TESTS DE SEGURIDAD

### TEST 8: Sin autenticación (debe fallar)

```bash
curl http://localhost:3001/api/bot-config
```

**Respuesta esperada:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

✅ **OK - Rechaza requests sin token**

---

### TEST 9: Token inválido (debe fallar)

```bash
curl http://localhost:3001/api/bot-config \
  -H "Authorization: Bearer token-invalido-12345"
```

**Respuesta esperada:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

✅ **OK - Rechaza tokens inválidos**

---

### TEST 10: API Key enmascarada

Crear config con API key larga:

```bash
curl -X POST http://localhost:3001/api/bot-config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "connectionType": "evolution_api",
    "evolutionApiKey": "super-secret-api-key-1234567890-abcdefg",
    "agentType": "vendedor",
    "businessName": "Test",
    "businessDescription": "Test",
    "products": "Test",
    "businessHours": "Test",
    "language": "es",
    "tone": "casual"
  }'
```

Verificar que en la respuesta el `evolutionApiKey` esté enmascarado:

```json
{
  "config": {
    "evolutionApiKey": "supe••••••••••••••••••••••••efg"
    // Solo muestra primeros 4 y últimos 4 chars
  }
}
```

✅ **OK - API keys están enmascaradas (seguridad)**

---

## 🧪 TEST DE VALIDACIÓN

### TEST 11: Campos requeridos faltantes (debe fallar)

```bash
curl -X POST http://localhost:3001/api/bot-config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "connectionType": "evolution_api"
  }'
```

**Respuesta esperada:**
```json
{
  "statusCode": 400,
  "message": [
    "agentType must be one of the following values: vendedor, asistente, secretaria, custom",
    "businessName should not be empty",
    "businessName must be a string",
    ...
  ],
  "error": "Bad Request"
}
```

✅ **OK - Validación funciona correctamente**

---

### TEST 12: Valores enum inválidos (debe fallar)

```bash
curl -X POST http://localhost:3001/api/bot-config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "connectionType": "invalid-type",
    "agentType": "invalid-agent",
    "language": "invalid-lang",
    "tone": "invalid-tone",
    "businessName": "Test",
    "businessDescription": "Test",
    "products": "Test",
    "businessHours": "Test"
  }'
```

**Respuesta esperada:**
```json
{
  "statusCode": 400,
  "message": [
    "connectionType must be one of the following values: evolution_api, meta_api",
    "agentType must be one of the following values: vendedor, asistente, secretaria, custom",
    "language must be one of the following values: es, en, pt",
    "tone must be one of the following values: formal, casual, professional"
  ],
  "error": "Bad Request"
}
```

✅ **OK - Validación de enums funciona**

---

## 🎯 CHECKLIST COMPLETO

Marcar cada uno al completarlo:

- [ ] Backend levanta sin errores
- [ ] Rutas de bot-config están registradas
- [ ] Login funciona y devuelve token
- [ ] GET /api/bot-config sin config devuelve `exists: false`
- [ ] POST /api/bot-config crea configuración
- [ ] GET /api/bot-config con config devuelve datos
- [ ] PUT /api/bot-config actualiza campos
- [ ] PATCH /api/bot-config/toggle activa/desactiva bot
- [ ] PATCH /api/bot-config/connection-status actualiza estado
- [ ] DELETE /api/bot-config elimina configuración
- [ ] Requests sin token son rechazados (401)
- [ ] Tokens inválidos son rechazados (401)
- [ ] API keys están enmascaradas en respuestas
- [ ] Validación de campos requeridos funciona
- [ ] Validación de enums funciona

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot find module 'uuid'"

```bash
cd backend
npm install uuid
```

### Error: "Port 3001 already in use"

Cambiar puerto en `.env`:
```env
PORT=3002
```

### Error: "JWT_SECRET is not defined"

Asegurarse que `.env` existe y tiene:
```env
JWT_SECRET=test-secret-key
```

### Backend no levanta

```bash
# Limpiar y reinstalar
cd backend
rm -rf node_modules dist
npm install
npm run build
npm run start:dev
```

---

## ✅ SI TODO PASÓ

**FASE 1 está 100% funcional** ✅

Puedes proceder con **FASE 2: Evolution API Module**

---

## 📊 LOGS A OBSERVAR

Cuando ejecutes los tests, deberías ver logs en la consola del backend:

```
[BotConfigService] Created bot config for org 1
[BotConfigService] Updated bot config for org 1
[BotConfigService] Toggled bot for org 1: ENABLED
[BotConfigService] Updated connection status for org 1: connected
[BotConfigService] Deleted bot config for org 1
```

✅ **Estos logs confirman que todo funciona correctamente**

---

**¿Todo funcionó? 🎉 ¡Listo para FASE 2!**
