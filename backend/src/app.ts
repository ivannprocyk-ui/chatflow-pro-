import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from '@hono/zod-validator';
import {
  SendMessageRequestSchema,
  CreateConversationRequestSchema,
  BulkSendRequestSchema,
  AddReactionRequestSchema
} from "./types";
import z from "zod";

// Environment variables interface
interface Env {
  WHATSAPP_ACCESS_TOKEN?: string;
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_WABA_ID?: string;
}

// In-memory storage (replace with real database later)
const conversations: any[] = [];
const messages: any[] = [];
const reactions: any[] = [];
const templates: any[] = [];
const contactLists: any[] = [];
const contacts: any[] = [];
const campaigns: any[] = [];

// Mock users for authentication (replace with real database later)
const users: any[] = [
  {
    id: '1',
    email: 'demo@pizzeria.com',
    password: 'demo123', // In production, this would be hashed
    organizationId: '1',
    role: 'admin',
  },
];

const organizations: any[] = [
  {
    id: '1',
    name: 'Pizzeria Demo',
  },
];

let nextId = 1;

const app = new Hono();

app.use('*', cors());

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication API
app.post('/api/auth/login', zValidator('json', z.object({
  email: z.string().email(),
  password: z.string(),
})), async (c) => {
  const { email, password } = c.req.valid('json');

  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return c.json({ message: 'Invalid credentials' }, 401);
  }

  const organization = organizations.find(o => o.id === user.organizationId);

  // Simple JWT-like token (in production, use proper JWT library)
  const accessToken = `token_${user.id}_${Date.now()}`;

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    },
    organization,
    accessToken,
  });
});

app.post('/api/auth/register', zValidator('json', z.object({
  email: z.string().email(),
  password: z.string().min(6),
  organizationName: z.string().min(1),
})), async (c) => {
  const { email, password, organizationName } = c.req.valid('json');

  // Check if user already exists
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return c.json({ message: 'User already exists' }, 400);
  }

  // Create new organization
  const newOrg = {
    id: String(nextId++),
    name: organizationName,
  };
  organizations.push(newOrg);

  // Create new user
  const newUser = {
    id: String(nextId++),
    email,
    password, // In production, hash this
    organizationId: newOrg.id,
    role: 'admin',
  };
  users.push(newUser);

  // Simple JWT-like token
  const accessToken = `token_${newUser.id}_${Date.now()}`;

  return c.json({
    user: {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      organizationId: newUser.organizationId,
    },
    organization: newOrg,
    accessToken,
  }, 201);
});

