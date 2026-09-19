import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // Technologies API
  @Get('technologies')
  async findAllTechnologies(@Query('category') category?: string) {
    return this.settingsService.findAllTechnologies(category);
  }

  @Post('technologies')
  async createTechnology(@Body() body: any) {
    return this.settingsService.createTechnology(body);
  }

  @Put('technologies/:id')
  async updateTechnology(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.settingsService.updateTechnology(id, body);
  }

  @Delete('technologies/:id')
  async removeTechnology(@Param('id', ParseIntPipe) id: number) {
    return this.settingsService.removeTechnology(id);
  }

  // Company Overview Settings API
  @Get('company')
  async getCompanySettings() {
    return this.settingsService.getCompanySettings();
  }

  @Put('company')
  async updateCompanySettings(@Body() body: any) {
    return this.settingsService.updateCompanySettings(body);
  }
}
