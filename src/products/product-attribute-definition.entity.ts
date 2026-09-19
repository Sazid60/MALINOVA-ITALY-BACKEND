import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { ProductCategory } from './product-category.entity';

@Entity('product_attribute_definitions')
export class ProductAttributeDefinition {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  category_id: number;

  @Column({ type: 'varchar', length: 100 })
  key: string;

  @Column({ type: 'varchar', length: 200 })
  label: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  group_name: string;

  @Column({ type: 'varchar', length: 30, default: 'text' })
  type: string; // text | number | select | boolean

  @Column({ type: 'varchar', length: 30, nullable: true })
  unit: string;

  @Column({ type: 'jsonb', nullable: true })
  options: string[];

  @Column({ type: 'boolean', default: false })
  is_filterable: boolean;

  @Column({ type: 'boolean', default: true })
  is_visible: boolean;

  @Column({ type: 'integer', default: 0 })
  sort_order: number;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;

  @ManyToOne(() => ProductCategory, (c) => c.attributeDefinitions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: ProductCategory;
}
