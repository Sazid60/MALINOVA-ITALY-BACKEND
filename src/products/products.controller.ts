import {
  Controller, Get, Post, Put, Patch, Delete, Param, Body, UseInterceptors, BadRequestException, UploadedFile,
  UseGuards, Query, ParseIntPipe, UploadedFiles, DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions, RequireAnyPermissions } from '../common/decorators/require-permissions.decorator';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateAttributeDefinitionDto } from './dto/create-attribute-definition.dto';
import { UpdateAttributeDefinitionDto } from './dto/update-attribute-definition.dto';
import { multerConfig } from '../upload/multer.config';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Products')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('products')
export class ProductsController {
  constructor(private svc: ProductsService) { }

  // Categories
  @RequireAnyPermissions('products.categories.view', 'products.categories.manage', 'products.products.view', 'products.products.manage', 'stock_costing.inventory.view', 'stock_costing.inventory.manage', 'stock_costing.logs.view', 'stock_costing.logs.manage', 'stock_costing.batches.view', 'stock_costing.batches.manage', 'stock_costing.product.view', 'stock_costing.product.manage', 'orders.orders.manage', 'orders.orders.view')
  @Get('categories')
  findCategories(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    if (page !== undefined && limit !== undefined) {
      return this.svc.findAllCategoriesPaginated(+page, +limit, search);
    }
    return this.svc.findAllCategories();
  }

  @RequireAnyPermissions('products.categories.view', 'products.categories.manage', 'products.products.view', 'products.products.manage', 'stock_costing.inventory.view', 'stock_costing.inventory.manage', 'stock_costing.logs.view', 'stock_costing.logs.manage', 'stock_costing.batches.view', 'stock_costing.batches.manage', 'stock_costing.product.view', 'stock_costing.product.manage', 'orders.orders.manage', 'orders.orders.view')
  @Get('categories/tree')
  findCategoryTree() {
    return this.svc.findCategoryTree();
  }

  @RequireAnyPermissions('products.categories.manage', 'products.products.manage')
  @Post('categories') createCategory(@Body() dto: CreateCategoryDto) { return this.svc.createCategory(dto); }

  @RequirePermissions('products.categories.manage')
  @Patch('categories/:id') updateCategory(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) { return this.svc.updateCategory(id, dto); }

  @RequirePermissions('products.categories.manage')
  @Delete('categories/:id') deleteCategory(@Param('id', ParseIntPipe) id: number) { return this.svc.deleteCategory(id); }

  @RequirePermissions('products.categories.manage')
  @Post('categories/:id/images')
  addCategoryImage(
    @Param('id', ParseIntPipe) categoryId: number,
    @Body('image_url') image_url: string,
    @Body('is_primary') is_primary?: boolean,
  ) {
    return this.svc.addCategoryImage(categoryId, image_url, !!is_primary);
  }

  @RequirePermissions('products.categories.manage')
  @Delete('categories/images/:imageId')
  deleteCategoryImage(@Param('imageId', ParseIntPipe) imageId: number) {
    return this.svc.deleteCategoryImage(imageId);
  }

  // ═══ Attribute Definitions ═══
  @RequireAnyPermissions('products.categories.view', 'products.categories.manage')
  @Get('categories/:id/attributes')
  findAttributes(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findAttributesByCategory(id);
  }

  @RequirePermissions('products.categories.manage')
  @Post('categories/:id/attributes')
  createAttribute(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateAttributeDefinitionDto,
  ) {
    return this.svc.createAttribute(id, dto);
  }

  @RequirePermissions('products.categories.manage')
  @Patch('attributes/:id')
  updateAttribute(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAttributeDefinitionDto,
  ) {
    return this.svc.updateAttribute(id, dto);
  }

  @RequirePermissions('products.categories.manage')
  @Delete('attributes/:id')
  deleteAttribute(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteAttribute(id);
  }

  // Brands
  @RequireAnyPermissions('products.brands.view', 'products.brands.manage')
  @Get('brands')
  findAllBrands(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.svc.findAllBrands(+page, +limit, search);
  }

  @RequireAnyPermissions('products.brands.view', 'products.brands.manage')
  @Get('brands/:id')
  findOneBrand(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOneBrand(id);
  }

