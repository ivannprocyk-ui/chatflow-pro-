import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { SUPABASE_CLIENT } from '../database/database.module';
import { AIService } from '../ai/ai.service';
import { ChatWootService } from '../chatwoot/chatwoot.service';
import { BotConfigService } from '../bot-config/bot-config.service';

export interface FollowUpConfig {
  id: string;
  organizationId: string;
  enabled: boolean;
  waitTimeMinutes: number;
  maxFollowUps: number;
  messageType: 'template' | 'ai_generated';
  templateMessage?: string;
  aiPrompt?: string;
  businessHoursOnly: boolean;
  businessHoursStart?: string; // e.g., "09:00"
  businessHoursEnd?: string; // e.g., "18:00"
  businessDaysOnly: boolean; // Mon-Fri only
  createdAt: Date;
  updatedAt: Date;
}

export interface PendingFollowUp {
  id: string;
  organizationId: string;
  conversationId: string;
  inboxId: string;
  accountId: string;
  contactId: string;
  lastMessageAt: Date;
  followUpCount: number;
  nextFollowUpAt: Date;
  status: 'pending' | 'sent' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class FollowUpsService {
  private readonly logger = new Logger(FollowUpsService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
    private aiService: AIService,
    private chatwootService: ChatWootService,
    private botConfigService: BotConfigService,
  ) {}

  /**
   * Get follow-up configuration for an organization
   */
  async getFollowUpConfig(organizationId: string): Promise<FollowUpConfig | null> {
    const { data: config, error } = await this.supabase
      .from('follow_up_configs')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error || !config) {
      return null;
    }

    return this.mapDbConfigToConfig(config);
  }

  /**
   * Create or update follow-up configuration
   */
  async upsertFollowUpConfig(
    organizationId: string,
    data: Partial<FollowUpConfig>,
  ): Promise<FollowUpConfig> {
    const existing = await this.getFollowUpConfig(organizationId);

    if (existing) {
      // Update
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (data.enabled !== undefined) updateData.enabled = data.enabled;
      if (data.waitTimeMinutes !== undefined) updateData.wait_time_minutes = data.waitTimeMinutes;
      if (data.maxFollowUps !== undefined) updateData.max_follow_ups = data.maxFollowUps;
      if (data.messageType !== undefined) updateData.message_type = data.messageType;
      if (data.templateMessage !== undefined) updateData.template_message = data.templateMessage;
      if (data.aiPrompt !== undefined) updateData.ai_prompt = data.aiPrompt;
      if (data.businessHoursOnly !== undefined) updateData.business_hours_only = data.businessHoursOnly;
      if (data.businessHoursStart !== undefined) updateData.business_hours_start = data.businessHoursStart;
      if (data.businessHoursEnd !== undefined) updateData.business_hours_end = data.businessHoursEnd;
      if (data.businessDaysOnly !== undefined) updateData.business_days_only = data.businessDaysOnly;

      const { data: updated, error } = await this.supabase
        .from('follow_up_configs')
        .update(updateData)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update follow-up config: ${error.message}`);
      }

      return this.mapDbConfigToConfig(updated);
    } else {
      // Create
      const newConfig = {
        id: uuidv4(),
        organization_id: organizationId,
        enabled: data.enabled !== undefined ? data.enabled : false,
        wait_time_minutes: data.waitTimeMinutes || 60,
        max_follow_ups: data.maxFollowUps || 3,
        message_type: data.messageType || 'template',
        template_message: data.templateMessage || '¡Hola! ¿Necesitas ayuda con algo más?',
        ai_prompt: data.aiPrompt,
        business_hours_only: data.businessHoursOnly || false,
        business_hours_start: data.businessHoursStart || '09:00',
        business_hours_end: data.businessHoursEnd || '18:00',
        business_days_only: data.businessDaysOnly || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: created, error } = await this.supabase
        .from('follow_up_configs')
        .insert(newConfig)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create follow-up config: ${error.message}`);
      }

