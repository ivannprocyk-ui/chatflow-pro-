# ⚡ QUICK START - ChatFlow Pro Multi-Tenant

## 🚀 De Prototipo a Producción en 1 Día

---

## PASO 1: SETUP DE BASE DE DATOS (15 min)

### Opción A: Supabase (Recomendado - Gratis)

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta gratis
3. Crea un nuevo proyecto
4. Copia la connection string de PostgreSQL
5. Ejecuta el schema:

```bash
# Conectar a Supabase
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Pegar el contenido de database/schema.sql
\i database/schema.sql
```

### Opción B: PostgreSQL Local

```bash
# Instalar PostgreSQL
brew install postgresql  # Mac
sudo apt install postgresql  # Linux

# Crear base de datos
createdb chatflow_pro

# Ejecutar schema
psql chatflow_pro < database/schema.sql
```

---

## PASO 2: BACKEND API (30 min)

```bash
# 1. Crear proyecto
npx create-nestjs-app chatflow-backend

cd chatflow-backend

# 2. Instalar dependencias
npm install @nestjs/passport @nestjs/jwt passport passport-jwt
npm install @prisma/client bcrypt class-validator
npm install -D prisma @types/bcrypt @types/passport-jwt

# 3. Inicializar Prisma
npx prisma init

# 4. Configurar .env
cat > .env << 'EOF'
DATABASE_URL="postgresql://user:password@localhost:5432/chatflow_pro"
JWT_SECRET="tu-secreto-super-seguro-aqui-cambialo"
PORT=3001
EOF

# 5. Generar Prisma Client
npx prisma generate

# 6. Copiar código de MIGRATION_GUIDE.md
# (Auth Module, Users Module, Contacts Module, etc.)

# 7. Iniciar servidor
npm run start:dev
```

**Tu API estará corriendo en: http://localhost:3001** ✅

---

## PASO 3: FRONTEND (10 min)

```bash
# En tu proyecto actual de chatflow-pro

# 1. Instalar axios
npm install axios react-router-dom

# 2. Crear .env
cat > .env.local << 'EOF'
REACT_APP_API_URL=http://localhost:3001/api
EOF

# 3. Copiar AuthContext del MIGRATION_GUIDE.md
# Guardar en: src/react-app/contexts/AuthContext.tsx

# 4. Copiar Login page
# Guardar en: src/react-app/pages/Login.tsx

# 5. Actualizar App.tsx
# Agregar AuthProvider y rutas protegidas

# 6. Iniciar
npm run dev
```

---

## PASO 4: TESTING (5 min)

### Test 1: Registro

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123",
    "organizationName": "Test Company"
  }'
```

**Respuesta esperada:**
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@test.com",
    "role": "admin",
    "organization": {
      "id": "org-uuid",
      "name": "Test Company"
    }
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "..."
}
```

### Test 2: Login

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123"
  }'
```

### Test 3: Obtener Contactos (Protegido)

```bash
curl -X GET http://localhost:3001/contacts \
  -H "Authorization: Bearer TU_ACCESS_TOKEN_AQUI"
```

---

## PASO 5: DEPLOYMENT (20 min)

### Backend en Railway

```bash
# 1. Instalar CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Crear proyecto
railway init

# 4. Agregar PostgreSQL
railway add postgresql

# 5. Configurar env vars
railway variables set JWT_SECRET="tu-secreto-aqui"

# 6. Deploy
git add .
git commit -m "Deploy backend"
railway up
```

### Frontend en Vercel

```bash
# 1. Instalar CLI
npm install -g vercel

# 2. Deploy
vercel

# 3. Configurar env
vercel env add REACT_APP_API_URL production
# Ingresar: https://tu-backend.railway.app/api

# 4. Re-deploy
vercel --prod
```

---

## PASO 6: MIGRAR DATOS EXISTENTES (10 min)

Si ya tienes datos en localStorage:

```bash
# 1. Exportar desde frontend
# Click en "Backup" en Dashboard
# Descargar archivo: chatflow_backup_2024-01-01.json

# 2. Ejecutar script de migración
cd chatflow-backend
ts-node scripts/migrate-localstorage-to-db.ts \
  YOUR-ORG-ID \
  ../chatflow_backup_2024-01-01.json
```

---

## 🎉 ¡LISTO!

Tu sistema multi-tenant está funcionando. Ahora puedes:

- ✅ Registrar múltiples organizaciones
- ✅ Cada una con su login independiente
- ✅ Datos completamente aislados
- ✅ Todos los features funcionando

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot connect to database"

**Solución:**
```bash
# Verificar que PostgreSQL esté corriendo
pg_isready

# Verificar connection string
echo $DATABASE_URL

# Test manual
psql $DATABASE_URL
```

### Error: "JWT malformed"

**Solución:**
```typescript
// Verificar que el frontend esté enviando el header correcto
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

### Error: "User already exists"

**Solución:** Email ya registrado. Usa otro email o haz login.

### Error: "Organization not found"

**Solución:** El token JWT está corrupto. Logout y login de nuevo.

---

## 📚 PRÓXIMOS PASOS

1. ✅ **Personalizar branding**
   - Logo, colores, nombre

2. ✅ **Configurar Meta API**
   - En configuración de cada organización

3. ✅ **Invitar usuarios**
   - Admin puede invitar a su equipo

4. ✅ **Setup dominio custom**
   - tuempresa.com en lugar de vercel.app

5. ✅ **Configurar monitoreo**
   - Sentry para errores
   - Plausible para analytics

---

## 💡 TIPS PRO

### Performance

```typescript
// 1. Agregar índices en queries lentas
// En Prisma schema:
@@index([organizationId, status])
@@index([createdAt])
```

### Seguridad

```typescript
// 1. Rate limiting
import { ThrottlerModule } from '@nestjs/throttler';

ThrottlerModule.forRoot({
  ttl: 60,
  limit: 10,
})

// 2. Helmet para headers de seguridad
import helmet from 'helmet';
app.use(helmet());
```

### Monitoreo

```typescript
// 1. Health check endpoint
@Get('health')
healthCheck() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}
```

---

## 📞 SOPORTE

¿Problemas? ¿Preguntas?

- 📧 Email: support@chatflowpro.com
- 💬 Discord: discord.gg/chatflowpro
- 📖 Docs: docs.chatflowpro.com
- 🐛 Issues: github.com/chatflowpro/issues

---

## 🎓 RECURSOS

- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Multi-tenancy Guide](https://www.prisma.io/docs/guides/database/multi-tenant-apps)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)

---

¡Feliz coding! 🚀
