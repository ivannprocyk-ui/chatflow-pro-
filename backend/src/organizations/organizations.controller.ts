import { Controller, Get, Put, Body, UseGuards, Request, Param } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  @Get('me')
  async getMyOrganization(@Request() req) {
    return this.organizationsService.findOne(req.user.organizationId);
  }

  @Put('me')
  async updateMyOrganization(@Request() req, @Body() data: any) {
    return this.organizationsService.update(req.user.organizationId, data);
  }

  @Get(':id')
  async getOrganization(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }
}
