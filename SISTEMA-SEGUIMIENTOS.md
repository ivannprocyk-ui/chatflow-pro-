# 📋 Sistema de Seguimientos Automáticos - ChatFlow Pro

## ¿Qué es el Sistema de Seguimientos?

El sistema de seguimientos automáticos es una funcionalidad **simple y clara** que envía mensajes automáticos cuando un cliente no responde después de cierto tiempo.

### Características Principales:

✅ **Automático**: Se activa solo cuando el cliente deja de responder
✅ **Inteligente**: Se cancela automáticamente si el cliente responde
✅ **Flexible**: Funciona con Evolution API (sin plantillas) y Meta API (con plantillas)
✅ **Configurable**: Personaliza tiempos, mensajes y horarios de negocio
✅ **Simple**: No requiere configuración compleja ni flujos visuales

---

## 🔄 ¿Cómo Funciona?

### Flujo Automático:

```
1. Cliente envía mensaje
   ↓
2. Bot responde automáticamente (vía ChatWoot)
   ↓
3. Sistema marca: "Esperando respuesta del cliente"
   ↓
4. Pasa el tiempo configurado (ej: 60 minutos)
   ↓
5. ¿Cliente respondió?
   → SÍ: Se cancela el seguimiento ✅
   → NO: Se envía mensaje de seguimiento 📤
   ↓
6. Se repite hasta alcanzar el máximo de seguimientos
```

### Tracking Automático:

El sistema **no requiere configuración manual** de a quién hacer seguimiento. Funciona así:

- **Cada conversación en ChatWoot** se rastrea automáticamente
- **Cuando envías un mensaje** (bot o agente), se inicia el temporizador
- **Cuando el cliente responde**, se cancela el seguimiento
- **Si no responde en X tiempo**, se envía seguimiento automático

---

## ⚙️ Configuración

### Acceso al Módulo:

1. Ve a **"Seguimientos"** en el menú lateral
2. Verás 3 pestañas:
   - **Configuración**: Ajustes generales
   - **Mensaje**: Editor de mensajes con variables
   - **Vista Previa**: Cómo se verá el mensaje

### Opciones de Configuración:

#### 1. Estado del Sistema
- **Toggle "Seguimientos Activos"**: Activa/desactiva todo el sistema

#### 2. Configuración de Tiempos
- **Tiempo de espera antes del primer seguimiento** (minutos)
  - Ejemplo: 60 = esperar 1 hora antes del primer seguimiento
- **Intervalo entre seguimientos** (minutos)
  - Ejemplo: 120 = esperar 2 horas entre cada seguimiento
- **Máximo de seguimientos por conversación**
  - Ejemplo: 3 = máximo 3 mensajes de seguimiento

#### 3. Restricciones de Horario
- **Solo durante horario de negocio**: ✅/❌
  - Si está activado, solo envía seguimientos en tu horario de atención
  - El horario se toma de la configuración del Bot IA
- **Solo días laborables**: ✅/❌
  - Si está activado, no envía seguimientos sábados/domingos

#### 4. Tipo de Mensaje
- **Usar plantilla fija**: El sistema usa el mensaje que escribas en el editor
- **Generar con IA**: El sistema genera un mensaje personalizado usando IA

---

## ✍️ Editor de Mensajes

### Variables Disponibles:

Puedes usar estas variables en tu mensaje, que se reemplazan automáticamente:

| Variable | Se Reemplaza Con | Ejemplo |
|----------|------------------|---------|
| `{nombre}` | Nombre del contacto | "Juan" |
| `{negocio}` | Nombre de tu negocio | "Mi Empresa" |
| `{producto}` | Producto mencionado en la conversación | "Pizza Margarita" |
| `{hora}` | Hora actual | "14:30" |
| `{fecha}` | Fecha actual | "17/11/2025" |

### Cómo Usar el Editor:

1. Escribe tu mensaje en el área de texto
2. Haz clic en los botones de variables para insertarlas
3. Ve la vista previa en tiempo real del mensaje formateado
4. Haz clic en "Guardar Configuración"

### Ejemplo de Mensaje:

```
Hola {nombre},

Noté que no recibí respuesta a mi mensaje anterior sobre {producto}.

¿Aún estás interesado? Estoy aquí para ayudarte.

Saludos,
{negocio}
```

