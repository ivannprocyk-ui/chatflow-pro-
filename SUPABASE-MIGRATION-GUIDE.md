# 🚀 Guía de Migración a Supabase - ChatFlow Pro

Esta guía documenta la migración de localStorage a Supabase para hacer la plataforma completamente funcional y escalable.

---

## ✅ Completado

### 1. **Base de Datos Supabase** ✅
- 20 tablas creadas en Supabase
- RLS (Row Level Security) implementado para multi-tenancy
- Migraciones SQL (001, 002, 003, 004) ejecutadas
- Seed data insertado
- Usuario demo creado: `demo@chatflow.pro`

### 2. **Autenticación** ✅
- **AuthContext actualizado** → Usa Supabase Auth
- **Login/Register** → Integrado con Supabase
- **AppRouter creado** → Rutas protegidas y públicas
- **Persistencia de sesión** → Automática con Supabase
- **Real-time auth state** → Detecta cambios automáticamente

**Ubicación:**
- `src/react-app/contexts/AuthContext.tsx`
- `src/react-app/AppRouter.tsx`
- `src/react-app/pages/Login.tsx`
- `src/react-app/pages/Register.tsx`

### 3. **Hooks de Supabase** ✅
Creados 3 hooks completos con todas las funcionalidades:

#### **useContacts** - `src/react-app/hooks/useContacts.ts`
```typescript
import { useContacts } from '@/react-app/hooks/useContacts';

function MyComponent() {
  const {
    contacts,          // Lista de contactos
    isLoading,         // Estado de carga
    error,             // Error si existe
    loadContacts,      // Recargar contactos (con filtros)
    createContact,     // Crear contacto
    updateContact,     // Actualizar contacto
    deleteContact,     // Eliminar contacto
    bulkCreateContacts, // Crear múltiples contactos
    getStats,          // Obtener estadísticas
  } = useContacts();

  // Los contactos se cargan automáticamente
  // Se actualizan en tiempo real con Supabase Realtime
}
```

**Funcionalidades:**
- ✅ CRUD completo (Create, Read, Update, Delete)
- ✅ Filtros (búsqueda, status, tags)
- ✅ Bulk import (importar múltiples contactos)
- ✅ Real-time updates (cambios en vivo)
- ✅ Estadísticas (total, leads, qualified, customers, inactive)
- ✅ Multi-tenant (automático con organization_id)

#### **useCampaigns** - `src/react-app/hooks/useCampaigns.ts`
```typescript
import { useCampaigns } from '@/react-app/hooks/useCampaigns';

function MyComponent() {
  const {
    campaigns,         // Lista de campañas
    isLoading,         // Estado de carga
    error,             // Error si existe
    loadCampaigns,     // Recargar campañas
    createCampaign,    // Crear campaña
    updateCampaign,    // Actualizar campaña
    deleteCampaign,    // Eliminar campaña
    getStats,          // Obtener estadísticas
  } = useCampaigns();
}
```

**Funcionalidades:**
- ✅ CRUD completo
- ✅ Estados: draft, scheduled, running, completed, failed, cancelled
- ✅ Real-time updates
- ✅ Estadísticas (total, completed, running, totalSent, totalFailed)
- ✅ Multi-tenant

#### **useMessages** - `src/react-app/hooks/useMessages.ts`
```typescript
import { useMessages } from '@/react-app/hooks/useMessages';

function MyComponent() {
  const {
    messages,          // Lista de mensajes
    isLoading,         // Estado de carga
    error,             // Error si existe
    loadMessages,      // Recargar mensajes (con filtros)
    createMessage,     // Crear mensaje
    updateMessage,     // Actualizar mensaje
    deleteMessage,     // Eliminar mensaje
    getConversation,   // Obtener conversación de un contacto
    getStats,          // Obtener estadísticas
  } = useMessages();
}
```

**Funcionalidades:**
- ✅ CRUD completo
- ✅ Filtros (contact_id, campaign_id, status, direction, fechas)
- ✅ Conversaciones por contacto
- ✅ Real-time updates
- ✅ Estadísticas (total, sent, delivered, read, failed, pending, inbound, outbound)
- ✅ Multi-tenant

---

## 🔄 Pendiente de Integración

### 4. **Integrar Hooks en Páginas Existentes**

#### **CRMPanel (Contactos)** - Pendiente
Reemplazar localStorage con `useContacts`:

```typescript
// ANTES (localStorage)
const contacts = JSON.parse(localStorage.getItem('crm_contacts') || '[]');

// DESPUÉS (Supabase)
import { useContacts } from '@/react-app/hooks/useContacts';

function CRMPanel() {
  const { contacts, isLoading, createContact, updateContact, deleteContact } = useContacts();

  // Los datos ya están cargados y actualizados en tiempo real
}
```

