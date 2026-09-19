import { Controller, Get, Patch, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { NotificationService } from './notification.service';
import { UpdateTemplateDto } from './dto/update-template.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('templates')
  @RequirePermissions('settings.notifications.view')
  @ApiOperation({ summary: 'Get all notification templates grouped by category' })
  async getTemplates() {
    return this.notificationService.getAllTemplates();
  }

  @Get('templates/:id')
  @RequirePermissions('settings.notifications.view')
  @ApiOperation({ summary: 'Get a single notification template by ID' })
  async getTemplate(@Param('id') id: string) {
    return this.notificationService.getTemplateById(Number(id));
  }

  @Patch('templates/:id')
  @RequirePermissions('settings.notifications.manage')
  @ApiOperation({ summary: 'Update notification template body or status' })
  async updateTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.notificationService.updateTemplate(Number(id), dto);
  }

  @Post('templates/:id/reset')
  @RequirePermissions('settings.notifications.manage')
  @ApiOperation({ summary: 'Reset a notification template to default' })
  async resetTemplate(@Param('id') id: string) {
    return this.notificationService.resetTemplateToDefault(Number(id));
  }

  @Get('events')
  @RequirePermissions('settings.notifications.view')
  @ApiOperation({ summary: 'Get all notification events' })
  async getEvents() {
    return this.notificationService.getAllEvents();
  }

  @Get('logs')
  @RequirePermissions('settings.notifications.view')
  @ApiOperation({ summary: 'Get notification delivery logs' })
  async getLogs(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.notificationService.getLogs(Number(page || 1), Number(limit || 50));
  }
}
