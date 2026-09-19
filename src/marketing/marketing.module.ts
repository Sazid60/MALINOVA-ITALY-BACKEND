import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketingController } from './marketing.controller';
import { MarketingService } from './marketing.service';
import { Coupon } from './coupon.entity';
import { RolePermission } from '../roles/role-permission.entity';
import { UserPermission } from '../users/user-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon, RolePermission, UserPermission])],
  controllers: [MarketingController],
  providers: [MarketingService],
  exports: [MarketingService],
})
export class MarketingModule {}
