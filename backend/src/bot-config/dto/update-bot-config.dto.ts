import { PartialType } from '@nestjs/mapped-types';
import { CreateBotConfigDto } from './create-bot-config.dto';

export class UpdateBotConfigDto extends PartialType(CreateBotConfigDto) {}