**Tareas:**
- [ ] Reemplazar `loadCRMData()` con `useContacts()`
- [ ] Reemplazar `saveCRMData()` con `createContact()` / `updateContact()`
- [ ] Actualizar importación de Excel para usar `bulkCreateContacts()`
- [ ] Actualizar búsqueda/filtros con `loadContacts({ search, status })`

#### **CampaignHistory** - Pendiente
Reemplazar localStorage con `useCampaigns`:

```typescript
// ANTES
const campaigns = JSON.parse(localStorage.getItem('campaigns') || '[]');

// DESPUÉS
import { useCampaigns } from '@/react-app/hooks/useCampaigns';

function CampaignHistory() {
  const { campaigns, isLoading, createCampaign } = useCampaigns();
}
```

**Tareas:**
- [ ] Reemplazar `loadCampaigns()` con `useCampaigns()`
- [ ] Reemplazar `saveCampaigns()` con `createCampaign()` / `updateCampaign()`
- [ ] Actualizar estadísticas con `getStats()`

#### **BulkMessaging** - Pendiente
Integrar con `useCampaigns` y `useMessages`:

```typescript
import { useCampaigns } from '@/react-app/hooks/useCampaigns';
import { useMessages } from '@/react-app/hooks/useMessages';

function BulkMessaging() {
  const { createCampaign } = useCampaigns();
  const { createMessage } = useMessages();

  const handleSendCampaign = async () => {
    // 1. Crear campaña
    const campaign = await createCampaign({
      name: 'Mi campaña',
      template_name: 'hello_world',
      total_contacts: contacts.length,
      status: 'running',
    });

    // 2. Crear mensaje para cada contacto
    for (const contact of contacts) {
      await createMessage({
        contact_id: contact.id,
        campaign_id: campaign.id,
        direction: 'outbound',
        status: 'pending',
        template_name: 'hello_world',
      });
    }
  };
}
```

#### **MessageScheduler** - Pendiente
Integrar con tabla `scheduled_messages`:

```typescript
// Crear tabla de scheduled_messages si no existe
// Usar hook similar a useCampaigns
```

#### **Automations (React Flow)** - Pendiente
Integrar con tabla `automations`:

```typescript
// Guardar flujos de automatización en Supabase
// Usar tabla automations + automation_executions
```

---

## 🔌 Integraciones Externas

### 5. **Evolution API (WhatsApp)** - Pendiente
**Guardar credenciales en tabla `organizations`:**

```typescript
// Actualizar organization con credenciales de Evolution API
const { data, error } = await supabase
  .from('organizations')
  .update({
    whatsapp_api_url: 'https://evolution-api.com',
    whatsapp_api_key: 'your-api-key',
    whatsapp_instance_id: 'instance-id',
  })
  .eq('id', organizationId);
```

**Webhook para recibir mensajes:**
```typescript
// POST /api/webhooks/evolution
// Cuando llegue un mensaje:
await supabase.from('messages').insert({
  organization_id: orgId,
  contact_id: contactId,
  direction: 'inbound',
  status: 'delivered',
  message_content: message,
  whatsapp_message_id: waId,
});
```

### 6. **Flowise (AI Chatbot)** - Pendiente
**Guardar credenciales en tabla `bot_configs`:**

```typescript
await supabase.from('bot_configs').insert({
  organization_id: orgId,
  name: 'Flowise Bot',
  platform: 'flowise',
  api_endpoint: 'https://flowise.com/api/v1/prediction/your-flow-id',
  api_key: 'your-api-key',
  config: {
    temperature: 0.7,
    max_tokens: 500,
  },
  is_active: true,
});
```

**Llamar a Flowise cuando llegue mensaje:**
```typescript
// Cuando llega mensaje inbound
const botConfig = await supabase
  .from('bot_configs')
  .select('*')
  .eq('organization_id', orgId)
  .eq('is_active', true)
  .single();

// Llamar API de Flowise
const response = await fetch(botConfig.api_endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: message.message_content,
    sessionId: contact.id,
  }),
});

const aiResponse = await response.json();

// Guardar respuesta del bot
await supabase.from('bot_message_logs').insert({
  organization_id: orgId,
  bot_config_id: botConfig.id,
  contact_id: contact.id,
  user_message: message.message_content,
  bot_response: aiResponse.text,
  intent_detected: aiResponse.intent,
  confidence_score: aiResponse.confidence,
});

// Enviar respuesta por WhatsApp
// ... código para enviar mensaje
```

### 7. **ChatWoot** - Pendiente
**Guardar credenciales en `organizations`:**

