# 📝 Cambios para BotConfiguration.tsx - Simplificación

## 🎯 Objetivo
Simplificar el formulario de configuración del Bot para que:
1. NO exponga nombres técnicos de servicios (Evolution API, Chatwoot, Flowise, etc.)
2. Use términos genéricos y amigables
3. Oculte campos técnicos que solo el admin debe ver
4. El cliente solo configura su negocio y conecta WhatsApp con un botón

---

## 🔄 Cambios en la Interface BotConfig

### ANTES (Expone servicios técnicos):
```typescript
interface BotConfig {
  connectionType: 'evolution_api' | 'meta_api';
  evolutionApiUrl?: string;
  evolutionInstanceName?: string;
  evolutionApiKey?: string;
  chatwootInboxId?: string;
  chatwootAccountId?: string;
  flowiseUrl?: string;
  flowiseApiKey?: string;
  // ...
}
```

### DESPUÉS (Solo configuración del negocio):
```typescript
interface BotConfig {
  // Configuración del Asistente Virtual
  agentType: 'vendedor' | 'asistente' | 'secretaria' | 'custom';
  businessName: string;
  businessDescription: string;
  products: string;
  businessHours: string;
  language: 'es' | 'en' | 'pt';
  tone: 'formal' | 'casual' | 'professional';
  customPrompt?: string;

  // Estado (readonly para el cliente)
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  botEnabled: boolean;

  // Campos técnicos NO se muestran en el frontend del cliente
  // Se manejan automáticamente en el backend
}
```

---

## 📑 Estructura de Tabs Simplificada

### Tab 1: "Asistente Virtual"
**Título**: Configura tu Asistente Virtual
**Campos**:
- Tipo de Asistente
  - 🛍️ Vendedor (enfocado en ventas)
  - 💬 Soporte (atención al cliente)
  - 📅 Agendador (coordina citas)
  - ⚙️ Personalizado

- Nombre de tu Negocio
- Descripción del Negocio
- Productos y Servicios
- Horarios de Atención
- Idioma: Español / English / Português
- Tono: Formal / Casual / Profesional

**Botón**: "Guardar Configuración"

---

### Tab 2: "Conexión de WhatsApp"
**Título**: Conecta tu WhatsApp

**Contenido**:

#### Estado Actual:
- 🟢 Conectado - Número: +54 9 11 1234-5678
- 🟡 Conectando...
- ⚪ Desconectado

#### Si NO está conectado:
```
┌──────────────────────────────────────┐
│  📱 Conectar WhatsApp Business       │
│                                       │
│  1. Haz click en "Conectar"          │
│  2. Escanea el código QR              │
│  3. Espera la confirmación            │
│                                       │
│  [Botón: Conectar WhatsApp]          │
└──────────────────────────────────────┘
```

#### Al hacer click en "Conectar":
1. Backend automáticamente:
   - Crea instancia en Evolution API usando credenciales globales
   - Instance name: `org-{organizationId}`
   - Configura webhook: `{backendUrl}/webhooks/evolution/{organizationId}`

2. Retorna QR code → Frontend lo muestra

3. Usuario escanea QR → Webhook actualiza estado → Frontend muestra "Conectado"

#### Si YA está conectado:
```
┌──────────────────────────────────────┐
│  ✅ WhatsApp Conectado               │
│                                       │
│  Número: +54 9 11 1234-5678          │
│  Conectado desde: 15/01/2025         │
│                                       │
│  [Botón: Desconectar]                │
└──────────────────────────────────────┘
```

**NO mostrar**:
- ❌ Evolution API URL
- ❌ API Keys
- ❌ Instance Names
- ❌ Webhook URLs
- ❌ Chatwoot IDs

---

### Tab 3: "Instrucciones Personalizadas"
**Título**: Personaliza las Respuestas

