import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('sitemap_config')
export class SitemapConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'jsonb', nullable: true })
  robots_disallow: string[]; // e.g. ['/admin', '/api', '/private']

  @Column({ type: 'jsonb', nullable: true })
  robots_allow: string[]; // e.g. ['/']

  @Column({ type: 'varchar', length: 500, nullable: true })
  sitemap_url: string; // e.g. 'https://milanovatech.com/sitemap.xml'

  @Column({ type: 'jsonb', nullable: true })
  priority_mappings: Record<string, number>; // { '/': 1.0, '/services': 0.9, '/products': 0.8 }

  @Column({ type: 'jsonb', nullable: true })
  change_frequencies: Record<string, string>; // { '/': 'daily', '/blog': 'weekly' }

  @UpdateDateColumn()
  updated_at: Date;
}
