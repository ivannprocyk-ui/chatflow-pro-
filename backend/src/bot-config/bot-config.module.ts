import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotConfigController } from './bot-config.controller';
import { BotConfigService } from './bot-config.service';
import { EvolutionApiModule } from '../evolution-api/evolution-api.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => EvolutionApiModule),
  ],
  controllers: [BotConfigController],
  providers: [BotConfigService],
  exports: [BotConfigService], // Export for use in other modules
})
export class BotConfigModule {}
