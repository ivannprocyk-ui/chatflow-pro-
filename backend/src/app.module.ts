import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ContactsModule } from './contacts/contacts.module';
import { MessagesModule } from './messages/messages.module';
import { AIModule } from './ai/ai.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { BotConfigModule } from './bot-config/bot-config.module';
import { EvolutionApiModule } from './evolution-api/evolution-api.module';
import { ChatWootModule } from './chatwoot/chatwoot.module';
import { BotTrackingModule } from './bot-tracking/bot-tracking.module';
import { FollowUpsModule } from './follow-ups/follow-ups.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    OrganizationsModule,
    ContactsModule,
    MessagesModule,
    AIModule,
    WhatsAppModule,
    BotConfigModule,
    EvolutionApiModule,
    ChatWootModule,
    BotTrackingModule,
    FollowUpsModule,
    WebhooksModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
