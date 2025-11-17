import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { BotConfig } from './entities/bot-config.entity';
import { CreateBotConfigDto } from './dto/create-bot-config.dto';
import { UpdateBotConfigDto } from './dto/update-bot-config.dto';
import { SUPABASE_CLIENT } from '../database/database.module';

@Injectable()
export class BotConfigService {
  private readonly logger = new Logger(BotConfigService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  /**
   * Create or update bot configuration for an organization
   */
  async upsert(createDto: CreateBotConfigDto): Promise<BotConfig> {
    // Check if config already exists for this organization
    const { data: existingConfig } = await this.supabase
      .from('bot_configs')
      .select('*')
      .eq('organization_id', createDto.organizationId)
      .single();

    if (existingConfig) {
      // Update existing
      this.logger.log(`Updating bot config for org ${createDto.organizationId}`);
      return this.update(createDto.organizationId, createDto);
    } else {
      // Create new
      const newConfig = {
        id: uuidv4(),
        organization_id: createDto.organizationId,
        connection_type: createDto.connectionType || 'evolution_api',
        connection_status: 'disconnected',
        evolution_api_url: createDto.evolutionApiUrl,
        evolution_instance_name: createDto.evolutionInstanceName,
        evolution_api_key: createDto.evolutionApiKey,
        meta_business_account_id: createDto.metaBusinessAccountId,
        meta_access_token: createDto.metaAccessToken,
        meta_phone_number_id: createDto.metaPhoneNumberId,
        chatwoot_inbox_id: createDto.chatwootInboxId,
        agent_type: createDto.agentType || 'asistente',
        business_name: createDto.businessName,
        business_description: createDto.businessDescription,
        products: createDto.products,
        business_hours: createDto.businessHours,
        language: createDto.language || 'es',
        tone: createDto.tone || 'casual',
        custom_prompt: createDto.customPrompt,
        flowise_url: createDto.flowiseUrl,
        flowise_api_key: createDto.flowiseApiKey,
        bot_enabled: createDto.botEnabled || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: createdConfig, error } = await this.supabase
        .from('bot_configs')
        .insert(newConfig)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create bot config: ${error.message}`);
      }

      this.logger.log(`Created bot config for org ${createDto.organizationId}`);
      return this.mapDbConfigToConfig(createdConfig);
    }
  }

  /**
   * Find bot config by organization ID
   */
  async findByOrganizationId(organizationId: string): Promise<BotConfig | null> {
    const { data: config, error } = await this.supabase
      .from('bot_configs')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error || !config) {
      return null;
    }

    return this.mapDbConfigToConfig(config);
  }

  /**
   * Find bot config by ChatWoot inbox ID
   */
  async findByInboxId(inboxId: string): Promise<BotConfig | null> {
    const { data: config, error } = await this.supabase
      .from('bot_configs')
      .select('*')
      .eq('chatwoot_inbox_id', inboxId)
      .single();

    if (error || !config) {
      return null;
    }

    return this.mapDbConfigToConfig(config);
  }

  /**
   * Update bot configuration
   */
  async update(
    organizationId: string,
    updateDto: UpdateBotConfigDto,
  ): Promise<BotConfig> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updateDto.connectionType !== undefined) updateData.connection_type = updateDto.connectionType;
    if (updateDto.evolutionApiUrl !== undefined) updateData.evolution_api_url = updateDto.evolutionApiUrl;
    if (updateDto.evolutionInstanceName !== undefined) updateData.evolution_instance_name = updateDto.evolutionInstanceName;
    if (updateDto.evolutionApiKey !== undefined) updateData.evolution_api_key = updateDto.evolutionApiKey;
    if (updateDto.metaBusinessAccountId !== undefined) updateData.meta_business_account_id = updateDto.metaBusinessAccountId;
    if (updateDto.metaAccessToken !== undefined) updateData.meta_access_token = updateDto.metaAccessToken;
    if (updateDto.metaPhoneNumberId !== undefined) updateData.meta_phone_number_id = updateDto.metaPhoneNumberId;
    if (updateDto.chatwootInboxId !== undefined) updateData.chatwoot_inbox_id = updateDto.chatwootInboxId;
    if (updateDto.agentType !== undefined) updateData.agent_type = updateDto.agentType;
    if (updateDto.businessName !== undefined) updateData.business_name = updateDto.businessName;
    if (updateDto.businessDescription !== undefined) updateData.business_description = updateDto.businessDescription;
    if (updateDto.products !== undefined) updateData.products = updateDto.products;
    if (updateDto.businessHours !== undefined) updateData.business_hours = updateDto.businessHours;
    if (updateDto.language !== undefined) updateData.language = updateDto.language;
    if (updateDto.tone !== undefined) updateData.tone = updateDto.tone;
    if (updateDto.customPrompt !== undefined) updateData.custom_prompt = updateDto.customPrompt;
    if (updateDto.flowiseUrl !== undefined) updateData.flowise_url = updateDto.flowiseUrl;
    if (updateDto.flowiseApiKey !== undefined) updateData.flowise_api_key = updateDto.flowiseApiKey;
    if (updateDto.botEnabled !== undefined) updateData.bot_enabled = updateDto.botEnabled;

    const { data: updatedConfig, error } = await this.supabase
      .from('bot_configs')
      .update(updateData)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error || !updatedConfig) {
      throw new NotFoundException(
        `Bot config not found for organization ${organizationId}`,
      );
    }

    this.logger.log(`Updated bot config for org ${organizationId}`);
    return this.mapDbConfigToConfig(updatedConfig);
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

    const { data: updatedConfig, error } = await this.supabase
      .from('bot_configs')
      .update({
        bot_enabled: !config.botEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to toggle bot: ${error.message}`);
    }

    this.logger.log(
      `Toggled bot for org ${organizationId}: ${!config.botEnabled ? 'ENABLED' : 'DISABLED'}`,
    );

    return this.mapDbConfigToConfig(updatedConfig);
  }

