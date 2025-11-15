import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { OrganizationsModule } from '../organizations/organizations.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [HttpModule, OrganizationsModule, MessagesModule],
  providers: [AIService],
  controllers: [AIController],
  exports: [AIService],
})
export class AIModule {}
