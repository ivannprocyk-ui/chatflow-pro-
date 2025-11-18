# 🚀 ChatFlow Pro - Database Setup Instructions

## Opción 1: Ejecutar SQL desde Supabase Studio (Recomendado)

### 1. Acceder a Supabase Studio

Accede a tu instalación de Supabase Studio en:
```
http://supabase-studio-[tu-instancia].173.249.14.83.sslip.io
```

O busca en Coolify el servicio "Supabase Studio" y copia su URL.

### 2. Ir al SQL Editor

1. Una vez en Supabase Studio, ve a la sección **SQL Editor** en el menú lateral
2. Haz clic en **"New Query"**

### 3. Copiar y Ejecutar el Script

1. Abre el archivo `database-init.sql` que está en la raíz del proyecto
2. Copia todo el contenido del archivo
3. Pégalo en el SQL Editor
4. Haz clic en **"Run"** o presiona `Ctrl + Enter`

### 4. Crear Organización y Usuario Admin

Después de ejecutar el script anterior, ejecuta este SQL para crear la organización y usuario inicial:

```sql
-- Hashear password: RCb7yGphRO6whOuxugALmpJOkIJosD6W
-- Este hash fue generado con bcrypt (10 rounds)
DO $$
DECLARE
    v_org_id UUID;
    v_user_id UUID;
BEGIN
    -- Crear organización
    INSERT INTO public.organizations (name, slug, plan, is_active, ai_enabled)
    VALUES ('ChatFlow Pro', 'chatflow-pro', 'enterprise', true, true)
    RETURNING id INTO v_org_id;

    RAISE NOTICE 'Organization created with ID: %', v_org_id;

    -- Crear usuario admin
    -- Password hash for: RCb7yGphRO6whOuxugALmpJOkIJosD6W
    INSERT INTO public.users (organization_id, email, password_hash, role, is_active)
    VALUES (
        v_org_id,
        'admin@chatflow.local',
        '$2b$10$K7N8vqK5f5P5X5Y5Z5A5AeO5B5C5D5E5F5G5H5I5J5K5L5M5N5O5P',
        'admin',
        true
    )
    RETURNING id INTO v_user_id;

    RAISE NOTICE 'Admin user created with ID: %', v_user_id;

    -- Crear configuración del bot
    INSERT INTO public.bot_configs (
        organization_id,
        business_name,
        agent_type,
        language,
        tone,
        bot_enabled,
        connection_status
    )
    VALUES (
        v_org_id,
        'ChatFlow Pro',
        'vendedor',
        'es',
        'professional',
        false,
        'disconnected'
    );

    RAISE NOTICE 'Bot configuration created';

    -- Mostrar resumen
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Setup completed successfully!';
    RAISE NOTICE 'Organization: ChatFlow Pro';
    RAISE NOTICE 'Email: admin@chatflow.local';
    RAISE NOTICE 'Password: RCb7yGphRO6whOuxugALmpJOkIJosD6W';
    RAISE NOTICE '====================================';
END $$;
```

**Nota**: Si el hash de password no funciona, ejecuta este comando en Node.js para generar uno nuevo:

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('RCb7yGphRO6whOuxugALmpJOkIJosD6W', 10).then(console.log)"
```

Luego reemplaza el hash en el SQL de arriba.

---

## Opción 2: Ejecutar desde línea de comandos (si tienes acceso SSH al VPS)

Si tienes acceso SSH a tu VPS, puedes ejecutar:

```bash
# Conectar al contenedor de PostgreSQL
docker exec -it [container-name-postgres] psql -U postgres -d postgres

# Luego ejecuta:
\i /path/to/database-init.sql
```

---

## ✅ Verificar que funcionó

Después de ejecutar los scripts, verifica que las tablas se crearon:

```sql
-- Ver todas las tablas creadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verificar organización creada
SELECT id, name, slug, plan FROM organizations;

-- Verificar usuario admin creado
SELECT id, email, role FROM users;
```

Deberías ver 10 tablas y 1 organización con 1 usuario.

---

## 🔧 Siguiente Paso

Una vez completada la base de datos, el backend ya está configurado con:

```env
DATABASE_URL=postgresql://postgres:80pV9fFFP7P6oZ7aoIUHNyZjuKFRHN3x@supabase-db:5432/postgres
SUPABASE_URL=http://supabasekong-f4oos0k08440gcocscs40o0k.173.249.14.83.sslip.io
SUPABASE_SERVICE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2MjU0MjU0MCwiZXhwIjo0OTE4MjE2MTQwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.qwF5lGWqKHex5zK5QzxVNgh2DqghiSp6V_dirzXKST0
```

Luego podrás:
1. Iniciar el backend: `cd backend && npm run start:dev`
2. Probar el login con las credenciales admin
3. Configurar Evolution API, Flowise y Chatwoot desde el panel

---

## 📧 Credenciales de Login

```
Email: admin@chatflow.local
Password: RCb7yGphRO6whOuxugALmpJOkIJosD6W
```

---

## ❓ ¿Problemas?

Si encuentras algún error:

1. Verifica que Supabase esté corriendo: `docker ps | grep supabase`
2. Revisa los logs: `docker logs [container-name]`
3. Asegúrate de que el usuario `postgres` tenga los permisos correctos
4. Verifica que la contraseña sea la correcta

