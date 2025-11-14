import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get()
  async findAll(@Request() req, @Query() filters: any) {
    return this.messagesService.findAll(req.user.organizationId, filters);
  }

  @Get('stats')
  async getStats(@Request() req, @Query() dateRange?: any) {
    return this.messagesService.getStats(req.user.organizationId, dateRange);
  }

  @Get('conversation/:contactId')
  async getConversation(@Param('contactId') contactId: string, @Request() req) {
    return this.messagesService.getConversation(contactId, req.user.organizationId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.messagesService.findOne(id, req.user.organizationId);
  }

  @Post()
  async create(@Request() req, @Body() data: any) {
    return this.messagesService.create(req.user.organizationId, data);
  }

  @Post('send')
  async sendMessage(@Request() req, @Body() data: { contactId: string; message: string }) {
    // This will be implemented with WhatsApp integration
    return {
      success: true,
      message: 'Message sending will be implemented with WhatsApp module',
    };
  }
}
