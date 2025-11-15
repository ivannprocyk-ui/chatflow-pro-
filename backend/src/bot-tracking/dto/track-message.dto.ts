import { IsString, IsNotEmpty, IsBoolean, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class TrackMessageDto {
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @IsString()
  @IsOptional()
  messageId?: string;

  @IsString()
  @IsOptional()
  conversationId?: string;

  @IsString()
  @IsOptional()
  inboxId?: string;

  @IsEnum(['inbound', 'outbound'])
  @IsNotEmpty()
  direction: 'inbound' | 'outbound';

  @IsBoolean()
  @IsNotEmpty()
  botEnabled: boolean;

  @IsBoolean()
  @IsNotEmpty()
  botProcessed: boolean;

  @IsBoolean()
  @IsNotEmpty()
  botResponded: boolean;

  @IsNumber()
  @IsOptional()
  processingTimeMs?: number;

  @IsNumber()
  @IsOptional()
  responseTimeMs?: number;

  @IsString()
  @IsOptional()
  aiProvider?: string;

  @IsString()
  @IsOptional()
  aiModel?: string;

  @IsString()
  @IsOptional()
  agentType?: string;

  @IsEnum(['pending', 'success', 'failed', 'skipped'])
  @IsNotEmpty()
  status: 'pending' | 'success' | 'failed' | 'skipped';

  @IsString()
  @IsOptional()
  errorMessage?: string;

  @IsString()
  @IsOptional()
  errorCode?: string;
}

export class GetMetricsDto {
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @IsEnum(['day', 'week', 'month', 'all'])
  @IsOptional()
  period?: 'day' | 'week' | 'month' | 'all';

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;
}