**Se convertirá en:**

```
Hola Juan,

Noté que no recibí respuesta a mi mensaje anterior sobre Pizza Margarita.

¿Aún estás interesado? Estoy aquí para ayudarte.

Saludos,
Mi Empresa
```

---

## 🔌 Integración con ChatWoot

### ¿Qué se Necesita?

El sistema funciona **100% integrado con ChatWoot** vía webhooks:

1. **Webhook Configurado**: En ChatWoot → Settings → Webhooks
   - URL: `https://tu-backend.com/webhooks/chatwoot`
   - Evento: `message_created`

2. **Bot Config**: En ChatFlow → Bot IA
   - Inbox ID de ChatWoot configurado
   - Bot activado

### ¿Cómo se Rastrean las Conversaciones?

**Automáticamente**, sin intervención manual:

- Cada vez que ChatWoot recibe un `message_created` webhook
- El sistema detecta si es mensaje **entrante** (del cliente) o **saliente** (del bot/agente)
- Si es **entrante**: Cancela seguimientos pendientes (porque el cliente respondió)
- Si es **saliente**: Crea/actualiza el seguimiento pendiente

**Datos rastreados por conversación:**
- `conversation_id`: ID único de ChatWoot
- `inbox_id`: Inbox de ChatWoot
- `account_id`: Cuenta de ChatWoot
- `contact_id`: ID del contacto
- `organization_id`: Tu organización en ChatFlow
- `last_message_at`: Cuándo fue el último mensaje
- `follow_up_count`: Cuántos seguimientos se han enviado

---

## 📊 Tablas en Supabase

El sistema usa 2 tablas principales:

### 1. `follow_up_configs`
Almacena la configuración de seguimientos por organización:

```sql
{
  organization_id: "uuid",
  enabled: true/false,
  delay_minutes: 60,
  interval_minutes: 120,
  max_follow_ups: 3,
  business_hours_only: true,
  business_days_only: true,
  message_type: "template" | "ai_generated",
  template_message: "Hola {nombre}..."
}
```

### 2. `pending_follow_ups`
Rastrea conversaciones que esperan seguimiento:

```sql
{
  id: "uuid",
  organization_id: "uuid",
  conversation_id: "123",
  inbox_id: "456",
  account_id: "1",
  contact_id: "789",
  last_message_at: "2025-11-17 14:30:00",
  next_follow_up_at: "2025-11-17 15:30:00",
  follow_up_count: 0,
  status: "pending" | "completed" | "cancelled"
}
```

---

## 🤖 Cron Job - Procesamiento Automático

### ¿Cuándo se Envían los Seguimientos?

El sistema tiene un **cron job** que se ejecuta **cada 5 minutos**:

```typescript
@Cron('*/5 * * * *') // Cada 5 minutos
async processPendingFollowUps() {
  // 1. Busca seguimientos pendientes donde next_follow_up_at <= ahora
  // 2. Verifica restricciones de horario
  // 3. Genera mensaje (plantilla o IA)
  // 4. Envía mensaje a ChatWoot
  // 5. Actualiza contadores y próximo seguimiento
}
```

### Flujo del Cron Job:

1. **Buscar seguimientos pendientes** que ya pasaron su tiempo
2. **Verificar configuración**:
   - ¿Seguimientos activados?
   - ¿Dentro de horario de negocio? (si aplica)
   - ¿Día laborable? (si aplica)
   - ¿No excede máximo de seguimientos?
3. **Generar mensaje**:
   - Si `message_type = "template"`: Usa template con variables
   - Si `message_type = "ai_generated"`: Llama a Flowise
4. **Enviar a ChatWoot**:
   - POST a ChatWoot API con el mensaje
   - Como mensaje "outgoing" en la conversación existente
5. **Actualizar seguimiento**:
   - Incrementar `follow_up_count`
   - Calcular próximo `next_follow_up_at`
   - Si llegó al máximo, marcar como "completed"

---

## 🔧 APIs del Backend

### 1. Obtener Configuración
```
GET /follow-ups/config
Headers: Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "config": {
    "enabled": true,
    "delayMinutes": 60,
    "intervalMinutes": 120,
    "maxFollowUps": 3,
    "businessHoursOnly": true,
    "businessDaysOnly": true,
    "messageType": "template",
    "templateMessage": "Hola {nombre}..."
  }
}
```

