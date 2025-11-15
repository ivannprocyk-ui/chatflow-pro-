# 🚀 Guía de Inicio Rápido - Bot IA

## ¿Dónde está la interfaz gráfica?

El código del Bot IA está **completamente implementado** pero necesitas **levantar los servidores** para verlo en tu navegador.

---

## 📋 Pasos para Ver el Bot IA

### 1️⃣ **Configurar Variables de Entorno**

Primero, crea el archivo `.env` en la carpeta `backend/`:

```bash
cd backend
cp .env.example .env
```

Edita `backend/.env` con tus credenciales:

```env
# Database (opcional para desarrollo - usa in-memory storage)
DATABASE_URL=postgresql://user:password@localhost:5432/chatflow

# JWT
JWT_SECRET=tu-secreto-super-seguro-cambialo

# Flowise AI
FLOWISE_API_URL=https://tu-flowise-instance.com
FLOWISE_API_KEY=tu-flowise-api-key
FLOWISE_FLOW_ID=tu-flow-id

# ChatWoot
CHATWOOT_URL=https://tu-chatwoot.com
CHATWOOT_API_KEY=tu-chatwoot-api-key

# Server
PORT=3000
```

---

### 2️⃣ **Instalar Dependencias Backend**

```bash
cd backend
npm install
```

---

### 3️⃣ **Iniciar Backend (en una terminal)**

```bash
cd backend
npm run start:dev
```

Deberías ver:

```
[Nest] 12345  - INFO [NestFactory] Starting Nest application...
[Nest] 12345  - INFO [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - INFO Application is running on: http://localhost:3000
```

✅ **Backend corriendo en http://localhost:3000**

---

### 4️⃣ **Instalar Dependencias Frontend**

Abre una **NUEVA terminal** (deja el backend corriendo):

```bash
# Asegúrate de estar en la raíz del proyecto
npm install
```

---

### 5️⃣ **Iniciar Frontend (en la segunda terminal)**

```bash
npm run dev
```

Deberías ver:

```
  VITE v5.x.x  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

✅ **Frontend corriendo en http://localhost:5173**

---

### 6️⃣ **Acceder a la Aplicación**

Abre tu navegador en: **http://localhost:5173**

1. **Registra una cuenta** (si es primera vez)
   - Email: `admin@ejemplo.com`
   - Password: `tu-password`
   - Nombre organización: `Mi Empresa`

2. **Haz Login**

3. **Ve al menú lateral y busca:**
   - 🤖 **Bot IA** → Para configurar tu bot
   - 📊 **Analytics Bot** → Para ver métricas

---

## 🎯 Cómo Usar el Bot IA

### **Paso 1: Configurar el Bot (🤖 Bot IA)**

1. Ve a **🤖 Bot IA** en el menú lateral
2. En la pestaña **"Configuración"**:
   - Selecciona tipo de agente: Vendedor / Asistente / Secretaria / Custom
   - Llena datos de tu negocio:
     - Nombre del negocio
     - Descripción
     - Productos/Servicios
     - Horario de atención
   - Selecciona idioma y tono
   - Añade ChatWoot Account ID e Inbox ID

3. Haz clic en **"💾 Guardar Configuración"**

---

### **Paso 2: Conectar WhatsApp (Tab "Conexión WhatsApp")**

1. Ve a la pestaña **"📱 Conexión WhatsApp"**
2. Configura Evolution API:
   - Evolution API URL: `https://tu-evolution-api.com`
   - Evolution API Key: `tu-api-key`
   - Instance Name (opcional): `mi-bot-whatsapp`

3. Haz clic en **"📱 Conectar WhatsApp"**
4. **Escanea el código QR** que aparece con tu WhatsApp
5. Espera a que el estado cambie a **"Conectado"** ✅

---

### **Paso 3: Activar el Bot**

1. En el header superior, verás un botón:
   - ⏸️ **Bot Inactivo** → Haz clic para activar
   - ✅ **Bot Activo** → El bot ahora responderá mensajes

---

### **Paso 4: Ver Analytics (📊 Analytics Bot)**

1. Ve a **📊 Analytics Bot** en el menú lateral
2. Selecciona el período: 24h / 7d / 30d / Todo
3. Verás:
   - Total de mensajes procesados
   - Tasa de éxito
   - Tasa de respuesta
   - Tiempos de procesamiento
   - Rendimiento por tipo de agente
   - Errores principales

---

## 🔥 Flujo Completo

