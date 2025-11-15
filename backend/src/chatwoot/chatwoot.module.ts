import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ChatWootService } from './chatwoot.service';

@Module({
  imports: [HttpModule],
  providers: [ChatWootService],
  exports: [ChatWootService],
})
export class ChatWootModule {}
