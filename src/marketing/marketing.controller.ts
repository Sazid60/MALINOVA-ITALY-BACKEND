import { Controller, Get, Post, Put, Patch, Delete, Param, Body, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { MarketingService } from './marketing.service';
import { Public } from '@/auth/decorators/public.decorator';

@ApiTags('Marketing')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('marketing')
export class MarketingController {
  constructor(private svc: MarketingService) { }

  @Get('coupons')
  @RequirePermissions('marketing.coupons.view')
  @ApiQuery({ name: 'page', required: false })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.svc.findAll(+page, +limit);
  }
  @Public()
  @Post('coupons/validate')
  @ApiOperation({ summary: 'Validate coupon code for an order amount' })
  validate(@Body() body: { code: string; order_amount: number }) {
    return this.svc.validate(body.code, body.order_amount);
  }
  @Get('coupons/:id')
  @RequirePermissions('marketing.coupons.view')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Post('coupons')
  @RequirePermissions('marketing.coupons.manage')
  create(@Body() body: any) {
    return this.svc.create(body);
  }

  @Patch('coupons/:id')
  @RequirePermissions('marketing.coupons.manage')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.update(id, body);
  }

  @Delete('coupons/:id')
  @RequirePermissions('marketing.coupons.manage')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }

}
