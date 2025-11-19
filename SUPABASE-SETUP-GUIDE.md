# 🚀 Guía de Configuración de Supabase para ChatFlow Pro

Esta guía te llevará paso a paso por el proceso de configuración de Supabase para ChatFlow Pro.

## 📋 Índice

1. [Prerequisitos](#prerequisitos)
2. [Crear Proyecto en Supabase](#crear-proyecto-en-supabase)
3. [Ejecutar Migraciones](#ejecutar-migraciones)
4. [Configurar Variables de Entorno](#configurar-variables-de-entorno)
5. [Instalar Dependencias](#instalar-dependencias)
6. [Migrar Datos Existentes](#migrar-datos-existentes)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisitos

Antes de empezar, asegúrate de tener:

- [ ] Cuenta en [Supabase](https://supabase.com) (gratis)
- [ ] Node.js v18+ instalado
- [ ] Git instalado
- [ ] Acceso al repositorio de ChatFlow Pro

---

## 🆕 Crear Proyecto en Supabase

### Paso 1: Registrarse en Supabase

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Crea una cuenta o inicia sesión
3. Clic en **"New Project"**

### Paso 2: Configurar el Proyecto

Completa los siguientes datos:

| Campo | Valor Recomendado |
|-------|-------------------|
| **Name** | ChatFlow Pro |
| **Database Password** | (genera una contraseña segura y guárdala) |
| **Region** | Selecciona la más cercana a tus usuarios |
| **Pricing Plan** | Free (para empezar) |

> ⚠️ **Importante:** Guarda la contraseña de la base de datos en un lugar seguro. La necesitarás si quieres conectarte directamente a PostgreSQL.

4. Clic en **"Create new project"**
5. Espera 2-3 minutos mientras Supabase configura tu proyecto

### Paso 3: Obtener Claves de API

Una vez creado el proyecto:

1. Ve a **Settings** (⚙️ en el sidebar)
2. Clic en **API** en el menú lateral
3. Copia las siguientes claves:

   ```
   Project URL: https://xyzcompany.supabase.co
   anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

> ⚠️ **MUY IMPORTANTE:**
> - La clave `anon public` es segura para usar en el frontend
> - La clave `service_role` es PRIVADA y solo debe usarse en el backend
> - NUNCA expongas `service_role` en el frontend o en el código público

---

## 📝 Ejecutar Migraciones

### Método 1: Desde el Dashboard de Supabase (Recomendado)

1. En tu proyecto de Supabase, ve a **SQL Editor** (icono 📊 en el sidebar)
2. Clic en **"New query"**
3. Ejecuta los scripts en este orden:

#### **Script 1: Schema Inicial**

1. Abre el archivo `/supabase/migrations/001_initial_schema.sql`
2. Copia TODO el contenido
3. Pégalo en el SQL Editor de Supabase
4. Clic en **"Run"** o `Ctrl + Enter`
5. Verifica que se ejecutó sin errores (debe mostrar "Success")

#### **Script 2: Políticas RLS**

1. Abre el archivo `/supabase/migrations/002_rls_policies.sql`
2. Copia TODO el contenido
3. Pégalo en el SQL Editor
4. Clic en **"Run"**
5. Verifica que se ejecutó sin errores

#### **Script 3: Datos Iniciales**

1. Abre el archivo `/supabase/migrations/003_seed_data.sql`
2. Copia TODO el contenido
3. Pégalo en el SQL Editor
4. Clic en **"Run"**
5. Verifica que se ejecutó sin errores

### Método 2: Usando Supabase CLI (Avanzado)

Si prefieres usar la CLI:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Hacer login
supabase login

# Vincular tu proyecto
supabase link --project-ref your-project-ref

# Aplicar migraciones
supabase db push

# Verificar
supabase db status
```

### Verificación

Después de ejecutar las migraciones, verifica que las tablas se crearon:

1. Ve a **Table Editor** (icono 📋 en el sidebar)
2. Deberías ver las siguientes tablas:
   - ✅ organizations
   - ✅ users
   - ✅ contacts
   - ✅ tags
   - ✅ contact_tags
   - ✅ contact_lists
   - ✅ contact_list_members
   - ✅ messages
   - ✅ campaigns
   - ✅ templates
   - ✅ scheduled_messages
   - ✅ calendar_events
   - ✅ automations
   - ✅ automation_executions
   - ✅ bot_configs
   - ✅ bot_message_logs
   - ✅ crm_fields
   - ✅ crm_statuses
   - ✅ segments
   - ✅ ab_tests

---

## 🔐 Configurar Variables de Entorno

### Frontend (React + Vite)

1. En la raíz del proyecto, copia el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```

2. Edita `.env` y agrega tus claves de Supabase:
   ```env
   VITE_SUPABASE_URL=https://xyzcompany.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Backend (NestJS)

1. En la carpeta `/backend`, crea un archivo `.env`:
   ```bash
   cd backend
   cp ../.env.example .env
   ```

2. Edita `backend/.env` y agrega TODAS las claves:
   ```env
   SUPABASE_URL=https://xyzcompany.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # ⚠️ PRIVADA

   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key-change-this
   ```

### Verificación de Variables

Verifica que las variables estén cargadas correctamente:

```bash
# En el frontend
npm run dev

# En el backend
cd backend
npm run start:dev
```

Si hay errores de "Missing environment variable", revisa tu archivo `.env`.

---

## 📦 Instalar Dependencias

### Frontend

```bash
# En la raíz del proyecto
npm install @supabase/supabase-js
```

### Backend

```bash
cd backend
npm install @supabase/supabase-js
```

---

## 🔄 Migrar Datos Existentes (de localStorage a Supabase)

Si ya tienes datos en localStorage que quieres migrar a Supabase:

### Paso 1: Exportar Datos Actuales

1. Abre la aplicación en el navegador
2. Abre DevTools (F12)
3. Ve a la pestaña **Console**
4. Ejecuta el siguiente código:

```javascript
// Exportar todos los datos de localStorage
const backup = {
  contacts: JSON.parse(localStorage.getItem('chatflow_crm_data') || '[]'),
  campaigns: JSON.parse(localStorage.getItem('chatflow_campaigns') || '[]'),
  templates: JSON.parse(localStorage.getItem('chatflow_cached_templates') || '[]'),
  automations: JSON.parse(localStorage.getItem('chatflow_automations') || '[]'),
  contactLists: JSON.parse(localStorage.getItem('chatflow_contact_lists') || '[]'),
  tags: JSON.parse(localStorage.getItem('chatflow_tags') || '[]'),
  calendarEvents: JSON.parse(localStorage.getItem('chatflow_calendar_events') || '[]'),
  messageHistory: JSON.parse(localStorage.getItem('chatflow_message_history') || '[]'),
};

// Descargar el backup
const dataStr = JSON.stringify(backup, null, 2);
const dataBlob = new Blob([dataStr], { type: 'application/json' });
const url = URL.createObjectURL(dataBlob);
const link = document.createElement('a');
link.href = url;
link.download = `chatflow_backup_${new Date().toISOString()}.json`;
link.click();

console.log('✅ Backup descargado exitosamente');
```

### Paso 2: Importar a Supabase

Puedes crear un script de migración o usar el siguiente código:

```typescript
// migration-script.ts
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SERVICE_ROLE_KEY'
);

async function migrate() {
  // Leer el backup
  const backup = JSON.parse(fs.readFileSync('chatflow_backup.json', 'utf8'));

  const orgId = '00000000-0000-0000-0000-000000000001'; // ID de tu organización

  // Migrar contactos
  if (backup.contacts.length > 0) {
    const { data, error } = await supabase
      .from('contacts')
      .insert(
        backup.contacts.map(c => ({
          organization_id: orgId,
          phone: c.phone,
          name: c.name,
          email: c.email,
          status: c.status,
          custom_fields: c.custom_fields || {},
        }))
      );

    if (error) console.error('Error migrating contacts:', error);
    else console.log(`✅ Migrated ${backup.contacts.length} contacts`);
  }

  // Migrar tags
  if (backup.tags.length > 0) {
    const { data, error } = await supabase
      .from('tags')
      .insert(
        backup.tags.map(t => ({
          organization_id: orgId,
          name: t.name,
          color: t.color,
        }))
      );

    if (error) console.error('Error migrating tags:', error);
    else console.log(`✅ Migrated ${backup.tags.length} tags`);
  }

  // ... continuar con otras tablas
}

migrate();
```

**Ejecutar el script:**

```bash
npx ts-node migration-script.ts
```

---

## ✅ Testing

### 1. Verificar Conexión

```typescript
// test-connection.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_ANON_KEY'
);

async function test() {
  const { data, error } = await supabase.from('organizations').select('*').limit(1);

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Conexión exitosa:', data);
  }
}

test();
```

### 2. Verificar RLS

Intenta acceder a datos sin autenticación:

```typescript
const { data, error } = await supabase.from('contacts').select('*');
// Debería devolver [] (vacío) o error si RLS está funcionando
```

### 3. Verificar Autenticación

```typescript
// Login de prueba
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'demo@chatflow.pro',
  password: 'demo123',
});

if (error) {
  console.error('❌ Error de login:', error);
} else {
  console.log('✅ Login exitoso:', data.user);
}
```

---

## 🐛 Troubleshooting

### Error: "relation does not exist"

**Causa:** Las tablas no se crearon correctamente.

**Solución:**
1. Ve a SQL Editor en Supabase
2. Ejecuta de nuevo el script `001_initial_schema.sql`
3. Verifica en Table Editor que las tablas existan

### Error: "Missing environment variable"

**Causa:** Las variables de entorno no están configuradas.

**Solución:**
1. Verifica que el archivo `.env` existe
2. Verifica que las variables tienen el prefijo correcto:
   - Frontend (Vite): `VITE_SUPABASE_URL`
   - Backend: `SUPABASE_URL`
3. Reinicia el servidor de desarrollo

### Error: "Row Level Security policy violation"

**Causa:** Las políticas RLS están bloqueando el acceso.

**Solución:**
1. Verifica que ejecutaste `002_rls_policies.sql`
2. Verifica que el usuario esté autenticado
3. Verifica que el `organization_id` del JWT coincida con los datos

### Error: "Invalid JWT"

**Causa:** El token de autenticación es inválido o expiró.

**Solución:**
1. Cierra sesión y vuelve a iniciar
2. Verifica que `SUPABASE_ANON_KEY` sea correcta
3. Limpia localStorage: `localStorage.clear()`

### Los datos no se actualizan en tiempo real

**Causa:** Realtime no está habilitado o configurado.

**Solución:**
1. Ve a Database > Replication en Supabase
2. Habilita Realtime para las tablas necesarias
3. Verifica que estés suscrito correctamente con `.subscribe()`

---

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime con Supabase](https://supabase.com/docs/guides/realtime)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Best Practices](https://supabase.com/docs/guides/platform/performance)

---

## 🎉 ¡Listo!

Si llegaste hasta aquí, tu proyecto de ChatFlow Pro está conectado a Supabase.

### Próximos Pasos:

1. ✅ Verifica que puedas crear contactos desde la UI
2. ✅ Prueba el login/registro
3. ✅ Verifica que los datos se guardan en Supabase (Table Editor)
4. ✅ Prueba las automatizaciones
5. ✅ Configura Realtime si lo necesitas

### Checklist de Producción:

Antes de llevar a producción:

- [ ] Cambiar todas las contraseñas y secrets
- [ ] Configurar variables de entorno en tu hosting (Vercel, Railway, etc.)
- [ ] Habilitar 2FA en Supabase
- [ ] Configurar backups automáticos
- [ ] Revisar políticas RLS
- [ ] Configurar rate limiting
- [ ] Agregar monitoring (Sentry, LogRocket, etc.)
- [ ] Probar flujos críticos end-to-end
- [ ] Documentar procesos de deploy

---

**¿Necesitas ayuda?** Abre un issue en el repositorio o contacta al equipo de desarrollo.

**Fecha de última actualización:** 2025-11-19
