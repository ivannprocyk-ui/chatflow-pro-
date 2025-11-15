import { Injectable, Logger } from '@nestjs/common';
import { ContactsService } from '../contacts/contacts.service';
import { MessagesService } from '../messages/messages.service';
import { AIService } from '../ai/ai.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { ChatWootService } from '../chatwoot/chatwoot.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private contactsService: ContactsService,
    private messagesService: MessagesService,
    private aiService: AIService,
    private whatsappService: WhatsAppService,
    private chatwootService: ChatWootService,
  ) {}

  async handleEvolutionWebhook(payload: any) {
    this.logger.log('📨 Received Evolution API webhook');

    try {
      const { instance, data } = payload;

      // Extract organization ID from instance name
      const organizationId = instance.replace('org-', '');

      // Extract message data
      const phone = data.key?.remoteJid?.replace('@s.whatsapp.net', '');
      const messageContent =
        data.message?.conversation ||
        data.message?.extendedTextMessage?.text ||
        '';

      if (!phone || !messageContent) {
        this.logger.warn('Invalid webhook payload - missing phone or message');
        return { processed: false, reason: 'invalid_payload' };
      }

      this.logger.log(`Message from ${phone} to org ${organizationId}`);

      // 1. Find or create contact
      let contact = await this.contactsService.findByPhone(phone, organizationId);
      if (!contact) {
        contact = await this.contactsService.create(organizationId, {
          phone,
          status: 'lead',
          customFields: {},
        });
        this.logger.log(`Created new contact: ${contact.id}`);
      }

      // 2. Save incoming message
      const incomingMessage = await this.messagesService.create(organizationId, {
        contactId: contact.id,
        direction: 'inbound',
        messageContent,
        status: 'delivered',
        isAutoReply: false,
      });

      this.logger.log(`Saved incoming message: ${incomingMessage.id}`);

      // 3. Check if should auto-respond
      const org = await this.contactsService['organizationsService']?.findOne(organizationId);

      // For mock data, create a basic org object
      const mockOrg = {
        aiEnabled: true,
        aiBusinessHoursOnly: false,
      };

      const shouldRespond = this.aiService.shouldAutoRespond(org || mockOrg, messageContent);

      if (!shouldRespond) {
        this.logger.log('Auto-response disabled for this message');
        return {
          processed: true,
          autoResponded: false,
          reason: 'auto_response_disabled',
        };
      }

      // 4. Get conversation history
      const history = await this.messagesService.getConversation(
        contact.id,
        organizationId,
        10,
      );

      // 5. Generate AI response
      this.logger.log('🤖 Generating AI response...');
      const aiResponse = await this.aiService.generateResponse(
        organizationId,
        phone,
        messageContent,
        history,
      );

      // 6. Save outgoing message
      const outgoingMessage = await this.messagesService.create(organizationId, {
        contactId: contact.id,
        direction: 'outbound',
        messageContent: aiResponse,
        status: 'pending',
        isAutoReply: true,
      });

      this.logger.log(`Saved outgoing message: ${outgoingMessage.id}`);

      // 7. Send message via WhatsApp
      this.logger.log('📤 Sending response via WhatsApp...');
      try {
        await this.whatsappService.sendMessage(organizationId, phone, aiResponse);

        // Update message status
        await this.messagesService.updateStatus(outgoingMessage.id, 'sent');

        this.logger.log('✅ Response sent successfully');
      } catch (error) {
        this.logger.error(`Error sending message: ${error.message}`);
        await this.messagesService.updateStatus(outgoingMessage.id, 'failed');
      }

      // 8. Update lead score
      const scoreIncrease = this.aiService.calculateLeadScore(messageContent);
      if (scoreIncrease > 0) {
        await this.contactsService.updateLeadScore(contact.id, scoreIncrease);
        this.logger.log(`Updated lead score +${scoreIncrease}`);
      }

      return {
        processed: true,
        autoResponded: true,
        messageId: outgoingMessage.id,
        response: aiResponse,
      };
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`);
      return {
        processed: false,
        error: error.message,
      };
    }
  }

  /**
   * Handle ChatWoot webhook
   * Main handler for ChatWoot message_created events
   */
  async handleChatWootWebhook(payload: any) {
    this.logger.log('📨 Received ChatWoot webhook');

    try {
      // Only process message_created events from incoming messages
      if (payload.event !== 'message_created') {
        this.logger.log(`Ignoring non-message event: ${payload.event}`);
        return { processed: false, reason: 'not_message_created_event' };
      }

      // Ignore outgoing messages (sent by us or agents)
      if (payload.message_type === 'outgoing') {
        this.logger.log('Ignoring outgoing message');
        return { processed: false, reason: 'outgoing_message' };
      }

      // Extract data from webhook
      const messageContent = payload.content;
      const conversationId = payload.conversation?.id;
      const accountId = payload.account?.id;
      const inboxId = payload.inbox?.id;
      const contactPhone = payload.sender?.phone_number || payload.sender?.id;

      if (!messageContent || !conversationId || !accountId || !inboxId) {
        this.logger.warn('Invalid ChatWoot webhook - missing required fields');
        return { processed: false, reason: 'invalid_payload' };
      }

      this.logger.log(`Message from ChatWoot inbox ${inboxId}, conversation ${conversationId}`);

      // Generate AI response using the new handleChatWootMessage method
      this.logger.log('🤖 Generating AI response via ChatWoot handler...');
      const aiResponse = await this.aiService.handleChatWootMessage(payload);

      if (!aiResponse || aiResponse === 'Bot is disabled') {
        this.logger.log('Bot disabled or no response generated');
        return { processed: false, reason: 'bot_disabled' };
      }

      // Send AI response back to ChatWoot
      this.logger.log('📤 Sending AI response to ChatWoot...');
      await this.chatwootService.sendMessage({
        accountId: accountId.toString(),
        conversationId: conversationId,
        content: aiResponse,
        messageType: 'outgoing',
        private: false,
      });

      this.logger.log('✅ AI response sent to ChatWoot successfully');

      return {
        processed: true,
        conversationId,
        response: aiResponse,
      };
    } catch (error) {
      this.logger.error(`Error processing ChatWoot webhook: ${error.message}`);
      return {
        processed: false,
        error: error.message,
      };
    }
  }
}
