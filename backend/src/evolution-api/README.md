# Evolution API Module

Module for managing Evolution API WhatsApp instances.

## Endpoints

### POST /api/evolution/instance
Create Evolution API instance.

**Auth:** Required (JWT)

**Body:**
```json
{
  "instanceName": "my-bot",
  "apiUrl": "http://evolution-api.example.com",
  "apiKey": "your-api-key",
  "number": "+5491112345678",
  "webhookUrl": "https://chatflow-api.com/webhooks/evolution"
}
```

**Response:**
```json
{
  "success": true,
  "instance": {
    "instance": {
      "instanceName": "my-bot",
      "status": "created"
    }
  }
}
```

---

### GET /api/evolution/qrcode
Get QR Code for instance.

**Auth:** Required (JWT)

**Response:**
```json
{
  "success": true,
  "qrcode": {
    "instance": "my-bot",
    "qrcode": "data:image/png;base64,...",
    "code": "1@abc123..."
  }
}
```

---

### GET /api/evolution/status
Get instance connection status.

**Auth:** Required (JWT)

**Response:**
```json
{
  "success": true,
  "status": {
    "instance": "my-bot",
    "status": "connected",
    "connectedPhone": "+5491112345678",
    "connectedAt": "2025-11-14T..."
  }
}
```

---

### POST /api/evolution/disconnect
Disconnect instance (logout).

**Auth:** Required (JWT)

**Response:**
```json
{
  "success": true,
  "message": "Instance disconnected successfully"
}
```

---

### DELETE /api/evolution/instance
Delete instance completely.

**Auth:** Required (JWT)

**Response:**
```json
{
  "success": true,
  "message": "Instance deleted successfully"
}
```

---

### POST /api/evolution/webhook
Set webhook URL for instance.

**Auth:** Required (JWT)

**Body:**
```json
{
  "webhookUrl": "https://chatflow-api.com/webhooks/evolution"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook configured successfully"
}
```

---

## Webhooks Received

### POST /webhooks/evolution

Evolution API sends webhooks for various events:

#### QRCODE_UPDATED
```json
{
  "event": "qrcode.updated",
  "instance": "my-bot",
  "data": {
    "qrcode": "data:image/png;base64,..."
  },
  "date_time": "2025-11-14T...",
  "sender": "evolution-api",
  "server_url": "http://evolution-api.com",
  "apikey": "your-api-key"
}
```

**Action:** QR code available for scanning

---

#### CONNECTION_UPDATE
```json
{
  "event": "connection.update",
  "instance": "my-bot",
  "data": {
    "state": "open"
  },
  "date_time": "2025-11-14T...",
  "sender": "evolution-api"
}
```

**States:**
- `open` / `connected` → Connected
- `connecting` / `qr` → Connecting
- `close` / `disconnected` → Disconnected

**Action:** Updates bot-config connectionStatus automatically

---

#### MESSAGES_UPSERT
```json
{
  "event": "messages.upsert",
  "instance": "my-bot",
  "data": {
    "key": {
      "remoteJid": "5491112345678@s.whatsapp.net",
      "fromMe": false,
      "id": "msg-id"
    },
    "message": {
      "conversation": "Hola, tienen iPhones?"
    },
    "messageTimestamp": "1699999999"
  }
}
```

**Action:** Will be sent to ChatWoot in FASE 4

---

## Service Methods

### createInstance()
Creates new instance in Evolution API.

### fetchQRCode()
Gets QR code for scanning.

### getInstanceStatus()
Gets connection status.

### disconnectInstance()
Disconnects (logout) instance.

### deleteInstance()
Deletes instance completely.

### setWebhook()
Configures webhook URL for instance.

### handleConnectionUpdate()
Handles CONNECTION_UPDATE webhook and updates bot-config.

---

## Connection Status Flow

```
1. Client creates instance
   → POST /api/evolution/instance
   → bot-config.connectionStatus = 'connecting'

2. Evolution API generates QR
   → Webhook: QRCODE_UPDATED
   → Client fetches: GET /api/evolution/qrcode

3. User scans QR code

4. Evolution API connects
   → Webhook: CONNECTION_UPDATE (state: 'open')
   → bot-config.connectionStatus = 'connected'

5. Instance is ready to send/receive messages
```

---

## Integration with Bot Config

Evolution API module automatically updates bot-config when connection status changes.

When `CONNECTION_UPDATE` webhook is received:
1. Find bot-config by instance name
2. Update `connectionStatus` field
3. Log update

This allows the frontend to show real-time connection status without polling.

---

## Error Handling

All methods throw HttpException on error:
- 400 Bad Request - Invalid data or API error
- 404 Not Found - Instance not found
- 500 Internal Server Error - Unexpected error

Errors are logged with context for debugging.

---

## Security Notes

- All endpoints require JWT authentication
- API keys are stored in bot-config (masked in responses)
- Webhooks are public but should validate apikey
- Instance names should be unique per organization
