import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BotMetricsService } from './bot-metrics.service';
import { BotTrackingService } from './bot-tracking.service';
import { GetMetricsDto } from './dto/track-message.dto';

@Controller('bot-tracking')
@UseGuards(JwtAuthGuard)
export class BotTrackingController {
  private readonly logger = new Logger(BotTrackingController.name);

  constructor(
    private botMetricsService: BotMetricsService,
    private botTrackingService: BotTrackingService,
  ) {}

  /**
   * Get bot metrics summary
   * GET /bot-tracking/metrics?period=day
   */
  @Get('metrics')
  async getMetrics(@Request() req, @Query('period') period?: string) {
    const organizationId = req.user.organizationId;
    const validPeriod = ['day', 'week', 'month', 'all'].includes(period)
      ? (period as 'day' | 'week' | 'month' | 'all')
      : 'all';

    this.logger.log(`Getting metrics for org ${organizationId}, period: ${validPeriod}`);

    return this.botMetricsService.getMetricsSummary(organizationId, validPeriod);
  }

  /**
   * Get metrics by agent type
   * GET /bot-tracking/metrics/by-agent-type?period=week
   */
  @Get('metrics/by-agent-type')
  async getMetricsByAgentType(@Request() req, @Query('period') period?: string) {
    const organizationId = req.user.organizationId;
    const validPeriod = ['day', 'week', 'month', 'all'].includes(period)
      ? (period as 'day' | 'week' | 'month' | 'all')
      : 'all';

    const metricsMap = await this.botMetricsService.getMetricsByAgentType(
      organizationId,
      validPeriod,
    );

    // Convert Map to object for JSON response
    const metrics = {};
    metricsMap.forEach((value, key) => {
      metrics[key] = value;
    });

    return metrics;
  }

  /**
   * Get message logs
   * GET /bot-tracking/logs?limit=50&offset=0&status=success
   */
  @Get('logs')
  async getMessageLogs(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('status') status?: string,
  ) {
    const organizationId = req.user.organizationId;

    return this.botTrackingService.getMessageLogs(organizationId, {
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
      status,
    });
  }

  /**
   * Get conversation logs
   * GET /bot-tracking/conversation/:conversationId
   */
  @Get('conversation/:conversationId')
  async getConversationLogs(
    @Request() req,
    @Query('conversationId') conversationId: string,
  ) {
    return this.botTrackingService.getMessageLogsByConversation(conversationId);
  }

  /**
   * Get success rate
   * GET /bot-tracking/success-rate?period=week
   */
  @Get('success-rate')
  async getSuccessRate(@Request() req, @Query('period') period?: string) {
    const organizationId = req.user.organizationId;
    const { startDate, endDate } = this.getPeriodDates(
      period as 'day' | 'week' | 'month' | 'all',
    );

    const successRate = await this.botTrackingService.getSuccessRate(
      organizationId,
      startDate,
      endDate,
    );

    return {
      organizationId,
      period: period || 'all',
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  /**
   * Helper to get period dates
   */
  private getPeriodDates(
    period: 'day' | 'week' | 'month' | 'all' = 'all',
  ): { startDate?: Date; endDate?: Date } {
    const now = new Date();
    let startDate: Date | undefined;

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
        startDate = undefined;
        break;
    }

    return { startDate, endDate: now };
  }
}
