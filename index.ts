import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from '@hono/zod-validator';
import { 
  SendMessageRequestSchema,
  CreateConversationRequestSchema,
  BulkSendRequestSchema,
  AddReactionRequestSchema
} from "../shared/types";
import z from "zod";

// Extend the Env interface to include WhatsApp API credentials
interface ExtendedEnv extends Env {
  WHATSAPP_ACCESS_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_WABA_ID: string;
}

const app = new Hono<{ Bindings: ExtendedEnv }>();

app.use('*', cors());

// Conversations API
app.get('/api/conversations', async (c) => {
  const db = c.env.DB;
  
  const conversations = await db.prepare(`
    SELECT * FROM conversations 
    ORDER BY last_message_at DESC NULLS LAST, created_at DESC
  `).all();
  
  return c.json(conversations.results);
});

app.post('/api/conversations', zValidator('json', CreateConversationRequestSchema), async (c) => {
  const { name, phone_number, is_group } = c.req.valid('json');
  const db = c.env.DB;
  
  const result = await db.prepare(`
    INSERT INTO conversations (name, phone_number, is_group, created_at, updated_at)
    VALUES (?, ?, ?, datetime('now'), datetime('now'))
  `).bind(name, phone_number, is_group ? 1 : 0).run();
  
  if (result.success) {
    const conversation = await db.prepare(`
      SELECT * FROM conversations WHERE id = ?
    `).bind(result.meta.last_row_id).first();
    
    return c.json(conversation);
  }
  
  return c.json({ error: 'Failed to create conversation' }, 500);
});

app.get('/api/conversations/:id/messages', async (c) => {
  const conversationId = c.req.param('id');
  const db = c.env.DB;
  
  const messages = await db.prepare(`
    SELECT m.*, 
           GROUP_CONCAT(r.emoji || ':' || COALESCE(r.user_id, 'anonymous')) as reactions
    FROM messages m
    LEFT JOIN message_reactions r ON m.id = r.message_id
    WHERE m.conversation_id = ?
    GROUP BY m.id
    ORDER BY m.created_at ASC
  `).bind(conversationId).all();
  
  const formattedMessages = messages.results.map((msg: any) => ({
    ...msg,
    reactions: msg.reactions ? msg.reactions.split(',').map((r: string) => {
      const [emoji, user_id] = r.split(':');
      return { emoji, user_id };
    }) : []
  }));
  
  return c.json(formattedMessages);
});

app.post('/api/conversations/:id/messages', zValidator('json', SendMessageRequestSchema), async (c) => {
  const conversationId = c.req.param('id');
  const { content, message_type, attachment_url } = c.req.valid('json');
  const db = c.env.DB;
  
  const result = await db.prepare(`
    INSERT INTO messages (conversation_id, content, message_type, attachment_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(conversationId, content, message_type, attachment_url).run();
  
  if (result.success) {
    // Update conversation last message
    await db.prepare(`
      UPDATE conversations 
      SET last_message = ?, last_message_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).bind(content, conversationId).run();
    
    const message = await db.prepare(`
      SELECT * FROM messages WHERE id = ?
    `).bind(result.meta.last_row_id).first();
    
    return c.json(message);
  }
  
  return c.json({ error: 'Failed to send message' }, 500);
});

// Message Reactions API
app.post('/api/messages/react', zValidator('json', AddReactionRequestSchema), async (c) => {
  const { message_id, emoji } = c.req.valid('json');
  const db = c.env.DB;
  
  // Check if user already reacted with this emoji
  const existing = await db.prepare(`
    SELECT id FROM message_reactions 
    WHERE message_id = ? AND emoji = ? AND user_id IS NULL
  `).bind(message_id, emoji).first();
  
  if (existing) {
    // Remove reaction
    await db.prepare(`
      DELETE FROM message_reactions WHERE id = ?
    `).bind(existing.id).run();
    
    return c.json({ action: 'removed' });
  } else {
    // Add reaction
    await db.prepare(`
      INSERT INTO message_reactions (message_id, emoji, created_at, updated_at)
      VALUES (?, ?, datetime('now'), datetime('now'))
    `).bind(message_id, emoji).run();
    
    return c.json({ action: 'added' });
  }
});

