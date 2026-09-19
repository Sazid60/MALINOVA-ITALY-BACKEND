import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { User } from '../users/user.entity';
import { RolePermission } from '../roles/role-permission.entity';
import { UserPermission } from '../users/user-permission.entity';
import { Lead } from '../leads/entities/lead.entity';
import { Job } from '../careers/entities/job.entity';
import { JobApplicant } from '../careers/entities/job-applicant.entity';
import { Blog } from '../cms/blog.entity';
import { Portfolio } from '../portfolio/entities/portfolio.entity';
import { ProductSaas } from '../products-saas/entities/product-saas.entity';
import { Testimonial } from '../testimonials/entities/testimonial.entity';
import { Partner } from '../partners/entities/partner.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      RolePermission,
      UserPermission,
      Lead,
      Job,
      JobApplicant,
      Blog,
      Portfolio,
      ProductSaas,
      Testimonial,
      Partner,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}