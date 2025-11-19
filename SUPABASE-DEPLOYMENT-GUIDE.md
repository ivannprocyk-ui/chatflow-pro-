# 🚀 Guía de Deployment - Supabase Database

## ✅ ESTADO ACTUAL

- ✅ **Proyecto Supabase creado:** `rschhztynywqlviyeefx`
- ✅ **Credenciales configuradas:** `.env.local` y `backend/.env`
- ✅ **Scripts SQL corregidos:** 100% funcionales
- ✅ **Interfaces TypeScript actualizadas:** Todos los campos mapeados
- ⏳ **Migraciones pendientes:** Ejecutar en Supabase

---

## 📋 PASOS PARA DEPLOYMENT

### **PASO 1: Acceder a Supabase Dashboard**

1. Ve a: https://app.supabase.com
2. Selecciona tu proyecto: `ChatFlow Pro` (ID: `rschhztynywqlviyeefx`)
3. Deberías ver el Dashboard principal

---

### **PASO 2: Abrir SQL Editor**

1. En el sidebar izquierdo, busca el icono **📊 SQL Editor**
2. Clic en **"New query"** o usa el editor existente

---

### **PASO 3: Ejecutar Migración 001 - Schema Inicial**

**Archivo:** `/supabase/migrations/001_initial_schema.sql`

#### Opción A: Copiar y pegar (Recomendado)

```bash
# En tu terminal local:
cat supabase/migrations/001_initial_schema.sql | pbcopy   # macOS
cat supabase/migrations/001_initial_schema.sql | xclip    # Linux
```

1. Abre el archivo `supabase/migrations/001_initial_schema.sql`
2. **Selecciona TODO el contenido** (Ctrl+A / Cmd+A)
3. **Copia** (Ctrl+C / Cmd+C)
4. Ve al SQL Editor en Supabase
5. **Pega** todo el contenido
6. Clic en **"Run"** o presiona `Ctrl + Enter`

#### Verificación:
✅ Deberías ver "Success. No rows returned"
✅ Si ves errores, cópialos y revisa el reporte

---

### **PASO 4: Ejecutar Migración 002 - RLS Policies**

**Archivo:** `/supabase/migrations/002_rls_policies.sql`

1. Abre el archivo `supabase/migrations/002_rls_policies.sql`
2. **Selecciona TODO** y copia
3. En el SQL Editor, **borra** el contenido anterior
4. **Pega** el nuevo SQL
5. Clic en **"Run"**

#### Verificación:
✅ Deberías ver "Success. No rows returned"
✅ Las políticas RLS se habrán creado

---

### **PASO 5: Ejecutar Migración 003 - Seed Data**

**Archivo:** `/supabase/migrations/003_seed_data.sql`

1. Abre el archivo `supabase/migrations/003_seed_data.sql`
2. **Selecciona TODO** y copia
3. En el SQL Editor, **borra** el contenido anterior
4. **Pega** el nuevo SQL
5. Clic en **"Run"**

#### Verificación:
✅ Deberías ver "Success. No rows returned"
✅ Se habrán creado tags, statuses, fields predefinidos

---

### **PASO 6: Verificar Tablas Creadas**

1. Ve a **📋 Table Editor** en el sidebar
2. Deberías ver **20 tablas creadas:**

#### Core Tables (5):
- ✅ organizations
- ✅ users
- ✅ contacts
- ✅ tags
- ✅ contact_tags

#### Lists (2):
- ✅ contact_lists
- ✅ contact_list_members

#### Messaging (4):
- ✅ messages
- ✅ campaigns
- ✅ templates
- ✅ scheduled_messages

#### Features (3):
- ✅ calendar_events
- ✅ automations
- ✅ automation_executions

#### Bot & Tracking (2):
- ✅ bot_configs
- ✅ bot_message_logs

#### CRM (2):
- ✅ crm_fields
- ✅ crm_statuses

#### Future (2):
- ✅ segments
- ✅ ab_tests

---

### **PASO 7: Crear Usuario Demo**

El usuario demo NO se puede crear via SQL (necesita Supabase Auth).

#### Opción A: Via Dashboard (Recomendado)

1. Ve a **🔐 Authentication > Users** en Supabase
2. Clic en **"Add user"** > **"Create new user"**
3. Completa:
   - **Email:** `demo@chatflow.pro`
   - **Password:** (la que prefieras, ej: `Demo123!`)
   - **Auto Confirm User:** ✅ Activar
   - **User Metadata (JSON):**
     ```json
     {
       "organization_id": "00000000-0000-0000-0000-000000000001",
       "full_name": "Usuario Demo"
     }
     ```
4. Clic en **"Create user"**

#### Luego ejecuta este SQL:

```sql
-- Crear registro en tabla users
INSERT INTO users (id, organization_id, email, full_name, role, is_active)
SELECT
  id,
  '00000000-0000-0000-0000-000000000001'::uuid,
  email,
  'Usuario Demo',
  'admin',
  true
FROM auth.users
WHERE email = 'demo@chatflow.pro'
ON CONFLICT (email) DO NOTHING;
```

#### Verificación:
1. Ve a **Table Editor > users**
2. Deberías ver el usuario `demo@chatflow.pro`

---

### **PASO 8: Verificar RLS (Row Level Security)**

1. Ve a **Database > Policies** en Supabase
2. Selecciona la tabla **contacts**
3. Deberías ver 4 políticas:
   - ✅ "Users can view organization contacts" (SELECT)
   - ✅ "Users can insert contacts" (INSERT)
   - ✅ "Users can update contacts" (UPDATE)
   - ✅ "Admins can delete contacts" (DELETE)

