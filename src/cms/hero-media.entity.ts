import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { HeroSection } from './hero-section.entity';

@Entity('hero_media')
export class HeroMedia {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' }) id: number;
  @Column({ type: 'bigint' }) hero_section_id: number;
  @Column({ type: 'varchar', length: 20 }) media_type: string; // image / youtube
  @Column({ type: 'text' }) media_url: string;
  @Column({ type: 'text', nullable: true }) cloudinary_public_id: string; // ✅ added for easier media management
  @Column({ type: 'integer', default: 0 }) sort_order: number;
  @Column({ type: 'boolean', default: true }) is_active: boolean;
  @Column({ type: 'boolean', default: false }) is_deleted: boolean;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
  @ManyToOne(() => HeroSection, (h) => h.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hero_section_id' }) heroSection: HeroSection;
}
