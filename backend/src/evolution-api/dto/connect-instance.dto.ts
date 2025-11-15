import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ConnectInstanceDto {
  @IsString()
  @IsNotEmpty()
  instanceName: string;

  @IsString()
  @IsNotEmpty()
  apiUrl: string;

  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @IsOptional()
  @IsString()
  number?: string; // Phone number (optional)

  @IsOptional()
  @IsString()
  webhookUrl?: string; // Webhook URL for this instance
}
