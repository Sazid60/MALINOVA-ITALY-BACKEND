import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('seo_meta')
export class SeoMeta {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 50 })
  entity_type: string; // product / blog / page

  @Column({ type: 'bigint' })
  entity_id: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  meta_title: string;

  @Column({ type: 'text', nullable: true })
  meta_description: string;

  @Column({ type: 'text', nullable: true })
  og_image_url: string;

  @Column({ type: 'text', nullable: true })
  keywords: string;

  @Column({ type: 'boolean', default: true })
  indexable: boolean;
}
