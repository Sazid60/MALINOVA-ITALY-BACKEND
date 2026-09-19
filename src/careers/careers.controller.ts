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
import { CareersService } from './careers.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('careers')
export class CareersController {
  constructor(private readonly careersService: CareersService) {}

  // Public & Admin Jobs API
  @Get('jobs')
  @Public()
  async findAllJobs(@Query('openOnly') openOnly?: string) {
    return this.careersService.findAllJobs(openOnly === 'true');
  }

  @Get('jobs/:id')
  @Public()
  async findJobById(@Param('id', ParseIntPipe) id: number) {
    return this.careersService.findJobById(id);
  }

  @Post('jobs')
  async createJob(@Body() body: any) {
    return this.careersService.createJob(body);
  }

  @Put('jobs/:id')
  async updateJob(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.careersService.updateJob(id, body);
  }

  @Delete('jobs/:id')
  async removeJob(@Param('id', ParseIntPipe) id: number) {
    return this.careersService.removeJob(id);
  }

  // ATS Applicants API
  @Get('applicants')
  async findAllApplicants(
    @Query('jobId') jobId?: string,
    @Query('channel') channel?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.careersService.findAllApplicants(
      jobId ? parseInt(jobId, 10) : undefined,
      channel,
      status,
      search,
    );
  }

  @Get('applicants/export')
  async exportApplicants(
    @Res({ passthrough: true }) res: Response,
    @Query('format') format = 'xlsx',
    @Query('jobId') jobId?: string,
    @Query('channel') channel?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const { buffer, mime, ext } = await this.careersService.exportApplicants(
      jobId ? parseInt(jobId, 10) : undefined,
      channel,
      status,
      search,
      format,
    );
    res.setHeader('Content-Type', mime);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="applicants-${Date.now()}.${ext}"`,
    );
    return new StreamableFile(buffer);
  }

  @Post('apply')
  @Public()
  async apply(@Body() body: any) {
    return this.careersService.createApplicant(body);
  }

  @Put('applicants/:id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string; notes?: string; userId?: number },
  ) {
    return this.careersService.updateApplicantStatus(id, body.status, body.userId, body.notes);
  }
}