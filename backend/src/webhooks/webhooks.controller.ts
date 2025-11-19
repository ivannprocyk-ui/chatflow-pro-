import { Controller, Post, Body, Logger, Param, HttpCode } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private webhooksService: WebhooksService) {}

  /**
   * Evolution API webhook endpoint
   * URL: /webhooks/evolution/:organizationId
   */
  @Post('evolution/:organizationId')
  @HttpCode(200)
  async handleEvolution(
    @Param('organizationId') organizationId: string,
    @Body() payload: any,
  ) {
    this.logger.log(`Received Evolution API webhook for org ${organizationId}`);

    // Add organizationId to payload
    payload.organizationId = organizationId;

    return this.webhooksService.handleEvolutionWebhook(payload);
  }

  /**
   * Legacy Evolution API webhook (without org ID in path)
   * Tries to extract org ID from instance name
   */
  @Post('evolution')
  @HttpCode(200)
  async handleEvolutionLegacy(@Body() payload: any) {
    this.logger.log('Received Evolution API webhook (legacy endpoint)');
    return this.webhooksService.handleEvolutionWebhook(payload);
  }

  /**
   * Meta WhatsApp API webhook endpoint
   * URL: /webhooks/evolution/:organizationId
   */
  @Post('meta/:organizationId')
  @HttpCode(200)
  async handleMeta(
    @Param('organizationId') organizationId: string,
    @Body() payload: any,
  ) {
    this.logger.log(`Received Meta WhatsApp webhook for org ${organizationId}`);

    // TODO: Implement Meta API webhook handler
    return {
      success: true,
      message: 'Meta webhook received',
      organizationId,
    };
  }

  /**
   * Chatwoot webhook endpoint
   * URL: /webhooks/chatwoot/:organizationId
   */
  @Post('chatwoot/:organizationId')
  @HttpCode(200)
  async handleChatWoot(
    @Param('organizationId') organizationId: string,
    @Body() payload: any,
  ) {
    this.logger.log(`ChatWoot webhook - Event: ${payload.event} for org ${organizationId}`);

    // Add organizationId to payload
    payload.organizationId = organizationId;

    return this.webhooksService.handleChatWootWebhook(payload);
  }

  /**
   * Legacy Chatwoot webhook (without org ID in path)
   */
  @Post('chatwoot')
  @HttpCode(200)
  async handleChatWootLegacy(@Body() payload: any) {
    this.logger.log(`ChatWoot webhook - Event: ${payload.event} (legacy endpoint)`);
    return this.webhooksService.handleChatWootWebhook(payload);
  }
}
