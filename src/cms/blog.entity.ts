import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('blogs')
export class Blog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 220, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  excerpt: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  content_delta: object;

  @Column({ type: 'varchar', length: 512, nullable: true })
  featured_image_url: string;

  @Column({ type: 'text', nullable: true })
  featured_image_public_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  featured_image_alt: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  reading_time: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  primary_author_name: string;

  @Column({ type: 'jsonb', nullable: true })
  co_authors: Array<{ name: string; designation?: string }>;

  @Column({ type: 'jsonb', nullable: true })
  related_article_ids: number[];

  @Column({ type: 'jsonb', nullable: true })
  related_service_keys: string[];

  // Comprehensive SEO & OG Settings
  @Column({ type: 'varchar', length: 255, nullable: true })
  meta_title: string;

  @Column({ type: 'text', nullable: true })
  meta_description: string;

  @Column({ type: 'jsonb', nullable: true })
  keywords: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  canonical_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  custom_og_image: string;

  @Column({ type: 'boolean', default: false })
  no_index: boolean;

  @Column({ type: 'boolean', default: false })
  no_follow: boolean;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  published_at: Date;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
