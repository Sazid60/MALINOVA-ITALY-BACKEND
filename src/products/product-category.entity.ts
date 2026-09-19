import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany, ManyToOne, JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { CategoryImage } from './category-image.entity';
import { ProductAttributeDefinition } from './product-attribute-definition.entity';

@Entity('product_categories')
export class ProductCategory {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  slug: string;

  @Column({ type: 'bigint', nullable: true })
  parent_id: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url: string | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @Column({ type: 'boolean', default: false }) is_deleted: boolean;

  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;

  @OneToMany(() => Product, (p) => p.category)
  products: Product[];

  @ManyToOne(() => ProductCategory, (c) => c.children, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_id' })
  parent: ProductCategory | null;

  @OneToMany(() => ProductCategory, (c) => c.parent)
  children: ProductCategory[];

  @OneToMany(() => CategoryImage, (ci) => ci.category)
  images: CategoryImage[];

  @OneToMany(() => ProductAttributeDefinition, (a) => a.category)
  attributeDefinitions: ProductAttributeDefinition[];
}