**Contenido**:
- Área de texto grande para instrucciones adicionales
- Placeholders de ejemplo:
  ```
  Ejemplo:
  - Siempre menciona que tenemos envío gratis
  - Si preguntan por garantías, ofrece 30 días
  - Deriva a humano si pide descuentos mayores al 20%
  ```

**Botón**: "Guardar Instrucciones"

---

### Tab 4: "Seguimientos Automáticos"
**Mantener como está** - Ya está bien implementado

---

## 🔧 Cambios en Funciones

### connectWhatsApp()

#### ANTES:
```typescript
const connectWhatsApp = async () => {
  if (!config.evolutionApiUrl || !config.evolutionApiKey) {
    showMessage('error', 'Por favor configura Evolution API URL y API Key primero');
    return;
  }

  await botConfigAPI.connectInstance({
    apiUrl: config.evolutionApiUrl,
    instanceName: config.evolutionInstanceName,
    apiKey: config.evolutionApiKey,
  });
  // ...
};
```

#### DESPUÉS:
```typescript
const connectWhatsApp = async () => {
  try {
    setIsLoading(true);
    setConfig(prev => ({ ...prev, connectionStatus: 'connecting' }));
    showMessage('info', '🔄 Conectando a WhatsApp...');

    // Backend crea la instancia automáticamente
    // usando las credenciales globales del admin
    const response = await botConfigAPI.connect();

    if (response.data.qrcode) {
      setQRCode(response.data.qrcode);
      showMessage('success', '📱 Escanea el código QR con WhatsApp');
    }
  } catch (error: any) {
    showMessage('error', `❌ Error al conectar WhatsApp`);
    setConfig(prev => ({ ...prev, connectionStatus: 'disconnected' }));
  } finally {
    setIsLoading(false);
  }
};
```

**El backend** (`botConfigAPI.connect()`):
1. Lee las credenciales globales de Evolution API desde `.env`
2. Obtiene el `organizationId` del usuario autenticado
3. Crea instancia: `org-{organizationId}`
4. Configura webhook automáticamente
5. Retorna el QR code

---

## 🎨 Terminología a Usar

### ✅ Términos Permitidos (Genéricos):
- Asistente Virtual
- WhatsApp
- Motor de IA
- Respuestas Automáticas
- Seguimientos Automáticos
- Gestión de Conversaciones

### ❌ Términos Prohibidos (Técnicos):
- Evolution API
- Flowise
- Chatwoot
- n8n
- Baileys
- Instance Name
- Webhook
- API Key
- Endpoint

---

## 📊 API Endpoints Necesarios

### Backend debe exponer:

```typescript
// POST /bot-config/connect
// Crea instancia de WhatsApp automáticamente
// Usa credenciales globales del admin
// Retorna QR code
botConfigAPI.connect()

// GET /bot-config/status
// Retorna estado de conexión actual
botConfigAPI.getStatus()

// POST /bot-config/disconnect
// Desconecta WhatsApp
botConfigAPI.disconnect()

// PUT /bot-config
// Guarda configuración del negocio
botConfigAPI.upsert(config)
```

---

## ✅ Beneficios de esta Arquitectura

1. **Seguridad**: Credenciales NO se exponen al frontend
2. **Simplicidad**: Cliente solo ve lo que necesita
3. **Escalabilidad**: Fácil agregar más clientes sin compartir infraestructura
4. **Mantenimiento**: Cambios en URLs/Keys solo en un lugar (.env)
5. **UX**: Interfaz limpia y profesional

---

## 🚀 Siguiente Paso

¿Quieres que implemente este nuevo BotConfiguration.tsx simplificado?

Se verá así:
- Tab "Asistente Virtual": Formulario simple del negocio
- Tab "WhatsApp": Botón "Conectar" → Muestra QR → Listo
- Tab "Instrucciones": Área de texto para personalizar
- Tab "Seguimientos": Como ya está

**Todo sin exponer servicios técnicos.**
