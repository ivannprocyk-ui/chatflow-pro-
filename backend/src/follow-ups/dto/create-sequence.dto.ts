import { IsString, IsBoolean, IsEnum, IsOptional, IsObject, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TriggerConfig, SequenceConditions } from '../entities/follow-up-sequence.entity';

export class CreateFollowUpMessageDto {
  @IsNumber()
  step_order: number;

  @IsNumber()
  delay_amount: number;

  @IsEnum(['minutes', 'hours', 'days'])
  delay_unit: 'minutes' | 'hours' | 'days';

  @IsString()
  message_template: string;

  @IsEnum(['fixed', 'ai_generated'])
  @IsOptional()
  message_type?: 'fixed' | 'ai_generated';

  @IsString()
  @IsOptional()
  ai_context_instructions?: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  available_variables?: string[];

  @IsObject()
  @IsOptional()
  send_conditions?: any;
}

export class CreateSequenceDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsEnum(['keyword', 'variable', 'conversation_state', 'bot_stage', 'time_based', 'action'])
  trigger_type: 'keyword' | 'variable' | 'conversation_state' | 'bot_stage' | 'time_based' | 'action';

  @IsObject()
  trigger_config: TriggerConfig;

  @IsEnum(['passive', 'moderate', 'aggressive'])
  @IsOptional()
  strategy?: 'passive' | 'moderate' | 'aggressive';

  @IsObject()
  @IsOptional()
  conditions?: SequenceConditions;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFollowUpMessageDto)
  messages: CreateFollowUpMessageDto[];
}
