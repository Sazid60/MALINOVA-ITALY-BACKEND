import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { HeroSection } from './hero-section.entity';
import { HeroMedia } from './hero-media.entity';
import { Blog } from './blog.entity';
import { SiteSetting } from './site-setting.entity';
import { CloudinaryService } from '@/upload/cloudinary.service';
import { SeoMeta } from '../products/seo-meta.entity';

const slugify = (str: string) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

@Injectable()
export class CmsService implements OnModuleInit {
  constructor(
    @InjectRepository(HeroSection) private heroRepo: Repository<HeroSection>,
    @InjectRepository(HeroMedia) private mediaRepo: Repository<HeroMedia>,
    @InjectRepository(Blog) private blogRepo: Repository<Blog>,
    @InjectRepository(SiteSetting) private settingRepo: Repository<SiteSetting>,
    @InjectRepository(SeoMeta) private seoRepo: Repository<SeoMeta>,
    private cloudinary: CloudinaryService,
  ) {}

  // // ── Hero ─────────────────────────────────────────────────────
  // findHero() { return this.heroRepo.find({ relations: ['media'], order: { id: 'ASC' } }); }

  // async createHeroSection(dto: any) { return this.heroRepo.save(this.heroRepo.create(dto)); }

  // async updateHeroSection(id: number, dto: any) {
  //   const h = await this.heroRepo.findOne({ where: { id } });
  //   if (!h) throw new NotFoundException('Hero section not found');
  //   return this.heroRepo.save({ ...h, ...dto });
  // }

  // async addHeroMedia(heroSectionId: number, dto: any) {
  //   return this.mediaRepo.save(this.mediaRepo.create({ ...dto, hero_section_id: heroSectionId }));
  // }

  // async updateHeroMedia(id: number, dto: any) {
  //   const m = await this.mediaRepo.findOne({ where: { id } });
  //   if (!m) throw new NotFoundException('Media not found');
  //   return this.mediaRepo.save({ ...m, ...dto });
  // }

  // async deleteHeroMedia(id: number) {
  //   const m = await this.mediaRepo.findOne({ where: { id } });
  //   if (!m) throw new NotFoundException();
  //   await this.mediaRepo.remove(m);
  //   return { message: 'Media deleted' };
  // }