// WhatsApp Templates API
app.get('/api/whatsapp/templates', async (c) => {
  const accessToken = c.env.WHATSAPP_ACCESS_TOKEN;
  const wabaId = c.env.WHATSAPP_WABA_ID;
  
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
    
    // Store templates in database
    const db = c.env.DB;
    for (const template of approvedTemplates) {
      await db.prepare(`
        INSERT OR REPLACE INTO whatsapp_templates 
        (name, language, status, category, components, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        template.name,
        template.language,
        template.status,
        template.category || null,
        JSON.stringify(template.components)
      ).run();
    }
    
    return c.json(approvedTemplates);
  } catch (error) {
    return c.json({ error: 'Failed to fetch templates' }, 500);
  }
});

// Bulk Messaging API
app.post('/api/whatsapp/bulk-send', zValidator('json', BulkSendRequestSchema), async (c) => {
  const { template_name, contact_list_id, phone_numbers, image_url, delay_seconds } = c.req.valid('json');
  const db = c.env.DB;
  
  const accessToken = c.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = c.env.WHATSAPP_PHONE_NUMBER_ID;
  
  if (!accessToken || !phoneNumberId) {
    return c.json({ error: 'WhatsApp API not configured' }, 400);
  }
  
  let contacts: string[] = [];
  
  if (contact_list_id) {
    const contactsResult = await db.prepare(`
      SELECT phone_number FROM contacts WHERE list_id = ? AND is_blocked = 0
    `).bind(contact_list_id).all();
    
    contacts = contactsResult.results.map((c: any) => c.phone_number);
  } else if (phone_numbers) {
    contacts = phone_numbers;
  }
  
  if (contacts.length === 0) {
    return c.json({ error: 'No contacts to send to' }, 400);
  }
  
  // Get template info
  const template = await db.prepare(`
    SELECT * FROM whatsapp_templates WHERE name = ?
  `).bind(template_name).first();
  
  if (!template) {
    return c.json({ error: 'Template not found' }, 404);
  }
  
  const templateComponents = JSON.parse(template.components as string);
  const hasImageHeader = templateComponents.some((c: any) => 
    c.type === 'HEADER' && c.format === 'IMAGE'
  );
  
  if (hasImageHeader && !image_url) {
    return c.json({ error: 'This template requires an image URL' }, 400);
  }
  
  // Create bulk campaign record
  const campaignResult = await db.prepare(`
    INSERT INTO bulk_campaigns 
    (name, template_name, contact_list_id, status, total_contacts, created_at, updated_at)
    VALUES (?, ?, ?, 'running', ?, datetime('now'), datetime('now'))
  `).bind(`Bulk ${template_name} ${new Date().toISOString()}`, template_name, contact_list_id, contacts.length).run();
  
  const campaignId = campaignResult.meta.last_row_id;
  
  let sentCount = 0;
  let failedCount = 0;
  
  // Send messages with delay
  for (const phoneNumber of contacts) {
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
  await db.prepare(`
    UPDATE bulk_campaigns 
    SET status = 'completed', sent_count = ?, failed_count = ?, completed_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).bind(sentCount, failedCount, campaignId).run();
  
  return c.json({
    campaign_id: campaignId,
    total_contacts: contacts.length,
    sent_count: sentCount,
    failed_count: failedCount
  });
});

// Contact Lists API
app.get('/api/contact-lists', async (c) => {
  const db = c.env.DB;
  
  const lists = await db.prepare(`
    SELECT cl.*, COUNT(c.id) as contact_count
    FROM contact_lists cl
    LEFT JOIN contacts c ON cl.id = c.list_id
    GROUP BY cl.id
    ORDER BY cl.created_at DESC
  `).all();
  
  return c.json(lists.results);
});

app.post('/api/contact-lists', zValidator('json', z.object({
  name: z.string(),
  description: z.string().optional()
})), async (c) => {
  const { name, description } = c.req.valid('json');
  const db = c.env.DB;
  
  const result = await db.prepare(`
    INSERT INTO contact_lists (name, description, created_at, updated_at)
    VALUES (?, ?, datetime('now'), datetime('now'))
  `).bind(name, description).run();
  
  if (result.success) {
    const list = await db.prepare(`
      SELECT * FROM contact_lists WHERE id = ?
    `).bind(result.meta.last_row_id).first();
    
    return c.json(list);
  }
  
  return c.json({ error: 'Failed to create contact list' }, 500);
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
  const { contacts } = c.req.valid('json');
  const db = c.env.DB;
  
  let addedCount = 0;
  
  for (const contact of contacts) {
    try {
      await db.prepare(`
        INSERT OR IGNORE INTO contacts 
        (list_id, phone_number, first_name, last_name, email, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        listId,
        contact.phone_number,
        contact.first_name,
        contact.last_name,
        contact.email
      ).run();
      
      addedCount++;
    } catch (error) {
      console.error('Failed to add contact:', contact, error);
    }
  }
  
  return c.json({ added_count: addedCount });
});

export default app;