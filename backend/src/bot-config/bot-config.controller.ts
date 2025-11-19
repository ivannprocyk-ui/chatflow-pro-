import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BotConfigService } from './bot-config.service';
import { EvolutionApiService } from '../evolution-api/evolution-api.service';
import { CreateBotConfigDto } from './dto/create-bot-config.dto';
import { UpdateBotConfigDto } from './dto/update-bot-config.dto';

@Controller('api/bot-config')
@UseGuards(JwtAuthGuard)
export class BotConfigController {
  private readonly logger = new Logger(BotConfigController.name);

  constructor(
    private readonly botConfigService: BotConfigService,
    private readonly evolutionApiService: EvolutionApiService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get bot configuration for current organization
   * GET /api/bot-config
   */
  @Get()
  async getConfig(@Request() req) {
    const organizationId = req.user.organizationId;
    const config = await this.botConfigService.findByOrganizationId(organizationId);

    if (!config) {
      return {
        exists: false,
        config: null,
      };
    }

    return {
      exists: true,
      config: this.sanitizeConfig(config),
    };
  }

  /**
   * Create or update bot configuration
   * POST /api/bot-config
   */
  @Post()
  async upsertConfig(@Request() req, @Body() createDto: CreateBotConfigDto) {
    // Ensure organizationId matches authenticated user
    createDto.organizationId = req.user.organizationId;

    const config = await this.botConfigService.upsert(createDto);

    return {
      success: true,
      config: this.sanitizeConfig(config),
    };
  }

  /**
   * Update bot configuration
   * PUT /api/bot-config
   */
  @Put()
  async updateConfig(@Request() req, @Body() updateDto: UpdateBotConfigDto) {
    const organizationId = req.user.organizationId;
    const config = await this.botConfigService.update(organizationId, updateDto);

    return {
      success: true,
      config: this.sanitizeConfig(config),
    };
  }

  /**
   * Toggle bot enabled/disabled
   * PATCH /api/bot-config/toggle
   */
  @Patch('toggle')
  async toggleBot(@Request() req) {
    const organizationId = req.user.organizationId;
    const config = await this.botConfigService.toggleBot(organizationId);

    return {
      success: true,
      botEnabled: config.botEnabled,
      config: this.sanitizeConfig(config),
    };
  }

  /**
   * Update connection status
   * PATCH /api/bot-config/connection-status
   */
  @Patch('connection-status')
  async updateConnectionStatus(
    @Request() req,
    @Body() body: { status: 'connected' | 'disconnected' | 'connecting' },
  ) {
    const organizationId = req.user.organizationId;
    const config = await this.botConfigService.updateConnectionStatus(
      organizationId,
      body.status,
    );

    return {
      success: true,
      connectionStatus: config.connectionStatus,
      config: this.sanitizeConfig(config),
    };
  }

  /**
   * Delete bot configuration
   * DELETE /api/bot-config
   */
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteConfig(@Request() req) {
    const organizationId = req.user.organizationId;
    await this.botConfigService.delete(organizationId);
  }

  /**
   * Connect WhatsApp automatically
   * POST /api/bot-config/connect
   *
   * Backend creates Evolution API instance automatically using global credentials
   */
  @Post('connect')
  async connectWhatsApp(@Request() req) {
    const organizationId = req.user.organizationId;

    try {
      this.logger.log(`Connecting WhatsApp for organization ${organizationId}`);

      // Get global Evolution API credentials from environment
      const evolutionApiUrl = this.configService.get<string>('EVOLUTION_API_URL');
      const evolutionApiKey = this.configService.get<string>('EVOLUTION_API_KEY');
      const backendUrl = this.configService.get<string>('BACKEND_URL') || 'http://localhost:3001';

      if (!evolutionApiUrl || !evolutionApiKey) {
        throw new Error('Evolution API not configured. Please set EVOLUTION_API_URL and EVOLUTION_API_KEY in .env');
      }

      // Create instance name based on organization ID
      const instanceName = `org-${organizationId}`;
      const webhookUrl = `${backendUrl}/api/webhooks/evolution/${organizationId}`;

      this.logger.log(`Creating instance ${instanceName} with webhook ${webhookUrl}`);

      // Create instance in Evolution API
      await this.evolutionApiService.createInstance({
        apiUrl: evolutionApiUrl,
        instanceName,
        apiKey: evolutionApiKey,
      });

      // Set webhook for this instance
      await this.evolutionApiService.setWebhook(
        evolutionApiUrl,
        instanceName,
        evolutionApiKey,
        webhookUrl,
      );

      // Wait a moment for instance to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get QR code
      const qrData = await this.evolutionApiService.fetchQRCode(
        evolutionApiUrl,
        instanceName,
        evolutionApiKey,
      );

      // Update bot config with instance name and set status to connecting
      await this.botConfigService.updateConnectionStatus(organizationId, 'connecting');

      this.logger.log(`QR code generated for organization ${organizationId}`);

      return {
        success: true,
        qrcode: qrData.qrcode,
        code: qrData.code,
        instanceName,
        message: 'Escanea el código QR con tu WhatsApp',
      };
    } catch (error) {
      this.logger.error(`Error connecting WhatsApp for org ${organizationId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get WhatsApp connection status
   * GET /api/bot-config/status
   */
  @Get('status')
  async getConnectionStatus(@Request() req) {
    const organizationId = req.user.organizationId;

    try {
      const evolutionApiUrl = this.configService.get<string>('EVOLUTION_API_URL');
      const evolutionApiKey = this.configService.get<string>('EVOLUTION_API_KEY');

      if (!evolutionApiUrl || !evolutionApiKey) {
        return {
          status: 'disconnected',
          message: 'Evolution API not configured',
        };
      }

      const instanceName = `org-${organizationId}`;

      // Get status from Evolution API
      const statusData = await this.evolutionApiService.getInstanceStatus(
        evolutionApiUrl,
        instanceName,
        evolutionApiKey,
      );

      return {
        status: statusData.status,
        connectedPhone: statusData.connectedPhone,
        instanceName,
      };
    } catch (error) {
      this.logger.error(`Error getting status for org ${organizationId}: ${error.message}`);
      return {
        status: 'disconnected',
        error: error.message,
      };
    }
  }

  /**
   * Disconnect WhatsApp
   * POST /api/bot-config/disconnect
   */
  @Post('disconnect')
  async disconnectWhatsApp(@Request() req) {
    const organizationId = req.user.organizationId;

    try {
      this.logger.log(`Disconnecting WhatsApp for organization ${organizationId}`);

      const evolutionApiUrl = this.configService.get<string>('EVOLUTION_API_URL');
      const evolutionApiKey = this.configService.get<string>('EVOLUTION_API_KEY');

      if (!evolutionApiUrl || !evolutionApiKey) {
        throw new Error('Evolution API not configured');
      }

      const instanceName = `org-${organizationId}`;

      // Disconnect instance
      await this.evolutionApiService.disconnectInstance(
        evolutionApiUrl,
        instanceName,
        evolutionApiKey,
      );

      // Update status in database
      await this.botConfigService.updateConnectionStatus(organizationId, 'disconnected');

      this.logger.log(`WhatsApp disconnected for organization ${organizationId}`);

      return {
        success: true,
        message: 'WhatsApp desconectado correctamente',
      };
    } catch (error) {
      this.logger.error(`Error disconnecting WhatsApp for org ${organizationId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sanitize config (remove sensitive data)
   */
  private sanitizeConfig(config: any) {
    const sanitized = { ...config };

    // Mask sensitive fields
    if (sanitized.evolutionApiKey) {
      sanitized.evolutionApiKey = this.maskSecret(sanitized.evolutionApiKey);
    }
    if (sanitized.metaAccessToken) {
      sanitized.metaAccessToken = this.maskSecret(sanitized.metaAccessToken);
    }
    if (sanitized.flowiseApiKey) {
      sanitized.flowiseApiKey = this.maskSecret(sanitized.flowiseApiKey);
    }

    return sanitized;
  }

  /**
   * Mask secret (show only first 4 and last 4 chars)
   */
  private maskSecret(secret: string): string {
    if (!secret || secret.length < 8) {
      return '••••••••';
    }
    return `${secret.substring(0, 4)}${'•'.repeat(secret.length - 8)}${secret.substring(secret.length - 4)}`;
  }
}
