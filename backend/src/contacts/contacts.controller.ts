import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  @Get()
  async findAll(@Request() req, @Query() filters: any) {
    return this.contactsService.findAll(req.user.organizationId, filters);
  }

  @Get('stats')
  async getStats(@Request() req) {
    return this.contactsService.getStats(req.user.organizationId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.contactsService.findOne(id, req.user.organizationId);
  }

  @Post()
  async create(@Request() req, @Body() data: any) {
    return this.contactsService.create(req.user.organizationId, data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Request() req, @Body() data: any) {
    return this.contactsService.update(id, req.user.organizationId, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req) {
    await this.contactsService.delete(id, req.user.organizationId);
    return { success: true };
  }
}
