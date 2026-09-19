import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('technologies')
export class Technology {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  icon_url: string;

  @Column({ type: 'varchar', length: 100, default: 'Frontend' })
  category: string; // 'Frontend' | 'Backend' | 'Mobile' | 'Cloud & DevOps' | 'AI & Automation' | 'Low-Code' | 'Image Tune' | 'Video Tune' | 'Analytics' | 'Digital Marketing'

  @Column({ type: 'varchar', length: 255, nullable: true })
  proficiency_tagline: string; // e.g. "Enterprise Standard", "Battle-Tested"

  @Column({ type: 'int', default: 0 })
  display_order: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
