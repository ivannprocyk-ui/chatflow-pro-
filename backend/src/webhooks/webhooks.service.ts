import { Injectable, Logger } from '@nestjs/common';
import { ContactsService } from '../contacts/contacts.service';
import { MessagesService } from '../messages/messages.service';
import { AIService } from '../ai/ai.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private contactsService: ContactsService,
    private messagesService: MessagesService,
    private aiService: AIService,
    private whatsappService: WhatsAppService,
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
}
