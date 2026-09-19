import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeoMetadata } from './entities/seo-metadata.entity';
import { RedirectRule } from './entities/redirect-rule.entity';
import { SitemapConfig } from './entities/sitemap-config.entity';
import { SeoService } from './seo.service';
import { SeoController } from './seo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SeoMetadata, RedirectRule, SitemapConfig])],
  controllers: [SeoController],
  providers: [SeoService],
  exports: [SeoService],
})
export class SeoModule {}
