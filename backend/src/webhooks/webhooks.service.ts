import { Injectable, Logger } from '@nestjs/common';
import { ContactsService } from '../contacts/contacts.service';
import { MessagesService } from '../messages/messages.service';
import { AIService } from '../ai/ai.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { ChatWootService } from '../chatwoot/chatwoot.service';
import { BotTrackingService } from '../bot-tracking/bot-tracking.service';
import { FollowUpsService } from '../follow-ups/follow-ups.service';
import { BotConfigService } from '../bot-config/bot-config.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private contactsService: ContactsService,
    private messagesService: MessagesService,
    private aiService: AIService,
    private whatsappService: WhatsAppService,
    private chatwootService: ChatWootService,
    private botTrackingService: BotTrackingService,
    private followUpsService: FollowUpsService,
    private botConfigService: BotConfigService,
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

    const startTime = Date.now();
    let organizationId: string;
    let botConfig: any;

    try {
      // Only process message_created events from incoming messages
      if (payload.event !== 'message_created') {
        this.logger.log(`Ignoring non-message event: ${payload.event}`);
        return { processed: false, reason: 'not_message_created_event' };
      }

      // Extract data from webhook
      const messageContent = payload.content;
      const conversationId = payload.conversation?.id;
      const accountId = payload.account?.id;
      const inboxId = payload.inbox?.id;
      const contactId = payload.sender?.id;
      const contactPhone = payload.sender?.phone_number || payload.sender?.id;

      if (!messageContent || !conversationId || !accountId || !inboxId) {
        this.logger.warn('Invalid ChatWoot webhook - missing required fields');
        return { processed: false, reason: 'invalid_payload' };
      }

      // Get bot config by inbox ID to get organization
      botConfig = await this.botConfigService.findByInboxId(inboxId.toString());
      if (!botConfig) {
        this.logger.warn(`No bot config found for inbox ${inboxId}`);
        return { processed: false, reason: 'no_bot_config' };
      }

      organizationId = botConfig.organizationId;

      // ===== INCOMING MESSAGE (from client) =====
      if (payload.message_type === 'incoming') {
        this.logger.log(`Incoming message from client in conversation ${conversationId}`);

        // 🔔 IMPORTANT: Cancel follow-ups because client responded
        await this.followUpsService.cancelFollowUpOnResponse(conversationId.toString());
        this.logger.log(`✅ Cancelled follow-ups for conversation ${conversationId}`);

        // Track inbound message
        await this.botTrackingService.trackMessage({
          organizationId,
          messageId: payload.id?.toString(),
          conversationId: conversationId.toString(),
          inboxId: inboxId.toString(),
          direction: 'inbound',
          botEnabled: botConfig.botEnabled,
          botProcessed: false,
          botResponded: false,
          status: 'pending',
        });

        // Only auto-respond if bot is enabled
        if (!botConfig.botEnabled) {
          this.logger.log('Bot is disabled for this organization');
          return { processed: false, reason: 'bot_disabled' };
        }

        // Generate AI response
        this.logger.log('🤖 Generating AI response...');
        const aiProcessingStart = Date.now();

        const aiResponse = await this.aiService.handleChatWootMessage(payload);
        const processingTimeMs = Date.now() - aiProcessingStart;

        if (!aiResponse || aiResponse === 'Bot is disabled') {
          this.logger.log('No AI response generated');
          return { processed: false, reason: 'no_ai_response' };
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

        const responseTimeMs = Date.now() - startTime;

        this.logger.log('✅ AI response sent successfully');

        // Track successful processing
        await this.botTrackingService.trackMessage({
          organizationId,
          messageId: payload.id?.toString(),
          conversationId: conversationId.toString(),
          inboxId: inboxId.toString(),
          direction: 'outbound',
          botEnabled: true,
          botProcessed: true,
          botResponded: true,
          processingTimeMs,
          responseTimeMs,
          aiProvider: 'flowise',
          aiModel: botConfig.agentType || 'asistente',
          agentType: botConfig.agentType,
          status: 'success',
        });

        // 🎯 IMPORTANT: Track conversation for future follow-up
        // This will create a pending follow-up if client doesn't respond
        await this.followUpsService.trackConversationForFollowUp(
          organizationId,
          conversationId.toString(),
          inboxId.toString(),
          accountId.toString(),
          contactId?.toString() || contactPhone,
        );
        this.logger.log(`📋 Tracked conversation ${conversationId} for follow-up`);

        return {
          processed: true,
          conversationId,
          response: aiResponse,
          metrics: {
            processingTimeMs,
            responseTimeMs,
          },
        };
      }

      // ===== OUTGOING MESSAGE (from bot or agent) =====
      else if (payload.message_type === 'outgoing') {
        this.logger.log(`Outgoing message in conversation ${conversationId} - tracking for follow-up`);

        // Track conversation for follow-up (in case client doesn't respond to our message)
        await this.followUpsService.trackConversationForFollowUp(
          organizationId,
          conversationId.toString(),
          inboxId.toString(),
          accountId.toString(),
          contactId?.toString() || contactPhone,
        );

        return { processed: true, reason: 'outgoing_tracked_for_followup' };
      }

      return { processed: false, reason: 'unknown_message_type' };

    } catch (error) {
      this.logger.error(`Error processing ChatWoot webhook: ${error.message}`);

      // Track failed processing
      try {
        if (organizationId) {
          await this.botTrackingService.trackMessage({
            organizationId,
            conversationId: payload.conversation?.id?.toString(),
            inboxId: payload.inbox?.id?.toString(),
            direction: 'inbound',
            botEnabled: botConfig?.botEnabled || false,
            botProcessed: true,
            botResponded: false,
            status: 'failed',
            errorMessage: error.message,
            errorCode: error.code || 'UNKNOWN_ERROR',
          });
        }
      } catch (trackingError) {
        this.logger.error(`Error tracking failed message: ${trackingError.message}`);
      }

      return {
        processed: false,
        error: error.message,
      };
    }
  }
}
