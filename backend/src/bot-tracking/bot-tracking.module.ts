import { Module } from '@nestjs/common';
import { BotTrackingController } from './bot-tracking.controller';
import { BotTrackingService } from './bot-tracking.service';
import { BotMetricsService } from './bot-metrics.service';

@Module({
  controllers: [BotTrackingController],
  providers: [BotTrackingService, BotMetricsService],
  exports: [BotTrackingService, BotMetricsService],
})
export class BotTrackingModule {}
