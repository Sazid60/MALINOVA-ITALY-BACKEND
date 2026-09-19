import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ProductSaas } from './product-saas.entity';

@Entity('product_modules')
export class ProductModule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  product_id: number;

  @ManyToOne(() => ProductSaas, (p) => p.modules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: ProductSaas;

  @Column({ type: 'varchar', length: 255 })
  module_name: string;

  @Column({ type: 'text', nullable: true })
  overview: string;

  @Column({ type: 'text', nullable: true })
  core_capability: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  supporting_media: string;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
