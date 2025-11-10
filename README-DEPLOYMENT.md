# 🚀 Guía de Deployment - ChatFlow Pro

## ❌ Problema Actual

El **frontend** está desplegado en Vercel pero el **backend NO** está desplegado, por eso sale error 404.

## ✅ Soluciones

### Opción 1: Usar localmente (FUNCIONA AHORA)

Ya tienes todo funcionando en:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001/api

**Credenciales de prueba:**
- Email: `demo@pizzeria.com`
- Password: `demo123`

### Opción 2: Desplegar Backend en Railway (Recomendado)

1. Crea cuenta en [Railway.app](https://railway.app)
2. Instala Railway CLI:
```bash
npm install -g @railway/cli
railway login
```

3. Despliega el backend:
```bash
cd backend
railway init
railway up
```

4. Copia la URL del backend (ej: `https://tu-backend.railway.app`)

5. Actualiza las variables de entorno en Vercel:
   - Ve a tu proyecto en Vercel
   - Settings > Environment Variables
   - Agrega: `VITE_API_URL` = `https://tu-backend.railway.app/api`
   - Redeploy el frontend

### Opción 3: Desplegar Backend en Render

1. Crea cuenta en [Render.com](https://render.com)
2. New > Web Service
3. Conecta tu repositorio de GitHub
4. Configura:
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`
   - Environment Variables:
     - `NODE_ENV` = `production`
     - `JWT_SECRET` = (genera uno aleatorio)
     - `PORT` = `3001`

5. Copia la URL (ej: `https://chatflow-backend.onrender.com`)

6. Actualiza `VITE_API_URL` en Vercel

### Opción 4: Todo en Vercel (Más complejo)

Vercel no es ideal para backends NestJS, pero se puede con serverless functions.

## 🔧 Configuración de Variables de Entorno

### Para Vercel (Frontend):
```
VITE_API_URL=https://tu-backend.railway.app/api
```

### Para Railway/Render (Backend):
```
NODE_ENV=production
PORT=3001
JWT_SECRET=tu-secreto-super-seguro-de-32-caracteres-minimo
FRONTEND_URL=https://tu-frontend.vercel.app
```

## 📝 Notas Importantes

1. El backend usa **mock data en memoria** - no necesita base de datos
2. Cada vez que reinicies el backend, los datos se borran
3. La cuenta demo (`demo@pizzeria.com` / `demo123`) siempre está disponible
4. Para producción real, necesitarás agregar una base de datos (PostgreSQL)

## 🎯 Recomendación

**Usa Railway para el backend** - es gratis para empezar, fácil de usar, y perfecto para NestJS.
