import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(private aiService: AIService) {}

  @Post('generate-response')
  async generateResponse(
    @Request() req,
    @Body() data: { contactPhone: string; message: string },
  ) {
    const response = await this.aiService.generateResponse(
      req.user.organizationId,
      data.contactPhone,
      data.message,
    );

    return {
      success: true,
      response,
    };
  }

  @Post('test')
  async testPrompt(@Request() req, @Body() data: { message: string }) {
    // For testing AI responses without saving
    const response = await this.aiService.generateResponse(
      req.user.organizationId,
      'test-user',
      data.message,
    );

    return {
      success: true,
      response,
    };
  }
}