### 2. Actualizar Configuración
```
POST /follow-ups/config
Headers: Authorization: Bearer {token}
Body: {
  "enabled": true,
  "delayMinutes": 60,
  "intervalMinutes": 120,
  "maxFollowUps": 3,
  "businessHoursOnly": true,
  "businessDaysOnly": true,
  "messageType": "template",
  "templateMessage": "Hola {nombre}..."
}
```

### 3. Webhook de ChatWoot (Interno)
```
POST /webhooks/chatwoot
Body: {evento de ChatWoot}
```

Este endpoint procesa automáticamente:
- Mensajes entrantes → Cancela seguimientos
- Mensajes salientes → Crea/actualiza seguimientos

---

## ✅ Ventajas del Sistema

### 1. **Sin Configuración Manual**
- No necesitas seleccionar a quién hacer seguimiento
- Todo se rastrea automáticamente por conversación

### 2. **Inteligente**
- Se cancela automáticamente si el cliente responde
- Respeta horarios de negocio
- No envía seguimientos infinitos (tiene un máximo)

### 3. **Flexible**
- Funciona con Evolution API (mensajes directos sin plantillas)
- Funciona con Meta API (usando plantillas)
- Opción de usar IA para generar mensajes personalizados

### 4. **Simple**
- Interfaz clara de 3 pestañas
- No requiere flujos visuales complejos
- Variables fáciles de usar con botones

### 5. **Integrado**
- Se conecta directamente con ChatWoot
- Usa la misma infraestructura de mensajería
- No requiere servicios adicionales

---

## 🐛 Troubleshooting

### El sistema no envía seguimientos

**Verifica:**
1. ✅ Seguimientos activados en la configuración
2. ✅ Webhook de ChatWoot configurado correctamente
3. ✅ Bot IA configurado con Inbox ID
4. ✅ Cron job corriendo (verifica logs del backend)
5. ✅ No estás fuera de horario de negocio (si está configurado)

### Los seguimientos no se cancelan cuando el cliente responde

**Verifica:**
1. ✅ Webhook de ChatWoot está enviando eventos `message_created`
2. ✅ El evento incluye `message_type: "incoming"`
3. ✅ El `conversation_id` coincide con el rastreado
4. ✅ Revisa logs del backend: debe decir "Cancelled follow-ups for conversation X"

### Variables no se reemplazan

**Verifica:**
1. ✅ Las variables están escritas exactamente: `{nombre}`, `{negocio}`, etc.
2. ✅ El contacto tiene datos completos en ChatWoot
3. ✅ Revisa logs del backend para ver los valores disponibles

---

## 📞 Ejemplo Completo

### Configuración:
- Seguimientos activados: ✅
- Primer seguimiento: 60 minutos
- Intervalo: 120 minutos
- Máximo: 3 seguimientos
- Horario de negocio: 9:00-18:00
- Solo días laborables: ✅

### Mensaje Template:
```
Hola {nombre}, noté que no recibí respuesta. ¿Aún te interesa {producto}? - {negocio}
```

### Timeline:

**14:00** - Cliente pregunta por "Pizza Margarita"
**14:01** - Bot responde automáticamente
**15:01** - (60 min después) Sistema envía 1er seguimiento: "Hola Juan, noté que no recibí respuesta. ¿Aún te interesa Pizza Margarita? - Mi Pizzería"
**17:01** - (120 min después) Sistema envía 2do seguimiento
**19:01** - (120 min después) Sistema NO envía (fuera de horario 9-18)
**Día siguiente 09:01** - Sistema envía 3er seguimiento
**Día siguiente 11:01** - Sistema NO envía más (llegó al máximo de 3)

**Si el cliente responde en cualquier momento**: Se cancelan todos los seguimientos pendientes ✅

---

## 🎯 Conclusión

El sistema de seguimientos es:
- ✅ **Simple**: No requiere configuración compleja
- ✅ **Automático**: Se maneja solo vía webhooks
- ✅ **Claro**: Sabes exactamente qué hace y cuándo
- ✅ **Efectivo**: Aumenta la tasa de respuesta de clientes

**No más clientes perdidos por falta de seguimiento** 🚀