// Conversations API
app.get('/api/conversations', async (c) => {
  const sorted = [...conversations].sort((a, b) => {
    const aTime = a.last_message_at || a.created_at;
    const bTime = b.last_message_at || b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
  return c.json(sorted);
});

app.post('/api/conversations', zValidator('json', CreateConversationRequestSchema), async (c) => {
  const { name, phone_number, is_group } = c.req.valid('json');

  const conversation = {
    id: String(nextId++),
    name,
    phone_number,
    is_group: is_group ? 1 : 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_message: null,
    last_message_at: null
  };

  conversations.push(conversation);
  return c.json(conversation);
});

app.get('/api/conversations/:id/messages', async (c) => {
  const conversationId = c.req.param('id');

  const conversationMessages = messages
    .filter(m => m.conversation_id === conversationId)
    .map(msg => {
      const msgReactions = reactions
        .filter(r => r.message_id === msg.id)
        .map(r => ({ emoji: r.emoji, user_id: r.user_id || 'anonymous' }));

      return { ...msg, reactions: msgReactions };
    })
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return c.json(conversationMessages);
});

app.post('/api/conversations/:id/messages', zValidator('json', SendMessageRequestSchema), async (c) => {
  const conversationId = c.req.param('id');
  const { content, message_type, attachment_url } = c.req.valid('json');

  const message = {
    id: String(nextId++),
    conversation_id: conversationId,
    content,
    message_type,
    attachment_url,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  messages.push(message);

  // Update conversation
  const conv = conversations.find(c => c.id === conversationId);
  if (conv) {
    conv.last_message = content;
    conv.last_message_at = message.created_at;
    conv.updated_at = message.created_at;
  }

  return c.json(message);
});

// Message Reactions API
app.post('/api/messages/react', zValidator('json', AddReactionRequestSchema), async (c) => {
  const { message_id, emoji } = c.req.valid('json');

  const existingIndex = reactions.findIndex(r =>
    r.message_id === message_id && r.emoji === emoji && !r.user_id
  );

  if (existingIndex >= 0) {
    reactions.splice(existingIndex, 1);
    return c.json({ action: 'removed' });
  } else {
    reactions.push({
      id: String(nextId++),
      message_id,
      emoji,
      user_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    return c.json({ action: 'added' });
  }
});

// WhatsApp Templates API
app.get('/api/whatsapp/templates', async (c) => {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const wabaId = process.env.WHATSAPP_WABA_ID;

  if (!accessToken || !wabaId) {
    return c.json({ error: 'WhatsApp API not configured' }, 400);
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${wabaId}/message_templates?access_token=${accessToken}`
    );

    const data = await response.json() as any;

    if (data.error) {
      return c.json({ error: data.error.message }, 400);
    }

    const approvedTemplates = data.data?.filter((t: any) => t.status === 'APPROVED') || [];

    // Store templates in memory
    templates.length = 0;
    templates.push(...approvedTemplates.map((t: any) => ({
      id: String(nextId++),
      name: t.name,
      language: t.language,
      status: t.status,
      category: t.category || null,
      components: JSON.stringify(t.components),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })));

    return c.json(approvedTemplates);
  } catch (error) {
    console.error('Template fetch error:', error);
    return c.json({ error: 'Failed to fetch templates' }, 500);
  }
});

// Bulk Messaging API
app.post('/api/whatsapp/bulk-send', zValidator('json', BulkSendRequestSchema), async (c) => {
  const { template_name, contact_list_id, phone_numbers, image_url, delay_seconds } = c.req.valid('json');

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    return c.json({ error: 'WhatsApp API not configured' }, 400);
  }

  let contactNumbers: string[] = [];

  if (contact_list_id) {
    const listContacts = contacts.filter(
      contact => contact.list_id === contact_list_id && contact.is_blocked === 0
    );
    contactNumbers = listContacts.map(c => c.phone_number);
  } else if (phone_numbers) {
    contactNumbers = phone_numbers;
  }

  if (contactNumbers.length === 0) {
    return c.json({ error: 'No contacts to send to' }, 400);
  }

  // Get template info
  const template = templates.find(t => t.name === template_name);

  if (!template) {
    return c.json({ error: 'Template not found' }, 404);
  }

  const templateComponents = JSON.parse(template.components);
  const hasImageHeader = templateComponents.some((c: any) =>
    c.type === 'HEADER' && c.format === 'IMAGE'
  );

  if (hasImageHeader && !image_url) {
    return c.json({ error: 'This template requires an image URL' }, 400);
  }

  // Create bulk campaign record
  const campaign = {
    id: String(nextId++),
    name: `Bulk ${template_name} ${new Date().toISOString()}`,
    template_name,
    contact_list_id,
    status: 'running',
    total_contacts: contactNumbers.length,
    sent_count: 0,
    failed_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null
  };

  campaigns.push(campaign);

  let sentCount = 0;
  let failedCount = 0;

  // Send messages with delay
  for (const phoneNumber of contactNumbers) {
    try {
      const payload: any = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: template_name,
          language: {
            code: template.language
          }
        }
      };

      if (hasImageHeader && image_url) {
        payload.template.components = [
          {
            type: 'header',
            parameters: [
              {
                type: 'image',
                image: {
                  link: image_url
                }
              }
            ]
          }
        ];
      }

      const response = await fetch(
        `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json() as any;

      if (response.ok) {
        sentCount++;
      } else {
        failedCount++;
        console.error('Failed to send to', phoneNumber, result);
      }

      // Add delay between messages
      if (delay_seconds > 0) {
        await new Promise(resolve => setTimeout(resolve, delay_seconds * 1000));
      }

    } catch (error) {
      failedCount++;
      console.error('Error sending to', phoneNumber, error);
    }
  }

  // Update campaign status
  campaign.status = 'completed';
  campaign.sent_count = sentCount;
  campaign.failed_count = failedCount;
  (campaign as any).completed_at = new Date().toISOString();
  campaign.updated_at = new Date().toISOString();

  return c.json({
    campaign_id: campaign.id,
    total_contacts: contactNumbers.length,
    sent_count: sentCount,
    failed_count: failedCount
  });
});

// Contact Lists API
app.get('/api/contact-lists', async (c) => {
  const listsWithCounts = contactLists.map(list => {
    const contactCount = contacts.filter(c => c.list_id === list.id).length;
    return { ...list, contact_count: contactCount };
  });

  return c.json(listsWithCounts);
});

app.post('/api/contact-lists', zValidator('json', z.object({
  name: z.string(),
  description: z.string().optional()
})), async (c) => {
  const { name, description } = c.req.valid('json');

  const list = {
    id: String(nextId++),
    name,
    description: description || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  contactLists.push(list);
  return c.json(list);
});

// Contacts API
app.post('/api/contact-lists/:listId/contacts', zValidator('json', z.object({
  contacts: z.array(z.object({
    phone_number: z.string(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    email: z.string().optional()
  }))
})), async (c) => {
  const listId = c.req.param('listId');
  const { contacts: newContacts } = c.req.valid('json');

  let addedCount = 0;

  for (const contact of newContacts) {
    // Check if contact already exists
    const exists = contacts.some(
      c => c.list_id === listId && c.phone_number === contact.phone_number
    );

    if (!exists) {
      contacts.push({
        id: String(nextId++),
        list_id: listId,
        phone_number: contact.phone_number,
        first_name: contact.first_name || null,
        last_name: contact.last_name || null,
        email: contact.email || null,
        is_blocked: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      addedCount++;
    }
  }

  return c.json({ added_count: addedCount });
});

export default app;
