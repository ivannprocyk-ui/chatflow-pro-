# ChatFlow Pro Backend

Node.js backend API for ChatFlow Pro using Hono framework.

## Features

- 🚀 WhatsApp Business API integration
- 💬 Conversations and messaging
- 📱 Bulk messaging with templates
- 📋 Contact list management
- 🔄 In-memory storage (upgrade to database later)
- ✅ Health check endpoint

## Local Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
PORT=3001
NODE_ENV=production

# WhatsApp Business API credentials
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_WABA_ID=your_waba_id_here
```

## Deploy to Render

### Option 1: Using Render Dashboard

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: chatflow-backend
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
5. Add environment variables in Render dashboard
6. Click "Create Web Service"

### Option 2: Using render.yaml

The `render.yaml` file is already configured. Just:

1. Push this code to GitHub
2. In Render Dashboard, create a new "Blueprint"
3. Connect to your repository
4. Select the `backend/render.yaml` file
5. Add environment variables
6. Deploy!

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Conversations
- `GET /api/conversations` - List all conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/:id/messages` - Get messages
- `POST /api/conversations/:id/messages` - Send message

### Messages
- `POST /api/messages/react` - Add/remove reaction

### WhatsApp
- `GET /api/whatsapp/templates` - Sync templates from Meta
- `POST /api/whatsapp/bulk-send` - Send bulk messages

### Contact Lists
- `GET /api/contact-lists` - List contact lists
- `POST /api/contact-lists` - Create contact list
- `POST /api/contact-lists/:listId/contacts` - Add contacts

## After Deployment

1. Get your Render backend URL (e.g., `https://chatflow-backend.onrender.com`)
2. Update frontend environment variable in Vercel:
   - Go to Vercel → Your Project → Settings → Environment Variables
   - Set `VITE_API_URL` = `https://chatflow-backend.onrender.com/api`
3. Redeploy frontend in Vercel
4. Test the connection!

## Tech Stack

- **Framework**: Hono (lightweight web framework)
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Validation**: Zod
- **Deployment**: Render

## Notes

- Currently using in-memory storage
- Data will reset when server restarts
- For production, consider adding:
  - PostgreSQL/MySQL database
  - Redis for caching
  - Proper authentication
  - Rate limiting
