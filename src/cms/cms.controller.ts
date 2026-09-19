import {
  Controller, Get, Post, Put, Patch, Delete, Param, Body,
  UseGuards, Query, ParseIntPipe,UseInterceptors,
  UploadedFile, UploadedFiles, BadRequestException, Req, ForbiddenException
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation,ApiConsumes,ApiBody ,ApiQuery} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions, RequireAnyPermissions } from '../common/decorators/require-permissions.decorator';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { CmsService } from './cms.service';
import { multerConfig } from '../upload/multer.config';


@ApiTags('CMS')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('cms')
export class CmsController {
  constructor(private svc: CmsService) {}

  // // Hero
  // @Get('hero') findHero() { return this.svc.findHero(); }
  // @Post('hero') createHero(@Body() body: any) { return this.svc.createHeroSection(body); }
  // @Put('hero/:id') updateHero(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.svc.updateHeroSection(id, body); }
  // @Post('hero/:id/media') addMedia(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.svc.addHeroMedia(id, body); }
  // @Put('hero/media/:id') updateMedia(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.svc.updateHeroMedia(id, body); }
  // @Delete('hero/media/:id') deleteMedia(@Param('id', ParseIntPipe) id: number) { return this.svc.deleteHeroMedia(id); }

  // ── Hero Sections ─────────────────────────────────────────────
  @Get('hero')
  @RequirePermissions('cms.hero.view')
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiOperation({ summary: 'Get all hero sections with media' })
  findHero(
    @Query('page')  page  = 1,
    @Query('limit') limit = 10,

  ) { return this.svc.findHero(+page, +limit,); }

  @Get('hero/:id')
  @RequirePermissions('cms.hero.view')
  @ApiOperation({ summary: 'Get hero section by ID with media' })
  findOneHero(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOneHero(id);
  }

  @Post('hero')
  @RequirePermissions('cms.hero.manage')
  @ApiOperation({ summary: 'Create hero section' })
  createHero(@Body() body: any) { return this.svc.createHeroSection(body); }

  @Patch('hero/:id')
  @RequirePermissions('cms.hero.manage')
  @ApiOperation({ summary: 'Update hero section' })
  updateHero(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.updateHeroSection(id, body);
  }

  @Delete('hero/:id')
  @RequirePermissions('cms.hero.manage')
  @ApiOperation({ summary: 'Delete hero section + all its media from Cloudinary' })
  deleteHero(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteHeroSection(id);
  }

  // ── Hero Media ────────────────────────────────────────────────
  @Get('hero/:id/media')
  @RequirePermissions('cms.hero.view')
  @ApiOperation({ summary: 'Get all media for a hero section' })
  getMedia(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getHeroMedia(id);
  }

  @Post('hero/:id/media/upload')
  @RequirePermissions('cms.hero.manage')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiOperation({ summary: 'Upload single image → Cloudinary → save' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file:       { type: 'string', format: 'binary' },
        sort_order: { type: 'number', example: 0 },
        is_active:  { type: 'boolean', example: true },
      },
    },
  })
  uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('sort_order') sortOrder?: string,
    @Body('is_active')  isActive?:  string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.svc.uploadHeroImage(id, file, {
      sort_order: sortOrder ? +sortOrder : undefined,
      is_active:  isActive === 'true',
    });
  }

  @Post('hero/:id/media/upload-multiple')
  @RequirePermissions('cms.hero.manage')
  @UseInterceptors(FilesInterceptor('files', 10, multerConfig))
  @ApiOperation({ summary: 'Upload multiple images at once' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  uploadMultiple(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files?.length) throw new BadRequestException('No files uploaded');
    return this.svc.uploadMultipleHeroImages(id, files);
  }

  @Post('hero/:id/media/url')
  @RequirePermissions('cms.hero.manage')
  @ApiOperation({ summary: 'Add YouTube video or image by URL' })
  addMediaByUrl(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.addHeroMediaByUrl(id, body);
  }

  @Patch('hero/:id/media/:mediaId/replace')
  @RequirePermissions('cms.hero.manage')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiOperation({ summary: 'Replace existing media image with new file' })
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
    @Param('id',      ParseIntPipe) heroId:  number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.svc.replaceHeroImage(mediaId, heroId, file);
  }

  @Patch('hero/media/:id')
  @RequirePermissions('cms.hero.manage')
  @ApiOperation({ summary: 'Update media metadata (sort_order, is_active)' })
  updateMedia(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.updateHeroMedia(id, body);
  }

  @Patch('hero/:id/media/reorder')
  @RequirePermissions('cms.hero.manage')
  @ApiOperation({ summary: 'Reorder media items' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        order: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id:         { type: 'number', example: 1 },
              sort_order: { type: 'number', example: 0 },
            },
          },
        },
      },
    },
  })
  reorderMedia(
    @Param('id', ParseIntPipe) id: number,
    @Body('order') order: { id: number; sort_order: number }[],
  ) {
    return this.svc.reorderHeroMedia(id, order);
  }

  @Delete('hero/media/:id')
  @RequirePermissions('cms.hero.manage')
  @ApiOperation({ summary: 'Delete media from DB + Cloudinary' })
  deleteMedia(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteHeroMedia(id);
  }
  // // Blogs
  // @Get('blogs') findBlogs(@Query('page') p = 1, @Query('limit') l = 10, @Query('status') status?: string) {
  //   return this.svc.findBlogs(+p, +l, status);
  // }
  // @Get('blogs/:id') findBlog(@Param('id', ParseIntPipe) id: number) { return this.svc.findBlog(id); }
  // @Post('blogs') createBlog(@Body() body: any) { return this.svc.createBlog(body); }
  // @Put('blogs/:id') updateBlog(@Param('id', ParseIntPipe) id: number, @Body() body: any) { return this.svc.updateBlog(id, body); }
  // @Delete('blogs/:id') deleteBlog(@Param('id', ParseIntPipe) id: number) { return this.svc.deleteBlog(id); }


  // ── Blogs ─────────────────────────────────────────────────────
  @Get('blogs')
  @RequirePermissions('cms.blogs.view')
  @ApiOperation({ summary: 'List blogs — paginated, filterable by status' })
  @ApiQuery({ name: 'page',   required: false })
  @ApiQuery({ name: 'limit',  required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'published'] })
  findBlogs(
    @Query('page')   page = 1,
    @Query('limit')  limit = 10,
    @Query('status') status?: string,
  ) { return this.svc.findBlogs(+page, +limit, status); }

  @Get('blogs/:id')
  @RequirePermissions('cms.blogs.view')
  @ApiOperation({ summary: 'Get blog by ID — includes content + content_delta for Quill restore' })
  findBlog(@Param('id', ParseIntPipe) id: number) {
  return this.svc.findBlog(id);
}

