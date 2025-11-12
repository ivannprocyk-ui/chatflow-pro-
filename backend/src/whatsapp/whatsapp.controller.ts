import { Controller, Get, Post, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsAppController {
  constructor(private whatsappService: WhatsAppService) {}

  @Post('connect')
  async createConnection(@Request() req) {
    return this.whatsappService.createInstance(req.user.organizationId);
  }

  @Get('qr')
  async getQRCode(@Request() req) {
    return this.whatsappService.getQRCode(req.user.organizationId);
  }

  @Get('status')
  async getStatus(@Request() req) {
    return this.whatsappService.getConnectionStatus(req.user.organizationId);
  }

  @Post('send')
  async sendMessage(@Request() req, @Body() data: { phone: string; message: string }) {
    return this.whatsappService.sendMessage(
      req.user.organizationId,
      data.phone,
      data.message,
    );
  }

  @Delete('disconnect')
  async disconnect(@Request() req) {
    return this.whatsappService.disconnect(req.user.organizationId);
  }
}
