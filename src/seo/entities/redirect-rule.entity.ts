import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('redirect_rules')
export class RedirectRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  source_path: string; // e.g. '/old-services', '/legacy-product'

  @Column({ type: 'varchar', length: 255 })
  target_path: string; // e.g. '/services', '/products/milanova-enterprise-erp'

  @Column({ type: 'int', default: 301 })
  status_code: number; // 301 Permanent | 302 Temporary

  @Column({ type: 'int', default: 0 })
  hit_count: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