// @Post('blogs')
// @ApiOperation({ summary: 'Create blog — save Quill HTML + Delta' })
// @ApiBody({
//   schema: {
//     type: 'object',
//     required: ['title'],
//     properties: {
//       title: {
//         type: 'string',
//         example: '5 Health Benefits of Eating Achar',
//       },
//       content: {
//         type: 'string',
//         description: 'Quill HTML output → quill.root.innerHTML',
//         example: '<p>Achar is <strong>great</strong> for digestion.</p>',
//       },
//       content_delta: {
//         type: 'object',
//         description: 'Quill Delta JSON → quill.getContents()',
//         example: {
//           ops: [
//             { insert: 'Achar is ' },
//             { insert: 'great', attributes: { bold: true } },
//             { insert: ' for digestion.\n' },
//           ],
//         },
//       },
//       featured_image_url: {
//         type: 'string',
//         example: 'https://example.com/image.jpg',
//         description: 'External image URL — no upload, Quill inline images embedded in content',
//       },
//       status: {
//         type: 'string',
//         enum: ['draft', 'published'],
//         example: 'draft',
//       },
//     },
//   },
// })
// createBlog(@Body() body: any) { return this.svc.createBlog(body); }

// @Put('blogs/:id')
// @ApiOperation({ summary: 'Update blog — partial update, auto-publishes on status=published' })
// @ApiBody({
//   schema: {
//     type: 'object',
//     properties: {
//       title: {
//         type: 'string',
//         example: 'Updated Blog Title',
//       },
//       content: {
//         type: 'string',
//         description: 'Quill HTML → quill.root.innerHTML',
//       },
//       content_delta: {
//         type: 'object',
//         description: 'Quill Delta → quill.getContents()',
//       },
//       featured_image_url: {
//         type: 'string',
//         example: 'https://example.com/new-image.jpg',
//       },
//       status: {
//         type: 'string',
//         enum: ['draft', 'published'],
//       },
//     },
//   },
// })
// updateBlog(
//   @Param('id', ParseIntPipe) id: number,
//   @Body() body: any,
// ) { return this.svc.updateBlog(id, body); }


// @Post('blogs')
// @UseInterceptors(FileInterceptor('file', multerConfig))
// @ApiOperation({ summary: 'Create blog with optional featured image — one request' })
// @ApiConsumes('multipart/form-data')
// @ApiBody({
//   schema: {
//     type: 'object',
//     required: ['title'],
//     properties: {
//       file: {
//         type: 'string',
//         format: 'binary',
//         description: 'Featured image (optional)',
//       },
//       title: {
//         type: 'string',
//         example: '5 Health Benefits of Eating Achar',
//       },
//       content: {
//         type: 'string',
//         description: 'Quill HTML → quill.root.innerHTML',
//         example: '<p>Achar is <strong>great</strong> for digestion.</p>',
//       },
//       content_delta: {
//         type: 'string',
//         description: 'Quill Delta JSON string → JSON.stringify(quill.getContents())',
//         example: '{"ops":[{"insert":"Achar is great\\n"}]}',
//       },
//       status: {
//         type: 'string',
//         enum: ['draft', 'published'],
//         example: 'draft',
//       },
//     },
//   },
// })
// createBlog(
//   @UploadedFile() file: Express.Multer.File,
//   @Body('title')         title:          string,
//   @Body('content')       content?:       string,
//   @Body('content_delta') contentDelta?:  string,
//   @Body('status')        status?:        string,
// ) {
//   // content_delta comes as string from multipart — parse it
//   const content_delta = contentDelta ? JSON.parse(contentDelta) : undefined;

