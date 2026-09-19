import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { ProductCategory } from './product-category.entity';
import { ProductImage } from './product-image.entity';
import { Brand } from './brand.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', nullable: true })
  category_id: number;

  @Column({ type: 'bigint', nullable: true })
  brand_id: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true, default: 0 })
  weight_grams: number;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 220, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  base_price: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  discount_type: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  discount_value: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  final_price: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country_of_origin: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  serial_number: string;

  @Column({ type: 'boolean', default: false })
  emi_available: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  product_video_url: string;

  @Column({ type: 'jsonb', nullable: true, default: '{}' })
  specifications_json: Record<string, any>;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @Column({ type: 'boolean', default: false }) is_featured: boolean;
  @Column({ type: 'boolean', default: false }) is_deleted: boolean;

  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;

  @ManyToOne(() => ProductCategory, (c) => c.products, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: ProductCategory;

  @ManyToOne(() => Brand, (b) => b.products, { nullable: true })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @OneToMany(() => ProductImage, (i) => i.product)
  images: ProductImage[];
}
