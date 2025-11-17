import { Injectable, Logger, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { BotMessageLog } from './entities/bot-message-log.entity';
import { TrackMessageDto } from './dto/track-message.dto';
import { SUPABASE_CLIENT } from '../database/database.module';

@Injectable()
export class BotTrackingService {
  private readonly logger = new Logger(BotTrackingService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  /**
   * Track a bot message (metadata only, no content)
   */
  async trackMessage(dto: TrackMessageDto): Promise<BotMessageLog> {
    const now = new Date().toISOString();

    const log = {
      id: uuidv4(),
      organization_id: dto.organizationId,
      message_id: dto.messageId,
      conversation_id: dto.conversationId,
      inbox_id: dto.inboxId,
      direction: dto.direction,
      bot_enabled: dto.botEnabled,
      bot_processed: dto.botProcessed,
      bot_responded: dto.botResponded,
      processing_time_ms: dto.processingTimeMs,
      response_time_ms: dto.responseTimeMs,
      ai_provider: dto.aiProvider,
      ai_model: dto.aiModel,
      agent_type: dto.agentType,
      status: dto.status,
      error_message: dto.errorMessage,
      error_code: dto.errorCode,
      received_at: now,
      processed_at: dto.status !== 'pending' ? now : null,
      sent_at: dto.status === 'success' ? now : null,
      created_at: now,
    };

    const { data: createdLog, error } = await this.supabase
      .from('bot_message_logs')
      .insert(log)
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to track message: ${error.message}`);
      throw new Error(`Failed to track message: ${error.message}`);
    }

    this.logger.log(`Message tracked: ${createdLog.id} - ${createdLog.status}`);

    return this.mapDbLogToLog(createdLog);
  }

  /**
   * Update message log status
   */
  async updateMessageLog(
    id: string,
    updates: Partial<BotMessageLog>,
  ): Promise<BotMessageLog> {
    const updateData: any = {};

    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.processingTimeMs !== undefined) updateData.processing_time_ms = updates.processingTimeMs;
    if (updates.responseTimeMs !== undefined) updateData.response_time_ms = updates.responseTimeMs;
    if (updates.errorMessage !== undefined) updateData.error_message = updates.errorMessage;
    if (updates.errorCode !== undefined) updateData.error_code = updates.errorCode;
    if (updates.processedAt !== undefined) updateData.processed_at = updates.processedAt?.toISOString();
    if (updates.sentAt !== undefined) updateData.sent_at = updates.sentAt?.toISOString();

    const { data: updatedLog, error } = await this.supabase
      .from('bot_message_logs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !updatedLog) {
      throw new Error(`Failed to update message log: ${error?.message}`);
    }

    return this.mapDbLogToLog(updatedLog);
  }

  /**
   * Get message logs by organization
   */
  async getMessageLogs(
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
      status?: string;
    },
  ): Promise<BotMessageLog[]> {
    let query = this.supabase
      .from('bot_message_logs')
      .select('*')
      .eq('organization_id', organizationId);

    // Filter by date range
    if (options?.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }
    if (options?.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }

    // Filter by status
    if (options?.status) {
      query = query.eq('status', options.status);
    }

    // Sort and paginate
    query = query.order('created_at', { ascending: false });

    const offset = options?.offset || 0;
    const limit = options?.limit || 100;
    query = query.range(offset, offset + limit - 1);

    const { data: logs, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch message logs: ${error.message}`);
    }

    return (logs || []).map(this.mapDbLogToLog);
  }

  /**
   * Get message logs by conversation
   */
  async getMessageLogsByConversation(
    conversationId: string,
  ): Promise<BotMessageLog[]> {
    const { data: logs, error } = await this.supabase
      .from('bot_message_logs')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch conversation logs: ${error.message}`);
    }

    return (logs || []).map(this.mapDbLogToLog);
  }

  /**
   * Get total message count
   */
  async getMessageCount(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    let query = this.supabase
      .from('bot_message_logs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to get message count: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Get success rate
   */
  async getSuccessRate(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    // Get total processed messages
    let totalQuery = this.supabase
      .from('bot_message_logs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('bot_processed', true);

    // Get successful messages
    let successQuery = this.supabase
      .from('bot_message_logs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('bot_processed', true)
      .eq('status', 'success');

    if (startDate) {
      const dateStr = startDate.toISOString();
      totalQuery = totalQuery.gte('created_at', dateStr);
      successQuery = successQuery.gte('created_at', dateStr);
    }
    if (endDate) {
      const dateStr = endDate.toISOString();
      totalQuery = totalQuery.lte('created_at', dateStr);
      successQuery = successQuery.lte('created_at', dateStr);
    }

    const [totalResult, successResult] = await Promise.all([
      totalQuery,
      successQuery,
    ]);

    const totalCount = totalResult.count || 0;
    const successCount = successResult.count || 0;

    if (totalCount === 0) return 0;
    return (successCount / totalCount) * 100;
  }

  /**
   * Get average processing time
   */
  async getAverageProcessingTime(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    let query = this.supabase
      .from('bot_message_logs')
      .select('processing_time_ms')
      .eq('organization_id', organizationId)
      .not('processing_time_ms', 'is', null);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data: logs, error } = await query;

    if (error || !logs || logs.length === 0) return 0;

    const totalTime = logs.reduce((sum, l) => sum + (l.processing_time_ms || 0), 0);
    return totalTime / logs.length;
  }

  /**
   * Get error statistics
   */
  async getErrorStats(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Array<{ code: string; count: number }>> {
    let query = this.supabase
      .from('bot_message_logs')
      .select('error_code')
      .eq('organization_id', organizationId)
      .eq('status', 'failed')
      .not('error_code', 'is', null);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data: logs, error } = await query;

    if (error || !logs) return [];

    // Group by error code
    const errorCounts = new Map<string, number>();
    logs.forEach((l) => {
      const code = l.error_code || 'unknown';
      errorCounts.set(code, (errorCounts.get(code) || 0) + 1);
    });

    // Convert to array and sort by count
    return Array.from(errorCounts.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get unique conversation count
   */
  async getConversationCount(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    let query = this.supabase
      .from('bot_message_logs')
      .select('conversation_id')
      .eq('organization_id', organizationId)
      .not('conversation_id', 'is', null);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data: logs, error } = await query;

    if (error || !logs) return 0;

    const conversationIds = new Set(logs.map((l) => l.conversation_id));
    return conversationIds.size;
  }

  /**
   * Map database log (snake_case) to application BotMessageLog (camelCase)
   */
  private mapDbLogToLog(dbLog: any): BotMessageLog {
    return {
      id: dbLog.id,
      organizationId: dbLog.organization_id,
      messageId: dbLog.message_id,
      conversationId: dbLog.conversation_id,
      inboxId: dbLog.inbox_id,
      direction: dbLog.direction,
      botEnabled: dbLog.bot_enabled,
      botProcessed: dbLog.bot_processed,
      botResponded: dbLog.bot_responded,
      processingTimeMs: dbLog.processing_time_ms,
      responseTimeMs: dbLog.response_time_ms,
      aiProvider: dbLog.ai_provider,
      aiModel: dbLog.ai_model,
      agentType: dbLog.agent_type,
      status: dbLog.status,
      errorMessage: dbLog.error_message,
      errorCode: dbLog.error_code,
      receivedAt: dbLog.received_at ? new Date(dbLog.received_at) : undefined,
      processedAt: dbLog.processed_at ? new Date(dbLog.processed_at) : undefined,
      sentAt: dbLog.sent_at ? new Date(dbLog.sent_at) : undefined,
      createdAt: new Date(dbLog.created_at),
    };
  }
}
