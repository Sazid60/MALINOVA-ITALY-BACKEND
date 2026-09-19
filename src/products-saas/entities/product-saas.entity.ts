import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ProductModule } from './product-module.entity';

@Entity('products_saas')
export class ProductSaas {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  product_name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  brand_logo: string;

  @Column({ type: 'varchar', length: 100, default: 'Software Engineering' })
  category: string; // 'Software Engineering' | 'Creative & Post Production' | 'Digital Marketing'

  @Column({ type: 'jsonb', nullable: true })
  industry_focus: string[]; // e.g. ['Utilities & Energy', 'eCommerce & Retail', 'Healthcare']

  @Column({ type: 'jsonb', nullable: true })
  deployment_options: string[]; // e.g. ['Cloud SaaS', 'On-Premise', 'Hybrid']

  @Column({ type: 'varchar', length: 100, default: 'Ready to Deploy' })
  status_badge: string; // 'Ready to Deploy' | 'Beta / In-Development' | 'Fully Customizable Enterprise'

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  // URLs & Action Buttons
  @Column({ type: 'varchar', length: 500, nullable: true })
  live_demo_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  sandbox_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  app_store_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  documentation_url: string;

  @Column({ type: 'boolean', default: false })
  is_featured: boolean;

  // Primary Highlights
  @Column({ type: 'varchar', length: 500, nullable: true })
  cover_image: string;

  @Column({ type: 'text', nullable: true })
  primary_challenge: string;

  @Column({ type: 'text', nullable: true })
  primary_solution: string;

  @Column({ type: 'boolean', default: true })
  enable_explore_solution: boolean;

  @Column({ type: 'boolean', default: true })
  enable_request_demo: boolean;

  // Tech Specs & Integrations
  @Column({ type: 'jsonb', nullable: true })
  tech_specs: string[]; // ['.NET Core', 'Next.js', 'PostgreSQL', 'GDPR Compliant']

  @Column({ type: 'jsonb', nullable: true })
  integrations: Array<{ name: string; logo: string }>;

  // SEO & OG Settings
  @Column({ type: 'varchar', length: 255, nullable: true })
  meta_title: string;

  @Column({ type: 'text', nullable: true })
  meta_description: string;

  @Column({ type: 'jsonb', nullable: true })
  keywords: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  canonical_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  custom_og_image: string;

  @Column({ type: 'boolean', default: false })
  no_index: boolean;

  @Column({ type: 'boolean', default: false })
  no_follow: boolean;

  // Comparison Matrix
  @Column({ type: 'boolean', default: true })
  comparison_enabled: boolean;

  @Column({ type: 'varchar', length: 255, default: 'Traditional / Manual Method vs. Our Product' })
  comparison_title: string;

  @Column({ type: 'jsonb', nullable: true })
  comparison_rows: Array<{ traditional: string; our_product: string }>;

  // Pricing Section
  @Column({ type: 'boolean', default: true })
  pricing_enabled: boolean;

  @Column({ type: 'varchar', length: 255, default: 'Transparent Pricing & Subscription Models' })
  pricing_title: string;

  @Column({ type: 'jsonb', nullable: true })
  pricing_tiers: Array<{
    title: string;
    currencies: string[];
    primary_price: string;
    regional_prices?: Record<string, string>;
    subtitle?: string;
    deliverables?: string[];
    badge?: string;
    cta_label?: string;
    cta_link?: string;
    is_popular?: boolean;
  }>;

  // Relations
  @OneToMany(() => ProductModule, (m) => m.product, { cascade: true })
  modules: ProductModule[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
