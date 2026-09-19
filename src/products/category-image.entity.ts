import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { ProductCategory } from './product-category.entity';

@Entity('category_images')
export class CategoryImage {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  category_id: number;

  @Column({ type: 'text' })
  image_url: string;

  @Column({ type: 'boolean', default: false })
  is_primary: boolean;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => ProductCategory, (c) => c.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: ProductCategory;
}
