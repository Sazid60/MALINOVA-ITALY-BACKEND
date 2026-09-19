import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ProductsSaasService } from './products-saas.service';

@Controller('products-saas')
export class ProductsSaasController {
  constructor(private readonly productsSaasService: ProductsSaasService) {}

  @Get()
  async findAll(
    @Query('industry') industry?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.productsSaasService.findAll(industry, category, search);
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.productsSaasService.findBySlug(slug);
  }

  @Post()
  async create(@Body() body: any) {
    return this.productsSaasService.create(body);
  }

  @Post(':id/seo')
  async updateSeo(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.productsSaasService.update(id, {
      meta_title: body.meta_title,
      meta_description: body.meta_description,
      keywords: body.keywords,
      canonical_url: body.canonical_url,
      custom_og_image: body.custom_og_image,
      no_index: body.no_index,
      no_follow: body.no_follow,
    });
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.productsSaasService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsSaasService.remove(id);
  }
}