//   return this.svc.createBlog(
//     { title, content, content_delta, status },
//     file,
//   );
// }

// @Put('blogs/:id')
// @UseInterceptors(FileInterceptor('file', multerConfig))
// @ApiOperation({ summary: 'Update blog with optional new featured image — one request' })
// @ApiConsumes('multipart/form-data')
// @ApiBody({
//   schema: {
//     type: 'object',
//     properties: {
//       file: {
//         type: 'string',
//         format: 'binary',
//         description: 'New featured image (optional — replaces old)',
//       },
//       title: {
//         type: 'string',
//         example: 'Updated Title',
//       },
//       content: {
//         type: 'string',
//         description: 'Quill HTML → quill.root.innerHTML',
//       },
//       content_delta: {
//         type: 'string',
//         description: 'Quill Delta JSON string → JSON.stringify(quill.getContents())',
//       },
//       status: {
//         type: 'string',
//         enum: ['draft', 'published'],
//       },
//     },
//   },
// })
// updateBlog(
//   @Param('id', ParseIntPipe) id: number,
//   @UploadedFile() file: Express.Multer.File,
//   @Body('title')         title?:         string,
//   @Body('content')       content?:       string,
//   @Body('content_delta') contentDelta?:  string,
//   @Body('status')        status?:        string,
// ) {
//   const content_delta = contentDelta ? JSON.parse(contentDelta) : undefined;

//   return this.svc.updateBlog(
//     id,
//     { title, content, content_delta, status },
//     file,
//   );
// }

@Post('blogs')
@RequirePermissions('cms.blogs.manage')
@UseInterceptors(FileInterceptor('file', multerConfig))
@ApiOperation({ summary: 'Create blog — file + data JSON in one request' })
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    required: ['data'],
    properties: {
      file: { type: 'string', format: 'binary', description: 'Featured image (optional)' },
      data: {
        type: 'string',
        description: 'JSON string of blog data',
        example: '{"title":"My Blog","content":"<p>Hello</p>","content_delta":{"ops":[]},"status":"draft"}',
      },
    },
  },
})
async createBlog(
  @UploadedFile() file: Express.Multer.File,
  @Body('data') data: string,
) {
  const parsedData = JSON.parse(data);
  const dto = plainToInstance(CreateBlogDto, parsedData);
  await validateOrReject(dto);
  return this.svc.createBlog(dto, file);
}

@Patch('blogs/:id')
@RequirePermissions('cms.blogs.manage')
@UseInterceptors(FileInterceptor('file', multerConfig))
@ApiOperation({ summary: 'Update blog — file + data JSON in one request' })
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      file: { type: 'string', format: 'binary', description: 'New featured image (optional)' },
      data: {
        type: 'string',
        description: 'JSON string of fields to update',
        example: '{"title":"Updated","status":"published"}',
      },
    },
  },
})
async updateBlog(
  @Param('id', ParseIntPipe) id: number,
  @UploadedFile() file: Express.Multer.File,
  @Body('data') data: string,
) {
  const parsedData = data ? JSON.parse(data) : {};
  const dto = plainToInstance(UpdateBlogDto, parsedData);
  await validateOrReject(dto);
  return this.svc.updateBlog(id, dto, file);
}
@Delete('blogs/:id')
@RequirePermissions('cms.blogs.manage')
@ApiOperation({ summary: 'Delete blog' })
deleteBlog(@Param('id', ParseIntPipe) id: number) {
  return this.svc.deleteBlog(id);
}

@Post('blogs/:id/seo')
@RequirePermissions('cms.blogs.manage')
@ApiOperation({ summary: 'Upsert SEO metadata for a blog post' })
upsertBlogSeo(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
  return this.svc.upsertBlogSeo(id, body);
}
  // Settings
  @Get('settings')
  @ApiOperation({ summary: 'Get all site settings as key-value map' })
  getAll() { return this.svc.getAllSettings(); }

  @Post('settings')
  @RequirePermissions('settings.site.manage')
  @ApiOperation({ summary: 'Bulk update settings' })
  bulkUpsert(@Body() body: Record<string, string>) { return this.svc.bulkUpsertSettings(body); }

  @Patch('settings/:key')
  @RequirePermissions('settings.site.manage')
  upsert(@Param('key') key: string, @Body() body: { value: string }) {
    return this.svc.upsertSetting(key, body.value);
  }

  @Post('settings/logo')
  @RequirePermissions('settings.site.manage')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiOperation({ summary: 'Upload company logo → Cloudinary → stores URL in site_settings' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Company logo image' },
      },
    },
  })
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.svc.uploadCompanyLogo(file);
  }
}
