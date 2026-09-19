import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { HeroSection } from './hero-section.entity';
import { HeroMedia } from './hero-media.entity';
import { Blog } from './blog.entity';
import { SiteSetting } from './site-setting.entity';
import { RolePermission } from '../roles/role-permission.entity';
import { UserPermission } from '../users/user-permission.entity';
import { SeoMeta } from '../products/seo-meta.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HeroSection, HeroMedia, Blog, SiteSetting, RolePermission, UserPermission, SeoMeta])],
  controllers: [CmsController],
  providers: [CmsService],
  exports: [CmsService],
})
export class CmsModule {}
