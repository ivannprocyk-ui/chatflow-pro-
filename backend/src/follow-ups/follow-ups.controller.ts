import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { FollowUpsService } from './follow-ups.service';
import { CreateSequenceDto } from './dto/create-sequence.dto';
import { UpdateSequenceDto } from './dto/update-sequence.dto';
import { StartExecutionDto } from './dto/start-execution.dto';

@Controller('follow-ups')
export class FollowUpsController {
  constructor(private readonly followUpsService: FollowUpsService) {}

  // =====================================================
  // SECUENCIAS
  // =====================================================

  @Post('sequences')
  async createSequence(@Request() req: any, @Body() dto: CreateSequenceDto) {
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    return this.followUpsService.createSequence(organizationId, dto);
  }

  @Get('sequences')
  async getAllSequences(@Request() req: any) {
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    return this.followUpsService.findAllSequences(organizationId);
  }

  @Get('sequences/:id')
  async getSequence(@Request() req: any, @Param('id') id: string) {
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    return this.followUpsService.findOneSequence(id, organizationId);
  }

  @Put('sequences/:id')
  async updateSequence(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateSequenceDto,
  ) {
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    return this.followUpsService.updateSequence(id, organizationId, dto);
  }

  @Delete('sequences/:id')
  async deleteSequence(@Request() req: any, @Param('id') id: string) {
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    await this.followUpsService.removeSequence(id, organizationId);
    return { message: 'Sequence deleted successfully' };
  }

  @Get('sequences/:id/stats')
  async getSequenceStats(@Request() req: any, @Param('id') id: string) {
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    return this.followUpsService.getSequenceStats(id, organizationId);
  }

  // =====================================================
  // EJECUCIONES
  // =====================================================

  @Post('executions/start')
  async startExecution(@Request() req: any, @Body() dto: StartExecutionDto) {
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    return this.followUpsService.startExecution(organizationId, dto);
  }

  @Get('executions')
  async getAllExecutions(@Request() req: any, @Query() filters: any) {
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    return this.followUpsService.findAllExecutions(organizationId, filters);
  }

  @Put('executions/:id/cancel')
  async cancelExecution(@Request() req: any, @Param('id') id: string) {
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    await this.followUpsService.cancelExecution(id, organizationId);
    return { message: 'Execution cancelled successfully' };
  }

  @Put('executions/:id/convert')
  async markAsConverted(@Request() req: any, @Param('id') id: string) {
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];
    await this.followUpsService.markAsConverted(id, organizationId);
    return { message: 'Execution marked as converted' };
  }

  // =====================================================
  // PROCESAMIENTO MANUAL
  // =====================================================

  @Post('process-pending')
  async processPending() {
    await this.followUpsService.processPendingExecutions();
    return { message: 'Processing pending executions' };
  }
}
