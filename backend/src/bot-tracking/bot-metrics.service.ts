import { Injectable, Logger } from '@nestjs/common';
import { BotTrackingService } from './bot-tracking.service';
import { BotMetricsSummary } from './entities/bot-message-log.entity';

@Injectable()
export class BotMetricsService {
  private readonly logger = new Logger(BotMetricsService.name);

  constructor(private botTrackingService: BotTrackingService) {}

  /**
   * Get complete metrics summary for an organization
   */
  async getMetricsSummary(
    organizationId: string,
    period: 'day' | 'week' | 'month' | 'all' = 'all',
  ): Promise<BotMetricsSummary> {
    const { startDate, endDate } = this.getPeriodDates(period);

    this.logger.log(
      `Calculating metrics for org ${organizationId}, period: ${period}`,
    );

    // Get all logs for the period
    const logs = await this.botTrackingService.getMessageLogs(organizationId, {
      startDate,
      endDate,
    });

    // Calculate message counts
    const totalMessages = logs.length;
    const inboundMessages = logs.filter((l) => l.direction === 'inbound').length;
    const outboundMessages = logs.filter((l) => l.direction === 'outbound').length;

    // Bot performance
    const botProcessedCount = logs.filter((l) => l.botProcessed).length;
    const botRespondedCount = logs.filter((l) => l.botResponded).length;
    const botSkippedCount = logs.filter((l) => l.status === 'skipped').length;
    const botFailedCount = logs.filter((l) => l.status === 'failed').length;

    // Success rate
    const successRate = botProcessedCount > 0
      ? (logs.filter((l) => l.status === 'success').length / botProcessedCount) * 100
      : 0;

    const responseRate = inboundMessages > 0
      ? (botRespondedCount / inboundMessages) * 100
      : 0;

    // Performance metrics
    const processingTimes = logs
      .filter((l) => l.processingTimeMs !== undefined)
      .map((l) => l.processingTimeMs);

    const avgProcessingTimeMs = processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0;

    const maxProcessingTimeMs = processingTimes.length > 0
      ? Math.max(...processingTimes)
      : 0;

    const responseTimes = logs
      .filter((l) => l.responseTimeMs !== undefined)
      .map((l) => l.responseTimeMs);

    const avgResponseTimeMs = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    const maxResponseTimeMs = responseTimes.length > 0
      ? Math.max(...responseTimes)
      : 0;

    // Conversations
    const conversationIds = new Set(
      logs.filter((l) => l.conversationId).map((l) => l.conversationId),
    );
    const totalConversations = conversationIds.size;

    // Active conversations (had activity in last 24 hours)
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLogs = logs.filter((l) => l.createdAt >= last24h);
    const activeConversationIds = new Set(
      recentLogs.filter((l) => l.conversationId).map((l) => l.conversationId),
    );
    const activeConversations = activeConversationIds.size;

    // Errors
    const errorCount = botFailedCount;
    const topErrors = await this.botTrackingService.getErrorStats(
      organizationId,
      startDate,
      endDate,
    );

    const summary: BotMetricsSummary = {
      organizationId,
      period,
      totalMessages,
      inboundMessages,
      outboundMessages,
      botProcessedCount,
      botRespondedCount,
      botSkippedCount,
      botFailedCount,
      successRate: Math.round(successRate * 100) / 100,
      responseRate: Math.round(responseRate * 100) / 100,
      avgProcessingTimeMs: Math.round(avgProcessingTimeMs),
      avgResponseTimeMs: Math.round(avgResponseTimeMs),
      maxProcessingTimeMs: Math.round(maxProcessingTimeMs),
      maxResponseTimeMs: Math.round(maxResponseTimeMs),
      totalConversations,
      activeConversations,
      errorCount,
      topErrors: topErrors.slice(0, 5), // Top 5 errors
      periodStart: startDate,
      periodEnd: endDate,
      generatedAt: new Date(),
    };

    this.logger.log(
      `Metrics calculated: ${totalMessages} messages, ${successRate.toFixed(1)}% success rate`,
    );

    return summary;
  }

  /**
   * Get period date range
   */
  private getPeriodDates(
    period: 'day' | 'week' | 'month' | 'all',
  ): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = new Date(0); // Beginning of time
        break;
    }

    return { startDate, endDate: now };
  }

  /**
   * Get metrics by agent type
   */
  async getMetricsByAgentType(
    organizationId: string,
    period: 'day' | 'week' | 'month' | 'all' = 'all',
  ): Promise<Map<string, any>> {
    const { startDate, endDate } = this.getPeriodDates(period);

    const logs = await this.botTrackingService.getMessageLogs(organizationId, {
      startDate,
      endDate,
    });

    const metricsByType = new Map<string, any>();

    // Group by agent type
    const agentTypes = new Set(
      logs.filter((l) => l.agentType).map((l) => l.agentType),
    );

    agentTypes.forEach((agentType) => {
      const typeLogs = logs.filter((l) => l.agentType === agentType);
      const successCount = typeLogs.filter((l) => l.status === 'success').length;

      metricsByType.set(agentType, {
        totalMessages: typeLogs.length,
        successCount,
        successRate: typeLogs.length > 0
          ? (successCount / typeLogs.length) * 100
          : 0,
        avgProcessingTimeMs: this.calculateAvgProcessingTime(typeLogs),
      });
    });

    return metricsByType;
  }

  /**
   * Calculate average processing time from logs
   */
  private calculateAvgProcessingTime(logs: any[]): number {
    const times = logs
      .filter((l) => l.processingTimeMs !== undefined)
      .map((l) => l.processingTimeMs);

    if (times.length === 0) return 0;

    return Math.round(times.reduce((sum, time) => sum + time, 0) / times.length);
  }
}
