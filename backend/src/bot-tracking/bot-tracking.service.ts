import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { BotMessageLog } from './entities/bot-message-log.entity';
import { TrackMessageDto } from './dto/track-message.dto';

@Injectable()
export class BotTrackingService {
  private readonly logger = new Logger(BotTrackingService.name);
  private messageLogs: BotMessageLog[] = [];

  /**
   * Track a bot message (metadata only, no content)
   */
  async trackMessage(dto: TrackMessageDto): Promise<BotMessageLog> {
    const now = new Date();

    const log: BotMessageLog = {
      id: uuidv4(),
      organizationId: dto.organizationId,
      messageId: dto.messageId,
      conversationId: dto.conversationId,
      inboxId: dto.inboxId,
      direction: dto.direction,
      botEnabled: dto.botEnabled,
      botProcessed: dto.botProcessed,
      botResponded: dto.botResponded,
      processingTimeMs: dto.processingTimeMs,
      responseTimeMs: dto.responseTimeMs,
      aiProvider: dto.aiProvider,
      aiModel: dto.aiModel,
      agentType: dto.agentType,
      status: dto.status,
      errorMessage: dto.errorMessage,
      errorCode: dto.errorCode,
      receivedAt: now,
      processedAt: dto.status !== 'pending' ? now : undefined,
      sentAt: dto.status === 'success' ? now : undefined,
      createdAt: now,
    };

    this.messageLogs.push(log);
    this.logger.log(`Message tracked: ${log.id} - ${log.status}`);

    return log;
  }

  /**
   * Update message log status
   */
  async updateMessageLog(
    id: string,
    updates: Partial<BotMessageLog>,
  ): Promise<BotMessageLog> {
    const log = this.messageLogs.find((l) => l.id === id);
    if (!log) {
      throw new Error(`Message log not found: ${id}`);
    }

    Object.assign(log, updates);
    return log;
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
    let logs = this.messageLogs.filter(
      (l) => l.organizationId === organizationId,
    );

    // Filter by date range
    if (options?.startDate) {
      logs = logs.filter((l) => l.createdAt >= options.startDate);
    }
    if (options?.endDate) {
      logs = logs.filter((l) => l.createdAt <= options.endDate);
    }

    // Filter by status
    if (options?.status) {
      logs = logs.filter((l) => l.status === options.status);
    }

    // Sort by most recent first
    logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || 100;
    return logs.slice(offset, offset + limit);
  }

  /**
   * Get message logs by conversation
   */
  async getMessageLogsByConversation(
    conversationId: string,
  ): Promise<BotMessageLog[]> {
    return this.messageLogs
      .filter((l) => l.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  /**
   * Get total message count
   */
  async getMessageCount(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    let logs = this.messageLogs.filter(
      (l) => l.organizationId === organizationId,
    );

    if (startDate) {
      logs = logs.filter((l) => l.createdAt >= startDate);
    }
    if (endDate) {
      logs = logs.filter((l) => l.createdAt <= endDate);
    }

    return logs.length;
  }

  /**
   * Get success rate
   */
  async getSuccessRate(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    let logs = this.messageLogs.filter(
      (l) => l.organizationId === organizationId && l.botProcessed,
    );

    if (startDate) {
      logs = logs.filter((l) => l.createdAt >= startDate);
    }
    if (endDate) {
      logs = logs.filter((l) => l.createdAt <= endDate);
    }

    if (logs.length === 0) return 0;

    const successCount = logs.filter((l) => l.status === 'success').length;
    return (successCount / logs.length) * 100;
  }

  /**
   * Get average processing time
   */
  async getAverageProcessingTime(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    let logs = this.messageLogs.filter(
      (l) =>
        l.organizationId === organizationId &&
        l.processingTimeMs !== undefined,
    );

    if (startDate) {
      logs = logs.filter((l) => l.createdAt >= startDate);
    }
    if (endDate) {
      logs = logs.filter((l) => l.createdAt <= endDate);
    }

    if (logs.length === 0) return 0;

    const totalTime = logs.reduce((sum, l) => sum + (l.processingTimeMs || 0), 0);
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
    let logs = this.messageLogs.filter(
      (l) =>
        l.organizationId === organizationId &&
        l.status === 'failed' &&
        l.errorCode,
    );

    if (startDate) {
      logs = logs.filter((l) => l.createdAt >= startDate);
    }
    if (endDate) {
      logs = logs.filter((l) => l.createdAt <= endDate);
    }

    // Group by error code
    const errorCounts = new Map<string, number>();
    logs.forEach((l) => {
      const code = l.errorCode || 'unknown';
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
    let logs = this.messageLogs.filter(
      (l) => l.organizationId === organizationId && l.conversationId,
    );

    if (startDate) {
      logs = logs.filter((l) => l.createdAt >= startDate);
    }
    if (endDate) {
      logs = logs.filter((l) => l.createdAt <= endDate);
    }

    const conversationIds = new Set(logs.map((l) => l.conversationId));
    return conversationIds.size;
  }
}
