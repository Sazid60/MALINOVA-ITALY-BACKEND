import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('seo_metadata')
export class SeoMetadata {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  page_path: string; // e.g. '/', '/company', '/services', '/products/milanova-enterprise-erp'

  @Column({ type: 'varchar', length: 255, nullable: true })
  meta_title: string;

  @Column({ type: 'text', nullable: true })
  meta_description: string;

  @Column({ type: 'jsonb', nullable: true })
  keywords: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  canonical_url: string;

  // Open Graph & Social Cards
  @Column({ type: 'varchar', length: 255, nullable: true })
  og_title: string;

  @Column({ type: 'text', nullable: true })
  og_description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  og_image: string;

  @Column({ type: 'varchar', length: 50, default: 'summary_large_image' })
  twitter_card: string;

  // Schema & Structured Data
  @Column({ type: 'jsonb', nullable: true })
  schema_json_ld: Record<string, any>; // JSON-LD Schema.org object (e.g. Organization, Product, Article)

  // Image & Link SEO
  @Column({ type: 'varchar', length: 255, nullable: true })
  default_image_alt: string;

  @Column({ type: 'jsonb', nullable: true })
  internal_link_targets: Array<{ anchor_text: string; target_url: string }>;

  @Column({ type: 'boolean', default: false })
  no_index: boolean;

  @Column({ type: 'boolean', default: false })
  no_follow: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
