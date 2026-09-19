import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { CmsService } from '../cms/cms.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { SettingsService } from '../settings/settings.service';
import { TestimonialsService } from '../testimonials/testimonials.service';
import { PartnersService } from '../partners/partners.service';
import { CareersService } from '../careers/careers.service';
import { ProductsSaasService } from '../products-saas/products-saas.service';

@Controller('client')
@Public()
export class ClientController {
  constructor(
    private readonly cmsService: CmsService,
    private readonly settingsService: SettingsService,
    private readonly portfolioService: PortfolioService,
    private readonly testimonialsService: TestimonialsService,
    private readonly partnersService: PartnersService,
    private readonly careersService: CareersService,
    private readonly productsSaasService: ProductsSaasService,
  ) {}

  @Get('config')
  @Public()
  async getConfig() {
    return this.settingsService.getCompanySettings();
  }

  @Get('hero')
  @Public()
  async getHero(@Query('page') page = '1', @Query('limit') limit = '10') {
    return this.cmsService.findHero(Number(page), Number(limit));
  }

  @Get('blogs')
  @Public()
  async getBlogs(@Query('page') page = '1', @Query('limit') limit = '10') {
    return this.cmsService.findBlogs(Number(page), Number(limit));
  }

  @Get('blogs/:id')
  @Public()
  async getBlog(@Param('id') id: string) {
    const numericId = Number(id);
    const data = Number.isInteger(numericId) && numericId > 0
      ? await this.cmsService.findBlog(numericId)
      : await this.cmsService.findBlogBySlug(id);
    if (!data) throw new NotFoundException('Blog post not found');
    return data;
  }

  @Get('portfolio')
  @Public()
  async getPortfolio() {
    return this.portfolioService.findAll();
  }

  @Get('portfolio/:slug')
  @Public()
  async getPortfolioBySlug(@Param('slug') slug: string) {
    const data = await this.portfolioService.findBySlug(slug);
    if (!data) throw new NotFoundException('Project not found');
    return data;
  }

  @Get('testimonials')
  @Public()
  async getTestimonials() {
    return this.testimonialsService.findAllPublic();
  }

  @Get('partners')
  @Public()
  async getPartners() {
    return this.partnersService.findAllPublic();
  }

  @Get('careers')
  @Public()
  async getCareers() {
    return this.careersService.findAllJobs(true);
  }

  @Get('technologies')
  @Public()
  async getTechnologies() {
    return this.settingsService.findAllTechnologies();
  }

  @Get('products')
  @Public()
  async getProducts() {
    return this.productsSaasService.findAllPublic();
  }

  @Get('products/:slug')
  @Public()
  async getProduct(@Param('slug') slug: string) {
    const data = await this.productsSaasService.findBySlug(slug);
    if (!data) throw new NotFoundException('Solution not found');
    return data;
  }
}