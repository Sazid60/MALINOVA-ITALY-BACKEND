import {
  Controller, Post, Delete, Param, UseGuards,
  UploadedFile, UploadedFiles, UseInterceptors,
  BadRequestException, Body, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes,
  ApiBody, ApiResponse,
} from '@nestjs/swagger';
import { multerConfig } from './multer.config';
import { CloudinaryService } from './cloudinary.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Upload')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly cloudinary: CloudinaryService) {}

  // ── Single image upload ───────────────────────────────────
  @Post('image')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiOperation({ summary: 'Upload a single image to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Image file (JPEG/PNG/WebP/GIF, max 5MB)' },
        folder: { type: 'string', example: 'products', description: 'Cloudinary subfolder (products|blogs|hero)' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Image uploaded — returns secure URL and metadata' })
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder = 'products',
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const result = await this.cloudinary.uploadFile(file, folder);
    return {
      message: 'Image uploaded successfully',
      ...result,
    };
  }

  // ── Multiple images upload ────────────────────────────────
  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 10, multerConfig))
  @ApiOperation({ summary: 'Upload multiple images at once (max 10)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files'],
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Up to 10 image files',
        },
        folder: { type: 'string', example: 'products' },
      },
    },
  })
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder = 'products',
  ) {
    if (!files?.length) throw new BadRequestException('No files uploaded');
    const results = await this.cloudinary.uploadMultiple(files, folder);
    return {
      message: `${results.length} image(s) uploaded successfully`,
      count: results.length,
      images: results,
    };
  }

  // ── Product image upload ──────────────────────────────────
  @Post('product/:productId/image')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiOperation({ summary: 'Upload image for a specific product (auto-saves to DB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file:       { type: 'string', format: 'binary' },
        is_primary: { type: 'boolean', example: false, description: 'Set as primary product image' },
      },
    },
  })
  async uploadProductImage(
    @Param('productId') productId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('is_primary') isPrimary: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');

    // Upload to cloudinary under products/product-{id}/
    const result = await this.cloudinary.uploadFile(
      file,
      `products/product-${productId}`,
      `product-${productId}-${Date.now()}`,
    );

    return {
      message: 'Product image uploaded',
      image_url:  result.url,
      public_id:  result.public_id,
      is_primary: isPrimary === 'true',
      width:      result.width,
      height:     result.height,
      format:     result.format,
      bytes:      result.bytes,
    };
  }

  // ── Blog featured image upload ────────────────────────────
  @Post('blog/:blogId/image')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiOperation({ summary: 'Upload featured image for a blog post' })
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
  async uploadBlogImage(
    @Param('blogId') blogId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const result = await this.cloudinary.uploadFile(file, 'blogs', `blog-${blogId}`);
    return {
      message: 'Blog image uploaded',
      image_url: result.url,
      public_id: result.public_id,
    };
  }

  // ── Hero banner image upload ──────────────────────────────
  @Post('hero/image')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiOperation({ summary: 'Upload hero banner image' })
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
  async uploadHeroImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const result = await this.cloudinary.uploadFile(file, 'hero', `hero-${Date.now()}`);
    return {
      message: 'Hero image uploaded',
      image_url: result.url,
      public_id: result.public_id,
      width:     result.width,
      height:    result.height,
    };
  }

  // ── Delete image ──────────────────────────────────────────
  @Delete('image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete image from Cloudinary by public_id' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['public_id'],
      properties: {
        public_id: { type: 'string', example: 'achar-shop/products/product-1-1700000000' },
      },
    },
  })
  async deleteImage(@Body('public_id') publicId: string) {
    if (!publicId) throw new BadRequestException('public_id is required');
    const result = await this.cloudinary.deleteFile(publicId);
    return { message: 'Image deleted', result: result.result };
  }
}
