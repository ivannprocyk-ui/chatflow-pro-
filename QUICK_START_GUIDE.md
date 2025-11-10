# 🚀 ChatFlow Pro - Guía de Inicio Rápido

## ¡Tu CRM de WhatsApp con IA está listo!

---

## 📋 Qué acabas de obtener:

✅ **Backend NestJS** completo con mock data (no necesita DB todavía)
✅ **Frontend React** con Login/Register
✅ **Integración Flowise** lista para IA
✅ **WhatsApp via Evolution API** (QR Code)
✅ **Sistema Multi-Tenant** completo

---

## 🎯 Inicio Rápido (5 minutos)

### 1️⃣ Backend

```bash
cd backend

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Iniciar servidor
npm run start:dev
```

✅ Backend corriendo en **http://localhost:3001**

### 2️⃣ Frontend

```bash
# En la raíz del proyecto
npm install

# Iniciar frontend
npm run dev
```

✅ Frontend corriendo en **http://localhost:3000**

---

## 🧪 Probar la App

### Opción A: Usuario Demo

1. Ir a http://localhost:3000/login
2. Email: `demo@pizzeria.com`
3. Password: `demo123`
4. Click "Iniciar Sesión"

### Opción B: Crear Nueva Cuenta

1. Ir a http://localhost:3000/register
2. Nombre empresa: `Mi Empresa`
3. Email: `admin@miempresa.com`
4. Password: `test123`
5. Click "Crear Cuenta"

---

## ⚙️ Configurar IA (Importante!)

Una vez logueado:

1. Ir a **AI Settings** en el menú lateral
2. Activar "Activar respuestas automáticas con IA"
3. Seleccionar un rol:
   - **Vendedor**: Proactivo, cierra ventas
   - **Asistente**: Amable, informativo (recomendado)
   - **Soporte**: Resuelve problemas
   - **Agendador**: Programa citas

4. Completar información:
   ```
   Información de tu Empresa:
   "Vendemos pizzas artesanales desde 1980..."

   Productos y Servicios:
   • Pizza Margarita - $150
   • Pizza Pepperoni - $180
   • Pizza Hawaiana - $170
   ```

5. **Probar el bot** con el botón "🧪 Probar Asistente IA"

6. Click "💾 Guardar Configuración"

---

## 🤖 Conectar Flowise (Opcional pero recomendado)

Si NO tienes Flowise todavía, el bot funcionará con respuestas fallback.

Si TIENES Flowise:

1. Editar `backend/.env`:
   ```bash
   FLOWISE_API_URL=https://flowise.tudominio.com/api/v1
   FLOWISE_API_KEY=sk-flowise-xxxxx
   FLOWISE_FLOW_ID=abc123-def456
   ```

2. Reiniciar backend:
   ```bash
   cd backend
   npm run start:dev
   ```

---

## 📱 Conectar WhatsApp (Próximo paso)

Para conectar WhatsApp con QR necesitas Evolution API.

**Opción 1: Docker local**
```bash
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=tu-api-key \
  atendai/evolution-api:latest
```

**Opción 2: En Coolify**
Ver `COOLIFY_DEPLOYMENT.md` para instrucciones completas.

Una vez Evolution API esté corriendo:

1. En frontend → **WhatsApp** (menú)
2. Click "Conectar WhatsApp"
3. Escanear QR con tu celular
4. ¡Listo! Empieza a recibir mensajes automáticamente

---

## 🗂️ Estructura del Proyecto