  @RequirePermissions('products.brands.manage')
  @Post('brands')
  createBrand(@Body() dto: CreateBrandDto) {
    return this.svc.createBrand(dto);
  }

  @RequirePermissions('products.brands.manage')
  @Patch('brands/:id')
  updateBrand(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBrandDto) {
    return this.svc.updateBrand(id, dto);
  }

  @RequirePermissions('products.brands.manage')
  @Delete('brands/:id')
  deleteBrand(@Param('id', ParseIntPipe) id: number) {
    return this.svc.removeBrand(id);
  }

  // Products
  // @Get()
  // @ApiQuery({ name: 'page', required: false }) @ApiQuery({ name: 'limit', required: false })
  // @ApiQuery({ name: 'search', required: false }) @ApiQuery({ name: 'categoryId', required: false })
  // @ApiQuery({ name: 'status', required: false })
  // findAll(@Query('page') page = 1, @Query('limit') limit = 20,
  //   @Query('search') search?: string, @Query('categoryId') cat?: number, @Query('status') status?: string) {
  //   return this.svc.findAll(+page, +limit, search, cat ? +cat : undefined, status);
  // }

  // Products
  @RequireAnyPermissions(
    'products.products.view',
    'products.products.manage',
    'products.variants.view',
    'products.variants.manage',
    'stock_costing.inventory.view',
    'stock_costing.inventory.manage',
    'stock_costing.logs.view',
    'stock_costing.logs.manage',
    'stock_costing.purchases.view',
    'stock_costing.purchases.manage',
    'stock_costing.product.view',
    'stock_costing.product.manage',
    'orders.orders.manage',
    'orders.orders.view'
  )
  @Get()
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "categoryId", required: false })
  @ApiQuery({ name: "status", required: false })
  // ____________________fix for search filter
  @ApiQuery({
    name: "stockLevel",
    required: false,
    enum: ["in_stock", "low_stock", "out_of_stock"],
  })
  @ApiQuery({ name: "sortBy", required: false, enum: ["name", "created_at"] })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"] })
  findAll(
    @Query("page") page = 1,
    @Query("limit") limit = 20,
    @Query("search") search?: string,
    @Query("categoryId") cat?: number,
    @Query("brandId") brandId?: number,
    @Query("status") status?: string,
    //_____________________for filter fix
    @Query("stockLevel") stockLevel?: string,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    return this.svc.findAll(
      +page,
      +limit,
      search,
      cat ? +cat : undefined,
      status,
      stockLevel,
      sortBy,
      sortOrder,
      brandId ? +brandId : undefined,
    );
  }


  @RequireAnyPermissions('products.products.view', 'products.products.manage', 'orders.orders.manage', 'orders.orders.view')
  @Get('filtered')
  findFiltered(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('categoryId') categoryId?: number,
    @Query('brandId') brandId?: number,
    @Query('specs') specsJson?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
  ) {
    let specs: Record<string, any> | undefined;
    if (specsJson) {
      try {
        specs = JSON.parse(specsJson);
      } catch (e) {
        throw new BadRequestException('Invalid specs JSON format');
      }
    }
    return this.svc.findProductsWithFilters(
      +page,
      +limit,
      categoryId ? +categoryId : undefined,
      brandId ? +brandId : undefined,
      specs,
      minPrice ? +minPrice : undefined,
      maxPrice ? +maxPrice : undefined,
    );
  }

  @RequireAnyPermissions('products.products.view', 'products.products.manage', 'orders.orders.manage', 'orders.orders.view')
  @Get('warranty-policies')
  @Get('warranties/all')
  findWarrantyPolicies() {
    return [];
  }

  @RequireAnyPermissions('products.products.view', 'products.products.manage', 'orders.orders.manage', 'orders.orders.view')
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findOne(id); }

  @RequirePermissions('products.products.manage')
  @Post() create(@Body() dto: CreateProductDto) { return this.svc.create(dto); }

  @RequirePermissions('products.products.manage')
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) { return this.svc.update(id, dto); }

  @ApiOperation({ summary: 'Feature or unfeature a product' })
  @ApiBody({ schema: { type: 'object', properties: { is_featured: { type: 'boolean', example: true } } } })
  @Patch(':id/featured')
  setFeatured(@Param('id', ParseIntPipe) id: number, @Body('is_featured') is_featured: boolean) {
    return this.svc.setFeatured(id, is_featured);
  }

  @RequirePermissions('products.products.manage')
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }

  // Variants (Deprecated in Electronics POS)
  @RequireAnyPermissions('products.variants.view', 'products.variants.manage', 'products.products.view', 'products.products.manage')
  @Get(':id/variants') findVariants() { return []; }

  @RequirePermissions('products.variants.manage')
  @Post(':id/variants') createVariant() { throw new BadRequestException('Variants are deprecated'); }

  @RequireAnyPermissions('products.variants.view', 'products.variants.manage', 'products.products.view', 'products.products.manage')
  @Get('variants/all')
  findAllVariants() {
    return { data: [], total: 0, page: 1, limit: 20 };
  }

  @RequireAnyPermissions('products.variants.view', 'products.products.view')
  @Get('variants/active')
  findActiveVariants() {
    return [];
  }

  @RequirePermissions('products.variants.manage')
  @Patch('variants/:vid') updateVariant() { throw new BadRequestException('Variants are deprecated'); }

  @RequirePermissions('products.variants.manage')
  @Delete('variants/:vid') deleteVariant() { throw new BadRequestException('Variants are deprecated'); }

  // // Images
  // @Post(':id/images') addImage(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.svc.addImage(id, body); }
  // @Delete('images/:iid') deleteImage(@Param('iid', ParseIntPipe) id: number) { return this.svc.deleteImage(id); }

  // Upload multiple images
  @RequirePermissions('products.products.manage')
  @Post(':id/images/upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 10, multerConfig))  // max 10 files
  @ApiOperation({ summary: 'Upload multiple images at once' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
        isPrimary: { type: 'number', example: 0, description: 'Index of image to set as primary (default: 0)' },
        variantId: { type: 'number', example: null, description: 'Optional variant ID to associate images with' },
      },
    },
  })
  uploadMultipleImages(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('isPrimary') isPrimary?: string,
    @Body('variantId') variantId?: string,
  ) {
    if (!files?.length) throw new BadRequestException('No files uploaded');
    return this.svc.uploadMultipleImages(
      id,
      files,
      isPrimary !== undefined ? +isPrimary : undefined,
    );
  }

  // Replace existing image
  @RequirePermissions('products.products.manage')
  @Patch(':id/images/:imageId/replace')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiOperation({ summary: 'Replace an existing image with a new file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  replaceImage(
    @Param('id', ParseIntPipe) productId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.svc.replaceImage(imageId, productId, file);
  }

  // ── Images (File Upload via Multer + Cloudinary) ─────────────
  @RequirePermissions('products.products.view')
  @Get(':id/images')
  @ApiOperation({ summary: 'Get all images for a product' })
  getImages(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getProductImages(id);
  }

  @RequirePermissions('products.products.manage')
  @Post(':id/images/upload')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiOperation({ summary: 'Upload image file → uploads to Cloudinary → saves URL to DB' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Image file (JPEG/PNG/WebP, max 5MB)' },
        is_primary: { type: 'boolean', example: false, description: 'Set as primary product image' },
      },
    },
  })
  uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('is_primary') isPrimary: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.svc.uploadAndAddImage(id, file, isPrimary === 'true');
  }

  @RequirePermissions('products.products.manage')
  @Post(':id/images/url')
  @ApiOperation({ summary: 'Add image by external URL (no upload)' })
  addImageByUrl(@Param('id', ParseIntPipe) id: number, @Body() body: { image_url: string; is_primary?: boolean }) {
    return this.svc.addImageByUrl(id, body);
  }

  @RequirePermissions('products.products.manage')
  @Patch(':id/images/:imageId/primary')
  @ApiOperation({ summary: 'Set a specific image as primary' })
  setImageAsPrimary(
    @Param('id', ParseIntPipe) productId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.svc.setImageAsPrimary(imageId, productId);
  }

  @RequirePermissions('products.products.manage')
  @Delete('images/:iid')
  @ApiOperation({ summary: 'Delete image from DB + Cloudinary' })
  deleteImage(@Param('iid', ParseIntPipe) id: number) { return this.svc.deleteImage(id); }

  // SEO
  @RequirePermissions('products.products.manage')
  @Post(':id/seo') upsertSeo(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.upsertSeo('product', id, body);
  }
}