  /**
   * Update connection status
   */
  async updateConnectionStatus(
    organizationId: string,
    status: 'connected' | 'disconnected' | 'connecting',
  ): Promise<BotConfig> {
    const { data: updatedConfig, error } = await this.supabase
      .from('bot_configs')
      .update({
        connection_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error || !updatedConfig) {
      throw new NotFoundException(
        `Bot config not found for organization ${organizationId}`,
      );
    }

    this.logger.log(
      `Updated connection status for org ${organizationId}: ${status}`,
    );

    return this.mapDbConfigToConfig(updatedConfig);
  }

  /**
   * Delete bot configuration
   */
  async delete(organizationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('bot_configs')
      .delete()
      .eq('organization_id', organizationId);

    if (error) {
      throw new NotFoundException(
        `Failed to delete bot config: ${error.message}`,
      );
    }

    this.logger.log(`Deleted bot config for org ${organizationId}`);
  }

  /**
   * Get all bot configs (for admin)
   */
  async findAll(): Promise<BotConfig[]> {
    const { data: configs, error } = await this.supabase
      .from('bot_configs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch bot configs: ${error.message}`);
    }

    return (configs || []).map(this.mapDbConfigToConfig);
  }

  /**
   * Map database bot config (snake_case) to application BotConfig (camelCase)
   */
  private mapDbConfigToConfig(dbConfig: any): BotConfig {
    return {
      id: dbConfig.id,
      organizationId: dbConfig.organization_id,
      connectionType: dbConfig.connection_type,
      connectionStatus: dbConfig.connection_status,
      evolutionApiUrl: dbConfig.evolution_api_url,
      evolutionInstanceName: dbConfig.evolution_instance_name,
      evolutionApiKey: dbConfig.evolution_api_key,
      metaBusinessAccountId: dbConfig.meta_business_account_id,
      metaAccessToken: dbConfig.meta_access_token,
      metaPhoneNumberId: dbConfig.meta_phone_number_id,
      chatwootInboxId: dbConfig.chatwoot_inbox_id,
      agentType: dbConfig.agent_type,
      businessName: dbConfig.business_name,
      businessDescription: dbConfig.business_description,
      products: dbConfig.products,
      businessHours: dbConfig.business_hours,
      language: dbConfig.language,
      tone: dbConfig.tone,
      customPrompt: dbConfig.custom_prompt,
      flowiseUrl: dbConfig.flowise_url,
      flowiseApiKey: dbConfig.flowise_api_key,
      botEnabled: dbConfig.bot_enabled,
      createdAt: new Date(dbConfig.created_at),
      updatedAt: new Date(dbConfig.updated_at),
    };
  }
}
