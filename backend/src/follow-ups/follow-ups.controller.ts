import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FollowUpsService } from './follow-ups.service';

@Controller('follow-ups')
@UseGuards(JwtAuthGuard)
export class FollowUpsController {
  constructor(private followUpsService: FollowUpsService) {}

  /**
   * Get follow-up configuration for the organization
   */
  @Get('config')
  async getConfig(@Request() req: any) {
    const organizationId = req.user.organizationId;
    const config = await this.followUpsService.getFollowUpConfig(organizationId);

    return {
      config: config || {
        enabled: false,
        waitTimeMinutes: 60,
        maxFollowUps: 3,
        messageType: 'template',
        templateMessage: '¡Hola! ¿Necesitas ayuda con algo más?',
        businessHoursOnly: false,
        businessDaysOnly: false,
      },
    };
  }

  /**
   * Update follow-up configuration
   */
  @Post('config')
  async updateConfig(@Request() req: any, @Body() body: any) {
    const organizationId = req.user.organizationId;

    const config = await this.followUpsService.upsertFollowUpConfig(organizationId, {
      enabled: body.enabled,
      waitTimeMinutes: body.waitTimeMinutes,
      maxFollowUps: body.maxFollowUps,
      messageType: body.messageType,
      templateMessage: body.templateMessage,
      aiPrompt: body.aiPrompt,
      businessHoursOnly: body.businessHoursOnly,
      businessHoursStart: body.businessHoursStart,
      businessHoursEnd: body.businessHoursEnd,
      businessDaysOnly: body.businessDaysOnly,
    });

    return { config };
  }

  /**
   * Toggle follow-ups on/off
   */
  @Patch('config/toggle')
  async toggleConfig(@Request() req: any) {
    const organizationId = req.user.organizationId;

    const current = await this.followUpsService.getFollowUpConfig(organizationId);
    const config = await this.followUpsService.upsertFollowUpConfig(organizationId, {
      enabled: !current?.enabled,
    });

    return { config };
  }
}
