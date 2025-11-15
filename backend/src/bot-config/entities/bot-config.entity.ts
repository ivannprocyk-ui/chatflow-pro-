export interface BotConfig {
  id: string;
  organizationId: string;

  // WhatsApp Connection
  connectionType: 'evolution_api' | 'meta_api';
  connectionStatus: 'connected' | 'disconnected' | 'connecting';

  // Evolution API Configuration
  evolutionApiUrl?: string;
  evolutionInstanceName?: string;
  evolutionApiKey?: string; // Encrypted

  // Meta API Configuration
  metaBusinessAccountId?: string;
  metaAccessToken?: string; // Encrypted
  metaPhoneNumberId?: string;

  // ChatWoot Configuration
  chatwootInboxId?: string;
  chatwootAccountId?: string;

  // Bot Agent Configuration
  agentType: 'vendedor' | 'asistente' | 'secretaria' | 'custom';
  businessName: string;
  businessDescription: string;
  products: string;
  businessHours: string;
  language: 'es' | 'en' | 'pt';
  tone: 'formal' | 'casual' | 'professional';
  customPrompt?: string;

  // Flowise Configuration (optional override per org)
  flowiseUrl?: string;
  flowiseApiKey?: string; // Encrypted

  // Bot Status
  botEnabled: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export type ConnectionType = 'evolution_api' | 'meta_api';
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';
export type AgentType = 'vendedor' | 'asistente' | 'secretaria' | 'custom';
export type Language = 'es' | 'en' | 'pt';
export type Tone = 'formal' | 'casual' | 'professional';
