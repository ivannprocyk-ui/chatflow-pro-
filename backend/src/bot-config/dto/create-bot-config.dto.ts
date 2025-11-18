import { IsString, IsBoolean, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateBotConfigDto {
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  // WhatsApp Connection
  @IsEnum(['evolution_api', 'meta_api'])
  connectionType: 'evolution_api' | 'meta_api';

  // Evolution API (optional, required if connectionType = 'evolution_api')
  @IsOptional()
  @IsString()
  evolutionApiUrl?: string;

  @IsOptional()
  @IsString()
  evolutionInstanceName?: string;

  @IsOptional()
  @IsString()
  evolutionApiKey?: string;

  // Meta API (optional, required if connectionType = 'meta_api')
  @IsOptional()
  @IsString()
  metaBusinessAccountId?: string;

  @IsOptional()
  @IsString()
  metaAccessToken?: string;

  @IsOptional()
  @IsString()
  metaPhoneNumberId?: string;

  // ChatWoot
  @IsOptional()
  @IsString()
  chatwootInboxId?: string;

  @IsOptional()
  @IsString()
  chatwootAccountId?: string;

  // Bot Configuration
  @IsEnum(['vendedor', 'asistente', 'secretaria', 'custom'])
  agentType: 'vendedor' | 'asistente' | 'secretaria' | 'custom';

  @IsString()
  @IsNotEmpty()
  businessName: string;

  @IsString()
  @IsNotEmpty()
  businessDescription: string;

  @IsString()
  @IsNotEmpty()
  products: string;

  @IsString()
  @IsNotEmpty()
  businessHours: string;

  @IsEnum(['es', 'en', 'pt'])
  language: 'es' | 'en' | 'pt';

  @IsEnum(['formal', 'casual', 'professional'])
  tone: 'formal' | 'casual' | 'professional';

  @IsOptional()
  @IsString()
  customPrompt?: string;

  // Flowise (optional)
  @IsOptional()
  @IsString()
  flowiseUrl?: string;

  @IsOptional()
  @IsString()
  flowiseApiKey?: string;

  // Bot Status
  @IsBoolean()
  @IsOptional()
  botEnabled?: boolean;

  @IsEnum(['connected', 'disconnected', 'connecting'])
  @IsOptional()
  connectionStatus?: 'connected' | 'disconnected' | 'connecting';
}
