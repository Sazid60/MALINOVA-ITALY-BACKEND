import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { LeadsService } from './leads.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  async findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.leadsService.findAll(type, status, search);
  }

  @Get('export')
  async export(
    @Res({ passthrough: true }) res: Response,
    @Query('format') format = 'xlsx',
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const { buffer, mime, ext } = await this.leadsService.export(
      type,
      status,
      search,
      format,
    );
    res.setHeader('Content-Type', mime);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="leads-${Date.now()}.${ext}"`,
    );
    return new StreamableFile(buffer);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.leadsService.findOne(id);
  }

  @Post('inquiry')
  @Public()
  async createInquiry(@Body() body: any) {
    return this.leadsService.createInquiry(body);
  }

  @Post('free-trial')
  @Public()
  async createFreeTrial(@Body() body: { lead: any; assets?: any[] }) {
    return this.leadsService.createFreeTrial(body.lead, body.assets);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.leadsService.updateLead(id, body);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string; notes?: string; adminUserId?: number },
  ) {
    return this.leadsService.updateStatus(id, body.status, body.adminUserId, body.notes);
  }

  @Post(':id/notes')
  async addNote(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { notes: string; adminUserId?: number },
  ) {
    return this.leadsService.addNote(id, body.notes, body.adminUserId);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.leadsService.remove(id);
  }
}