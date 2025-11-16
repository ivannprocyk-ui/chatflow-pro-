# 🚀 Guía de Configuración de Supabase para ChatFlow Pro

## 📋 Resumen

Esta guía te ayudará a configurar la base de datos PostgreSQL completa en Supabase para ChatFlow Pro. El esquema incluye 20 tablas con Row Level Security (RLS) y está listo para producción multi-tenant.

---

## ✅ Requisitos Previos

- Cuenta en Supabase (gratis): https://supabase.com
- Navegador web
- Los datos de acceso que proporcionarás

---

## 🎯 Paso 1: Crear Proyecto en Supabase

1. **Ir a Supabase Dashboard**: https://app.supabase.com
2. **Crear nuevo proyecto**:
   - Click en "New Project"
   - Nombre: `chatflow-pro` (o el que prefieras)
   - Database Password: **Guardar en lugar seguro** ⚠️
   - Region: Elegir más cercana (ej: South America - São Paulo)
   - Plan: Free (suficiente para empezar)
3. **Esperar ~2 minutos** mientras Supabase provisiona la base de datos

---

## 🗄️ Paso 2: Ejecutar el Schema SQL

### Opción A: Desde el SQL Editor (Recomendado)

1. En el dashboard de Supabase, ir a **SQL Editor** (menú izquierdo)
2. Click en **New Query**
3. **Copiar todo el contenido** del archivo `supabase-schema.sql` del repositorio
4. **Pegar** en el editor SQL
5. Click en **RUN** (botón abajo a la derecha)
6. Verificar que dice "Success. No rows returned" ✅

### Opción B: Vía CLI (Opcional)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref <tu-project-ref>

# Ejecutar migration
supabase db push < supabase-schema.sql
```

---

## 🔑 Paso 3: Obtener Credenciales

En el dashboard de Supabase:

1. Ir a **Settings** → **API**
2. Copiar los siguientes datos:

```
Project URL: https://<tu-project-id>.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  (⚠️ SECRETO)
```

**¡Proporcionarme estos datos para continuar con la integración!**

---

## 📊 Paso 4: Verificar las Tablas

1. Ir a **Table Editor** en el menú izquierdo
2. Deberías ver **20 tablas** creadas:

### Tablas de Autenticación y Usuarios
- ✅ `organizations`
- ✅ `users`

### Tablas de Contactos
- ✅ `contacts`
- ✅ `contact_lists`
- ✅ `contact_list_members`

### Tablas de WhatsApp
- ✅ `whatsapp_templates`
- ✅ `campaigns`
- ✅ `send_logs`
- ✅ `scheduled_messages`

### Tablas de Bot IA
- ✅ `bot_configs`
- ✅ `bot_message_logs`
- ✅ `bot_tracking_metrics`

### Tablas de Productividad
- ✅ `calendar_events`
- ✅ `automations`
- ✅ `automation_flows`

### Tablas de Admin SaaS
- ✅ `saas_clients`
- ✅ `saas_payments`
- ✅ `saas_usage`
- ✅ `saas_monthly_metrics`
- ✅ `saas_client_alerts`

---

## 👤 Paso 5: Crear Usuario Demo

### Via Authentication UI

1. Ir a **Authentication** → **Users**
2. Click en **Add user** → **Create new user**
3. Ingresar:
   - Email: `demo@chatflow.com`
   - Password: `Demo123!@#` (o la que prefieras)
   - Auto Confirm User: ✅ **Activar**
4. Click en **Create user**
5. **Copiar el User ID** (formato UUID)

### Vincular usuario con organización

1. Ir a **SQL Editor** → **New Query**
2. Reemplazar `<USER_ID>` con el ID copiado y ejecutar:

```sql
-- Vincular usuario demo con organización demo
INSERT INTO users (id, organization_id, email, full_name, role)
VALUES
  ('<USER_ID>', '00000000-0000-0000-0000-000000000001', 'demo@chatflow.com', 'Demo User', 'admin');
```

---

## 🔒 Paso 6: Verificar Row Level Security (RLS)

1. Ir a **Authentication** → **Policies**
2. Deberías ver políticas RLS creadas para cada tabla
3. Verificar que están **enabled** (verde)

Las políticas aseguran que:
- ✅ Cada organización solo ve sus propios datos
- ✅ Multi-tenant seguro por defecto
- ✅ No se puede acceder a datos de otras organizaciones

---

## 🧪 Paso 7: Probar Conexión

Ejecutar en SQL Editor:

```sql
-- Ver organización demo
SELECT * FROM organizations WHERE id = '00000000-0000-0000-0000-000000000001';

-- Ver contactos demo
SELECT * FROM contacts LIMIT 5;

-- Ver listas demo
SELECT * FROM contact_lists LIMIT 5;

-- Verificar RLS funciona (debería retornar 0 rows si no hay auth context)
SELECT * FROM contacts;
```

---

## 📦 Datos Demo Incluidos

El schema ya incluye datos de prueba:

- ✅ 1 organización demo (`Demo Organization`)
- ✅ 3 contactos demo (Juan Pérez, María García, Carlos López)
- ✅ 1 lista de contactos (`Clientes VIP`)

Estos aparecerán automáticamente cuando el frontend se conecte.

---

## 🔧 Próximos Pasos

Una vez tengas las credenciales de Supabase, el siguiente paso será:

1. **Integrar Supabase Client en el frontend**
   - Instalar `@supabase/supabase-js`
   - Configurar cliente con Project URL y anon key
   - Reemplazar llamadas a `localStorage` con llamadas a Supabase

2. **Migrar funciones de storage.ts**
   - `loadContacts()` → `supabase.from('contacts').select()`
   - `saveContact()` → `supabase.from('contacts').insert()`
   - etc.

3. **Implementar autenticación real**
   - Login con `supabase.auth.signInWithPassword()`
   - Register con `supabase.auth.signUp()`
   - Session management automático

4. **Actualizar backend** (opcional - Supabase tiene API automática)
   - O usar directamente la API REST auto-generada de Supabase
   - O crear endpoints personalizados que usen Supabase

---

## 📞 Dame los Datos de Acceso

**Para continuar necesito que me proporciones:**

1. ✅ Project URL (https://xxx.supabase.co)
2. ✅ anon/public key (eyJhbGci...)
3. ✅ ¿Ya creaste el proyecto? (sí/no)
4. ✅ ¿Ya ejecutaste el schema SQL? (sí/no)
5. ✅ ¿Ya creaste el usuario demo? (sí/no)

Con esos datos podré:
- Configurar el cliente de Supabase en el frontend
- Migrar todas las funciones de localStorage a la base de datos
- Implementar autenticación real
- Hacer el sistema 100% operativo con persistencia real

---

## ⚡ Estimación de Tiempo

- **Setup de Supabase**: 5-10 minutos (tú)
- **Integración en frontend**: 2-3 horas (yo)
- **Migración completa**: 4-6 horas (yo)
- **Testing**: 1-2 horas (ambos)

**Total: ~8 horas para tener todo operativo con base de datos real**

---

## 🆘 Troubleshooting

### Error: "relation does not exist"
- Verifica que ejecutaste `supabase-schema.sql` correctamente
- Revisa que no hubo errores en el SQL Editor

### Error: "new row violates row-level security policy"
- Verifica que el usuario está en la tabla `users`
- Verifica que tiene `organization_id` asignado

### No veo las tablas en Table Editor
- Refresca la página
- Verifica que el SQL se ejecutó sin errores
- Revisa la pestaña "Logs" por errores

---

**¿Ya tienes Supabase configurado? Dame los datos de acceso para continuar! 🚀**