```typescript
await supabase
  .from('organizations')
  .update({
    chatwoot_url: 'https://chatwoot.com',
    chatwoot_account_id: 'account-id',
    chatwoot_access_token: 'token',
    chatwoot_inbox_id: 'inbox-id',
  })
  .eq('id', organizationId);
```

**Sincronizar conversaciones:**
```typescript
// Cuando llega mensaje, enviar a ChatWoot
const response = await fetch(`${chatwootUrl}/api/v1/accounts/${accountId}/conversations`, {
  method: 'POST',
  headers: {
    'api_access_token': accessToken,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    inbox_id: inboxId,
    contact_id: contact.chatwoot_id,
    message: {
      content: message.message_content,
    },
  }),
});
```

---

## 🎯 Flujo End-to-End Completo

### **Flujo: Mensaje recibido → Bot → Base de datos → Respuesta**

```typescript
// 1. Webhook recibe mensaje de Evolution API
// POST /api/webhooks/evolution
app.post('/api/webhooks/evolution', async (req, res) => {
  const { phone, message, waId } = req.body;

  // 2. Buscar o crear contacto
  let contact = await supabase
    .from('contacts')
    .select('*')
    .eq('phone', phone)
    .single();

  if (!contact) {
    const { data } = await supabase.from('contacts').insert({
      organization_id: orgId,
      phone,
      status: 'lead',
    }).select().single();
    contact = data;
  }

  // 3. Guardar mensaje inbound
  await supabase.from('messages').insert({
    organization_id: orgId,
    contact_id: contact.id,
    direction: 'inbound',
    status: 'delivered',
    message_content: message,
    whatsapp_message_id: waId,
  });

  // 4. Llamar a Flowise para obtener respuesta del bot
  const botConfig = await supabase
    .from('bot_configs')
    .select('*')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .single();

  const aiResponse = await fetch(botConfig.api_endpoint, {
    method: 'POST',
    body: JSON.stringify({ question: message, sessionId: contact.id }),
  }).then(r => r.json());

  // 5. Guardar log del bot
  await supabase.from('bot_message_logs').insert({
    organization_id: orgId,
    bot_config_id: botConfig.id,
    contact_id: contact.id,
    user_message: message,
    bot_response: aiResponse.text,
  });

  // 6. Enviar respuesta por Evolution API
  await fetch(`${evolutionApiUrl}/message/sendText/${instanceId}`, {
    method: 'POST',
    headers: { 'apikey': evolutionApiKey },
    body: JSON.stringify({
      number: phone,
      text: aiResponse.text,
    }),
  });

  // 7. Guardar mensaje outbound
  await supabase.from('messages').insert({
    organization_id: orgId,
    contact_id: contact.id,
    direction: 'outbound',
    status: 'sent',
    message_content: aiResponse.text,
  });

  // 8. Actualizar estadísticas del contacto
  await supabase.from('contacts')
    .update({
      messages_received: contact.messages_received + 1,
      messages_sent: contact.messages_sent + 1,
      last_contact_at: new Date().toISOString(),
    })
    .eq('id', contact.id);

  res.json({ success: true });
});
```

---

## 📊 Estado Actual del Proyecto

| Componente | Estado | Progreso |
|------------|--------|----------|
| Base de Datos Supabase | ✅ Completo | 100% |
| Autenticación | ✅ Completo | 100% |
| Hooks (useContacts, useCampaigns, useMessages) | ✅ Completo | 100% |
| Integración CRMPanel | ⏳ Pendiente | 0% |
| Integración CampaignHistory | ⏳ Pendiente | 0% |
| Integración BulkMessaging | ⏳ Pendiente | 0% |
| Integración Automations | ⏳ Pendiente | 0% |
| Evolution API | ⏳ Pendiente | 0% |
| Flowise | ⏳ Pendiente | 0% |
| ChatWoot | ⏳ Pendiente | 0% |
| Flujo End-to-End | ⏳ Pendiente | 0% |

---

## 🚀 Próximos Pasos

1. **Integrar hooks en páginas** (CRMPanel, CampaignHistory, BulkMessaging)
2. **Crear backend webhook** para Evolution API
3. **Configurar Flowise** para respuestas automáticas
4. **Configurar ChatWoot** para sincronización de conversaciones
5. **Probar flujo end-to-end** completo

---

## 📖 Recursos

- **Supabase Docs**: https://supabase.com/docs
- **Evolution API**: https://doc.evolution-api.com
- **Flowise**: https://docs.flowiseai.com
- **ChatWoot**: https://www.chatwoot.com/docs

---

## ✅ Para probar la autenticación:

1. Ejecutar `npm run dev`
2. Ir a `http://localhost:5173`
3. Hacer login con: `demo@chatflow.pro` / (tu contraseña)
4. O crear una nueva cuenta

¡La plataforma ya está funcional con Supabase! 🎉
