import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EvolutionApiController } from './evolution-api.controller';
import { EvolutionApiService } from './evolution-api.service';
import { BotConfigModule } from '../bot-config/bot-config.module';

@Module({
  imports: [
    HttpModule,
    forwardRef(() => BotConfigModule), // For accessing bot config
  ],
  controllers: [EvolutionApiController],
  providers: [EvolutionApiService],
  exports: [EvolutionApiService], // Export for use in webhooks module
})
export class EvolutionApiModule {}
