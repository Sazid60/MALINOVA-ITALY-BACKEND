import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { HeroMedia } from './hero-media.entity';

@Entity('hero_sections')
export class HeroSection {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' }) id: number;
  @Column({ type: 'varchar', length: 200, nullable: true }) title: string;
  @Column({ type: 'text', nullable: true }) subtitle: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) cta_text: string;
  @Column({ type: 'text', nullable: true }) cta_link: string;
  @Column({ type: 'boolean', default: true }) is_active: boolean;
  @Column({ type: 'boolean', default: false }) is_deleted: boolean;
  @OneToMany(() => HeroMedia, (m) => m.heroSection) media: HeroMedia[];
}
