import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

/**
 * DTO for sending messages to ChatWoot
 */
export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsNumber()
  @IsNotEmpty()
  conversationId: number;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  messageType?: string; // 'outgoing', 'incoming'

  @IsString()
  private?: boolean; // Private note or public message
}

/**
 * DTO for ChatWoot webhook payloads
 */
export class ChatWootWebhookDto {
  @IsString()
  event: string; // 'message_created', 'message_updated', 'conversation_created'

  id?: number;
  content?: string;
  message_type?: string; // 'incoming', 'outgoing'
  created_at?: number;

  conversation?: {
    id: number;
    messages?: any[];
    meta?: any;
    status?: string;
    account_id?: number;
    inbox_id?: number;
  };

  sender?: {
    id: number;
    name?: string;
    phone_number?: string;
    email?: string;
  };

  inbox?: {
    id: number;
    name?: string;
  };

  account?: {
    id: number;
    name?: string;
  };
}
