# 🚀 GUÍA COMPLETA DE CONFIGURACIÓN - ChatFlow Pro

Esta guía te llevará paso a paso para poner ChatFlow Pro en funcionamiento completo.

## 📋 Tabla de Contenidos

1. [Prerequisitos](#prerequisitos)
2. [Configuración de Supabase](#configuración-de-supabase)
3. [Configuración de Chatwoot](#configuración-de-chatwoot)
4. [Configuración de Flowise](#configuración-de-flowise)
5. [Configuración de Evolution API (opcional)](#configuración-de-evolution-api)
6. [Configuración del Backend](#configuración-del-backend)
7. [Configuración del Frontend](#configuración-del-frontend)
8. [Primer Uso](#primer-uso)
9. [Verificación](#verificación)

---

## 1. Prerequisitos

Antes de comenzar, asegúrate de tener:

- ✅ Node.js 18+ instalado
- ✅ npm o yarn instalado
- ✅ Una cuenta de Supabase (gratis en https://supabase.com)
- ✅ Una instancia de Chatwoot desplegada
- ✅ Una instancia de Flowise desplegada
- ✅ (Opcional) Evolution API para WhatsApp vía QR

---

## 2. Configuración de Supabase

### 2.1 Crear Proyecto

1. Ve a https://supabase.com
2. Crea un nuevo proyecto
3. Anota la URL del proyecto y las API Keys

### 2.2 Ejecutar el Schema

1. Abre el SQL Editor en Supabase
2. Ejecuta el contenido del archivo `supabase-schema.sql`

```bash
# El archivo está en la raíz del proyecto
cat supabase-schema.sql
```

3. Verifica que se crearon todas las tablas:
   - `organizations`
   - `users`
   - `bot_configs`
   - `bot_message_logs`
   - `follow_up_configs`
   - `pending_follow_ups`
   - Y todas las demás...

### 2.3 Obtener Credenciales

En tu proyecto de Supabase, ve a Settings → API:

- **Project URL:** `https://xxxxx.supabase.co`
- **Anon/Public Key:** Comienza con `eyJhbG...`
- **Service Role Key:** Comienza con `eyJhbG...` (¡Mantén esto secreto!)

---

## 3. Configuración de Chatwoot

### 3.1 Crear Cuenta de Usuario

Si no tienes Chatwoot instalado:
- Opción 1: Usa Chatwoot Cloud (https://app.chatwoot.com)
- Opción 2: Deploy con Docker: https://www.chatwoot.com/docs/self-hosted/deployment/docker

### 3.2 Crear Inbox

1. En Chatwoot, ve a Settings → Inboxes
2. Crea un nuevo Inbox tipo "API"
3. Anota el **Inbox ID** (aparece en la URL)

### 3.3 Obtener API Key

1. Ve a tu perfil → Profile Settings
2. En "Access Token", copia tu API Key
3. **Account ID:** Normalmente es `1` (aparece en la URL de Chatwoot)

### 3.4 Configurar Webhook (Importante)

1. En Settings → Webhooks
2. Crea un nuevo webhook:
   - **URL:** `https://TU-BACKEND-URL.com/webhooks/chatwoot`
   - **Events:** Selecciona `message_created`
3. Guarda el webhook

**URL del Backend:** Será la URL donde deploys el backend de ChatFlow (ej: Railway, Render, etc.)

---

## 4. Configuración de Flowise

### 4.1 Deploy de Flowise

Si no tienes Flowise instalado:

```bash
# Opción 1: Docker
docker run -d -p 3000:3000 flowiseai/flowise

# Opción 2: npm
npx flowise start
```

Documentación: https://docs.flowiseai.com

### 4.2 Crear Chatflow

1. Abre Flowise en tu navegador
2. Crea un nuevo Chatflow
3. Ejemplo de configuración básica:
   - **Chat Model:** OpenAI, Anthropic, o el que prefieras
   - **Prompt:** Usa variables `{{company_name}}`, `{{products_list}}`, etc.
   - **Memory:** Conversation Buffer Memory

4. Guarda el Chatflow y anota el **Chatflow ID**

### 4.3 Generar API Key

1. Settings → API Keys
2. Crea una nueva API Key
3. Anota la key (comienza con `sk-...`)

---

## 5. Configuración de Evolution API (Opcional)

Si quieres usar WhatsApp vía QR code en lugar de Meta API:

### 5.1 Deploy Evolution API

```bash
# Docker
docker run -d \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=tu-api-key \
  atendai/evolution-api:latest
```

Documentación: https://doc.evolution-api.com

### 5.2 Obtener Credenciales

- **URL:** `http://localhost:8080` o tu dominio
- **API Key:** La que configuraste en `AUTHENTICATION_API_KEY`

---

## 6. Configuración del Backend

### 6.1 Editar el archivo .env

El archivo `.env` ya existe en `backend/.env`. Edítalo con tus credenciales:

```bash
cd backend
nano .env  # o tu editor favorito
```

### 6.2 Completar Variables de Entorno

```bash
# ============================================
# SUPABASE DATABASE
# ============================================
SUPABASE_URL=https://xxxxx.supabase.co  # Tu URL de Supabase
SUPABASE_ANON_KEY=eyJhbG...              # Tu Anon Key
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...      # Tu Service Role Key

# ============================================
# JWT AUTHENTICATION
# ============================================
JWT_SECRET=cambia-esto-por-algo-muy-secreto-y-aleatorio

# ============================================
# CHATWOOT INTEGRATION
# ============================================
CHATWOOT_URL=https://app.chatwoot.com  # Tu URL de Chatwoot
CHATWOOT_API_KEY=tu-api-key-de-chatwoot
CHATWOOT_ACCOUNT_ID=1                   # Tu Account ID

# ============================================
# FLOWISE AI INTEGRATION
# ============================================
FLOWISE_API_URL=https://tu-flowise.com/api/v1
FLOWISE_API_KEY=sk-flowise-tu-api-key
FLOWISE_FLOW_ID=tu-chatflow-id-aqui

# ============================================
# EVOLUTION API (opcional)
# ============================================
EVOLUTION_API_URL=http://localhost:8080  # Si usas Evolution API
EVOLUTION_API_KEY=tu-evolution-api-key

# ============================================
# WEBHOOK URLs
# ============================================
BACKEND_WEBHOOK_URL=https://tu-backend.com/webhooks

# ============================================
# CORS
# ============================================
FRONTEND_URL=http://localhost:3000  # Cambia cuando deploys
```

### 6.3 Instalar Dependencias

```bash
npm install
```

### 6.4 Compilar y Ejecutar

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

El backend estará corriendo en `http://localhost:3001`

---

## 7. Configuración del Frontend

### 7.1 Variables de Entorno

Crea un archivo `.env.local` en `src/react-app`:

```bash
REACT_APP_API_URL=http://localhost:3001
```

### 7.2 Instalar Dependencias

```bash
cd src/react-app
npm install
```

### 7.3 Ejecutar

```bash
npm start
```

El frontend estará en `http://localhost:3000`

---

## 8. Primer Uso

### 8.1 Crear Cuenta

1. Abre `http://localhost:3000`
2. Haz clic en "Registrarse"
3. Completa el formulario:
   - Email
   - Password
   - Nombre de la organización

4. Haz login con tus credenciales

### 8.2 Configurar Bot IA

1. Ve a **"Bot IA"** en el menú
2. Completa la configuración:

   **Conexión WhatsApp:**
   - Tipo: Evolution API o Meta API
   - URL de Evolution API (si aplica)
   - Credenciales

   **Configuración del Agente:**
   - Tipo de agente: Vendedor / Asistente / Secretaria
   - Nombre del negocio
   - Descripción
   - Productos/Servicios
   - Horarios de atención
   - Idioma
   - Tono de conversación

   **Chatwoot:**
   - Inbox ID de Chatwoot

3. Guarda la configuración

### 8.3 Conectar WhatsApp (Evolution API)

1. Ve a la pestaña de "Conexión"
2. Haz clic en "Conectar WhatsApp"
3. Escanea el código QR con tu teléfono
4. Espera a que aparezca "Conectado"

### 8.4 Activar el Bot

1. En la página de configuración del bot
2. Toggle "Bot Activado" a ON
3. El bot ahora responderá automáticamente en Chatwoot

---

## 9. Verificación

### 9.1 Verificar Flujo Completo

1. **Envía un mensaje de prueba** vía WhatsApp al número conectado

2. **Verifica en Chatwoot:**
   - El mensaje debe aparecer en el inbox
   - Debe crearse una conversación

3. **El bot debe responder automáticamente:**
   - La respuesta llega a ChatWoot
   - ChatWoot envía la respuesta al cliente vía WhatsApp

4. **Verifica en Bot Analytics:**
   - Ve a "Analytics Bot" en ChatFlow
   - Deberías ver el mensaje procesado
   - Métricas de tiempo de respuesta
   - Estado de éxito

### 9.2 Verificar Tracking

En Bot Analytics puedes ver:
- Total de mensajes procesados
- Tasa de éxito
- Tiempo promedio de respuesta
- Conversaciones únicas
- Gráficos de actividad

### 9.3 Configurar Follow-ups (Opcional)

1. Ve a "Automatizaciones" → "Configuración de Seguimiento"
2. Activa los follow-ups
3. Configura:
   - Tiempo de espera antes del seguimiento (ej: 60 minutos)
   - Máximo de seguimientos (ej: 3)
   - Tipo de mensaje: Template o generado por IA
   - Horario de negocio
   - Solo días laborables

4. El sistema enviará mensajes automáticos si el cliente no responde

---

## 🎯 Checklist Final

- [ ] Supabase configurado y schema ejecutado
- [ ] Chatwoot con inbox creado y webhook configurado
- [ ] Flowise con chatflow creado y API key generada
- [ ] Backend con .env configurado y corriendo
- [ ] Frontend con .env.local configurado y corriendo
- [ ] Cuenta de usuario creada en ChatFlow
- [ ] Bot IA configurado
- [ ] WhatsApp conectado (QR escaneado o Meta API configurada)
- [ ] Bot activado
- [ ] Mensaje de prueba enviado y respuesta recibida
- [ ] Analytics mostrando datos

---

## 🐛 Troubleshooting

### El bot no responde

1. **Verifica en el backend:**
   ```bash
   # Revisa los logs del backend
   npm run start:dev
   ```

2. **Verifica el webhook de Chatwoot:**
   - Settings → Webhooks
   - Debe apuntar a tu backend: `/webhooks/chatwoot`
   - Eventos: `message_created`

3. **Verifica que el bot esté activado:**
   - En Bot IA → Toggle "Bot Activado"

### Error de conexión con Flowise

1. Verifica que Flowise esté corriendo
2. Verifica la URL en `.env`: debe terminar en `/api/v1`
3. Verifica que el Chatflow ID sea correcto
4. Verifica la API Key

### Error de Supabase

1. Verifica las credenciales en `.env`
2. Verifica que el schema se haya ejecutado completamente
3. Revisa los logs del backend para errores específicos

### WhatsApp no conecta (Evolution API)

1. Verifica que Evolution API esté corriendo
2. Verifica la URL y API Key
3. Revisa los logs de Evolution API
4. Intenta desconectar y reconectar

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs del backend (`npm run start:dev`)
2. Revisa la consola del navegador (F12)
3. Verifica que todas las URLs en `.env` sean correctas
4. Verifica que todos los servicios (Supabase, Chatwoot, Flowise) estén activos

---

## 🎉 ¡Listo!

ChatFlow Pro está completamente configurado y funcionando.

### Próximos Pasos:

1. **Personaliza tus prompts** en Flowise
2. **Configura follow-ups automáticos**
3. **Revisa las analíticas** regularmente
4. **Ajusta el comportamiento del bot** según necesites

**¡Disfruta de tu bot de WhatsApp con IA! 🚀**
