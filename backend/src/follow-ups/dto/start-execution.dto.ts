import { IsString, IsObject, IsOptional } from 'class-validator';
import { ConversationContext, TriggerData } from '../entities/follow-up-execution.entity';

export class StartExecutionDto {
  @IsString()
  sequence_id: string;

  @IsString()
  contact_phone: string;

  @IsString()
  @IsOptional()
  contact_name?: string;

  @IsObject()
  conversation_context: ConversationContext;

  @IsObject()
  trigger_data: TriggerData;
}
