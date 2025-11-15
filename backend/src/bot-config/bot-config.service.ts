import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { BotConfig } from './entities/bot-config.entity';
import { CreateBotConfigDto } from './dto/create-bot-config.dto';
import { UpdateBotConfigDto } from './dto/update-bot-config.dto';

@Injectable()
export class BotConfigService {
  private readonly logger = new Logger(BotConfigService.name);

  // In-memory storage (replace with database later)
  private configs: BotConfig[] = [];

  /**
   * Create or update bot configuration for an organization
   */
  async upsert(createDto: CreateBotConfigDto): Promise<BotConfig> {
    const existingConfig = this.configs.find(
      (c) => c.organizationId === createDto.organizationId,
    );

    if (existingConfig) {
      // Update existing
      Object.assign(existingConfig, {
        ...createDto,
        updatedAt: new Date(),
      });
      this.logger.log(`Updated bot config for org ${createDto.organizationId}`);
      return existingConfig;
    } else {
      // Create new
      const newConfig: BotConfig = {
        id: uuidv4(),
        ...createDto,
        connectionStatus: 'disconnected',
        botEnabled: createDto.botEnabled ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.configs.push(newConfig);
      this.logger.log(`Created bot config for org ${createDto.organizationId}`);
      return newConfig;
    }
  }

  /**
   * Find bot config by organization ID
   */
  async findByOrganizationId(organizationId: string): Promise<BotConfig | null> {
    const config = this.configs.find((c) => c.organizationId === organizationId);
    return config || null;
  }

  /**
   * Find bot config by ChatWoot inbox ID
   */
  async findByInboxId(inboxId: string): Promise<BotConfig | null> {
    const config = this.configs.find((c) => c.chatwootInboxId === inboxId);
    return config || null;
  }

  /**
   * Update bot configuration
   */
  async update(
    organizationId: string,
    updateDto: UpdateBotConfigDto,
  ): Promise<BotConfig> {
    const config = await this.findByOrganizationId(organizationId);

    if (!config) {
      throw new NotFoundException(
        `Bot config not found for organization ${organizationId}`,
      );
    }

    Object.assign(config, {
      ...updateDto,
      updatedAt: new Date(),
    });

    this.logger.log(`Updated bot config for org ${organizationId}`);
    return config;
  }

  /**
   * Toggle bot enabled status
   */
  async toggleBot(organizationId: string): Promise<BotConfig> {
    const config = await this.findByOrganizationId(organizationId);

    if (!config) {
      throw new NotFoundException(
        `Bot config not found for organization ${organizationId}`,
      );
    }

    config.botEnabled = !config.botEnabled;
    config.updatedAt = new Date();

    this.logger.log(
      `Toggled bot for org ${organizationId}: ${config.botEnabled ? 'ENABLED' : 'DISABLED'}`,
    );

    return config;
  }

  /**
   * Update connection status
   */
  async updateConnectionStatus(
    organizationId: string,
    status: 'connected' | 'disconnected' | 'connecting',
  ): Promise<BotConfig> {
    const config = await this.findByOrganizationId(organizationId);

    if (!config) {
      throw new NotFoundException(
        `Bot config not found for organization ${organizationId}`,
      );
    }

    config.connectionStatus = status;
    config.updatedAt = new Date();

    this.logger.log(
      `Updated connection status for org ${organizationId}: ${status}`,
    );

    return config;
  }

  /**
   * Delete bot configuration
   */
  async delete(organizationId: string): Promise<void> {
    const index = this.configs.findIndex(
      (c) => c.organizationId === organizationId,
    );

    if (index === -1) {
      throw new NotFoundException(
        `Bot config not found for organization ${organizationId}`,
      );
    }

    this.configs.splice(index, 1);
    this.logger.log(`Deleted bot config for org ${organizationId}`);
  }

  /**
   * Get all bot configs (for admin)
   */
  async findAll(): Promise<BotConfig[]> {
    return this.configs;
  }
}
