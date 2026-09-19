import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Portfolio } from './portfolio.entity';

@Entity('portfolio_pricing_tiers')
export class PortfolioPricingTier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  portfolio_id: number;

  @ManyToOne(() => Portfolio, (portfolio) => portfolio.pricing_tiers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'jsonb', nullable: true })
  currencies: string[]; // ['USD', 'BDT', 'EUR', 'GBP']

  @Column({ type: 'varchar', length: 100 })
  primary_price: string; // e.g. "$5,000" or "Custom"

  @Column({ type: 'jsonb', nullable: true })
  regional_prices: Record<string, string>; // { BDT: '৳500,000', EUR: '€4,500' }

  @Column({ type: 'varchar', length: 255, nullable: true })
  price_subtitle: string; // e.g. "One-time investment", "per month"

  @Column({ type: 'jsonb', nullable: true })
  deliverables: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  badge_text: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cta_label: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  cta_link: string;

  @Column({ type: 'boolean', default: false })
  is_most_popular: boolean;

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
