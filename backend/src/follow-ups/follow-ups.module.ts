import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FollowUpsService } from './follow-ups.service';
import { FollowUpsController } from './follow-ups.controller';
import { AIModule } from '../ai/ai.module';
import { ChatWootModule } from '../chatwoot/chatwoot.module';
import { BotConfigModule } from '../bot-config/bot-config.module';

@Module({
  imports: [HttpModule, AIModule, ChatWootModule, BotConfigModule],
  controllers: [FollowUpsController],
  providers: [FollowUpsService],
  exports: [FollowUpsService],
})
export class FollowUpsModule {}
