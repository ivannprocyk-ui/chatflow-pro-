import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { ContactsModule } from '../contacts/contacts.module';
import { MessagesModule } from '../messages/messages.module';
import { AIModule } from '../ai/ai.module';
import { WhatsAppModule} from '../whatsapp/whatsapp.module';
import { ChatWootModule } from '../chatwoot/chatwoot.module';

@Module({
  imports: [ContactsModule, MessagesModule, AIModule, WhatsAppModule, ChatWootModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
