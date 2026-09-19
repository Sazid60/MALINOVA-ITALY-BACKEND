import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { PortfolioChallenge } from './portfolio-challenge.entity';
import { PortfolioPricingTier } from './portfolio-pricing-tier.entity';

@Entity('portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  project_name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  client_name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  client_logo: string;

  @Column({ type: 'varchar', length: 100 })
  category: string; // 'Software Engineering' | 'Creative & Post Production' | 'Digital Marketing'

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  live_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  app_store_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  play_store_url: string;

  @Column({ type: 'boolean', default: false })
  is_featured: boolean;

  // Primary Highlight
  @Column({ type: 'varchar', length: 500, nullable: true })
  cover_image: string;

  @Column({ type: 'text', nullable: true })
  primary_challenge: string;

  @Column({ type: 'text', nullable: true })
  primary_solution: string;

  // Standard vs Ours Comparison Matrix
  @Column({ type: 'boolean', default: true })
  comparison_enabled: boolean;

  @Column({ type: 'varchar', length: 255, default: 'Industry Standard vs. Our Approach' })
  comparison_title: string;

  @Column({ type: 'text', nullable: true })
  industry_standard_text: string;

  @Column({ type: 'text', nullable: true })
  our_approach_text: string;

  // Pricing Section
  @Column({ type: 'boolean', default: true })
  pricing_enabled: boolean;

  @Column({ type: 'varchar', length: 255, default: 'Transparent Pricing & Engagement Models' })
  pricing_title: string;

  // Relations
  @OneToMany(() => PortfolioChallenge, (challenge) => challenge.portfolio, { cascade: true })
  challenges: PortfolioChallenge[];

  @OneToMany(() => PortfolioPricingTier, (tier) => tier.portfolio, { cascade: true })
  pricing_tiers: PortfolioPricingTier[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