```
chatflow-pro/
├── backend/              ← API NestJS
│   ├── src/
│   │   ├── auth/         ← Login/Register
│   │   ├── contacts/     ← Gestión de contactos
│   │   ├── messages/     ← Mensajes y conversaciones
│   │   ├── ai/           ← Integración Flowise
│   │   ├── whatsapp/     ← Evolution API / Meta API
│   │   └── webhooks/     ← Recibir mensajes entrantes
│   ├── .env              ← Variables de entorno
│   └── package.json
│
├── src/react-app/        ← Frontend React
│   ├── pages/
│   │   ├── Login.tsx     ← Página de login
│   │   ├── Register.tsx  ← Página de registro
│   │   ├── AISettings.tsx ← Configuración IA
│   │   └── Dashboard.tsx ← Dashboard principal
│   ├── contexts/
│   │   └── AuthContext.tsx ← Manejo de autenticación
│   ├── services/
│   │   └── api.ts        ← Axios + API calls
│   └── AppNew.tsx        ← Router principal
│
└── database/
    └── schema.sql        ← Schema PostgreSQL (para producción)
```

---

## 🔄 Flujo Completo

```
1. Cliente envía WhatsApp
   ↓
2. Evolution API → Webhook → Backend
   ↓
3. Backend guarda mensaje
   ↓
4. Backend consulta Flowise (IA)
   ↓
5. Flowise genera respuesta inteligente
   ↓
6. Backend envía respuesta por WhatsApp
   ↓
7. Cliente recibe respuesta en 2-3 segundos
```

---

## 📊 Datos Mock vs PostgreSQL

### Actualmente (Mock Data):
- ✅ Todo funciona sin base de datos
- ✅ Datos en memoria (se pierden al reiniciar)
- ✅ Perfecto para desarrollo y testing

### Para Producción (PostgreSQL):
1. Instalar PostgreSQL
2. Ejecutar `database/schema.sql`
3. Cambiar `backend/.env`:
   ```bash
   USE_DATABASE=true
   DATABASE_URL=postgresql://user:pass@localhost:5432/chatflow_prod
   ```
4. Reiniciar backend

Ver `MIGRATION_GUIDE.md` para más detalles.

---

## 🛠️ Comandos Útiles

### Backend:
```bash
cd backend

# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod

# Ver logs
# Los logs aparecen en la consola
```

### Frontend:
```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

### Ambos al mismo tiempo:
Usa 2 terminales, una para backend y otra para frontend.

---

## 🐛 Troubleshooting

### Backend no inicia
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run start:dev
```

### Frontend no inicia
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Error de CORS
Verificar que `backend/.env` tenga:
```bash
FRONTEND_URL=http://localhost:3000
```

### No puedo hacer login
1. Verificar que backend esté corriendo (http://localhost:3001/api/health)
2. Abrir DevTools → Network → Ver errores
3. Verificar que frontend esté apuntando a backend correcto

### Bot no responde
1. Verificar que `aiEnabled` esté en `true` en AI Settings
2. Si tienes Flowise: verificar API Key y Flow ID en `.env`
3. Sin Flowise: debería dar respuesta fallback

---

## 📚 Documentación Completa

- `backend/README.md` - Documentación detallada del backend
- `MIGRATION_GUIDE.md` - Guía de migración a producción
- `COOLIFY_DEPLOYMENT.md` - Deploy en Coolify
- `N8N_WORKFLOWS.md` - Automatizaciones con n8n
- `ONBOARDING_FLOW.md` - Flujo de onboarding de clientes

---

## 🎉 ¡Ya está todo listo!

Tu ChatFlow Pro está funcionando. Ahora puedes:

1. ✅ Crear cuentas de prueba
2. ✅ Configurar tu asistente IA
3. ✅ Conectar WhatsApp (con Evolution API)
4. ✅ Recibir y responder mensajes automáticamente
5. ✅ Ver analytics en el dashboard

---

## 🚀 Próximos Pasos

1. **Conectar Flowise** para respuestas IA reales
2. **Conectar Evolution API** para WhatsApp por QR
3. **Deploy en Coolify** para producción
4. **Configurar n8n** para automatizaciones avanzadas
5. **Migrar a PostgreSQL** cuando tengas muchos datos

---

**¿Necesitas ayuda?**

1. Revisar logs del backend en la terminal
2. Revisar Network tab en DevTools del navegador
3. Verificar que todos los servicios estén corriendo
4. Consultar los README.md de cada módulo

¡Disfruta tu CRM con IA! 🎉
