import { Module } from '@nestjs/common';
import { CmsModule } from '../cms/cms.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { SettingsModule } from '../settings/settings.module';
import { TestimonialsModule } from '../testimonials/testimonials.module';
import { PartnersModule } from '../partners/partners.module';
import { CareersModule } from '../careers/careers.module';
import { ProductsSaasModule } from '../products-saas/products-saas.module';
import { ClientController } from './client.controller';

@Module({
  imports: [
    CmsModule,
    SettingsModule,
    PortfolioModule,
    TestimonialsModule,
    PartnersModule,
    CareersModule,
    ProductsSaasModule,
  ],
  controllers: [ClientController],
})
export class ClientModule {}