      return this.mapDbConfigToConfig(created);
    }
  }

  /**
   * Cron job that runs every 5 minutes to check for pending follow-ups
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkPendingFollowUps() {
    this.logger.log('🔍 Checking for pending follow-ups...');

    try {
      // Get all pending follow-ups that are due
      const now = new Date();
      const { data: pendingFollowUps, error } = await this.supabase
        .from('pending_follow_ups')
        .select('*')
        .eq('status', 'pending')
        .lte('next_follow_up_at', now.toISOString());

      if (error) {
        this.logger.error(`Error fetching pending follow-ups: ${error.message}`);
        return;
      }

      if (!pendingFollowUps || pendingFollowUps.length === 0) {
        this.logger.log('No pending follow-ups at this time');
        return;
      }

      this.logger.log(`Found ${pendingFollowUps.length} pending follow-ups`);

      // Process each follow-up
      for (const followUp of pendingFollowUps) {
        try {
          await this.sendFollowUpMessage(this.mapDbFollowUpToFollowUp(followUp));
        } catch (error) {
          this.logger.error(
            `Error processing follow-up ${followUp.id}: ${error.message}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Error in checkPendingFollowUps: ${error.message}`);
    }
  }

  /**
   * Send a follow-up message
   */
  private async sendFollowUpMessage(followUp: PendingFollowUp) {
    this.logger.log(`📤 Sending follow-up for conversation ${followUp.conversationId}`);

    // 1. Get follow-up config
    const config = await this.getFollowUpConfig(followUp.organizationId);

    if (!config || !config.enabled) {
      this.logger.log(`Follow-ups disabled for org ${followUp.organizationId}`);
      await this.cancelFollowUp(followUp.id);
      return;
    }

    // 2. Check business hours
    if (config.businessHoursOnly || config.businessDaysOnly) {
      const now = new Date();
      const isWithinBusinessHours = this.isWithinBusinessHours(now, config);

      if (!isWithinBusinessHours) {
        // Reschedule for next business hour
        this.logger.log('Outside business hours, rescheduling...');
        const nextBusinessTime = this.getNextBusinessTime(now, config);
        await this.rescheduleFollowUp(followUp.id, nextBusinessTime);
        return;
      }
    }

    // 3. Check max follow-ups
    if (followUp.followUpCount >= config.maxFollowUps) {
      this.logger.log(`Max follow-ups reached for conversation ${followUp.conversationId}`);
      await this.cancelFollowUp(followUp.id);
      return;
    }

    // 4. Generate message
    let message: string;
    if (config.messageType === 'template') {
      message = config.templateMessage || '¡Hola! ¿Necesitas ayuda con algo más?';
    } else {
      // AI-generated follow-up
      message = await this.generateAIFollowUp(followUp, config);
    }

    // 5. Send message via ChatWoot
    try {
      await this.chatwootService.sendMessage({
        accountId: followUp.accountId,
        conversationId: parseInt(followUp.conversationId),
        content: message,
        messageType: 'outgoing',
        private: false,
      });

      this.logger.log(`✅ Follow-up sent for conversation ${followUp.conversationId}`);

      // 6. Mark as sent and schedule next follow-up if needed
      await this.markFollowUpSent(followUp.id, config.waitTimeMinutes);
    } catch (error) {
      this.logger.error(`Failed to send follow-up: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate AI follow-up message
   */
  private async generateAIFollowUp(
    followUp: PendingFollowUp,
    config: FollowUpConfig,
  ): Promise<string> {
    try {
      // Get bot config
      const botConfig = await this.botConfigService.findByOrganizationId(
        followUp.organizationId,
      );

      if (!botConfig) {
        return config.templateMessage || '¡Hola! ¿Necesitas ayuda con algo más?';
      }

      // Get conversation history from ChatWoot
      const messages = await this.chatwootService.getConversationMessages(
        followUp.accountId,
        parseInt(followUp.conversationId),
      );

      // Build prompt for AI
      const prompt =
        config.aiPrompt ||
        `Genera un mensaje de seguimiento amable y breve para un cliente que no ha respondido.
El mensaje debe ser en tono ${botConfig.tone} y en idioma ${botConfig.language}.
No debe ser insistente, solo amigable y útil.`;

      // TODO: Call Flowise to generate follow-up message
      // For now, return template message
      return config.templateMessage || '¡Hola! ¿Puedo ayudarte con algo más?';
    } catch (error) {
      this.logger.error(`Error generating AI follow-up: ${error.message}`);
      return config.templateMessage || '¡Hola! ¿Necesitas ayuda con algo más?';
    }
  }

  /**
   * Track a new conversation for follow-up
   */
  async trackConversationForFollowUp(
    organizationId: string,
    conversationId: string,
    inboxId: string,
    accountId: string,
    contactId: string,
  ) {
    const config = await this.getFollowUpConfig(organizationId);

    if (!config || !config.enabled) {
      return;
    }

    const now = new Date();
    const nextFollowUpAt = new Date(now.getTime() + config.waitTimeMinutes * 60 * 1000);

    // Check if already tracking this conversation
    const { data: existing } = await this.supabase
      .from('pending_follow_ups')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('status', 'pending')
      .single();

    if (existing) {
      // Update existing
      await this.supabase
        .from('pending_follow_ups')
        .update({
          last_message_at: now.toISOString(),
          next_follow_up_at: nextFollowUpAt.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', existing.id);
    } else {
      // Create new
      await this.supabase.from('pending_follow_ups').insert({
        id: uuidv4(),
        organization_id: organizationId,
        conversation_id: conversationId,
        inbox_id: inboxId,
        account_id: accountId,
        contact_id: contactId,
        last_message_at: now.toISOString(),
        follow_up_count: 0,
        next_follow_up_at: nextFollowUpAt.toISOString(),
        status: 'pending',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      });
    }

    this.logger.log(`Tracking conversation ${conversationId} for follow-up in ${config.waitTimeMinutes} minutes`);
  }

  /**
   * Cancel follow-up when customer responds
   */
  async cancelFollowUpOnResponse(conversationId: string) {
    await this.supabase
      .from('pending_follow_ups')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('conversation_id', conversationId)
      .eq('status', 'pending');

    this.logger.log(`Cancelled follow-up for conversation ${conversationId}`);
  }

  /**
   * Helper methods
   */
  private async cancelFollowUp(followUpId: string) {
    await this.supabase
      .from('pending_follow_ups')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', followUpId);
  }

  private async markFollowUpSent(followUpId: string, waitTimeMinutes: number) {
    const now = new Date();
    const nextFollowUpAt = new Date(now.getTime() + waitTimeMinutes * 60 * 1000);

    // Get current follow-up
    const { data: followUp } = await this.supabase
      .from('pending_follow_ups')
      .select('follow_up_count')
      .eq('id', followUpId)
      .single();

    if (!followUp) return;

    await this.supabase
      .from('pending_follow_ups')
      .update({
        follow_up_count: followUp.follow_up_count + 1,
        next_follow_up_at: nextFollowUpAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', followUpId);
  }

  private async rescheduleFollowUp(followUpId: string, nextTime: Date) {
    await this.supabase
      .from('pending_follow_ups')
      .update({
        next_follow_up_at: nextTime.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', followUpId);
  }

  private isWithinBusinessHours(date: Date, config: FollowUpConfig): boolean {
    // Check day of week
    if (config.businessDaysOnly) {
      const day = date.getDay();
      if (day === 0 || day === 6) {
        return false; // Weekend
      }
    }

    // Check time of day
    if (config.businessHoursOnly && config.businessHoursStart && config.businessHoursEnd) {
      const hour = date.getHours();
      const minute = date.getMinutes();
      const currentTime = hour * 60 + minute;

      const [startHour, startMinute] = config.businessHoursStart.split(':').map(Number);
      const startTime = startHour * 60 + startMinute;

      const [endHour, endMinute] = config.businessHoursEnd.split(':').map(Number);
      const endTime = endHour * 60 + endMinute;

      if (currentTime < startTime || currentTime >= endTime) {
        return false;
      }
    }

    return true;
  }

  private getNextBusinessTime(from: Date, config: FollowUpConfig): Date {
    const next = new Date(from);

    // If business days only and it's weekend, move to Monday
    if (config.businessDaysOnly) {
      while (next.getDay() === 0 || next.getDay() === 6) {
        next.setDate(next.getDate() + 1);
      }
    }

    // Set to business hours start
    if (config.businessHoursStart) {
      const [hour, minute] = config.businessHoursStart.split(':').map(Number);
      next.setHours(hour, minute, 0, 0);
    }

    return next;
  }

  private mapDbConfigToConfig(dbConfig: any): FollowUpConfig {
    return {
      id: dbConfig.id,
      organizationId: dbConfig.organization_id,
      enabled: dbConfig.enabled,
      waitTimeMinutes: dbConfig.wait_time_minutes,
      maxFollowUps: dbConfig.max_follow_ups,
      messageType: dbConfig.message_type,
      templateMessage: dbConfig.template_message,
      aiPrompt: dbConfig.ai_prompt,
      businessHoursOnly: dbConfig.business_hours_only,
      businessHoursStart: dbConfig.business_hours_start,
      businessHoursEnd: dbConfig.business_hours_end,
      businessDaysOnly: dbConfig.business_days_only,
      createdAt: new Date(dbConfig.created_at),
      updatedAt: new Date(dbConfig.updated_at),
    };
  }

  private mapDbFollowUpToFollowUp(dbFollowUp: any): PendingFollowUp {
    return {
      id: dbFollowUp.id,
      organizationId: dbFollowUp.organization_id,
      conversationId: dbFollowUp.conversation_id,
      inboxId: dbFollowUp.inbox_id,
      accountId: dbFollowUp.account_id,
      contactId: dbFollowUp.contact_id,
      lastMessageAt: new Date(dbFollowUp.last_message_at),
      followUpCount: dbFollowUp.follow_up_count,
      nextFollowUpAt: new Date(dbFollowUp.next_follow_up_at),
      status: dbFollowUp.status,
      createdAt: new Date(dbFollowUp.created_at),
      updatedAt: new Date(dbFollowUp.updated_at),
    };
  }
}