  // ── Hero Sections ─────────────────────────────────────────────
  // findHero(page: number, limit: number) {
  //   return this.heroRepo.find({
  //     relations: ['media'],
  //     order: { id: 'ASC' },
  //   });
  // }
  async findHero(page = 1, limit = 10) {
    const safePage  = Math.max(1, +page);
    const safeLimit = Math.min(50, Math.max(1, +limit));

    const [data, total] = await this.heroRepo.findAndCount({
      where: { is_deleted: false },
      relations: ['media'],
      order:     { id: 'ASC' },
      skip:      (safePage - 1) * safeLimit,
      take:      safeLimit,
    });

    data.forEach(h => {
      if (h.media) {
        h.media = h.media.filter(m => !m.is_deleted);
      }
    });

    return {
      data,
      total,
      page:  safePage,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit),
    };
  }

  async findOneHero(id: number) {
    const h = await this.heroRepo.findOne({ where: { id, is_deleted: false }, relations: ['media'] });
    if (!h) throw new NotFoundException('Hero section not found');
    if (h.media) {
      h.media = h.media.filter(m => !m.is_deleted);
    }
    return h;
  }

  // async createHeroSection(dto: any) {
  //     // ── If new section is active → deactivate all others ─────
  //     if (dto.is_active === true || dto.is_active === 'true') {
  //       await this.heroRepo.update({}, { is_active: false });
  //     }
  //   return this.heroRepo.save(this.heroRepo.create(dto));
  // }

  // async updateHeroSection(id: number, dto: any) {
  //   const h = await this.findOneHero(id);

  //     // ── If updating to active → deactivate all others ────────
  //   if (dto.is_active === true || dto.is_active === 'true') {
  //     await this.heroRepo.update({}, { is_active: false });
  //   }
  //   return this.heroRepo.save({ ...h, ...dto });
  // }

  async createHeroSection(dto: any) {
    // ── If new section is active → deactivate all others ─────
    if (dto.is_active === true || String(dto.is_active) === 'true') {
      await this.heroRepo.update({ is_active: true }, { is_active: false });
    }
    return this.heroRepo.save(this.heroRepo.create(dto));
  }

  async updateHeroSection(id: number, dto: any) {
    const h = await this.findOneHero(id);

    // ── If updating to active → deactivate all others ────────
    if (dto.is_active === true || String(dto.is_active) === 'true') {
      await this.heroRepo.update({ is_active: true }, { is_active: false });
    }
    return this.heroRepo.save({ ...h, ...dto });
  }

  async deleteHeroSection(id: number) {
    const h = await this.findOneHero(id);
    h.is_deleted = true;
    await this.heroRepo.save(h);
    if (h.media) {
      for (const m of h.media) {
        m.is_deleted = true;
        await this.mediaRepo.save(m);
      }
    }
    return { message: 'Hero section deleted' };
  }

  // ── Hero Media ────────────────────────────────────────────────

  async getHeroMedia(heroSectionId: number) {
    return this.mediaRepo.find({
      where: { hero_section_id: heroSectionId, is_deleted: false },
      order: { sort_order: 'ASC' },
    });
  }

  // Upload image file → Cloudinary → save
  async uploadHeroImage(
    heroSectionId: number,
    file: Express.Multer.File,
    dto: { sort_order?: number; is_active?: boolean },
  ) {
    await this.findOneHero(heroSectionId);

    const uploaded = await this.cloudinary.uploadFile(
      file,
      `cms/hero-${heroSectionId}`,
      `hero-${heroSectionId}-${Date.now()}`,
    );

    const media = await this.mediaRepo.save(
      this.mediaRepo.create({
        hero_section_id:      heroSectionId,
        media_type:           'image',
        media_url:            uploaded.url,
        cloudinary_public_id: uploaded.public_id,
        sort_order:           dto.sort_order ?? 0,
        is_active:            dto.is_active  ?? true,
      }),
    );

    return {
      ...media,
      width:  uploaded.width,
      height: uploaded.height,
      format: uploaded.format,
      bytes:  uploaded.bytes,
    };
  }

  // Upload multiple images at once
  async uploadMultipleHeroImages(
    heroSectionId: number,
    files: Express.Multer.File[],
  ) {
    await this.findOneHero(heroSectionId);

    const results = await Promise.all(
      files.map(async (file, index) => {
        const uploaded = await this.cloudinary.uploadFile(
          file,
          `cms/hero-${heroSectionId}`,
          `hero-${heroSectionId}-${Date.now()}-${index}`,
        );
        const media = await this.mediaRepo.save(
          this.mediaRepo.create({
            hero_section_id:      heroSectionId,
            media_type:           'image',
            media_url:            uploaded.url,
            cloudinary_public_id: uploaded.public_id,
            sort_order:           index,
            is_active:            true,
          }),
        );
        return { ...media, width: uploaded.width, height: uploaded.height, format: uploaded.format, bytes: uploaded.bytes };
      }),
    );

    return results;
  }

  // Add YouTube video by URL
  async addHeroMediaByUrl(
    heroSectionId: number,
    dto: { media_url: string; media_type?: string; sort_order?: number; is_active?: boolean },
  ) {
    await this.findOneHero(heroSectionId);
    return this.mediaRepo.save(
      this.mediaRepo.create({
        hero_section_id: heroSectionId,
        media_type:      dto.media_type ?? 'youtube',
        media_url:       dto.media_url,
        sort_order:      dto.sort_order ?? 0,
        is_active:       dto.is_active  ?? true,
      }),
    );
  }

  // Replace existing media image
  async replaceHeroImage(mediaId: number, heroSectionId: number, file: Express.Multer.File) {
    const m = await this.mediaRepo.findOne({
      where: { id: mediaId, hero_section_id: heroSectionId, is_deleted: false },
    });
    if (!m) throw new NotFoundException('Media not found');

    if (m.cloudinary_public_id) {
      await this.cloudinary.deleteFile(m.cloudinary_public_id);
    }

    const uploaded = await this.cloudinary.uploadFile(
      file,
      `cms/hero-${heroSectionId}`,
      `hero-${heroSectionId}-${Date.now()}`,
    );

    const updated = await this.mediaRepo.save({
      ...m,
      media_url:            uploaded.url,
      cloudinary_public_id: uploaded.public_id,
    });

    return { ...updated, width: uploaded.width, height: uploaded.height, format: uploaded.format, bytes: uploaded.bytes };
  }

  async updateHeroMedia(id: number, dto: any) {
    const m = await this.mediaRepo.findOne({ where: { id, is_deleted: false } });
    if (!m) throw new NotFoundException('Media not found');
    return this.mediaRepo.save({ ...m, ...dto });
  }

  async deleteHeroMedia(id: number) {
    const m = await this.mediaRepo.findOne({ where: { id, is_deleted: false } });
    if (!m) throw new NotFoundException('Media not found');
    m.is_deleted = true;
    await this.mediaRepo.save(m);
    return { message: 'Media deleted' };
  }

  async reorderHeroMedia(heroSectionId: number, order: { id: number; sort_order: number }[]) {
    await this.findOneHero(heroSectionId);
    for (const item of order) {
      await this.mediaRepo.update({ id: item.id, hero_section_id: heroSectionId }, { sort_order: item.sort_order });
    }
    return this.getHeroMedia(heroSectionId);
  }

  // ── Blogs ─────────────────────────────────────────────────────
  async findBlogs(page = 1, limit = 10, status?: string) {
    const qb = this.blogRepo.createQueryBuilder('b')
      .where('b.is_deleted = :is_deleted', { is_deleted: false })
      .orderBy('b.created_at', 'DESC');
    if (status) qb.andWhere('b.status = :status', { status });
    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();

    if (data.length > 0) {
      const blogIds = data.map((b) => b.id);
      const seos = await this.seoRepo.find({
        where: { entity_type: 'blog', entity_id: In(blogIds) },
      });
      const seoMap = new Map(seos.map((s) => [s.entity_id, s]));
      data.forEach((b) => {
        (b as any).seo_meta = seoMap.get(b.id) || null;
      });
    }

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findBlog(id: number) {
    const b = await this.blogRepo.findOne({ where: { id, is_deleted: false } });
    if (!b) throw new NotFoundException('Blog not found');
    const seo = await this.seoRepo.findOne({ where: { entity_type: 'blog', entity_id: b.id } });
    (b as any).seo_meta = seo || null;
    return b;
  }

  async findBlogBySlug(slug: string) {
    const b = await this.blogRepo.findOne({ where: { slug, is_deleted: false } });
    if (!b) return null;
    const seo = await this.seoRepo.findOne({ where: { entity_type: 'blog', entity_id: b.id } });
    (b as any).seo_meta = seo || null;
    return b;
  }

  // async createBlog(dto: any) {
  //   const slug = slugify(dto.title);
  //   return this.blogRepo.save(this.blogRepo.create({ ...dto, slug }));
  // }

  // async updateBlog(id: number, dto: any) {
  //   const b = await this.findBlog(id);
  //   if (dto.status === 'published' && !b.published_at) dto.published_at = new Date();
  //   return this.blogRepo.save({ ...b, ...dto });
  // }

//   async createBlog(dto: {
//   title:             string;
//   content?:          string;   // Quill HTML  → quill.root.innerHTML
//   content_delta?:    object;   // Quill Delta → quill.getContents()
//   featured_image_url?: string;
//   status?:           string;
// }) {
//   const slug = slugify(dto.title);
//   return this.blogRepo.save(
//     this.blogRepo.create({
//       ...dto,
//       slug,
//       status: dto.status ?? 'draft',
//     }),
//   );
// }

async createBlog(
  dto: {
    title:             string;
    content?:          string;
    content_delta?:    object;
    status?:           string;
  },
  file?: Express.Multer.File,
) {
  const slug = slugify(dto.title);

  let featured_image_url:       string | null = null;
  let featured_image_public_id: string | null = null;

  // ── Upload featured image if provided ─────────────────────
  if (file) {
    const uploaded = await this.cloudinary.uploadFile(
      file,
      'cms/blogs',
      `blog-featured-${Date.now()}`,
    );
    featured_image_url       = uploaded.url;
    featured_image_public_id = uploaded.public_id;
  }

  const saved = await this.blogRepo.save(
    this.blogRepo.create({
      ...dto,
      slug,
      status:                   dto.status ?? 'draft',
      featured_image_url,
      featured_image_public_id,
    }),
  );

  await this.autoGenerateSeoForBlog(saved);
  return saved;
}

// async updateBlog(id: number, dto: {
//   title?:              string;
//   content?:            string;
//   content_delta?:      object;
//   featured_image_url?: string;
//   status?:             string;
// }) {
//   const b = await this.findBlog(id);

//   // Auto-set published_at when first published
//   if (dto.status === 'published' && !b.published_at) {
//     (dto as any).published_at = new Date();
//   }

//   // Auto-update slug if title changed
//   if (dto.title && dto.title !== b.title) {
//     (dto as any).slug = slugify(dto.title);
//   }

//   return this.blogRepo.save({ ...b, ...dto });
// }

async updateBlog(
  id: number,
  dto: {
    title?:           string;
    content?:         string;
    content_delta?:   object;
    status?:          string;
  },
  file?: Express.Multer.File,
) {
  const b = await this.findBlog(id);

  // ── Auto published_at ─────────────────────────────────────
  if (dto.status === 'published' && !b.published_at) {
    (dto as any).published_at = new Date();
  }

  // ── Auto slug if title changed ────────────────────────────
  // SLUG IS IMMUTABLE ON UPDATE FOR SEO PRESERVATION.
  // if (dto.title && dto.title !== b.title) {
  //   (dto as any).slug = slugify(dto.title);
  // }

  // ── Replace featured image if new file provided ───────────
  let featured_image_url       = b.featured_image_url;
  let featured_image_public_id = b.featured_image_public_id;

  if (file) {
    // Delete old from Cloudinary
    if (b.featured_image_public_id) {
      await this.cloudinary.deleteFile(b.featured_image_public_id);
    }
    const uploaded = await this.cloudinary.uploadFile(
      file,
      'cms/blogs',
      `blog-featured-${id}-${Date.now()}`,
    );
    featured_image_url       = uploaded.url;
    featured_image_public_id = uploaded.public_id;
  }

  const { seo_meta, ...blogData } = b as any;
  const saved = await this.blogRepo.save({
    ...blogData,
    ...dto,
    featured_image_url,
    featured_image_public_id,
  });

  await this.autoGenerateSeoForBlog(saved);
  return saved;
}

  // async deleteBlog(id: number) {
  //   const b = await this.findBlog(id);
  //   await this.blogRepo.remove(b);
  //   return { message: 'Blog deleted' };
  // }

  async deleteBlog(id: number) {
    const b = await this.findBlog(id);
    b.is_deleted = true;
    b.slug = `${b.slug}-deleted-${Date.now()}`;
    await this.blogRepo.save(b);
    return { message: 'Blog deleted' };
  }

  // ── Settings ──────────────────────────────────────────────────
  async getAllSettings() {
    const rows = await this.settingRepo.find();
    return rows.reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {});
  }

  async getSetting(key: string) {
    return this.settingRepo.findOne({ where: { key } });
  }

  async upsertSetting(key: string, value: string) {
    const existing = await this.settingRepo.findOne({ where: { key } });
    if (existing) return this.settingRepo.save({ ...existing, value });
    return this.settingRepo.save(this.settingRepo.create({ key, value }));
  }

  async onModuleInit() {
    setTimeout(() => this.backfillBlogSeo(), 5000);
  }

  async backfillBlogSeo() {
    try {
      const blogs = await this.blogRepo.find({
        where: { is_deleted: false },
      });
      for (const b of blogs) {
        await this.autoGenerateSeoForBlog(b);
      }
      console.log(`[SEO Backfill] Completed blog SEO backfill for ${blogs.length} blogs.`);
    } catch (err) {
      console.error('[SEO Backfill] Failed blog SEO backfill:', err);
    }
  }

  async autoGenerateSeoForBlog(blog: Blog) {
    const defaultTitle = blog.title;
    const cleanDesc = blog.content ? blog.content.replace(/<[^>]*>/g, '').trim() : '';
    const defaultDesc = cleanDesc.slice(0, 155) + (cleanDesc.length > 155 ? '...' : '');
    const defaultOgUrl = blog.featured_image_url || null;
    
    const defaultKeywords = [blog.title, 'Bombai Achar Blog', 'Bombai Achar'].filter(Boolean).join(', ');

    let seo = await this.seoRepo.findOne({ where: { entity_type: 'blog', entity_id: blog.id } });
    if (!seo) {
      seo = this.seoRepo.create({
        entity_type: 'blog',
        entity_id: blog.id,
        meta_title: defaultTitle,
        meta_description: defaultDesc || null,
        og_image_url: defaultOgUrl || null,
        keywords: defaultKeywords,
        indexable: true,
      });
      await this.seoRepo.save(seo);
    } else {
      let changed = false;
      if (!seo.meta_title) { seo.meta_title = defaultTitle; changed = true; }
      if (!seo.meta_description && defaultDesc) { seo.meta_description = defaultDesc; changed = true; }
      if (!seo.og_image_url && defaultOgUrl) { seo.og_image_url = defaultOgUrl; changed = true; }
      if (!seo.keywords) { seo.keywords = defaultKeywords; changed = true; }
      if (changed) {
        await this.seoRepo.save(seo);
      }
    }
  }

  async upsertBlogSeo(blogId: number, dto: any) {
    const seo = await this.seoRepo.findOne({ where: { entity_type: 'blog', entity_id: blogId } });
    if (seo) return this.seoRepo.save({ ...seo, ...dto });
    return this.seoRepo.save(this.seoRepo.create({ entity_type: 'blog', entity_id: blogId, ...dto }));
  }

  async bulkUpsertSettings(settings: Record<string, string>) {
    const results = [];
    for (const [key, value] of Object.entries(settings)) {
      results.push(await this.upsertSetting(key, value));
    }
    return results;
  }

  async uploadCompanyLogo(file: Express.Multer.File) {
    // Delete old logo from Cloudinary if one exists
    const existing = await this.settingRepo.findOne({ where: { key: 'company_logo_public_id' } });
    if (existing?.value) {
      await this.cloudinary.deleteFile(existing.value);
    }

    const uploaded = await this.cloudinary.uploadFile(
      file,
      'company',
      `logo-${Date.now()}`,
    );

    await this.upsertSetting('company_logo', uploaded.url);
    await this.upsertSetting('company_logo_public_id', uploaded.public_id);

    return {
      url: uploaded.url,
      public_id: uploaded.public_id,
      width: uploaded.width,
      height: uploaded.height,
      format: uploaded.format,
    };
  }
}
