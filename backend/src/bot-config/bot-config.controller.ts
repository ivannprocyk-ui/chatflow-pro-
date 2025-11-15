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
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BotConfigService } from './bot-config.service';
import { CreateBotConfigDto } from './dto/create-bot-config.dto';
import { UpdateBotConfigDto } from './dto/update-bot-config.dto';

@Controller('api/bot-config')
@UseGuards(JwtAuthGuard)
export class BotConfigController {
  constructor(private readonly botConfigService: BotConfigService) {}

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