#### Test rápido:
```sql
-- Esto NO debería devolver nada (RLS activo sin autenticación)
SELECT * FROM contacts;

-- Resultado esperado: [] (vacío)
```

---

### **PASO 9: Verificar Datos Iniciales**

#### Tags predefinidos:
```sql
SELECT * FROM tags WHERE organization_id = '00000000-0000-0000-0000-000000000001';
```

**Resultado esperado:** 7 tags (VIP, Cliente Nuevo, Seguimiento Urgente, etc.)

#### CRM Fields:
```sql
SELECT name, label, field_type FROM crm_fields
WHERE organization_id = '00000000-0000-0000-0000-000000000001'
ORDER BY "order";
```

**Resultado esperado:** 7 campos (name, phone, email, company, position, cost, notes)

#### CRM Statuses:
```sql
SELECT name, label, color FROM crm_statuses
WHERE organization_id = '00000000-0000-0000-0000-000000000001'
ORDER BY "order";
```

**Resultado esperado:** 11 estados (lead, contacted, qualified, etc.)

---

### **PASO 10: Test de Conexión desde la App**

#### Frontend Test:

1. Asegúrate de que `.env.local` existe con las credenciales
2. Inicia el frontend:
   ```bash
   npm run dev
   ```

3. Abre DevTools Console (F12)
4. Ejecuta:
   ```javascript
   import { supabase } from './src/react-app/lib/supabase.ts';

   // Test conexión
   const { data, error } = await supabase.from('organizations').select('*').limit(1);
   console.log('✅ Conexión exitosa:', data);
   ```

#### Backend Test:

1. Asegúrate de que `backend/.env` existe
2. Inicia el backend:
   ```bash
   cd backend
   npm run start:dev
   ```

3. Deberías ver en los logs:
   ```
   ✅ Supabase clients initialized
   ```

---

## 🔍 TROUBLESHOOTING

### Error: "relation does not exist"

**Causa:** Las tablas no se crearon.

**Solución:**
1. Ve a Table Editor
2. Si no ves las tablas, ejecuta de nuevo `001_initial_schema.sql`
3. Revisa errores en el SQL Editor

---

### Error: "permission denied for schema public"

**Causa:** Permisos incorrectos.

**Solución:**
```sql
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
```

---

### Error: "function public.get_organization_id() does not exist"

**Causa:** No se ejecutó `002_rls_policies.sql`.

**Solución:**
1. Ejecuta `002_rls_policies.sql` completo
2. Verifica que las funciones existan:
   ```sql
   SELECT routine_name FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name LIKE 'get_%';
   ```

---

### Error: "auth.jwt() does not exist"

**Causa:** Intentas usar las funciones antiguas `auth.organization_id()`.

**Solución:**
- Ya está corregido en los scripts actualizados
- Asegúrate de usar los scripts de `/supabase/migrations/` actuales

---

### Login no funciona

**Causa:** Usuario demo no creado correctamente.

**Solución:**
1. Ve a Authentication > Users en Supabase
2. Verifica que `demo@chatflow.pro` exista
3. Si no existe, créalo manualmente (PASO 7)

---

## ✅ CHECKLIST DE DEPLOYMENT

Marca cada paso cuando lo completes:

- [ ] Acceder a Supabase Dashboard
- [ ] Ejecutar 001_initial_schema.sql
- [ ] Ejecutar 002_rls_policies.sql
- [ ] Ejecutar 003_seed_data.sql
- [ ] Verificar 20 tablas creadas
- [ ] Crear usuario demo via Auth
- [ ] Ejecutar INSERT del usuario en tabla users
- [ ] Verificar políticas RLS
- [ ] Verificar datos iniciales (tags, fields, statuses)
- [ ] Test de conexión desde frontend
- [ ] Test de conexión desde backend

---

## 📊 MÉTRICAS POST-DEPLOYMENT

Después del deployment, verifica:

1. **Tablas creadas:** 20
2. **Políticas RLS:** ~80 (4 por tabla en promedio)
3. **Índices:** ~45
4. **Funciones:** 2 (get_organization_id, get_user_role)
5. **Triggers:** ~15 (updated_at + contadores)
6. **Tags predefinidos:** 7
7. **CRM Fields:** 7
8. **CRM Statuses:** 11

---

## 🎉 DEPLOYMENT COMPLETO

Si todos los pasos están ✅, tu base de datos está lista!

### Próximos pasos:

1. **Instalar dependencias:**
   ```bash
   npm install @supabase/supabase-js
   cd backend && npm install @supabase/supabase-js
   ```

2. **Migrar datos de localStorage** (opcional):
   - Usa la función `exportCompleteBackup()` en el frontend actual
   - Crea script de migración a Supabase

3. **Actualizar componentes** para usar Supabase:
   - Reemplazar `storage.ts` con llamadas a Supabase
   - Actualizar interfaces con tipos de `/src/react-app/types/schema.ts`

4. **Conectar integraciones:**
   - ✅ Flowise (campos listos en bot_configs)
   - ✅ ChatWoot (campos listos en bot_configs)
   - ✅ Evolution API (campos listos)
   - ✅ Meta API (campos listos)

---

## 📚 RECURSOS

- [Documentación Supabase](https://supabase.com/docs)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [SQL Editor](https://supabase.com/docs/guides/database/overview)
- [Authentication](https://supabase.com/docs/guides/auth)

---

**¿Problemas?** Abre un issue o revisa `SUPABASE-VERIFICATION-REPORT.md`

**Fecha:** 2025-11-19
**Versión:** 1.0 (Correcciones aplicadas)
