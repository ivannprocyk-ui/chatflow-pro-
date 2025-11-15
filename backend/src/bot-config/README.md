# Bot Config Module

Module for managing AI bot configuration per organization.

## Endpoints

### GET /api/bot-config
Get bot configuration for current organization.

**Auth:** Required (JWT)

**Response:**
```json
{
  "exists": true,
  "config": {
    "id": "uuid",
    "organizationId": "org-123",
    "connectionType": "evolution_api",
    "connectionStatus": "connected",
    "agentType": "vendedor",
    "businessName": "TechStore",
    "businessDescription": "Venta de electrónicos",
    "products": "Laptops, celulares, tablets",
    "businessHours": "Lun-Vie 9am-6pm",
    "language": "es",
    "tone": "casual",
    "botEnabled": true,
    "evolutionApiUrl": "http://...",
    "evolutionInstanceName": "techstore-bot",
    "evolutionApiKey": "abc1••••••••xyz9",
    "createdAt": "2025-11-14T...",
    "updatedAt": "2025-11-14T..."
  }
}
```

### POST /api/bot-config
Create or update bot configuration.

**Auth:** Required (JWT)

**Body:**
```json
{
  "connectionType": "evolution_api",
  "evolutionApiUrl": "http://evolution-api.example.com",
  "evolutionInstanceName": "my-bot",
  "evolutionApiKey": "your-api-key",
  "agentType": "vendedor",
  "businessName": "TechStore",
  "businessDescription": "Venta de electrónicos y accesorios",
  "products": "Laptops, celulares, tablets, auriculares",
  "businessHours": "Lunes a Viernes 9am - 6pm",
  "language": "es",
  "tone": "casual",
  "botEnabled": false
}
```

**Response:**
```json
{
  "success": true,
  "config": { ... }
}
```

### PUT /api/bot-config
Update bot configuration (partial update).

**Auth:** Required (JWT)

**Body:** (partial)
```json
{
  "businessName": "TechStore Pro",
  "products": "Laptops, celulares, tablets, auriculares, smartwatches"
}
```

### PATCH /api/bot-config/toggle
Toggle bot enabled/disabled.

**Auth:** Required (JWT)

**Response:**
```json
{
  "success": true,
  "botEnabled": true,
  "config": { ... }
}
```

### PATCH /api/bot-config/connection-status
Update connection status.

**Auth:** Required (JWT)

**Body:**
```json
{
  "status": "connected"
}
```

**Response:**
```json
{
  "success": true,
  "connectionStatus": "connected",
  "config": { ... }
}
```

### DELETE /api/bot-config
Delete bot configuration.

**Auth:** Required (JWT)

**Response:** 204 No Content

## Entity Structure

```typescript
interface BotConfig {
  id: string;
  organizationId: string;

  // WhatsApp Connection
  connectionType: 'evolution_api' | 'meta_api';
  connectionStatus: 'connected' | 'disconnected' | 'connecting';

  // Evolution API
  evolutionApiUrl?: string;
  evolutionInstanceName?: string;
  evolutionApiKey?: string; // Encrypted

  // Meta API
  metaBusinessAccountId?: string;
  metaAccessToken?: string; // Encrypted
  metaPhoneNumberId?: string;

  // ChatWoot
  chatwootInboxId?: string;
  chatwootAccountId?: string;

  // Bot Configuration
  agentType: 'vendedor' | 'asistente' | 'secretaria' | 'custom';
  businessName: string;
  businessDescription: string;
  products: string;
  businessHours: string;
  language: 'es' | 'en' | 'pt';
  tone: 'formal' | 'casual' | 'professional';
  customPrompt?: string;

  // Flowise (optional)
  flowiseUrl?: string;
  flowiseApiKey?: string;

  // Status
  botEnabled: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

## Agent Types

### vendedor
Bot enfocado en ventas, ofrecer productos y cerrar conversiones.

### asistente
Bot de atención al cliente, resolver dudas y problemas.

### secretaria
Bot para agendar citas y organizar reuniones.

### custom
Prompt personalizado definido por el usuario.

## Security Notes

- API keys and access tokens are masked in responses (show only first 4 and last 4 chars)
- Authentication required for all endpoints
- Configuration is scoped to authenticated organization
- Sensitive fields should be encrypted in production database