```
┌─────────────┐
│  Cliente    │
│  (WhatsApp) │
└──────┬──────┘
       │ 1. Envía mensaje
       ▼
┌─────────────┐
│  ChatWoot   │ 2. Recibe mensaje
│             │ 3. Envía webhook a tu backend
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  TU BACKEND (localhost:3000)        │
│  /webhooks/chatwoot                 │
│                                     │
│  1. WebhooksService recibe webhook  │
│  2. AIService genera respuesta      │
│     - Busca bot-config             │
│     - Construye prompt             │
│     - Llama Flowise AI             │
│  3. BotTrackingService registra    │
│  4. Envía respuesta a ChatWoot     │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────┐
│  Flowise AI │ 5. Genera respuesta inteligente
│  (Grok)     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  ChatWoot   │ 6. Recibe respuesta
│             │ 7. Envía a WhatsApp
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Cliente    │ 8. Recibe respuesta del bot
│  (WhatsApp) │
└─────────────┘
```

---

## 📍 URLs Importantes

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:5173 | Interfaz gráfica |
| **Backend API** | http://localhost:3000/api | API REST |
| **Health Check** | http://localhost:3000/health | Estado del backend |
| **Bot Config API** | http://localhost:3000/api/bot-config | Configuración del bot |
| **Metrics API** | http://localhost:3000/api/bot-tracking/metrics | Métricas del bot |

---

## 🐛 Troubleshooting

### ❌ No veo "🤖 Bot IA" en el menú

**Problema:** El frontend no se actualizó

**Solución:**
```bash
# Detén el frontend (Ctrl+C)
# Limpia cache
rm -rf node_modules/.vite
# Reinicia
npm run dev
```

---

### ❌ Error "Cannot connect to backend"

**Problema:** El backend no está corriendo o está en puerto incorrecto

**Solución:**
1. Verifica que backend esté corriendo: `cd backend && npm run start:dev`
2. Verifica el archivo `src/services/api.ts`:
   ```typescript
   const API_URL = 'http://localhost:3000/api';
   ```

---

### ❌ Error "Bot config not found"

**Problema:** No has guardado la configuración del bot

**Solución:**
1. Ve a **🤖 Bot IA**
2. Llena el formulario
3. Haz clic en **"💾 Guardar Configuración"**

---

### ❌ QR Code no aparece

**Problema:** Evolution API no configurada o URL incorrecta

**Solución:**
1. Verifica Evolution API URL y API Key
2. Asegúrate que Evolution API esté accesible
3. Revisa logs del backend para errores

---

## 🎬 Ejemplo de Uso Rápido

### Configuración Rápida para Testing:

```javascript
// 1. Bot Configuration
Tipo: Asistente
Nombre: "Mi Tienda"
Descripción: "Tienda de ropa online"
Productos: "Camisetas ($20), Pantalones ($40)"
Horario: "Lunes a Viernes 9-18h"
Idioma: Español
Tono: Casual

// 2. ChatWoot (usa tus datos reales)
Account ID: 12345
Inbox ID: 67890

// 3. Evolution API (usa tu instancia)
URL: https://tu-evolution-api.com
API Key: tu-api-key
```

---

## 📊 Verificar que Todo Funciona

### 1. Backend Health Check:
```bash
curl http://localhost:3000/health
# Respuesta: {"status":"ok"}
```

### 2. Obtener Configuración del Bot:
```bash
curl -H "Authorization: Bearer TU_TOKEN" \
  http://localhost:3000/api/bot-config
```

### 3. Ver Métricas:
```bash
curl -H "Authorization: Bearer TU_TOKEN" \
  http://localhost:3000/api/bot-tracking/metrics?period=all
```

---

## ✅ Checklist de Implementación

- [ ] Backend instalado y corriendo (puerto 3000)
- [ ] Frontend instalado y corriendo (puerto 5173)
- [ ] Cuenta creada y login exitoso
- [ ] Menú "🤖 Bot IA" visible
- [ ] Menú "📊 Analytics Bot" visible
- [ ] Configuración del bot guardada
- [ ] Evolution API configurada (opcional para testing sin WhatsApp)
- [ ] ChatWoot configurado (opcional para testing sin WhatsApp)
- [ ] Bot activado (botón verde ✅)

---

## 🚀 Siguiente Nivel

Una vez que veas la interfaz funcionando:

1. **Conecta ChatWoot real** → Para recibir mensajes de WhatsApp
2. **Conecta Evolution API real** → Para conectar tu número de WhatsApp
3. **Configura Flowise** → Para respuestas con IA (Grok/OpenAI/etc)
4. **Prueba end-to-end** → Envía mensaje de WhatsApp y recibe respuesta del bot

---

**¿Necesitas ayuda?** Revisa los logs:
- **Backend:** Aparecen en la terminal donde ejecutaste `npm run start:dev`
- **Frontend:** Abre DevTools del navegador (F12) → Console

---

🎉 **¡Disfruta tu Bot IA!**
