import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeoMetadata } from './entities/seo-metadata.entity';
import { RedirectRule } from './entities/redirect-rule.entity';
import { SitemapConfig } from './entities/sitemap-config.entity';

@Injectable()
export class SeoService {
  constructor(
    @InjectRepository(SeoMetadata)
    private metaRepo: Repository<SeoMetadata>,
    @InjectRepository(RedirectRule)
    private redirectRepo: Repository<RedirectRule>,
    @InjectRepository(SitemapConfig)
    private sitemapRepo: Repository<SitemapConfig>,
  ) {}

  // Page SEO Metadata
  async getPageMeta(pagePath: string) {
    const meta = await this.metaRepo.findOneBy({ page_path: pagePath });
    if (!meta) {
      // Default fallback
      return {
        page_path: pagePath,
        meta_title: 'Milanova Technologies | Enterprise Digital Agency',
        meta_description: 'Premier European technology agency specializing in enterprise software, cloud infrastructure, AI solutions & digital growth.',
        keywords: ['Milanova Technologies', 'Software Agency', 'Cloud Infrastructure', 'AI Solutions'],
        canonical_url: `https://milanovatech.com${pagePath}`,
        og_title: 'Milanova Technologies',
        og_description: 'Enterprise Digital Agency & Cloud Solutions',
        og_image: 'https://milanovatech.com/images/og-default.png',
        twitter_card: 'summary_large_image',
        schema_json_ld: {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Milanova Technologies',
          url: 'https://milanovatech.com',
          logo: 'https://milanovatech.com/logo.png',
        },
        no_index: false,
        no_follow: false,
      };
    }
    return meta;
  }

  async upsertPageMeta(data: Partial<SeoMetadata>) {
    let existing = await this.metaRepo.findOneBy({ page_path: data.page_path });
    if (existing) {
      Object.assign(existing, data);
      return this.metaRepo.save(existing);
    }
    const created = this.metaRepo.create(data);
    return this.metaRepo.save(created);
  }

  async findAllMeta() {
    return this.metaRepo.find({ order: { updated_at: 'DESC' } });
  }

  // Redirect Management
  async findAllRedirects() {
    return this.redirectRepo.find({ order: { created_at: 'DESC' } });
  }

  async findActiveRedirect(sourcePath: string) {
    const rule = await this.redirectRepo.findOneBy({ source_path: sourcePath, is_active: true });
    if (rule) {
      rule.hit_count += 1;
      await this.redirectRepo.save(rule);
    }
    return rule;
  }

  async createRedirect(data: Partial<RedirectRule>) {
    const rule = this.redirectRepo.create(data);
    return this.redirectRepo.save(rule);
  }

  async updateRedirect(id: number, data: Partial<RedirectRule>) {
    await this.redirectRepo.update(id, data);
    return this.redirectRepo.findOneBy({ id });
  }

  async removeRedirect(id: number) {
    await this.redirectRepo.delete(id);
    return { success: true };
  }

  // Sitemap & Robots.txt Config
  async getSitemapConfig() {
    let config = await this.sitemapRepo.findOneBy({ id: 1 });
    if (!config) {
      config = this.sitemapRepo.create({
        id: 1,
        robots_disallow: ['/admin', '/api', '/private'],
        robots_allow: ['/'],
        sitemap_url: 'https://milanovatech.com/sitemap.xml',
        priority_mappings: { '/': 1.0, '/services': 0.9, '/products': 0.8, '/portfolio': 0.8, '/company': 0.7, '/contact': 0.7 },
        change_frequencies: { '/': 'daily', '/services': 'weekly', '/products': 'weekly', '/portfolio': 'weekly', '/blogs': 'daily' },
      });
      await this.sitemapRepo.save(config);
    }
    return config;
  }

  async updateSitemapConfig(data: Partial<SitemapConfig>) {
    let config = await this.getSitemapConfig();
    Object.assign(config, data);
    return this.sitemapRepo.save(config);
  }

  async generateRobotsTxt() {
    const config = await this.getSitemapConfig();
    let txt = "User-agent: *\n";
    if (config.robots_disallow) {
      config.robots_disallow.forEach(p => { txt += `Disallow: ${p}\n`; });
    }
    if (config.robots_allow) {
      config.robots_allow.forEach(p => { txt += `Allow: ${p}\n`; });
    }
    if (config.sitemap_url) {
      txt += `\nSitemap: ${config.sitemap_url}\n`;
    }
    return txt;
  }
}
