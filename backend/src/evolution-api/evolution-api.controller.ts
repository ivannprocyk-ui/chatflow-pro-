import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EvolutionApiService } from './evolution-api.service';
import { BotConfigService } from '../bot-config/bot-config.service';
import { ConnectInstanceDto } from './dto/connect-instance.dto';

@Controller('api/evolution')
@UseGuards(JwtAuthGuard)
export class EvolutionApiController {
  constructor(
    private readonly evolutionService: EvolutionApiService,
    private readonly botConfigService: BotConfigService,
  ) {}

  /**
   * Create Evolution API instance
   * POST /api/evolution/instance
   */
  @Post('instance')
  async createInstance(@Request() req, @Body() dto: ConnectInstanceDto) {
    const organizationId = req.user.organizationId;

    // Create instance in Evolution API
    const result = await this.evolutionService.createInstance(dto);

    // Update bot config with instance details
    const config = await this.botConfigService.findByOrganizationId(organizationId);
    if (config) {
      await this.botConfigService.update(organizationId, {
        evolutionApiUrl: dto.apiUrl,
        evolutionInstanceName: dto.instanceName,
        evolutionApiKey: dto.apiKey,
        connectionStatus: 'connecting',
      });
    }

    return {
      success: true,
      instance: result,
    };
  }

  /**
   * Get QR Code for instance
   * GET /api/evolution/qrcode
   */
  @Get('qrcode')
  async getQRCode(@Request() req) {
    const organizationId = req.user.organizationId;
    const config = await this.botConfigService.findByOrganizationId(organizationId);

    if (!config || !config.evolutionApiUrl || !config.evolutionInstanceName) {
      return {
        success: false,
        message: 'Evolution API not configured',
      };
    }

    const qrcode = await this.evolutionService.fetchQRCode(
      config.evolutionApiUrl,
      config.evolutionInstanceName,
      config.evolutionApiKey || '',
    );

    return {
      success: true,
      qrcode,
    };
  }

  /**
   * Get instance connection status
   * GET /api/evolution/status
   */
  @Get('status')
  async getStatus(@Request() req) {
    const organizationId = req.user.organizationId;
    const config = await this.botConfigService.findByOrganizationId(organizationId);

    if (!config || !config.evolutionApiUrl || !config.evolutionInstanceName) {
      return {
        success: false,
        message: 'Evolution API not configured',
        status: 'disconnected',
      };
    }

    const status = await this.evolutionService.getInstanceStatus(
      config.evolutionApiUrl,
      config.evolutionInstanceName,
      config.evolutionApiKey || '',
    );

    // Update config with latest status
    await this.botConfigService.updateConnectionStatus(
      organizationId,
      status.status,
    );

    return {
      success: true,
      status,
    };
  }

  /**
   * Disconnect instance (logout)
   * POST /api/evolution/disconnect
   */
  @Post('disconnect')
  @HttpCode(HttpStatus.OK)
  async disconnect(@Request() req) {
    const organizationId = req.user.organizationId;
    const config = await this.botConfigService.findByOrganizationId(organizationId);

    if (!config || !config.evolutionApiUrl || !config.evolutionInstanceName) {
      return {
        success: false,
        message: 'Evolution API not configured',
      };
    }

    await this.evolutionService.disconnectInstance(
      config.evolutionApiUrl,
      config.evolutionInstanceName,
      config.evolutionApiKey || '',
    );

    // Update status
    await this.botConfigService.updateConnectionStatus(
      organizationId,
      'disconnected',
    );

    return {
      success: true,
      message: 'Instance disconnected successfully',
    };
  }

  /**
   * Delete instance completely
   * DELETE /api/evolution/instance
   */
  @Delete('instance')
  @HttpCode(HttpStatus.OK)
  async deleteInstance(@Request() req) {
    const organizationId = req.user.organizationId;
    const config = await this.botConfigService.findByOrganizationId(organizationId);

    if (!config || !config.evolutionApiUrl || !config.evolutionInstanceName) {
      return {
        success: false,
        message: 'Evolution API not configured',
      };
    }

    await this.evolutionService.deleteInstance(
      config.evolutionApiUrl,
      config.evolutionInstanceName,
      config.evolutionApiKey || '',
    );

    // Clear Evolution API config
    await this.botConfigService.update(organizationId, {
      evolutionApiUrl: undefined,
      evolutionInstanceName: undefined,
      evolutionApiKey: undefined,
      connectionStatus: 'disconnected',
    });

    return {
      success: true,
      message: 'Instance deleted successfully',
    };
  }

  /**
   * Set webhook for instance
   * POST /api/evolution/webhook
   */
  @Post('webhook')
  async setWebhook(@Request() req, @Body() body: { webhookUrl: string }) {
    const organizationId = req.user.organizationId;
    const config = await this.botConfigService.findByOrganizationId(organizationId);

    if (!config || !config.evolutionApiUrl || !config.evolutionInstanceName) {
      return {
        success: false,
        message: 'Evolution API not configured',
      };
    }

    await this.evolutionService.setWebhook(
      config.evolutionApiUrl,
      config.evolutionInstanceName,
      config.evolutionApiKey || '',
      body.webhookUrl,
    );

    return {
      success: true,
      message: 'Webhook configured successfully',
    };
  }
}
