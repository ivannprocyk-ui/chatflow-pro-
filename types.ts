import z from "zod";

// Conversation Types
export const ConversationSchema = z.object({
  id: z.number(),
  name: z.string(),
  phone_number: z.string().optional(),
  avatar_url: z.string().optional(),
  last_message: z.string().optional(),
  last_message_at: z.string().optional(),
  unread_count: z.number().default(0),
  is_group: z.boolean().default(false),
  is_archived: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Conversation = z.infer<typeof ConversationSchema>;

// Message Types
export const MessageSchema = z.object({
  id: z.number(),
  conversation_id: z.number(),
  content: z.string(),
  message_type: z.enum(['text', 'image', 'video', 'audio', 'document']).default('text'),
  sender_type: z.enum(['user', 'contact', 'system']).default('user'),
  attachment_url: z.string().optional(),
  attachment_type: z.string().optional(),
  meta_message_id: z.string().optional(),
  status: z.enum(['sent', 'delivered', 'read', 'failed']).default('sent'),
  is_read: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;

// Message Reaction Types
export const MessageReactionSchema = z.object({
  id: z.number(),
  message_id: z.number(),
  emoji: z.string(),
  user_id: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type MessageReaction = z.infer<typeof MessageReactionSchema>;

// Contact Types
export const ContactSchema = z.object({
  id: z.number(),
  list_id: z.number().optional(),
  phone_number: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().optional(),
  is_blocked: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Contact = z.infer<typeof ContactSchema>;

// Contact List Types
export const ContactListSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  contact_count: z.number().default(0),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ContactList = z.infer<typeof ContactListSchema>;

// WhatsApp Template Types
export const WhatsAppTemplateSchema = z.object({
  id: z.number(),
  name: z.string(),
  language: z.string(),
  status: z.string(),
  category: z.string().optional(),
  components: z.string(), // JSON string
  created_at: z.string(),
  updated_at: z.string(),
});

export type WhatsAppTemplate = z.infer<typeof WhatsAppTemplateSchema>;

// Bulk Campaign Types
export const BulkCampaignSchema = z.object({
  id: z.number(),
  name: z.string(),
  template_name: z.string(),
  contact_list_id: z.number().optional(),
  status: z.enum(['draft', 'scheduled', 'running', 'completed', 'failed']).default('draft'),
  total_contacts: z.number().default(0),
  sent_count: z.number().default(0),
  failed_count: z.number().default(0),
  scheduled_at: z.string().optional(),
  completed_at: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type BulkCampaign = z.infer<typeof BulkCampaignSchema>;

// API Request/Response Types
export const SendMessageRequestSchema = z.object({
  conversation_id: z.number(),
  content: z.string(),
  message_type: z.enum(['text', 'image', 'video', 'audio', 'document']).default('text'),
  attachment_url: z.string().optional(),
});

export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;

export const CreateConversationRequestSchema = z.object({
  name: z.string(),
  phone_number: z.string().optional(),
  is_group: z.boolean().default(false),
});

export type CreateConversationRequest = z.infer<typeof CreateConversationRequestSchema>;

export const BulkSendRequestSchema = z.object({
  template_name: z.string(),
  contact_list_id: z.number().optional(),
  phone_numbers: z.array(z.string()).optional(),
  image_url: z.string().optional(),
  delay_seconds: z.number().default(2),
});

export type BulkSendRequest = z.infer<typeof BulkSendRequestSchema>;

export const AddReactionRequestSchema = z.object({
  message_id: z.number(),
  emoji: z.string(),
});

export type AddReactionRequest = z.infer<typeof AddReactionRequestSchema>;
