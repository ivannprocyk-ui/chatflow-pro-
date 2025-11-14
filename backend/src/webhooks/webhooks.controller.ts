import { Controller, Post, Body, Logger } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private webhooksService: WebhooksService) {}

  @Post('evolution')
  async handleEvolution(@Body() payload: any) {
    this.logger.log('Received Evolution API webhook');
    return this.webhooksService.handleEvolutionWebhook(payload);
  }

  @Post('meta')
  async handleMeta(@Body() payload: any) {
    this.logger.log('Received Meta WhatsApp webhook');
    // Meta webhook implementation
    return {
      success: true,
      message: 'Meta webhook received',
    };
  }
}
