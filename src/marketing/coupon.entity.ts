import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' }) id: number;
  @Column({ type: 'varchar', length: 50, unique: true }) code: string;
  @Column({ type: 'varchar', length: 20 }) discount_type: string;
  @Column({ type: 'numeric', precision: 10, scale: 2 }) discount_value: number;
  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 }) min_order_amount: number;
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true }) max_discount_amount: number;
  @Column({ type: 'integer', nullable: true }) usage_limit: number;
  @Column({ type: 'integer', default: 0 }) used_count: number;
  @Column({ type: 'date', nullable: true }) valid_from: Date;
  @Column({ type: 'date', nullable: true }) valid_to: Date;
  @Column({ type: 'boolean', default: false }) is_deleted: boolean;
}
