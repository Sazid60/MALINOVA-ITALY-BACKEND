import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_images')
export class ProductImage {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  product_id: number;

  /** Cloudinary public_id — used for deletion */
  @Column({ type: 'text', nullable: true })
  cloudinary_public_id: string;

  @Column({ type: 'text' })
  image_url: string;

  @Column({ type: 'boolean', default: false })
  is_primary: boolean;

  @ManyToOne(() => Product, (p) => p.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'boolean', default: false }) is_deleted: boolean;
}
