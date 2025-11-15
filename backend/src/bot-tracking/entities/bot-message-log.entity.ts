/**
 * Bot Message Log Entity
 * Stores metadata about bot messages (NOT the actual message content for privacy)
 */
export interface BotMessageLog {
  id: string;
  organizationId: string;

  // Message metadata (NO content for privacy)
  messageId?: string; // External message ID from ChatWoot/WhatsApp
  conversationId?: string; // ChatWoot conversation ID
  inboxId?: string; // ChatWoot inbox ID
  direction: 'inbound' | 'outbound';

  // Bot processing data
  botEnabled: boolean; // Was bot enabled when message was received?
  botProcessed: boolean; // Did bot process this message?
  botResponded: boolean; // Did bot send a response?

  // Performance metrics
  processingTimeMs?: number; // Time to generate AI response
  responseTimeMs?: number; // Total time from receive to send

  // AI data (NO prompts or actual content)
  aiProvider?: string; // 'flowise', 'openai', etc.
  aiModel?: string; // Model used (e.g., 'grok-1')
  agentType?: string; // 'vendedor', 'asistente', 'secretaria', 'custom'

  // Status tracking
  status: 'pending' | 'success' | 'failed' | 'skipped';
  errorMessage?: string;
  errorCode?: string;

  // Timestamps
  receivedAt: Date;
  processedAt?: Date;
  sentAt?: Date;

  createdAt: Date;
}

/**
 * Bot Metrics Summary
 * Aggregated statistics for dashboard
 */
export interface BotMetricsSummary {
  organizationId: string;
  period: 'day' | 'week' | 'month' | 'all';

  // Message counts
  totalMessages: number;
  inboundMessages: number;
  outboundMessages: number;

  // Bot performance
  botProcessedCount: number;
  botRespondedCount: number;
  botSkippedCount: number;
  botFailedCount: number;

  // Success rate
  successRate: number; // Percentage of successful responses
  responseRate: number; // Percentage of messages that got a response

  // Performance metrics
  avgProcessingTimeMs: number;
  avgResponseTimeMs: number;
  maxProcessingTimeMs: number;
  maxResponseTimeMs: number;

  // Conversations
  totalConversations: number;
  activeConversations: number;

  // Errors
  errorCount: number;
  topErrors: Array<{ code: string; count: number }>;

  // Timestamps
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Date;
}
